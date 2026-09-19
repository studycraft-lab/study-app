-- Keep request fulfilment atomic with lesson import and publication.
create function public.import_requested_tutor_pack(p_family_id uuid, p_request_id uuid, p_payload jsonb, p_content_hash text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_request tutor_requests; v_section tutor_sections; v_result jsonb; v_pack tutor_packs;
begin
  select * into v_request from tutor_requests where id=p_request_id and family_id=p_family_id for update;
  if not found then raise exception 'Request unavailable.'; end if;
  if v_request.status='declined' then raise exception 'This request was declined.'; end if;
  if v_request.status='ready' and exists(select 1 from tutor_packs where id=v_request.pack_id and status='published') then raise exception 'This request already has a published lesson.'; end if;
  if v_request.section_id is not null then
    select * into v_section from tutor_sections where id=v_request.section_id;
    if p_payload->'section'->>'id' <> v_section.external_id or p_payload->'section'->>'heading' <> v_section.heading then raise exception 'Lesson section does not match this request.'; end if;
  elsif lower(trim(p_payload->'section'->>'heading')) <> lower(trim(v_request.proposed_heading)) then
    raise exception 'Lesson heading does not match this request.';
  end if;
  v_result := import_tutor_pack(p_family_id,v_request.chapter_id,p_payload,p_content_hash);
  select * into v_pack from tutor_packs where id=(v_result->>'id')::uuid;
  if v_pack.status='archived' then raise exception 'Upload a new version; this lesson is archived.'; end if;
  update tutor_requests set section_id=v_pack.section_id,pack_id=v_pack.id,status='preparing',reason='',updated_at=now() where id=p_request_id;
  if v_pack.status='published' then perform manage_tutor_request(p_family_id,p_request_id,'ready',null,v_pack.id,''); end if;
  return v_result;
end $$;
create function public.publish_requested_tutor_pack(p_family_id uuid,p_pack_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_request tutor_requests;
begin
  perform 1 from tutor_requests where family_id=p_family_id and pack_id=p_pack_id and status='preparing' order by id for update;
  perform manage_tutor_pack(p_family_id,p_pack_id,'publish');
  for v_request in select * from tutor_requests where family_id=p_family_id and pack_id=p_pack_id and status='preparing' order by id loop
    perform manage_tutor_request(p_family_id,v_request.id,'ready',null,p_pack_id,'');
  end loop;
end $$;
revoke all on function public.import_requested_tutor_pack(uuid,uuid,jsonb,text),public.publish_requested_tutor_pack(uuid,uuid) from public,anon,authenticated;
grant execute on function public.import_requested_tutor_pack(uuid,uuid,jsonb,text),public.publish_requested_tutor_pack(uuid,uuid) to service_role;
