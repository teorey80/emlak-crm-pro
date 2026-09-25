-- Google bağlantı sırları yalnızca sunucu tarafından okunur.
create table if not exists public.google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  refresh_token_encrypted text not null,
  scopes text not null default '',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.google_connections enable row level security;
revoke all on public.google_connections from anon, authenticated;

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  office_id uuid,
  title text not null check (length(trim(title)) between 1 and 255),
  notes text not null default '',
  due_date date,
  completed boolean not null default false,
  google_task_id text,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_tasks_user_created on public.crm_tasks(user_id, created_at desc);
alter table public.crm_tasks enable row level security;
revoke all on public.crm_tasks from anon;
grant select, insert, update, delete on public.crm_tasks to authenticated;
create policy crm_tasks_select on public.crm_tasks for select to authenticated using (user_id = (select auth.uid()));
create policy crm_tasks_insert on public.crm_tasks for insert to authenticated with check (user_id = (select auth.uid()));
create policy crm_tasks_update on public.crm_tasks for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy crm_tasks_delete on public.crm_tasks for delete to authenticated using (user_id = (select auth.uid()));
