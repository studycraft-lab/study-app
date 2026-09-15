create table public.tutor_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  child_id uuid not null references public.child_profiles(id),
  chapter_id uuid not null references public.chapters(id),
  section_id uuid references public.tutor_sections(id),
  proposed_heading text not null check(length(trim(proposed_heading)) between 1 and 200),
  page_reference text not null default '' check(length(page_reference)<=80),
  note text not null default '' check(length(note)<=300),
  status text not null default 'requested' check(status in ('requested','preparing','ready','declined')),
  reason text not null default '' check(length(reason)<=300),
  pack_id uuid references public.tutor_packs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'ready' or (pack_id is not null and section_id is not null)),
  check (status <> 'preparing' or section_id is not null)
);
create unique index tutor_active_request on public.tutor_requests(child_id,chapter_id,(coalesce(section_id::text,lower(trim(proposed_heading))))) where status <> 'declined';
alter table public.tutor_requests enable row level security;
revoke all on public.tutor_requests from public,anon,authenticated;
grant select on public.tutor_requests to service_role;

create function public.request_tutor_section(p_child_id uuid,p_chapter_id uuid,p_section_id uuid,p_heading text,p_page text,p_note text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_child child_profiles; v_section tutor_sections; v_id uuid; v_heading text;
begin
  select child.* into v_child from child_profiles child join courses c on c.family_id=child.family_id
    and lower(c.board)=lower(child.board) and c.grade=child.grade join chapters ch on ch.course_id=c.id
    where child.id=p_child_id and child.active and ch.id=p_chapter_id for update of child;
  if not found then raise exception 'Chapter unavailable for this child.'; end if;
  v_heading:=trim(p_heading);
  if p_section_id is not null then
    select * into v_section from tutor_sections where id=p_section_id and chapter_id=p_chapter_id;
    if not found then raise exception 'Section unavailable in this chapter.'; end if;
    v_heading:=v_section.heading;
  end if;
  select id into v_id from tutor_requests where child_id=p_child_id and chapter_id=p_chapter_id and status<>'declined'
    and coalesce(section_id::text,lower(trim(proposed_heading)))=coalesce(p_section_id::text,lower(v_heading));
  if found then return v_id; end if;
  insert into tutor_requests(family_id,child_id,chapter_id,section_id,proposed_heading,page_reference,note)
    values(v_child.family_id,p_child_id,p_chapter_id,p_section_id,v_heading,p_page,p_note) returning id into v_id;
  return v_id;
end $$;

create function public.catalogue_tutor_section(p_family_id uuid,p_chapter_id uuid,p_key text,p_heading text,p_pages jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_chapter chapters; v_id uuid;
begin
  select ch.* into v_chapter from chapters ch join courses c on c.id=ch.course_id where ch.id=p_chapter_id and c.family_id=p_family_id for update of ch;
  if not found then raise exception 'Chapter unavailable.'; end if;
  if p_key !~ '^[a-z][a-z0-9_-]{0,63}$' or length(trim(p_heading)) not between 1 and 200 or jsonb_typeof(p_pages)<>'array' then raise exception 'Invalid section details.'; end if;
  insert into tutor_sections(chapter_id,external_id,heading,heading_path,printed_pages,pdf_pages)
    values(p_chapter_id,p_key,trim(p_heading),jsonb_build_array(v_chapter.title,trim(p_heading)),p_pages,'[]')
    on conflict(chapter_id,external_id) do nothing returning id into v_id;
  if v_id is null then
    select id into v_id from tutor_sections where chapter_id=p_chapter_id and external_id=p_key and heading=trim(p_heading) and printed_pages=p_pages;
    if not found then raise exception 'That section key already has different details.'; end if;
  end if;
  return v_id;
end $$;

create function public.manage_tutor_request(p_family_id uuid,p_request_id uuid,p_action text,p_section_id uuid,p_pack_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=public as $$
declare v_request tutor_requests; v_pack tutor_packs;
begin
  select * into v_request from tutor_requests where id=p_request_id and family_id=p_family_id for update;
  if not found then raise exception 'Request unavailable.'; end if;
  if v_request.status='declined' then raise exception 'This request was declined. The child can make a new request.'; end if;
  if p_action='decline' then
    if length(trim(p_reason)) not between 1 and 300 then raise exception 'Give a short reason for the child.'; end if;
    update tutor_requests set status='declined',reason=trim(p_reason),pack_id=null,updated_at=now() where id=p_request_id;
  elsif p_action='preparing' then
    if not exists(select 1 from tutor_sections where id=p_section_id and chapter_id=v_request.chapter_id) then raise exception 'Map this request to an exact section in its chapter.'; end if;
    update tutor_requests set status='preparing',section_id=p_section_id,reason='',pack_id=null,updated_at=now() where id=p_request_id;
  elsif p_action='ready' then
    select * into v_pack from tutor_packs where id=p_pack_id and family_id=p_family_id and status='published' and section_id=v_request.section_id for share;
    if not found then raise exception 'Choose a published lesson for this exact section.'; end if;
    if not exists(select 1 from tutor_sections s join chapters ch on ch.id=s.chapter_id join courses c on c.id=ch.course_id
      join child_profiles child on child.id=v_request.child_id and child.family_id=c.family_id and lower(child.board)=lower(c.board) and child.grade=c.grade and child.active
      where s.id=v_pack.section_id and ch.id=v_request.chapter_id) then raise exception 'Lesson is not eligible for this child.'; end if;
    update tutor_requests set status='ready',pack_id=p_pack_id,reason='',updated_at=now() where id=p_request_id;
  else raise exception 'Unsupported request action.';
  end if;
end $$;
revoke all on function public.request_tutor_section(uuid,uuid,uuid,text,text,text),public.catalogue_tutor_section(uuid,uuid,text,text,jsonb),public.manage_tutor_request(uuid,uuid,text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.request_tutor_section(uuid,uuid,uuid,text,text,text),public.catalogue_tutor_section(uuid,uuid,text,text,jsonb),public.manage_tutor_request(uuid,uuid,text,uuid,uuid,text) to service_role;
