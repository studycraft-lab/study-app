alter table public.question_reports
  alter column attempt_id drop not null;

create unique index if not exists question_reports_one_open_child_question_idx
  on public.question_reports(child_id, question_bank_id, question_id, question_version)
  where status = 'open';
