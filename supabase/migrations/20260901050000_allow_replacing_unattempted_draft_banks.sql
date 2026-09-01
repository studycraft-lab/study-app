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
  v_bank_status text;
  v_existing_hash text;
  v_created boolean := false;
  v_replaced boolean := false;
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

  select id, status, content_hash into v_bank_id, v_bank_status, v_existing_hash
  from question_banks
  where external_id = p_payload->'bank'->>'id'
    and version = (p_payload->'bank'->>'version')::integer
  for update;

  if v_bank_id is null then
    insert into question_banks (chapter_id, external_id, version, schema_version, status, payload, content_hash, question_count, source_count, topic_count)
    values (v_chapter_id, p_payload->'bank'->>'id', (p_payload->'bank'->>'version')::integer, p_payload->>'schemaVersion', coalesce(p_payload->'bank'->>'status', 'draft'), p_payload, p_content_hash, jsonb_array_length(p_payload->'questions'), jsonb_array_length(p_payload->'sources'), jsonb_array_length(p_payload->'topics'))
    returning id into v_bank_id;
    v_created := true;
  elsif v_existing_hash <> p_content_hash then
    if v_bank_status <> 'draft' then
      raise exception 'A non-draft bank cannot be replaced. Increase the bank version.';
    end if;

    if exists (select 1 from study_sessions where question_bank_id = v_bank_id)
      or exists (select 1 from study_attempts where question_bank_id = v_bank_id)
      or exists (select 1 from review_items where question_bank_id = v_bank_id) then
      raise exception 'A bank with study history cannot be replaced. Increase the bank version.';
    end if;

    update question_banks
    set chapter_id = v_chapter_id,
        schema_version = p_payload->>'schemaVersion',
        status = coalesce(p_payload->'bank'->>'status', 'draft'),
        payload = p_payload,
        content_hash = p_content_hash,
        question_count = jsonb_array_length(p_payload->'questions'),
        source_count = jsonb_array_length(p_payload->'sources'),
        topic_count = jsonb_array_length(p_payload->'topics'),
        imported_at = now()
    where id = v_bank_id;
    v_replaced := true;
  end if;

  return jsonb_build_object('id', v_bank_id, 'created', v_created, 'replaced', v_replaced);
end;
$$;

revoke all on function public.import_question_bank(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.import_question_bank(jsonb, jsonb, text) to service_role;
