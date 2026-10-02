create table public.grammar_batch_progress (
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  lesson_slug text not null check (lesson_slug ~ '^[a-z][a-z0-9-]{0,79}$'),
  content_version integer not null check (content_version > 0),
  batch_index integer not null check (batch_index >= 0),
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (child_id, lesson_slug, content_version, batch_index)
);

create index grammar_batch_progress_child_updated_idx
  on public.grammar_batch_progress(child_id, updated_at desc);

alter table public.grammar_batch_progress enable row level security;
revoke all on table public.grammar_batch_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.grammar_batch_progress to service_role;
