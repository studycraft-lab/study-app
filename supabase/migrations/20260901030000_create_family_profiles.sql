create table public.families (
  id uuid primary key default gen_random_uuid(),
  family_key text not null unique,
  name text not null default 'Our family',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parent_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references public.families(id) on delete cascade,
  display_name text not null default 'Parent',
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  board text not null default 'ICSE',
  grade integer not null check (grade between 1 and 12),
  pin_salt text not null,
  pin_hash text not null,
  active boolean not null default true,
  failed_pin_attempts integer not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index child_profiles_family_id_idx on public.child_profiles(family_id);

insert into public.families (family_key, name)
values ('default-family', 'Our family')
on conflict (family_key) do nothing;

insert into public.parent_profiles (family_id, display_name)
select id, 'Parent' from public.families where family_key = 'default-family'
on conflict (family_id) do nothing;

alter table public.courses add column family_id uuid references public.families(id);

update public.courses
set family_id = (select id from public.families where family_key = 'default-family')
where family_id is null;

alter table public.courses alter column family_id set not null;
create index courses_family_id_idx on public.courses(family_id);

create or replace function public.import_question_bank(p_payload jsonb, p_metadata jsonb, p_content_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_course_id uuid;
  v_chapter_id uuid;
  v_bank_id uuid;
  v_created boolean := false;
  v_course_fingerprint text;
  v_chapter_fingerprint text;
begin
  select id into v_family_id from families where family_key = 'default-family';
  if v_family_id is null then
    insert into families (family_key, name) values ('default-family', 'Our family') returning id into v_family_id;
  end if;

  v_course_fingerprint := md5(lower(concat_ws('|', 'default-family', p_metadata->>'board', p_metadata->>'grade', p_metadata->>'subject', coalesce(p_metadata->>'bookTitle', ''))));
  insert into courses (family_id, family_key, fingerprint, board, grade, subject, book_title)
  values (v_family_id, 'default-family', v_course_fingerprint, p_metadata->>'board', (p_metadata->>'grade')::integer, p_metadata->>'subject', nullif(p_metadata->>'bookTitle', ''))
  on conflict (fingerprint) do update set board = excluded.board, family_id = excluded.family_id
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

drop view public.library_chapters;
create view public.library_chapters with (security_invoker = true) as
select qb.id, c.board, c.grade, c.subject, c.book_title, ch.chapter_number,
       ch.title as chapter_title, qb.version as bank_version, qb.question_count, qb.imported_at,
       c.family_id
from public.question_banks qb
join public.chapters ch on ch.id = qb.chapter_id
join public.courses c on c.id = ch.course_id;

alter table public.families enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.child_profiles enable row level security;

revoke all on table public.families, public.parent_profiles, public.child_profiles from public, anon, authenticated;
grant select, insert, update, delete on table public.families, public.parent_profiles, public.child_profiles to service_role;
grant select on table public.library_chapters to service_role;
grant execute on function public.import_question_bank(jsonb, jsonb, text) to service_role;
