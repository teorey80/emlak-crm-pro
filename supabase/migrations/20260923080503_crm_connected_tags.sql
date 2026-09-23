-- Shared labels and correlated search. Caller RLS applies to every source.
begin;
alter table public.properties add column site_id text references public.sites(id);
alter table public.prospecting_cases add column site_id text references public.sites(id), add column rooms text;
alter table public.activities add column site_id text references public.sites(id), add column rooms text;
alter table public.prospecting_contacts add column customer_id text references public.customers(id) on delete set null;
create index properties_tag_site on public.properties(site_id,rooms);
create index prospecting_tag_site on public.prospecting_cases(user_id,site_id,rooms);
create index activities_tag_property on public.activities("propertyId","customerId",type,status);
create index requests_tag_customer on public.requests("customerId","siteId","minRooms");

create function public.crm_normalize_label(value text) returns text
language sql immutable set search_path='' as $$
 select lower(translate(regexp_replace(trim(coalesce(value,'')), '\s+', ' ', 'g'),'IİÇĞÖŞÜ','ıiçğöşü'));
$$;

-- Exact, unique matches only, within the owner's catalogue; original text stays intact.
update public.properties p set site_id=s.id from public.sites s
where p.user_id=s.user_id and public.crm_normalize_label(p.site)=public.crm_normalize_label(s.name)
and public.crm_normalize_label(s.name)<>'' and (select count(*) from public.sites s2 where s2.user_id=p.user_id and public.crm_normalize_label(s2.name)=public.crm_normalize_label(p.site))=1;
update public.prospecting_cases p set site_id=s.id from public.sites s
where p.user_id=s.user_id and public.crm_normalize_label(p.site_name)=public.crm_normalize_label(s.name)
and public.crm_normalize_label(s.name)<>'' and (select count(*) from public.sites s2 where s2.user_id=p.user_id and public.crm_normalize_label(s2.name)=public.crm_normalize_label(p.site_name))=1;
update public.prospecting_contacts p set customer_id=c.id from public.customers c
where p.user_id=c.user_id and p.phone<>'' and right(regexp_replace(c.phone,'[^0-9]','','g'),10)=p.phone
and public.crm_normalize_label(c.name)=public.crm_normalize_label(p.name)
and (select count(*) from public.customers c2 where c2.user_id=p.user_id and right(regexp_replace(c2.phone,'[^0-9]','','g'),10)=p.phone and public.crm_normalize_label(c2.name)=public.crm_normalize_label(p.name))=1;

create function public.crm_tag_entity_owned(kind text, entity text) returns boolean
language sql stable security invoker set search_path='' as $$
 select case kind
 when 'customer' then exists(select 1 from public.customers where id=entity and user_id=(select auth.uid()))
 when 'property' then exists(select 1 from public.properties where id=entity and user_id=(select auth.uid()))
 when 'activity' then exists(select 1 from public.activities where id=entity and user_id=(select auth.uid()))
 when 'request' then exists(select 1 from public.requests where id=entity and user_id=(select auth.uid()))
 when 'prospect' then exists(select 1 from public.prospecting_cases where id::text=entity and user_id=(select auth.uid()))
 else false end;
$$;
create table public.crm_tags (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(trim(name)) between 1 and 60),
 normalized_name text generated always as (public.crm_normalize_label(name)) stored,
 unique(user_id,normalized_name), unique(id,user_id)
);
create table public.crm_tag_links (
 tag_id uuid not null, user_id uuid not null default auth.uid(),
 entity_type text not null check(entity_type in ('customer','property','activity','request','prospect')),
 entity_id text not null, primary key(tag_id,entity_type,entity_id),
 foreign key(tag_id,user_id) references public.crm_tags(id,user_id) on delete cascade
);
create index crm_tag_links_entity on public.crm_tag_links(user_id,entity_type,entity_id);
alter table public.crm_tags enable row level security;
alter table public.crm_tag_links enable row level security;
revoke all on public.crm_tags,public.crm_tag_links from public,anon,authenticated;
grant select,insert,delete on public.crm_tags,public.crm_tag_links to authenticated;
create policy crm_tags_owner on public.crm_tags for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy crm_tag_links_owner on public.crm_tag_links for all to authenticated
using(user_id=(select auth.uid()) and public.crm_tag_entity_owned(entity_type,entity_id))
with check(user_id=(select auth.uid()) and public.crm_tag_entity_owned(entity_type,entity_id));

