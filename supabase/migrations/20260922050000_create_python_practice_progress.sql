create table public.python_practice_answers (
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  question_id text not null check (question_id ~ '^q-[0-9]{3}$'),
  answer text not null default '' check (char_length(answer) <= 10000),
  checked boolean not null default false,
  passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (child_id, question_id)
);

create index python_practice_answers_child_updated_idx
  on public.python_practice_answers(child_id, updated_at desc);

alter table public.python_practice_answers enable row level security;
revoke all on table public.python_practice_answers from public, anon, authenticated;
grant select, insert, update, delete on table public.python_practice_answers to service_role;
