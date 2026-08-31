create extension if not exists pgcrypto;

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  family_key text not null default 'default-family',
  fingerprint text not null unique,
  board text not null,
  grade integer not null check (grade > 0),
  subject text not null,
  book_title text,
  created_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  fingerprint text not null unique,
  chapter_number integer,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.question_banks (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  external_id text not null,
  version integer not null check (version > 0),
  schema_version text not null,
  status text not null default 'draft',
  payload jsonb not null,
  content_hash text not null,
  question_count integer not null,
  source_count integer not null,
  topic_count integer not null,
  imported_at timestamptz not null default now(),
  unique (external_id, version)
);

alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.question_banks enable row level security;

create or replace function public.import_question_bank(p_payload jsonb, p_metadata jsonb, p_content_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_chapter_id uuid;
  v_bank_id uuid;
  v_created boolean := false;
  v_course_fingerprint text;
  v_chapter_fingerprint text;
begin
  v_course_fingerprint := md5(lower(concat_ws('|', 'default-family', p_metadata->>'board', p_metadata->>'grade', p_metadata->>'subject', coalesce(p_metadata->>'bookTitle', ''))));
  insert into courses (fingerprint, board, grade, subject, book_title)
  values (v_course_fingerprint, p_metadata->>'board', (p_metadata->>'grade')::integer, p_metadata->>'subject', nullif(p_metadata->>'bookTitle', ''))
  on conflict (fingerprint) do update set board = excluded.board
  returning id into v_course_id;

  v_chapter_fingerprint := md5(concat_ws('|', v_course_id::text, coalesce(p_metadata->>'chapterNumber', ''), lower(p_metadata->>'chapterTitle')));
  insert into chapters (course_id, fingerprint, chapter_number, title)
  values (v_course_id, v_chapter_fingerprint, nullif(p_metadata->>'chapterNumber', '')::integer, p_metadata->>'chapterTitle')
  on conflict (fingerprint) do update set title = excluded.title
  returning id into v_chapter_id;

  select id into v_bank_id from question_banks
  where external_id = p_payload->'bank'->>'id' and version = (p_payload->'bank'->>'version')::integer;

  if v_bank_id is null then
    insert into question_banks (chapter_id, external_id, version, schema_version, status, payload, content_hash, question_count, source_count, topic_count)
    values (v_chapter_id, p_payload->'bank'->>'id', (p_payload->'bank'->>'version')::integer, p_payload->>'schemaVersion', coalesce(p_payload->'bank'->>'status', 'draft'), p_payload, p_content_hash, jsonb_array_length(p_payload->'questions'), jsonb_array_length(p_payload->'sources'), jsonb_array_length(p_payload->'topics'))
    returning id into v_bank_id;
    v_created := true;
  elsif (select content_hash from question_banks where id = v_bank_id) <> p_content_hash then
    raise exception 'Bank ID and version already exist with different content. Increase the bank version.';
  end if;

  return jsonb_build_object('id', v_bank_id, 'created', v_created);
end;
$$;

revoke all on function public.import_question_bank(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.import_question_bank(jsonb, jsonb, text) to service_role;

create view public.library_chapters with (security_invoker = true) as
select qb.id, c.board, c.grade, c.subject, c.book_title, ch.chapter_number,
       ch.title as chapter_title, qb.version as bank_version, qb.question_count, qb.imported_at
from public.question_banks qb
join public.chapters ch on ch.id = qb.chapter_id
join public.courses c on c.id = ch.course_id;
