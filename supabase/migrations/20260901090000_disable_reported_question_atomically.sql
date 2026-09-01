update public.question_banks qb
set status = 'superseded'
where qb.status <> 'superseded'
  and exists (
    select 1 from public.question_banks newer
    where newer.external_id = qb.external_id and newer.version > qb.version
  );

create or replace view public.library_chapters with (security_invoker = true) as
select qb.id, c.board, c.grade, c.subject, c.book_title, ch.chapter_number,
       ch.title as chapter_title, qb.version as bank_version, qb.question_count, qb.imported_at,
       c.family_id
from public.question_banks qb
join public.chapters ch on ch.id = qb.chapter_id
join public.courses c on c.id = ch.course_id
where qb.status <> 'abandoned';

create or replace function public.disable_reported_question(
  p_report_id uuid,
  p_family_id uuid,
  p_resolver_name text,
  p_resolution_note text,
  p_payload jsonb,
  p_content_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.question_reports%rowtype;
  v_latest public.question_banks%rowtype;
  v_new_bank_id uuid;
  v_new_version integer;
  v_replacement jsonb;
begin
  select * into v_report
  from public.question_reports
  where id = p_report_id and family_id = p_family_id and status = 'open'
  for update;
  if not found then raise exception 'This report is no longer open.'; end if;

  select qb.* into v_latest
  from public.question_banks qb
  where qb.external_id = (select external_id from public.question_banks where id = v_report.question_bank_id)
    and qb.status <> 'abandoned'
  order by qb.version desc
  limit 1
  for update;
  if not found then raise exception 'The latest question bank is unavailable.'; end if;

  v_new_version := v_latest.version + 1;
  if p_payload->'bank'->>'id' <> v_latest.external_id
    or (p_payload->'bank'->>'version')::integer <> v_new_version then
    raise exception 'The replacement bank version is invalid.';
  end if;

  select question into v_replacement
  from jsonb_array_elements(p_payload->'questions') question
  where question->>'id' = v_report.question_id and question->>'status' = 'disabled';
  if v_replacement is null then raise exception 'The reported question was not disabled.'; end if;

  insert into public.question_banks (
    chapter_id, external_id, version, schema_version, status, payload, content_hash,
    question_count, source_count, topic_count
  ) values (
    v_latest.chapter_id, v_latest.external_id, v_new_version, p_payload->>'schemaVersion',
    coalesce(p_payload->'bank'->>'status', 'draft'), p_payload, p_content_hash,
    jsonb_array_length(p_payload->'questions'), jsonb_array_length(p_payload->'sources'),
    jsonb_array_length(p_payload->'topics')
  ) returning id into v_new_bank_id;

  update public.question_banks set status = 'superseded' where id = v_latest.id;
  delete from public.review_items
  where question_id = v_report.question_id
    and question_bank_id in (v_report.question_bank_id, v_latest.id);
  update public.question_reports
  set status = 'disabled', resolved_at = now(), resolver_name = p_resolver_name,
      resolution_note = nullif(trim(p_resolution_note), ''),
      resolved_question_bank_id = v_new_bank_id, replacement_snapshot = v_replacement
  where family_id = p_family_id and question_bank_id = v_report.question_bank_id
    and question_id = v_report.question_id and question_version = v_report.question_version
    and status = 'open';

  return jsonb_build_object('bankId', v_new_bank_id, 'bankVersion', v_new_version);
end;
$$;

revoke all on function public.disable_reported_question(uuid, uuid, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.disable_reported_question(uuid, uuid, text, text, jsonb, text)
  to service_role;
