-- Mirror real prospecting calls into the existing private activity timeline.
-- Imported notes and follow-up plans are not completed calls.
begin;
alter table public.prospecting_events add constraint prospecting_event_case_owner unique(id,case_id,user_id);
alter table public.activities
  add column prospecting_event_id uuid unique,
  add column prospecting_case_id uuid,
  add column prospecting_source_kind text check(prospecting_source_kind in ('list','fsbo','manual')),
  add column prospecting_outcome text check(prospecting_outcome in ('reached','no_answer','do_not_contact')),
  add column prospecting_is_follow_up boolean,
  add constraint activity_prospect_event_owner foreign key(prospecting_event_id,prospecting_case_id,user_id)
    references public.prospecting_events(id,case_id,user_id),
  add constraint activity_prospect_metadata check(prospecting_event_id is null or
    (prospecting_case_id is not null and user_id is not null and prospecting_source_kind is not null
     and prospecting_outcome is not null and prospecting_is_follow_up is not null));

create function public.prospecting_sync_activity(p_event_id uuid) returns void
language sql security invoker set search_path='' as $$
  insert into public.activities(id,user_id,office_id,type,"customerId","customerName","propertyTitle",date,time,description,status,
    prospecting_event_id,prospecting_case_id,prospecting_source_kind,prospecting_outcome,prospecting_is_follow_up)
  select 'PROSPECT-'||e.id::text,e.user_id,p.office_id,'Giden Arama',
    (select case when count(*)=1 then min(cu.id) else null end from public.customers cu
     where cu.user_id=e.user_id and c.phone<>''
       and right(regexp_replace(coalesce(cu.phone,''),'[^0-9]','','g'),10)=c.phone
       and lower(trim(cu.name))=lower(trim(c.name))),
    c.name,concat_ws(' · ',p.site_name,nullif(p.block,''),nullif(p.unit,'')),
    to_char(e.occurred_at at time zone 'Europe/Istanbul','YYYY-MM-DD'),
    case when e.date_precision='minute' then to_char(e.occurred_at at time zone 'Europe/Istanbul','HH24:MI') else null end,
    e.note,'Tamamlandı',e.id,p.id,p.source_kind,e.outcome,
    exists(select 1 from public.prospecting_events previous where previous.user_id=e.user_id and previous.case_id=e.case_id
      and previous.id<>e.id and previous.outcome in ('reached','no_answer','do_not_contact','import')
      and (previous.outcome='import' or (previous.created_at,previous.id)<(e.created_at,e.id)))
  from public.prospecting_events e
  join public.prospecting_cases p on p.id=e.case_id and p.user_id=e.user_id
  join public.prospecting_contacts c on c.id=p.contact_id and c.user_id=e.user_id
  where e.id=p_event_id and e.outcome in ('reached','no_answer','do_not_contact') and e.occurred_at is not null
  on conflict(prospecting_event_id) do nothing;
$$;
revoke all on function public.prospecting_sync_activity(uuid) from public,anon;
grant execute on function public.prospecting_sync_activity(uuid) to authenticated;

create function public.prospecting_activity_on_insert() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  perform public.prospecting_sync_activity(new.id);
  return new;
end;
$$;
revoke all on function public.prospecting_activity_on_insert() from public,anon;
create trigger prospecting_activity_on_insert after insert on public.prospecting_events
  for each row execute function public.prospecting_activity_on_insert();

-- Recover calls already entered in the CRM, once, at their original dates.
select public.prospecting_sync_activity(id) from public.prospecting_events
  where outcome in ('reached','no_answer','do_not_contact') and occurred_at is not null;

-- Linked calls are audit records: editing/deleting one copy would split the histories.
create function public.prospecting_activity_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if old.prospecting_event_id is not null then
    raise exception 'Bu arama Portföy Takibi geçmişine bağlıdır. Yeni not veya takip için takip kartını açın.';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.prospecting_activity_guard() from public,anon;
create trigger prospecting_activity_guard before update or delete on public.activities
  for each row execute function public.prospecting_activity_guard();
-- Existing owner RLS and anonymous privilege restrictions are unchanged.
commit;
