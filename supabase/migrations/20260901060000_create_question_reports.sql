create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.study_attempts(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  reporter_name text not null,
  question_bank_id uuid not null references public.question_banks(id) on delete restrict,
  bank_version integer not null check (bank_version > 0),
  question_id text not null,
  question_version integer not null check (question_version > 0),
  question_snapshot jsonb not null,
  note text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_question_bank_id uuid references public.question_banks(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index question_reports_status_created_idx on public.question_reports(status, created_at desc);

alter table public.question_reports enable row level security;
revoke all on table public.question_reports from public, anon, authenticated;
grant select, insert, update, delete on table public.question_reports to service_role;
