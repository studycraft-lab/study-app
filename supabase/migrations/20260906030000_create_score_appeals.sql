alter table public.study_attempts
  add column if not exists adjusted_earned_marks numeric check (adjusted_earned_marks is null or adjusted_earned_marks >= 0),
  add column if not exists adjusted_correct boolean;

create table public.score_appeals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  attempt_id uuid not null unique references public.study_attempts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'adjusted')),
  child_comment text,
  original_earned_marks numeric not null check (original_earned_marks >= 0),
  original_max_marks numeric not null check (original_max_marks > 0),
  resolved_earned_marks numeric check (resolved_earned_marks is null or resolved_earned_marks >= 0),
  resolver_name text,
  parent_comment text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index score_appeals_family_status_idx on public.score_appeals(family_id, status, created_at desc);
alter table public.score_appeals enable row level security;
revoke all on table public.score_appeals from public, anon, authenticated;
grant select, insert, update, delete on table public.score_appeals to service_role;

create or replace function public.resolve_score_appeal(
  p_appeal_id uuid,
  p_family_id uuid,
  p_resolver_name text,
  p_earned_marks numeric,
  p_parent_comment text default ''
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_appeal public.score_appeals%rowtype;
  v_attempt public.study_attempts%rowtype;
  v_repetitions integer;
  v_interval integer;
  v_reason text;
  v_correct boolean;
begin
  select * into v_appeal from public.score_appeals
    where id = p_appeal_id and family_id = p_family_id and status = 'pending' for update;
  if not found then raise exception 'This appeal is no longer pending.'; end if;

  select * into v_attempt from public.study_attempts where id = v_appeal.attempt_id for update;
  if not found then raise exception 'The appealed attempt is unavailable.'; end if;
  if p_earned_marks < 0 or p_earned_marks > v_attempt.max_marks then raise exception 'Adjusted marks must be between zero and the maximum marks.'; end if;

  v_correct := p_earned_marks >= v_attempt.max_marks;
  update public.study_attempts set adjusted_earned_marks = p_earned_marks,
    adjusted_correct = v_correct, grading_status = 'graded'
    where id = v_attempt.id;

  update public.score_appeals set
    status = case when p_earned_marks = original_earned_marks then 'confirmed' else 'adjusted' end,
    resolved_earned_marks = p_earned_marks, resolver_name = p_resolver_name,
    parent_comment = nullif(trim(p_parent_comment), ''), resolved_at = now()
    where id = v_appeal.id;

  select coalesce(repetitions, 0) into v_repetitions from public.review_items
    where child_id = v_attempt.child_id and question_bank_id = v_attempt.question_bank_id
      and bank_version = v_attempt.bank_version and question_id = v_attempt.question_id
      and question_version = v_attempt.question_version;
  v_repetitions := coalesce(v_repetitions, 0);
  if v_correct then
    v_repetitions := v_repetitions + 1;
    v_interval := (array[3, 7, 14, 30, 60])[least(v_repetitions, 5)];
    v_reason := 'maintenance';
  elsif p_earned_marks / v_attempt.max_marks >= 0.75 then
    v_interval := 3;
    v_reason := 'partial';
  else
    v_interval := 1;
    v_repetitions := 0;
    v_reason := 'incorrect';
  end if;

  insert into public.review_items (
    child_id, question_bank_id, bank_version, question_id, question_version,
    due_at, interval_days, repetitions, reason, last_attempt_id, updated_at
  ) values (
    v_attempt.child_id, v_attempt.question_bank_id, v_attempt.bank_version, v_attempt.question_id, v_attempt.question_version,
    now() + make_interval(days => v_interval), v_interval, v_repetitions, v_reason, v_attempt.id, now()
  ) on conflict (child_id, question_bank_id, bank_version, question_id, question_version)
  do update set due_at = excluded.due_at, interval_days = excluded.interval_days,
    repetitions = excluded.repetitions, reason = excluded.reason,
    last_attempt_id = excluded.last_attempt_id, updated_at = excluded.updated_at;

  return jsonb_build_object('appealId', v_appeal.id, 'attemptId', v_attempt.id,
    'status', case when p_earned_marks = v_appeal.original_earned_marks then 'confirmed' else 'adjusted' end,
    'earnedMarks', p_earned_marks, 'maxMarks', v_attempt.max_marks, 'correct', v_correct);
end;
$$;

revoke all on function public.resolve_score_appeal(uuid, uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.resolve_score_appeal(uuid, uuid, text, numeric, text) to service_role;
