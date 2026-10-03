-- Run this in Supabase Dashboard > SQL Editor before deploying the frontend.
create table if not exists public.departments (
  dept text primary key check (char_length(trim(dept)) between 1 and 100),
  ip text not null check (ip ~ '^(25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1?[0-9]?[0-9])$')
);

create table if not exists public.usage_logs (
  id bigint generated always as identity primary key,
  ip text not null,
  timestamp timestamptz not null default now(),
  bytes_sent double precision not null default 0 check (bytes_sent >= 0),
  bytes_recv double precision not null default 0 check (bytes_recv >= 0)
);
create index if not exists usage_logs_ip_timestamp_idx on public.usage_logs (ip, timestamp desc);
create index if not exists usage_logs_timestamp_idx on public.usage_logs (timestamp desc);

create table if not exists public.downtime_logs (
  id bigint generated always as identity primary key,
  dept text not null,
  start_time timestamptz not null,
  end_time timestamptz
);
create index if not exists downtime_logs_start_idx on public.downtime_logs (start_time desc);

create table if not exists public.config (
  key text primary key,
  value text not null
);
insert into public.config(key, value) values ('threshold', '0.1'), ('bandwidth', '50') on conflict (key) do nothing;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  action text not null,
  detail text,
  timestamp timestamptz not null default now()
);
create index if not exists audit_logs_timestamp_idx on public.audit_logs (timestamp desc);

-- Browser access requires an authenticated Supabase user. Disable public sign-ups
-- in Authentication settings and create admin users manually.
alter table public.departments enable row level security;
alter table public.usage_logs enable row level security;
alter table public.downtime_logs enable row level security;
alter table public.config enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Signed-in admins can manage departments" on public.departments;
drop policy if exists "Signed-in admins can read usage" on public.usage_logs;
drop policy if exists "Signed-in admins can read downtime" on public.downtime_logs;
drop policy if exists "Signed-in admins can manage config" on public.config;
drop policy if exists "Signed-in admins can read audit" on public.audit_logs;
drop policy if exists "Signed-in admins can write audit" on public.audit_logs;
create policy "Signed-in admins can manage departments" on public.departments for all to authenticated using (true) with check (true);
create policy "Signed-in admins can read usage" on public.usage_logs for select to authenticated using (true);
create policy "Signed-in admins can read downtime" on public.downtime_logs for select to authenticated using (true);
create policy "Signed-in admins can manage config" on public.config for all to authenticated using (true) with check (true);
create policy "Signed-in admins can read audit" on public.audit_logs for select to authenticated using (true);
create policy "Signed-in admins can write audit" on public.audit_logs for insert to authenticated with check (true);

-- Aggregate on Postgres so history charts are not limited by the REST row cap.
create or replace function public.usage_by_period(p_days integer)
returns table (dept text, upload_mb numeric, download_mb numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(d.dept, 'Unknown') as dept,
         round((sum(u.bytes_sent) / 1048576.0)::numeric, 2) as upload_mb,
         round((sum(u.bytes_recv) / 1048576.0)::numeric, 2) as download_mb
  from public.usage_logs u
  left join public.departments d on d.ip = u.ip
  where u.timestamp >= now() - make_interval(days => greatest(1, least(p_days, 30)))
  group by coalesce(d.dept, 'Unknown')
  order by dept;
$$;
revoke all on function public.usage_by_period(integer) from public, anon;
grant execute on function public.usage_by_period(integer) to authenticated;

-- The local monitor uses the service-role key to write usage/downtime rows.
