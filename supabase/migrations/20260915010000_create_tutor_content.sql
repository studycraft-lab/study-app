-- Tutoring sections are not exercise topics. All access goes through authenticated server routes.
create table public.tutor_sections (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  external_id text not null,
  heading text not null check (length(heading) between 1 and 200),
  heading_path jsonb not null,
  printed_pages jsonb not null,
  pdf_pages jsonb not null,
  unique(chapter_id, external_id)
);
create table public.tutor_packs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  section_id uuid not null references public.tutor_sections(id),
  lesson_id text not null,
  content_version integer not null check (content_version > 0),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  previewed_at timestamptz,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(family_id, lesson_id, content_version)
);
create unique index tutor_one_current_publication on public.tutor_packs(section_id) where status = 'published';
alter table public.tutor_sections enable row level security;
alter table public.tutor_packs enable row level security;
revoke all on public.tutor_sections, public.tutor_packs from public, anon, authenticated;
grant select on public.tutor_sections, public.tutor_packs to service_role;

create view public.tutor_library with (security_invoker = true) as
select p.*, s.chapter_id, s.external_id as section_key, s.heading, s.printed_pages,
       c.board, c.grade, c.subject, c.book_title, ch.title as chapter_title
from public.tutor_packs p join public.tutor_sections s on s.id=p.section_id
join public.chapters ch on ch.id=s.chapter_id join public.courses c on c.id=ch.course_id
where p.family_id=c.family_id;
grant select on public.tutor_library to service_role;

create function public.import_tutor_pack(p_family_id uuid, p_chapter_id uuid, p_payload jsonb, p_content_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_chapter record; v_section tutor_sections; v_pack tutor_packs;
begin
  -- Chapter lock serializes first imports, section creation and version collisions.
  select ch.*, c.family_id, c.board, c.grade, c.subject, c.book_title into v_chapter
    from chapters ch join courses c on c.id=ch.course_id
    where ch.id=p_chapter_id and c.family_id=p_family_id for update of ch;
  if not found then raise exception 'Chapter unavailable.'; end if;
  if lower(v_chapter.board) <> lower(p_payload->'source'->>'board')
    or v_chapter.grade <> (p_payload->'source'->>'grade')::integer
    or lower(v_chapter.subject) <> lower(p_payload->'source'->>'subject')
    or lower(v_chapter.title) <> lower(p_payload->'source'->>'chapterTitle')
    or (p_payload->'source'->>'bookTitle' is not null and coalesce(v_chapter.book_title,'') <> p_payload->'source'->>'bookTitle')
    then raise exception 'Pack does not match the selected chapter.'; end if;
  -- Serializes the same lesson identity even if malicious callers choose different chapters.
  perform pg_advisory_xact_lock(hashtextextended(p_family_id::text || ':' || (p_payload->>'lessonId'),0));
  select * into v_pack from tutor_packs where family_id=p_family_id
    and lesson_id=p_payload->>'lessonId' and content_version=(p_payload->>'contentVersion')::integer;
  if found then
    if v_pack.content_hash <> p_content_hash or
       not exists(select 1 from tutor_sections where id=v_pack.section_id and chapter_id=p_chapter_id)
      then raise exception 'Version collision. Increase contentVersion.'; end if;
    return jsonb_build_object('id',v_pack.id,'created',false);
  end if;
  select * into v_section from tutor_sections where chapter_id=p_chapter_id and external_id=p_payload->'section'->>'id';
  if found and (v_section.heading <> p_payload->'section'->>'heading' or v_section.heading_path <> p_payload->'section'->'path')
    then raise exception 'Section heading differs. Confirm the catalogue mapping.'; end if;
  if not found then
    insert into tutor_sections(chapter_id,external_id,heading,heading_path,printed_pages,pdf_pages)
    values(p_chapter_id,p_payload->'section'->>'id',p_payload->'section'->>'heading',p_payload->'section'->'path',p_payload->'section'->'printedPages',p_payload->'section'->'pdfPages') returning * into v_section;
  end if;
  insert into tutor_packs(family_id,section_id,lesson_id,content_version,content_hash,payload)
    values(p_family_id,v_section.id,p_payload->>'lessonId',(p_payload->>'contentVersion')::integer,p_content_hash,p_payload) returning * into v_pack;
  return jsonb_build_object('id',v_pack.id,'created',true);
end $$;

create function public.manage_tutor_pack(p_family_id uuid, p_pack_id uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare v_pack tutor_packs; v_section uuid;
begin
  select section_id into v_section from tutor_packs where id=p_pack_id and family_id=p_family_id;
  if not found then raise exception 'Lesson unavailable.'; end if;
  -- All publication operations for a section use the same lock order.
  perform 1 from tutor_sections where id=v_section for update;
  select * into v_pack from tutor_packs where id=p_pack_id and family_id=p_family_id for update;
  if p_action='preview' then
    update tutor_packs set previewed_at=now() where id=p_pack_id;
  elsif p_action='publish' then
    if v_pack.previewed_at is null then raise exception 'Preview the lesson before publishing.'; end if;
    if v_pack.payload->'source'->>'sourceStatus' = 'unverified' then raise exception 'Review this lesson against its source before publishing a new version.'; end if;
    if v_pack.status='archived' then raise exception 'Archived versions cannot be republished. Import a new version.'; end if;
    update tutor_packs set status='archived' where section_id=v_section and status='published' and id<>p_pack_id;
    update tutor_packs set status='published',published_at=coalesce(published_at,now()) where id=p_pack_id;
  elsif p_action='archive' then
    update tutor_packs set status='archived' where id=p_pack_id;
  else raise exception 'Unsupported lesson action.';
  end if;
end $$;
revoke all on function public.import_tutor_pack(uuid,uuid,jsonb,text), public.manage_tutor_pack(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.import_tutor_pack(uuid,uuid,jsonb,text), public.manage_tutor_pack(uuid,uuid,text) to service_role;
