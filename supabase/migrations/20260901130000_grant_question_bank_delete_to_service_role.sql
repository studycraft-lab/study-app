-- Parent-initiated bank deletion is authorized in the server route after the
-- bank is scoped to the current family. The server's service role still needs
-- the underlying table privilege in addition to its RLS bypass.
grant delete on table public.question_banks to service_role;
