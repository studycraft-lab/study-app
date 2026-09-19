create table public.tutor_text_question_usage (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id),
  progress_id uuid not null references public.tutor_progress(id),
  created_at timestamptz not null default now()
);
create index tutor_text_question_usage_child_time on public.tutor_text_question_usage(child_id, created_at desc);
alter table public.tutor_text_question_usage enable row level security;
revoke all on public.tutor_text_question_usage from public, anon, authenticated;
grant select, insert on public.tutor_text_question_usage to service_role;

create function public.reserve_tutor_text_question(p_child_id uuid, p_progress_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_child child_profiles; v_recent integer; v_today integer;
begin
  select * into v_child from child_profiles where id=p_child_id and active for update;
  if not found then raise exception 'Child unavailable.'; end if;
  if not exists(select 1 from tutor_progress pr join tutor_packs p on p.id=pr.pack_id join tutor_sections s on s.id=p.section_id
    join chapters ch on ch.id=s.chapter_id join courses c on c.id=ch.course_id
    where pr.id=p_progress_id and pr.child_id=p_child_id and p.family_id=v_child.family_id
      and lower(c.board)=lower(v_child.board) and c.grade=v_child.grade and p.status in ('published','archived'))
    then raise exception 'Lesson unavailable.'; end if;
  select count(*) into v_recent from tutor_text_question_usage where child_id=p_child_id and created_at>now()-interval '1 minute';
  if v_recent>=5 then raise exception 'Too many questions. Wait a minute.'; end if;
  select count(*) into v_today from tutor_text_question_usage where child_id=p_child_id
    and created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if v_today>=40 then raise exception 'Daily question allowance reached.'; end if;
  insert into tutor_text_question_usage(child_id,progress_id) values(p_child_id,p_progress_id);
end $$;
revoke all on function public.reserve_tutor_text_question(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_tutor_text_question(uuid,uuid) to service_role;
