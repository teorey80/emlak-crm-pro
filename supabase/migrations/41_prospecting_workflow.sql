-- Private prospecting workflow. Does not alter existing CRM tables or policies.
begin;

create table public.prospecting_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  office_id uuid references public.offices(id),
  identity_key text not null,
  name text not null check (length(trim(name)) > 0),
  phone text not null default '',
  do_not_contact boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, identity_key), unique (id, user_id)
);

create table public.prospecting_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  office_id uuid references public.offices(id),
  contact_id uuid not null,
  site_name text not null, block text not null default '', unit text not null,
  stage text not null default 'pool' check (stage in ('pool','new','follow_up','meeting','authorization','other_agent','snoozed','won','lost')),
  transaction_type text not null default 'Belirsiz', priority text not null default 'Normal',
  source_key text not null check (length(trim(source_key)) > 0), source_url text not null default '',
  source_note text not null default '', source_metadata jsonb not null default '{}'::jsonb,
  data_warning text not null default '', last_note text not null default '', search_notes text not null default '', last_contact_at timestamptz,
  next_action text not null default '', next_action_at timestamptz,
  closed_reason text not null default '', version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, source_key), unique (id, user_id),
  foreign key (contact_id, user_id) references public.prospecting_contacts(id, user_id),
  check (next_action_at is null or length(trim(next_action)) > 0),
  check (stage not in ('won','lost') or next_action_at is null)
);

create table public.prospecting_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  case_id uuid not null,
  request_id uuid not null default gen_random_uuid(),
  occurred_at timestamptz, created_at timestamptz not null default now(),
  date_precision text not null default 'minute' check (date_precision in ('day','minute','unknown')),
  outcome text not null check (outcome in ('reached','no_answer','plan','do_not_contact','import')),
  note text not null check (length(trim(note)) > 0),
  stage text not null check (stage in ('pool','new','follow_up','meeting','authorization','other_agent','snoozed','won','lost')),
  next_action text not null default '', next_action_at timestamptz,
  unique (user_id, request_id),
  foreign key (case_id, user_id) references public.prospecting_cases(id, user_id)
);

create index prospecting_contacts_owner_phone on public.prospecting_contacts(user_id, phone);
create index prospecting_cases_owner_due on public.prospecting_cases(user_id, next_action_at, id);
create index prospecting_cases_owner_stage on public.prospecting_cases(user_id, stage, id);
create index prospecting_cases_contact on public.prospecting_cases(contact_id, user_id);
create index prospecting_events_case_date on public.prospecting_events(case_id, occurred_at desc, created_at desc, id);

alter table public.prospecting_contacts enable row level security;
alter table public.prospecting_cases enable row level security;
alter table public.prospecting_events enable row level security;
revoke all on public.prospecting_contacts, public.prospecting_cases, public.prospecting_events from public, anon, authenticated;
grant select, insert, update on public.prospecting_contacts, public.prospecting_cases to authenticated;
grant select, insert on public.prospecting_events to authenticated;

create policy prospect_contacts_read on public.prospecting_contacts for select to authenticated using (user_id = (select auth.uid()));
create policy prospect_contacts_insert on public.prospecting_contacts for insert to authenticated with check (
  user_id = (select auth.uid()) and office_id is not distinct from (select office_id from public.profiles where id = (select auth.uid()))
);
create policy prospect_contacts_update on public.prospecting_contacts for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and office_id is not distinct from (select office_id from public.profiles where id = (select auth.uid()))
);
create policy prospect_cases_read on public.prospecting_cases for select to authenticated using (user_id = (select auth.uid()));
create policy prospect_cases_insert on public.prospecting_cases for insert to authenticated with check (
  user_id = (select auth.uid()) and office_id is not distinct from (select office_id from public.profiles where id = (select auth.uid()))
);
create policy prospect_cases_update on public.prospecting_cases for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and office_id is not distinct from (select office_id from public.profiles where id = (select auth.uid()))
);
create policy prospect_events_read on public.prospecting_events for select to authenticated using (user_id = (select auth.uid()));
create policy prospect_events_insert on public.prospecting_events for insert to authenticated with check (user_id = (select auth.uid()));

