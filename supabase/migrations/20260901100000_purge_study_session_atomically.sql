create or replace function public.purge_study_session(p_session_id uuid, p_child_id uuid)
returns table (deleted_session_id uuid, deleted_attempts integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt_count integer;
begin
  perform 1
  from public.study_sessions
  where id = p_session_id and child_id = p_child_id
  for update;

  if not found then
    raise exception 'Study session is unavailable.';
  end if;

  select count(*) into v_attempt_count
  from public.study_attempts
  where session_id = p_session_id and child_id = p_child_id;

  -- Review items are derived state. Rebuild all of this child's items after
  -- deleting the session so no stale schedule survives the purge.
  delete from public.review_items where child_id = p_child_id;
  delete from public.study_sessions where id = p_session_id and child_id = p_child_id;

  insert into public.review_items (
    child_id, question_bank_id, bank_version, question_id, question_version,
    due_at, interval_days, repetitions, reason, last_attempt_id, updated_at
  )
  with last_incorrect as (
    select question_bank_id, bank_version, question_id, question_version,
      max(attempted_at) filter (where not correct) as last_incorrect_at
    from public.study_attempts
    where child_id = p_child_id
    group by question_bank_id, bank_version, question_id, question_version
  ),
  streaks as (
    select a.question_bank_id, a.bank_version, a.question_id, a.question_version,
      count(*) filter (
        where a.correct and (li.last_incorrect_at is null or a.attempted_at > li.last_incorrect_at)
      )::integer as consecutive_correct
    from public.study_attempts a
    join last_incorrect li using (question_bank_id, bank_version, question_id, question_version)
    where a.child_id = p_child_id
    group by a.question_bank_id, a.bank_version, a.question_id, a.question_version
  ),
  latest as (
    select distinct on (question_bank_id, bank_version, question_id, question_version)
      id, child_id, question_bank_id, bank_version, question_id, question_version,
      correct, attempted_at
    from public.study_attempts
    where child_id = p_child_id
    order by question_bank_id, bank_version, question_id, question_version, attempted_at desc, id desc
  ),
  rebuilt as (
    select latest.*,
      case
        when not latest.correct then 1
        when streaks.consecutive_correct <= 1 then 3
        when streaks.consecutive_correct = 2 then 7
        when streaks.consecutive_correct = 3 then 14
        when streaks.consecutive_correct = 4 then 30
        else 60
      end as interval_days,
      case when latest.correct then streaks.consecutive_correct else 0 end as repetitions
    from latest
    join streaks using (question_bank_id, bank_version, question_id, question_version)
  )
  select child_id, question_bank_id, bank_version, question_id, question_version,
    attempted_at + make_interval(days => interval_days), interval_days, repetitions,
    case when correct then 'maintenance' else 'incorrect' end,
    id, now()
  from rebuilt;

  return query select p_session_id, v_attempt_count;
end;
$$;

revoke all on function public.purge_study_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.purge_study_session(uuid, uuid) to service_role;
