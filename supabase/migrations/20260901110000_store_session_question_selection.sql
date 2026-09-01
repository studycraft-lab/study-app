alter table public.study_sessions
add column question_ids text[];

alter table public.study_sessions
add constraint study_sessions_question_ids_size
check (question_ids is null or cardinality(question_ids) = total_questions);

create index study_sessions_resumable_idx
on public.study_sessions(child_id, started_at desc)
where status = 'in_progress' and question_ids is not null;
