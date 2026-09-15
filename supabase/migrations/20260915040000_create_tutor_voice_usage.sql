create table public.tutor_voice_settings (
  family_id uuid primary key references public.families(id),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.tutor_voice_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id),
  progress_id uuid not null references public.tutor_progress(id),
  client_token uuid not null,
  model text not null,
  status text not null default 'reserved' check(status in ('reserved','active','termination_pending','ended','failed')),
  provider_call_id text,
  ui_revision integer not null default -1,
  reserved_seconds integer not null check(reserved_seconds between 60 and 1200),
  deadline timestamptz not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  error_class text,
  provider_usage jsonb,
  unique(child_id,client_token)
);
create unique index tutor_one_live_session on public.tutor_voice_sessions(child_id) where status in ('reserved','active','termination_pending');
alter table public.tutor_voice_settings enable row level security;
alter table public.tutor_voice_sessions enable row level security;
revoke all on public.tutor_voice_settings,public.tutor_voice_sessions from public,anon,authenticated;
grant select,insert,update on public.tutor_voice_settings to service_role;
grant select,update on public.tutor_voice_sessions to service_role;

create function public.reserve_tutor_voice(p_child_id uuid,p_progress_id uuid,p_model text,p_session_seconds integer,p_daily_seconds integer,p_starts_per_minute integer,p_client_token uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_child child_profiles; v_row tutor_voice_sessions; v_used integer; v_starts integer;
begin
  select * into v_child from child_profiles where id=p_child_id and active for update;
  if not found then raise exception 'Child unavailable.'; end if;
  if not exists(select 1 from tutor_voice_settings where family_id=v_child.family_id and enabled) then raise exception 'Parent has not enabled live tutoring.'; end if;
  if not exists(select 1 from tutor_progress pr join tutor_packs p on p.id=pr.pack_id join tutor_sections s on s.id=p.section_id
    join chapters ch on ch.id=s.chapter_id join courses c on c.id=ch.course_id
    where pr.id=p_progress_id and pr.child_id=p_child_id and p.family_id=v_child.family_id and lower(c.board)=lower(v_child.board) and c.grade=v_child.grade and p.status in ('published','archived'))
    then raise exception 'Lesson unavailable.'; end if;
  if p_session_seconds not between 60 and 1200 or p_daily_seconds not between 60 and 3600 or p_starts_per_minute not between 1 and 10 then raise exception 'Invalid voice limits.'; end if;
  select * into v_row from tutor_voice_sessions where child_id=p_child_id and client_token=p_client_token;
  if found then
    if v_row.progress_id<>p_progress_id then raise exception 'Client token already belongs to another lesson.'; end if;
    return to_jsonb(v_row);
  end if;
  if exists(select 1 from tutor_voice_sessions where child_id=p_child_id and status in ('reserved','active','termination_pending')) then raise exception 'Another voice session is active or awaiting termination.'; end if;
  select count(*) into v_starts from tutor_voice_sessions where child_id=p_child_id and created_at>now()-interval '1 minute';
  if v_starts>=p_starts_per_minute then raise exception 'Too many voice starts. Wait a minute.'; end if;
  -- Reserve the full allowance even on early end or setup failure; abandoned calls are never free.
  select coalesce(sum(reserved_seconds),0) into v_used from tutor_voice_sessions where child_id=p_child_id
    and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if v_used+p_session_seconds>p_daily_seconds then raise exception 'Daily voice allowance reached.'; end if;
  insert into tutor_voice_sessions(child_id,progress_id,client_token,model,reserved_seconds,deadline)
    values(p_child_id,p_progress_id,p_client_token,p_model,p_session_seconds,now()+make_interval(secs=>p_session_seconds)) returning * into v_row;
  return to_jsonb(v_row);
end $$;
revoke all on function public.reserve_tutor_voice(uuid,uuid,text,integer,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.reserve_tutor_voice(uuid,uuid,text,integer,integer,integer,uuid) to service_role;

create function public.ack_tutor_voice(p_child_id uuid,p_client_token uuid,p_revision integer)
returns void language plpgsql security definer set search_path=public as $$
begin
  update tutor_voice_sessions v set ui_revision=greatest(v.ui_revision,p_revision)
    from tutor_progress p where v.progress_id=p.id and v.child_id=p_child_id and v.client_token=p_client_token
    and v.status='active' and p.revision>=p_revision and p_revision>=0;
  if not found then raise exception 'Voice acknowledgement unavailable.'; end if;
end $$;
revoke all on function public.ack_tutor_voice(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.ack_tutor_voice(uuid,uuid,integer) to service_role;
