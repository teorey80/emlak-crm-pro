begin;

-- Optional broker listing details captured from a phone call or message.
alter table public.activities
  add column transaction_type text check (transaction_type in ('Satılık', 'Kiralık')),
  add column sharing_status text check (sharing_status in ('open', 'restricted', 'unknown')),
  add column external_listing_url text check (
    external_listing_url is null or
    (length(external_listing_url) <= 2048 and external_listing_url ~* '^https?://')
  );

-- Preserve the existing invoker security model and include listing details in tag searches.
create or replace function public.crm_tag_contexts()
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
 ||public.crm_tag('transaction',a.transaction_type)
 ||public.crm_tag('sharing',a.sharing_status,case a.sharing_status when 'open' then 'Paylaşıma açık' when 'restricted' then 'Paylaşıma kapalı' when 'unknown' then 'Durum bilinmiyor' end)
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

commit;