-- Validate new relationships with the caller's actual visibility; no privileged reads.
create function public.crm_validate_tag_fields() returns trigger language plpgsql security invoker set search_path='' as $$
declare sid text; begin
 sid:=to_jsonb(new)->>'site_id';
 if sid is not null and not exists(select 1 from public.sites where id=sid) then raise exception 'Site bulunamadı veya erişim izniniz yok'; end if;
 if tg_table_name='prospecting_contacts' then
  if new.customer_id is not null and not exists(select 1 from public.customers c where c.id=new.customer_id and c.user_id=new.user_id) then raise exception 'Müşteri bağlantısı aynı hesaba ait olmalı'; end if;
 end if;
 return new;
end; $$;
create trigger properties_tag_fields before insert or update of site_id on public.properties for each row execute function public.crm_validate_tag_fields();
create trigger activities_tag_fields before insert or update of site_id on public.activities for each row execute function public.crm_validate_tag_fields();
create trigger prospecting_tag_fields before insert or update of site_id on public.prospecting_cases for each row execute function public.crm_validate_tag_fields();
create trigger contacts_tag_fields before insert or update of customer_id on public.prospecting_contacts for each row execute function public.crm_validate_tag_fields();

-- New optional fields are committed in the same transaction as the existing writer.
alter function public.prospecting_start(jsonb) rename to prospecting_start_before_tags;
create function public.prospecting_start(p_input jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare cid uuid; already_saved boolean; begin
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select exists(select 1 from public.prospecting_events where user_id=auth.uid() and request_id=(p_input->>'request_id')::uuid)
 or exists(select 1 from public.prospecting_activity_links where user_id=auth.uid() and activity_id=p_input->>'activity_id') into already_saved;
 cid:=public.prospecting_start_before_tags(p_input);
 if not already_saved and nullif(p_input->>'case_id','') is null then
  update public.prospecting_cases set site_id=nullif(p_input->>'site_id',''),rooms=nullif(trim(p_input->>'rooms'),'') where id=cid and user_id=auth.uid();
  update public.prospecting_contacts pc set customer_id=(select min(c.id) from public.customers c where c.user_id=pc.user_id and pc.phone<>'' and right(regexp_replace(c.phone,'[^0-9]','','g'),10)=pc.phone and public.crm_normalize_label(c.name)=public.crm_normalize_label(pc.name) having count(*)=1)
  where pc.id=(select contact_id from public.prospecting_cases where id=cid) and pc.user_id=auth.uid() and pc.customer_id is null;
 end if;
 return cid;
end; $$;

create function public.crm_tag(group_name text, value text, label text default null) returns jsonb
language sql immutable set search_path='' as $$
 select case when nullif(trim(value),'') is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('key',group_name||':'||value,'group',group_name,'label',coalesce(label,value))) end;
$$;
create function public.crm_site_tag(sid text, name text) returns jsonb
language sql immutable set search_path='' as $$
 select public.crm_tag('site',coalesce(nullif(sid,''),'name='||nullif(public.crm_normalize_label(name),'')),name);
$$;
create function public.crm_custom_tags(kind text, entity text) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('key','custom:'||t.id,'group','custom','label',t.name) order by t.name),'[]'::jsonb)
 from public.crm_tag_links l join public.crm_tags t on t.id=l.tag_id and t.user_id=l.user_id
 where l.entity_type=kind and l.entity_id=entity;
$$;

