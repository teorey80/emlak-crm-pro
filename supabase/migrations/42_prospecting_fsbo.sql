-- Add manual FSBO workflows without changing existing CRM activity/customer records.
begin;
alter table public.prospecting_cases add column source_kind text not null default 'list' check (source_kind in ('list','fsbo','manual'));
create table public.prospecting_activity_links (
  user_id uuid not null default auth.uid() references auth.users(id),
  activity_id text not null,
  case_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(user_id,activity_id),
  foreign key(case_id,user_id) references public.prospecting_cases(id,user_id)
);
create index prospect_activity_case on public.prospecting_activity_links(case_id,user_id);
alter table public.prospecting_activity_links enable row level security;
revoke all on public.prospecting_activity_links from public,anon,authenticated;
grant select,insert on public.prospecting_activity_links to authenticated;
create policy prospect_activity_read on public.prospecting_activity_links for select to authenticated using(user_id=(select auth.uid()));
create policy prospect_activity_insert on public.prospecting_activity_links for insert to authenticated with check(
  user_id=(select auth.uid()) and exists(select 1 from public.activities a where a.id=activity_id and a.user_id=(select auth.uid()))
);

create function public.prospecting_start(p_input jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare
  uid uuid:=auth.uid(); office uuid; cid uuid; person uuid; phone text; identity text;
  request uuid:=(p_input->>'request_id')::uuid; aid text:=nullif(p_input->>'activity_id','');
  existing uuid:=nullif(p_input->>'case_id','')::uuid; kind text:=coalesce(p_input->>'source_kind','fsbo');
  c public.prospecting_cases; a public.activities; customer public.customers;
  event_date timestamptz; precision text; note text; matched_name text; matched_phone text;
begin
  if uid is null or request is null then raise exception 'Oturum ve işlem kimliği gerekli'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  -- Retry after a lost response returns the same case without overwriting a newer plan.
  select case_id into cid from public.prospecting_events where user_id=uid and request_id=request;
  if found then return cid; end if;
  if aid is not null then
    select case_id into cid from public.prospecting_activity_links where user_id=uid and activity_id=aid;
    if found then return cid; end if;
    select * into a from public.activities where id=aid and user_id=uid;
    if not found then raise exception 'Aktivite bulunamadı veya sana ait değil'; end if;
    if a.type not in ('Giden Arama','Gelen Arama') then raise exception 'Yalnız arama aktiviteleri takibe alınabilir'; end if;
    select * into customer from public.customers where id=a."customerId" and user_id=uid;
    if not found then raise exception 'Aktivitenin müşteri kaydı bulunamadı'; end if;
  end if;
  if existing is not null then
    if aid is null then raise exception 'Mevcut karta bağlamak için aktivite gerekli'; end if;
    select * into c from public.prospecting_cases where id=existing and user_id=uid for update;
    if not found then raise exception 'Takip kartı bulunamadı'; end if;
    if c.version is distinct from (p_input->>'expected_version')::integer then raise exception 'Kart değişti; listeyi yenileyin'; end if;
    cid:=c.id;
    select p.name,p.phone into matched_name,matched_phone from public.prospecting_contacts p where p.id=c.contact_id and p.user_id=uid;
    phone:=regexp_replace(coalesce(customer.phone,''),'[^0-9]','','g');
    if phone like '0090%' then phone:=substr(phone,5); end if;
    if length(phone)=12 and phone like '90%' then phone:=substr(phone,3); end if;
    if length(phone)=11 and phone like '0%' then phone:=substr(phone,2); end if;
    if (phone<>'' and phone is distinct from matched_phone) or (phone='' and lower(trim(customer.name)) is distinct from lower(trim(matched_name))) then
      raise exception 'Aktivite ile kartın kişisi eşleşmiyor';
    end if;
  else
    if kind not in ('fsbo','manual') then raise exception 'Geçersiz kayıt kaynağı'; end if;
    matched_name:=case when aid is null then trim(p_input->>'name') else customer.name end;
    phone:=regexp_replace(coalesce(case when aid is null then p_input->>'phone' else customer.phone end,''),'[^0-9]','','g');
    if phone like '0090%' then phone:=substr(phone,5); end if;
    if length(phone)=12 and phone like '90%' then phone:=substr(phone,3); end if;
    if length(phone)=11 and phone like '0%' then phone:=substr(phone,2); end if;
    if coalesce(matched_name,'')='' or phone !~ '^[0-9]{10}$' or coalesce(trim(p_input->>'site_name'),'')='' then
      raise exception 'Ad, geçerli telefon ve taşınmaz açıklaması gerekli';
    end if;
    if coalesce(p_input->>'source_url','')<>'' and p_input->>'source_url' !~ '^https?://' then raise exception 'İlan bağlantısı http veya https ile başlamalı'; end if;
    select office_id into office from public.profiles where id=uid;
    identity:=md5(lower(trim(matched_name))||'|'||phone);
    insert into public.prospecting_contacts(user_id,office_id,identity_key,name,phone)
      values(uid,office,identity,matched_name,phone) on conflict(user_id,identity_key) do update set identity_key=excluded.identity_key returning id into person;
    insert into public.prospecting_cases(user_id,office_id,contact_id,site_name,block,unit,source_kind,source_key,source_url,source_metadata,transaction_type,stage)
      values(uid,office,person,trim(p_input->>'site_name'),coalesce(p_input->>'block',''),coalesce(p_input->>'unit',''),kind,
        'manual:'||request::text,coalesce(p_input->>'source_url',''),jsonb_build_object('Kanal',coalesce(p_input->>'channel',''),'Eklenme biçimi',case when aid is null then 'Manuel' else 'CRM aktivitesinden' end),
        coalesce(p_input->>'transaction_type','Belirsiz'),'new') returning * into c;
    cid:=c.id;
  end if;
  if exists(select 1 from public.prospecting_contacts p where p.user_id=uid and p.do_not_contact and (p.id=c.contact_id or (p.phone<>'' and p.phone=(select p2.phone from public.prospecting_contacts p2 where p2.id=c.contact_id)))) then
    raise exception 'Bu kişi tekrar aranmak istemiyor; takip açılamaz';
  end if;
  if aid is not null then
    -- Preserve the source snapshot and its actual precision, without inventing a fresh conversation.
    event_date:=null; precision:='unknown';
    begin
      if a.date ~ '^\d{4}-\d{2}-\d{2}$' then
        event_date:=(a.date||' '||case when a.time ~ '^\d{2}:\d{2}(:\d{2})?$' then a.time else '12:00' end||'+03:00')::timestamptz;
        precision:=case when a.time ~ '^\d{2}:\d{2}(:\d{2})?$' then 'minute' else 'day' end;
      end if;
    exception when others then event_date:=null; precision:='unknown'; end;
    note:=concat('Eski CRM aktivitesi · ',a.type,' · ',a.date,' · ',a.status,E'\n',coalesce(nullif(a.description,''),'Açıklama yok.'));
    insert into public.prospecting_events(user_id,case_id,occurred_at,date_precision,outcome,note,stage)
      values(uid,cid,event_date,precision,'import',note,c.stage);
    insert into public.prospecting_activity_links(user_id,activity_id,case_id) values(uid,aid,cid);
    update public.prospecting_cases set search_notes=concat_ws(E'\n',nullif(search_notes,''),note) where id=cid;
  end if;
  -- The existing atomic writer validates future dates, notes, opt-out and closed states.
  perform public.prospecting_record_event(p_input||jsonb_build_object('case_id',cid,'expected_version',c.version,'occurred_at',now(),
    'outcome',case when aid is not null then 'plan' else coalesce(p_input->>'outcome','plan') end));
  return cid;
end;
$$;
revoke all on function public.prospecting_start(jsonb) from public,anon;
grant execute on function public.prospecting_start(jsonb) to authenticated;
commit;
