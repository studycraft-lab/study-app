create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

grant select on table public.app_config to anon, authenticated;

drop policy if exists "app configuration is publicly readable"
on public.app_config;

create policy "app configuration is publicly readable"
on public.app_config
for select
to anon, authenticated
using (key = 'application_name');