create function public.crm_tag_contexts()
returns table(entity_type text, entity_id text, title text, subtitle text, href text, context_label text, tags jsonb, links jsonb)
language sql stable security invoker set search_path='' as $$
with
custom as materialized (
 select l.entity_type,l.entity_id,jsonb_agg(jsonb_build_object('key','custom:'||t.id,'group','custom','label',t.name) order by t.name) tags
 from public.crm_tag_links l join public.crm_tags t on t.id=l.tag_id and t.user_id=l.user_id
 group by l.entity_type,l.entity_id
),
c as (select c.*,public.crm_tag('role',c."customerType")||coalesce(custom.tags,'[]'::jsonb) ct from public.customers c left join custom on custom.entity_type='customer' and custom.entity_id=c.id),
p as (select p.*,coalesce(s.name,p.site) canonical_site,public.crm_site_tag(s.id,coalesce(s.name,p.site))||public.crm_tag('rooms',p.rooms)||public.crm_tag('transaction',p.status)||coalesce(custom.tags,'[]'::jsonb) pt from public.properties p left join public.sites s on s.id=p.site_id left join custom on custom.entity_type='property' and custom.entity_id=p.id),
f as (select f.*,coalesce(s.name,f.site_name) canonical_site,coalesce(c.name,pc.name) person_name,c.id customer,
 public.crm_site_tag(s.id,coalesce(s.name,f.site_name))||public.crm_tag('rooms',f.rooms)||public.crm_tag('source',f.source_kind,case f.source_kind when 'fsbo' then 'FSBO' when 'list' then 'Liste datası' else 'Manuel' end)||public.crm_tag('stage',f.stage,case f.stage when 'pool' then 'Veri havuzu' when 'new' then 'Yeni takip' when 'follow_up' then 'Takipte' when 'meeting' then 'Portföy görüşmesi' when 'authorization' then 'Yetkilendirme' when 'other_agent' then 'Başka danışmanda' when 'snoozed' then 'Beklemede' when 'won' then 'Kazanıldı' else 'Kapandı' end)||public.crm_tag('transaction',f.transaction_type)||coalesce(c.ct,case when f.source_kind='fsbo' then public.crm_tag('role','Mal Sahibi') else '[]'::jsonb end)||coalesce(custom.tags,'[]'::jsonb) ft
 from public.prospecting_cases f join public.prospecting_contacts pc on pc.id=f.contact_id and pc.user_id=f.user_id
 left join c on c.id=pc.customer_id and c.user_id=pc.user_id left join public.sites s on s.id=f.site_id left join custom on custom.entity_type='prospect' and custom.entity_id=f.id::text),
r as (select r.*,coalesce(s.name,r."siteName") canonical_site,coalesce(c.ct,'[]'::jsonb)||public.crm_site_tag(s.id,coalesce(s.name,r."siteName"))||public.crm_tag('rooms',r."minRooms")||public.crm_tag('transaction',r."requestType")||coalesce(custom.tags,'[]'::jsonb) rt from public.requests r left join c on c.id=r."customerId" left join public.sites s on s.id=r."siteId" left join custom on custom.entity_type='request' and custom.entity_id=r.id),
a as (select a.*,case when p.id is not null then p.pt when a.site_id is not null or nullif(a.rooms,'') is not null then public.crm_site_tag(s.id,s.name)||public.crm_tag('rooms',a.rooms) else coalesce(f.ft,'[]'::jsonb) end
 ||coalesce(c.ct,'[]'::jsonb)
 ||public.crm_tag('event',case when a.type='Yer Gösterimi' then case when a.status='Planlandı' then 'showing_planned' when a.status in ('Tamamlandı','Olumlu','Olumsuz','Düşünüyor') then 'showing_done' else 'showing_unknown' end else a.type end,
 case when a.type='Yer Gösterimi' then case when a.status='Planlandı' then 'Yer gösterimi planlandı' when a.status in ('Tamamlandı','Olumlu','Olumsuz','Düşünüyor') then 'Yer gösterimi yapıldı' else 'Yer gösterimi — durum belirsiz' end else a.type end)
 ||public.crm_tag('outcome',coalesce(a.prospecting_outcome,a.status),case a.prospecting_outcome when 'no_answer' then 'Ulaşılamadı' when 'reached' then 'Görüşüldü' when 'do_not_contact' then 'Aranmasın' else a.status end)
 ||public.crm_tag('source',a.prospecting_source_kind,case a.prospecting_source_kind when 'fsbo' then 'FSBO' when 'list' then 'Liste datası' else 'Manuel' end)
 ||coalesce(custom.tags,'[]'::jsonb) activity_tags,
 p.id visible_property,c.id visible_customer,f.id visible_case,
 coalesce(p.canonical_site,s.name,f.canonical_site) place
 from public.activities a left join p on p.id=a."propertyId"
 left join f on f.id=a.prospecting_case_id left join c on c.id=coalesce(nullif(a."customerId",''),f.customer) left join public.sites s on s.id=a.site_id left join custom on custom.entity_type='activity' and custom.entity_id=a.id),
