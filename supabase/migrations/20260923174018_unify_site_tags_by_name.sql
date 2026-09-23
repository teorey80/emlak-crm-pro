-- Legacy prospecting rows kept a site name without a catalogue link.
-- Only connect exact normalized names when there is one matching site.
begin;

with unique_sites as (
  select public.crm_normalize_label(name) as normalized_name, min(id) as id
  from public.sites
  group by public.crm_normalize_label(name)
  having count(*) = 1
)
update public.prospecting_cases p
set site_id = s.id
from unique_sites s
where p.site_id is null
  and s.normalized_name <> ''
  and public.crm_normalize_label(p.site_name) = s.normalized_name;

-- A future import may again have a name but no site_id. Resolve a unique,
-- RLS-visible catalogue match at search time so one project has one tag key.
create or replace function public.crm_site_tag(sid text, name text)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  with matching_site as (
    select min(s.id) as id, min(s.name) as name
    from public.sites s
    where nullif($1, '') is null
      and nullif(public.crm_normalize_label($2), '') is not null
      and public.crm_normalize_label(s.name) = public.crm_normalize_label($2)
    having count(*) = 1
  )
  select public.crm_tag(
    'site',
    coalesce(nullif($1, ''), (select id from matching_site),
      'name=' || nullif(public.crm_normalize_label($2), '')),
    coalesce((select name from matching_site), $2)
  );
$$;

revoke all on function public.crm_site_tag(text, text) from public, anon;
grant execute on function public.crm_site_tag(text, text) to authenticated;

commit;
