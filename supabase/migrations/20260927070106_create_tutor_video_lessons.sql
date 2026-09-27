-- Prepared video lessons share chapter eligibility with the existing tutor library.
-- Media lives in a private Storage bucket; only authenticated server routes sign it.
create table public.tutor_video_lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content_version integer not null check (content_version > 0),
  title text not null check (length(title) between 1 and 200),
  description text not null check (length(description) between 1 and 1000),
  duration_seconds numeric not null check (duration_seconds > 0),
  asset_prefix text not null unique,
  chapters jsonb not null check (jsonb_typeof(chapters) = 'array'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  unique (chapter_id, slug, content_version)
);
alter table public.tutor_video_lessons enable row level security;
revoke all on public.tutor_video_lessons from public, anon, authenticated;
grant select, insert, update, delete on public.tutor_video_lessons to service_role;
