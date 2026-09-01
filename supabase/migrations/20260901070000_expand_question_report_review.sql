alter table public.question_reports add column family_id uuid references public.families(id) on delete cascade;
update public.question_reports qr
set family_id = cp.family_id
from public.child_profiles cp
where cp.id = qr.child_id;
alter table public.question_reports alter column family_id set not null;

alter table public.question_reports drop constraint question_reports_status_check;
update public.question_reports set status = 'corrected' where status = 'resolved';
alter table public.question_reports add constraint question_reports_status_check
  check (status in ('open', 'dismissed', 'disabled', 'corrected'));

alter table public.question_reports
  add column resolver_name text,
  add column resolution_note text,
  add column replacement_snapshot jsonb;

create index question_reports_family_status_created_idx
  on public.question_reports(family_id, status, created_at desc);
