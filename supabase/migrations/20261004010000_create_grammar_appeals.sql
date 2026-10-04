create table public.grammar_appeals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  lesson_slug text not null check (lesson_slug ~ '^[a-z][a-z0-9-]{0,79}$'),
  content_version integer not null check (content_version > 0),
  batch_index integer not null check (batch_index >= 0),
  question_id text not null,
  answer text not null,
  original_status text not null check (original_status in ('incorrect', 'review')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'adjusted')),
  resolved_status text check (resolved_status in ('correct', 'incorrect')),
  child_comment text,
  parent_comment text,
  resolver_name text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (child_id, lesson_slug, content_version, question_id)
);

create index grammar_appeals_family_pending_idx on public.grammar_appeals(family_id, status, created_at);
alter table public.grammar_appeals enable row level security;
revoke all on table public.grammar_appeals from public, anon, authenticated;
grant select, insert, update, delete on table public.grammar_appeals to service_role;