-- Invoker functions preserve RLS and commit history + next action atomically.
create function public.prospecting_import(p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_office uuid; r jsonb; e jsonb;
  v_contact uuid; v_case uuid; v_phone text; v_identity text; v_blocked boolean;
  v_added integer := 0; v_skipped integer := 0; v_latest jsonb;
begin
  if v_uid is null then raise exception 'Oturum gerekli'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 1000 or octet_length(p_rows::text) > 5000000 then
    raise exception 'Aktarım 1–1000 kayıt içermeli';
  end if;
  select office_id into v_office from public.profiles where id = v_uid;
  -- Serialise imports per owner: no partial duplicates under concurrent retries.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  for r in select value from jsonb_array_elements(p_rows) loop
    if coalesce(trim(r->>'source_key'),'') = '' or coalesce(trim(r->>'name'),'') = '' or coalesce(trim(r->>'site_name'),'') = '' or coalesce(trim(r->>'unit'),'') = '' then
      raise exception 'Kaynak ID, malik, site ve daire gerekli';
    end if;
    if exists(select 1 from public.prospecting_cases where user_id = v_uid and source_key = r->>'source_key') then
      v_skipped := v_skipped + 1; continue;
    end if;
    v_phone := regexp_replace(coalesce(r->>'phone',''), '[^0-9]', '', 'g');
    if v_phone like '0090%' then v_phone := substr(v_phone,5); end if;
    if length(v_phone) = 12 and v_phone like '90%' then v_phone := substr(v_phone,3); end if;
    if length(v_phone) = 11 and v_phone like '0%' then v_phone := substr(v_phone,2); end if;
    -- Exact name + telephone only. Cases and source IDs are never merged.
    v_identity := md5(lower(trim(r->>'name')) || '|' || v_phone || case when v_phone = '' then r->>'source_key' else '' end);
    v_blocked := coalesce((r->>'do_not_contact')::boolean,false) or exists (
      select 1 from public.prospecting_contacts where user_id = v_uid and phone = v_phone and v_phone <> '' and do_not_contact
    );
    insert into public.prospecting_contacts(user_id,office_id,identity_key,name,phone,do_not_contact)
      values(v_uid,v_office,v_identity,trim(r->>'name'),v_phone,v_blocked)
      on conflict (user_id,identity_key) do update set do_not_contact = prospecting_contacts.do_not_contact or excluded.do_not_contact
      returning id,do_not_contact into v_contact,v_blocked;
    insert into public.prospecting_cases(user_id,office_id,contact_id,site_name,block,unit,stage,transaction_type,priority,
      source_key,source_url,source_note,source_metadata,data_warning,next_action,next_action_at)
    values(v_uid,v_office,v_contact,r->>'site_name',coalesce(r->>'block',''),r->>'unit',coalesce(r->>'stage','pool'),
      coalesce(r->>'transaction_type','Belirsiz'),coalesce(r->>'priority','Normal'),r->>'source_key',coalesce(r->>'source_url',''),
      coalesce(r->>'source_note',''),coalesce(r->'source_metadata','{}'::jsonb),coalesce(r->>'data_warning',''),
      case when v_blocked or r->>'stage' in ('won','lost') then '' else coalesce(r->>'next_action','') end,
      case when v_blocked or r->>'stage' in ('won','lost') then null else (r->>'next_action_at')::timestamptz end)
    returning id into v_case;
    for e in select value from jsonb_array_elements(coalesce(r->'events','[]'::jsonb)) loop
      insert into public.prospecting_events(user_id,case_id,occurred_at,date_precision,outcome,note,stage,next_action,next_action_at)
        values(v_uid,v_case,(e->>'occurred_at')::timestamptz,case when e->>'occurred_at' is null then 'unknown' else coalesce(e->>'date_precision','day') end,'import',e->>'note',e->>'stage',coalesce(e->>'next_action',''),(e->>'next_action_at')::timestamptz);
    end loop;
    select value into v_latest from jsonb_array_elements(coalesce(r->'events','[]'::jsonb))
      order by (value->>'occurred_at')::timestamptz desc nulls last limit 1;
    if v_latest is not null then
      update public.prospecting_cases set last_note = v_latest->>'note', last_contact_at = (v_latest->>'occurred_at')::timestamptz,
        search_notes = (select string_agg(value->>'note', E'\n') from jsonb_array_elements(r->'events')) where id = v_case;
    end if;
    if v_blocked then
      update public.prospecting_contacts set do_not_contact = true where user_id = v_uid and (id = v_contact or (phone = v_phone and v_phone <> ''));
      update public.prospecting_cases set next_action = '', next_action_at = null, version = version + 1
        where user_id = v_uid and contact_id in (select id from public.prospecting_contacts where user_id = v_uid and do_not_contact);
    end if;
    v_added := v_added + 1;
  end loop;
  return jsonb_build_object('added',v_added,'skipped',v_skipped);
end;
$$;

create function public.prospecting_record_event(p_input jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  c public.prospecting_cases; person public.prospecting_contacts;
  v_uid uuid := auth.uid(); v_event uuid; v_stage text := p_input->>'stage';
  v_outcome text := p_input->>'outcome'; v_due timestamptz := (p_input->>'next_action_at')::timestamptz;
  v_occurred timestamptz := (p_input->>'occurred_at')::timestamptz;
  v_request uuid := (p_input->>'request_id')::uuid;
begin
  if v_uid is null then raise exception 'Oturum gerekli'; end if;
  if v_request is null then raise exception 'İşlem kimliği gerekli'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  select id into v_event from public.prospecting_events where user_id = v_uid and request_id = v_request;
  if found then return v_event; end if;
  select * into c from public.prospecting_cases where id = (p_input->>'case_id')::uuid and user_id = v_uid for update;
  if not found then raise exception 'Kayıt bulunamadı'; end if;
  if c.version <> (p_input->>'expected_version')::integer or p_input->>'expected_version' is null then
    raise exception 'Kayıt başka bir işlemde değişti. Listeyi yenileyip tekrar deneyin.';
  end if;
  select * into person from public.prospecting_contacts where id = c.contact_id and user_id = v_uid;
  if person.do_not_contact then raise exception 'Bu kişi aranmak istemiyor; yeni arama veya takip oluşturulamaz.'; end if;
  if coalesce(trim(p_input->>'note'),'') = '' then raise exception 'Görüşme notu gerekli'; end if;
  if v_occurred is null or v_occurred > now() + interval '5 minutes' then raise exception 'Görüşme tarihi boş veya gelecekte olamaz'; end if;
  if v_outcome = 'no_answer' then v_stage := c.stage; end if;
  if v_outcome = 'do_not_contact' then v_stage := 'lost'; end if;
  if v_stage = 'pool' and v_outcome <> 'no_answer' then raise exception 'Başlatılan görüşme için bir takip aşaması seçin'; end if;
  if v_stage not in ('won','lost') and v_outcome <> 'do_not_contact' then
    if v_due is null or v_due <= now() or coalesce(trim(p_input->>'next_action'),'') = '' then
      raise exception 'Açık süreç için gelecekte bir takip tarihi ve sonraki adım gerekli';
    end if;
  else
    if coalesce(trim(p_input->>'closed_reason'),'') = '' then raise exception 'Kapanış nedeni gerekli'; end if;
    v_due := null;
  end if;
  insert into public.prospecting_events(user_id,case_id,request_id,occurred_at,outcome,note,stage,next_action,next_action_at)
    values(v_uid,c.id,v_request,v_occurred,v_outcome,trim(p_input->>'note'),v_stage,
      case when v_due is null then '' else trim(p_input->>'next_action') end,v_due) returning id into v_event;
  update public.prospecting_cases set stage = v_stage,
    last_note = trim(p_input->>'note'), search_notes = concat_ws(E'\n',nullif(search_notes,''),trim(p_input->>'note')),
    last_contact_at = case when v_outcome = 'plan' then last_contact_at else greatest(last_contact_at,v_occurred) end,
    next_action = case when v_due is null then '' else trim(p_input->>'next_action') end,
    next_action_at = v_due, closed_reason = case when v_due is null then trim(p_input->>'closed_reason') else '' end,
    version = version + 1 where id = c.id;
  if v_outcome = 'do_not_contact' then
    update public.prospecting_contacts set do_not_contact = true
      where user_id = v_uid and (id = person.id or (person.phone <> '' and phone = person.phone));
    update public.prospecting_cases set next_action = '', next_action_at = null, version = version + 1
      where user_id = v_uid and contact_id in (select id from public.prospecting_contacts where user_id = v_uid and do_not_contact);
  end if;
  return v_event;
end;
$$;
revoke all on function public.prospecting_import(jsonb), public.prospecting_record_event(jsonb) from public, anon;
grant execute on function public.prospecting_import(jsonb), public.prospecting_record_event(jsonb) to authenticated;
commit;
