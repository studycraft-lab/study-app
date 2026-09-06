alter table public.study_attempts
  add column if not exists submission_id text,
  add column if not exists grading_status text not null default 'graded';

alter table public.study_attempts drop constraint if exists study_attempts_grading_status_check;
alter table public.study_attempts add constraint study_attempts_grading_status_check
  check (grading_status in ('graded', 'pending_review'));

create unique index if not exists study_attempts_child_submission_idx
  on public.study_attempts(child_id, submission_id)
  where submission_id is not null;