base as (
 select 'customer'::text kind,c.id,c.name title,c."customerType" subtitle,'/customers/'||c.id href,'Kişi bilgisi'::text label,c.ct tags,'[]'::jsonb links from c
 union all select 'property',p.id,p.title,concat_ws(' · ',p.canonical_site,p.rooms),'/properties/'||p.id,'Taşınmaz',p.pt,'[]' from p
 union all select 'request',r.id,r."customerName",concat_ws(' · ',r.canonical_site,r."minRooms"),'/requests/'||r.id,'İstediği ev',r.rt,
 case when exists(select 1 from c where c.id=r."customerId") then jsonb_build_array(jsonb_build_object('label','Müşteri','href','/customers/'||r."customerId")) else '[]'::jsonb end from r
 union all select 'prospect',f.id::text,f.person_name,concat_ws(' · ',f.canonical_site,f.block,f.unit),'/prospecting?case='||f.id,'Portföy takibi',f.ft,
 case when f.customer is not null then jsonb_build_array(jsonb_build_object('label','Müşteri','href','/customers/'||f.customer)) else '[]'::jsonb end from f
 union all select 'activity',a.id,a."customerName",concat_ws(' · ',a.type,a.date,a.time,a."propertyTitle"),'/activities?record='||a.id,
 case when a.type='Yer Gösterimi' then case when a.status='Planlandı' then 'Planlanan gösterim' when a.status in ('Tamamlandı','Olumlu','Olumsuz','Düşünüyor') then 'Gösterilen ev' else 'Gösterim — durum belirsiz' end else 'Görüşme' end,a.activity_tags,
 (case when a.visible_customer is not null then jsonb_build_array(jsonb_build_object('label','Müşteri','href','/customers/'||a.visible_customer)) else '[]'::jsonb end)||
 (case when a.visible_property is not null then jsonb_build_array(jsonb_build_object('label','Portföy','href','/properties/'||a.visible_property)) else '[]'::jsonb end)||
 (case when a.visible_case is not null then jsonb_build_array(jsonb_build_object('label','Takip kartı','href','/prospecting?case='||a.visible_case)) else '[]'::jsonb end) from a
), contexts as (
 select * from base
 union all select 'customer',c.id,c.name,b.subtitle,'/customers/'||c.id,b.label,b.tags||c.ct,jsonb_build_array(jsonb_build_object('label','Görüşme · '||a.date,'href',b.href))||b.links from a join c on c.id=a.visible_customer join base b on b.kind='activity' and b.id=a.id
 union all select 'customer',c.id,c.name,b.subtitle,'/customers/'||c.id,b.label,b.tags||c.ct,jsonb_build_array(jsonb_build_object('label','Talep','href',b.href)) from r join c on c.id=r."customerId" join base b on b.kind='request' and b.id=r.id
 union all select 'customer',c.id,c.name,b.subtitle,'/customers/'||c.id,b.label,b.tags||c.ct,jsonb_build_array(jsonb_build_object('label','Takip','href',b.href)) from f join c on c.id=f.customer join base b on b.kind='prospect' and b.id=f.id::text
 union all select 'customer',c.id,c.name,b.subtitle,'/customers/'||c.id,'Sahibi olduğu portföy',b.tags||c.ct||public.crm_tag('role','Mal Sahibi'),jsonb_build_array(jsonb_build_object('label','Portföy','href',b.href)) from p join c on c.id=p."ownerId" join base b on b.kind='property' and b.id=p.id
 union all select 'property',p.id,p.title,b.subtitle,'/properties/'||p.id,b.label,b.tags,jsonb_build_array(jsonb_build_object('label','Görüşme · '||a.date,'href',b.href))||b.links from a join p on p.id=a.visible_property join base b on b.kind='activity' and b.id=a.id
 union all select 'prospect',f.id::text,f.person_name,b.subtitle,'/prospecting?case='||f.id,b.label,b.tags,jsonb_build_array(jsonb_build_object('label','Görüşme · '||a.date,'href',b.href))||b.links from a join f on f.id=a.visible_case join base b on b.kind='activity' and b.id=a.id
)
select kind,id,title,subtitle,href,label,tags,links from contexts;
$$;

create function public.crm_tags_match(tags jsonb, selected text[]) returns boolean
language sql immutable set search_path='' as $$
 select not exists(
  select 1 from (select case when k like 'custom:%' then k else split_part(k,':',1) end grp,array_agg(k) choices from unnest(selected) k group by 1) g
  where not exists(select 1 from jsonb_array_elements(tags) t where t->>'key'=any(g.choices))
 );
