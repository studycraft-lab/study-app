insert into public.app_config (key, value)
values ('application_name', 'StudyCraft')
on conflict (key)
do update set
  value = excluded.value,
  updated_at = now();
