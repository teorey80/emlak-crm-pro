begin;

-- Ana sayfadaki "Gördüm, geç" ile gizlenen eşleşmeler; her cihazda aynı görünsün diye DB'de tutulur.
-- Kayıtlar yalnızca sahibine görünür.
create table if not exists public.dismissed_matches (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  request_id text not null,
  property_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id, property_id)
);

alter table public.dismissed_matches enable row level security;

revoke all on public.dismissed_matches from anon, authenticated;
grant select, insert, delete on public.dismissed_matches to authenticated;
create policy dismissed_matches_select on public.dismissed_matches for select to authenticated using (user_id = (select auth.uid()));
create policy dismissed_matches_insert on public.dismissed_matches for insert to authenticated with check (user_id = (select auth.uid()));
create policy dismissed_matches_delete on public.dismissed_matches for delete to authenticated using (user_id = (select auth.uid()));

commit;
