create table public.tutor_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id),
  pack_id uuid not null references public.tutor_packs(id),
  state jsonb not null,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(child_id,pack_id)
);
alter table public.tutor_progress enable row level security;
revoke all on public.tutor_progress from public,anon,authenticated;
grant select on public.tutor_progress to service_role;

create function public.start_tutor_progress(p_child_id uuid,p_pack_id uuid,p_initial_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_progress tutor_progress; v_pack tutor_packs;
begin
  select p.* into v_pack from tutor_packs p join tutor_sections s on s.id=p.section_id
    join chapters ch on ch.id=s.chapter_id join courses c on c.id=ch.course_id
    join child_profiles child on child.id=p_child_id and child.family_id=p.family_id and child.active
    and lower(child.board)=lower(c.board) and child.grade=c.grade where p.id=p_pack_id for share of p;
  if not found then raise exception 'Lesson unavailable for this child.'; end if;
  select * into v_progress from tutor_progress where child_id=p_child_id and pack_id=p_pack_id;
  if found then return to_jsonb(v_progress); end if;
  if v_pack.status<>'published' then raise exception 'This lesson is no longer available to start.'; end if;
  insert into tutor_progress(child_id,pack_id,state) values(p_child_id,p_pack_id,p_initial_state)
    on conflict(child_id,pack_id) do nothing;
  select * into v_progress from tutor_progress where child_id=p_child_id and pack_id=p_pack_id;
  return to_jsonb(v_progress);
end $$;

-- Application applies the shared state machine; only this service-role RPC can write its result.
-- Compare-and-swap prevents parallel browser/provider events from replacing newer progress.
create function public.save_tutor_progress(p_child_id uuid,p_id uuid,p_revision integer,p_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_progress tutor_progress;
begin
  if (p_state->>'revision')::integer <> p_revision+1 then raise exception 'Invalid progress revision.'; end if;
  update tutor_progress set state=p_state,revision=p_revision+1,updated_at=now()
    where id=p_id and child_id=p_child_id and revision=p_revision returning * into v_progress;
  if not found then raise exception 'Progress changed. Resume the current step.'; end if;
  return to_jsonb(v_progress);
end $$;
revoke all on function public.start_tutor_progress(uuid,uuid,jsonb),public.save_tutor_progress(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.start_tutor_progress(uuid,uuid,jsonb),public.save_tutor_progress(uuid,uuid,integer,jsonb) to service_role;
