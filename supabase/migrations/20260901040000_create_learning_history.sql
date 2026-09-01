create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  question_bank_id uuid not null references public.question_banks(id) on delete restrict,
  bank_version integer not null check (bank_version > 0),
  total_questions integer not null check (total_questions > 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.study_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  question_bank_id uuid not null references public.question_banks(id) on delete restrict,
  bank_version integer not null check (bank_version > 0),
  question_id text not null,
  question_version integer not null check (question_version > 0),
  question_prompt text not null,
  topic_ids text[] not null default '{}',
  response jsonb not null,
  correct boolean not null,
  earned_marks numeric not null check (earned_marks >= 0),
  max_marks numeric not null check (max_marks > 0),
  feedback jsonb not null,
  self_rating text check (self_rating in ('up', 'down')),
  attempted_at timestamptz not null default now()
);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  question_bank_id uuid not null references public.question_banks(id) on delete cascade,
  bank_version integer not null check (bank_version > 0),
  question_id text not null,
  question_version integer not null check (question_version > 0),
  due_at timestamptz not null,
  interval_days integer not null default 1 check (interval_days > 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  reason text not null check (reason in ('incorrect', 'low_confidence', 'maintenance')),
  last_attempt_id uuid references public.study_attempts(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (child_id, question_bank_id, bank_version, question_id, question_version)
);

create index study_sessions_child_started_idx on public.study_sessions(child_id, started_at desc);
create index study_attempts_child_attempted_idx on public.study_attempts(child_id, attempted_at desc);
create index study_attempts_session_idx on public.study_attempts(session_id, attempted_at);
create index review_items_child_due_idx on public.review_items(child_id, due_at);

alter table public.study_sessions enable row level security;
alter table public.study_attempts enable row level security;
alter table public.review_items enable row level security;

revoke all on table public.study_sessions, public.study_attempts, public.review_items from public, anon, authenticated;
grant select, insert, update, delete on table public.study_sessions, public.study_attempts, public.review_items to service_role;