$$;

create function public.crm_search_tags(p_selected text[] default '{}',p_kind text default 'customer',p_search text default '',p_offset integer default 0,p_limit integer default 30,p_entity text default null)
returns jsonb language sql stable security invoker set search_path='' as $$
with docs as materialized(select * from public.crm_tag_contexts()),
matched as (select * from docs d where public.crm_tags_match(d.tags,p_selected) and (coalesce(p_search,'')='' or strpos(public.crm_normalize_label(concat_ws(' ',d.title,d.subtitle)),public.crm_normalize_label(p_search))>0) and (p_entity is null or d.entity_id=p_entity)),
grouped as (select entity_type,entity_id,min(title) title,min(href) href,jsonb_agg(distinct jsonb_build_object('label',context_label,'subtitle',subtitle,'tags',tags,'links',links)) contexts from matched group by entity_type,entity_id),
page as (select * from grouped where entity_type=p_kind order by title,entity_id limit greatest(1,least(p_limit,100)) offset greatest(p_offset,0)),
counts as (select entity_type,count(*) amount from grouped group by entity_type),
facets as (select t->>'key' key,t->>'group' grp,min(t->>'label') label,count(distinct (d.entity_type,d.entity_id)) amount from docs d cross join lateral jsonb_array_elements(d.tags) t group by 1,2)
select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page) order by title,entity_id) from page),'[]'::jsonb),
 'counts',coalesce((select jsonb_object_agg(entity_type,amount) from counts),'{}'::jsonb),
 'facets',coalesce((select jsonb_agg(jsonb_build_object('key',key,'group',grp,'label',label,'count',amount) order by grp,label) from facets),'[]'::jsonb));
$$;

create function public.crm_entity_tag_batch(p_entities jsonb) returns jsonb
language sql stable security invoker set search_path='' as $$
 with requested as materialized (
  select distinct e->>'type' kind,e->>'id' id from jsonb_array_elements(p_entities) e
 ), own_tags as materialized (
  select kind,id,public.crm_custom_tags(kind,id) tags from requested
 )
 select coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('own_custom_tags',o.tags)),'[]'::jsonb)
 from public.crm_tag_contexts() d join own_tags o on o.kind=d.entity_type and o.id=d.entity_id;
$$;

-- All helper functions are authenticated only; none bypass row policies.
revoke all on function public.crm_normalize_label(text),public.crm_tag_entity_owned(text,text),public.crm_validate_tag_fields(),public.crm_tag(text,text,text),public.crm_site_tag(text,text),public.crm_custom_tags(text,text),public.crm_tag_contexts(),public.crm_tags_match(jsonb,text[]),public.crm_search_tags(text[],text,text,integer,integer,text),public.crm_entity_tag_batch(jsonb),public.prospecting_start(jsonb) from public,anon;
grant execute on function public.crm_normalize_label(text),public.crm_tag_entity_owned(text,text),public.crm_validate_tag_fields(),public.crm_tag(text,text,text),public.crm_site_tag(text,text),public.crm_custom_tags(text,text),public.crm_tag_contexts(),public.crm_tags_match(jsonb,text[]),public.crm_search_tags(text[],text,text,integer,integer,text),public.crm_entity_tag_batch(jsonb),public.prospecting_start(jsonb) to authenticated;
create function public.crm_update_prospect_details(p_id uuid,p_version integer,p_site text,p_rooms text,p_customer text default null) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if p_site is not null and not exists(select 1 from public.sites where id=p_site) then raise exception 'Site bulunamadı veya erişilemiyor'; end if;
 update public.prospecting_cases set site_id=p_site,rooms=nullif(trim(p_rooms),''),version=version+1
 where id=p_id and user_id=auth.uid() and version=p_version;
 if not found then raise exception 'Kart değişmiş veya erişilemiyor. Listeyi yenileyin.'; end if;
 update public.prospecting_contacts set customer_id=p_customer where user_id=auth.uid() and id=(select contact_id from public.prospecting_cases where id=p_id and user_id=auth.uid());
end; $$;
revoke all on function public.crm_update_prospect_details(uuid,integer,text,text,text) from public,anon;
grant execute on function public.crm_update_prospect_details(uuid,integer,text,text,text) to authenticated;
commit;
