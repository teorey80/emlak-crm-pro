-- Run only in a disposable empty PostgreSQL 15+ database, never in the live project.
\set ON_ERROR_STOP on
do $$begin create role anon nologin; exception when duplicate_object then null; end$$;
do $$begin create role authenticated nologin; exception when duplicate_object then null; end$$;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table auth.users(id uuid primary key);
create table public.offices(id uuid primary key);
create table public.profiles(id uuid primary key,office_id uuid);
create table public.sites(id text primary key,user_id uuid,office_id uuid,name text,region text,address text,status text,"createdAt" text);
create table public.customers(id text primary key,user_id uuid,office_id uuid,name text,phone text,"customerType" text);
create table public.properties(id text primary key,user_id uuid,office_id uuid,title text,site text,rooms text,status text,"ownerId" text,visibility text);
create table public.requests(id text primary key,user_id uuid,office_id uuid,"customerId" text,"customerName" text,"siteId" text,"siteName" text,"minRooms" text,"requestType" text);
create table public.activities(id text primary key,user_id uuid,office_id uuid,type text,"customerId" text,"customerName" text,"propertyId" text,"propertyTitle" text,date text,time text,description text,status text);
grant usage on schema public,auth to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
do $$declare t text;begin foreach t in array array['customers','sites','properties','requests','activities'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
end loop;end$$;
insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.profiles select id,null from auth.users;
\ir ../../supabase/migrations/41_prospecting_workflow.sql
\ir ../../supabase/migrations/42_prospecting_fsbo.sql
\ir ../../supabase/migrations/43_prospecting_activity_history.sql
-- Legacy strings: resolve only unique same-owner names.
insert into sites(id,user_id,name) values
('legacy-site','00000000-0000-0000-0000-000000000001','Eski Proje'),
('duplicate-a','00000000-0000-0000-0000-000000000001','Çift Site'),
('duplicate-b','00000000-0000-0000-0000-000000000001','Çift Site');
insert into properties(id,user_id,title,site) values
('legacy-property','00000000-0000-0000-0000-000000000001','Eski portföy','  ESKİ   PROJE  '),
('ambiguous-property','00000000-0000-0000-0000-000000000001','Belirsiz portföy','Çift Site');
\ir ../../supabase/migrations/20260923080503_crm_connected_tags.sql
do $$begin
 assert (select site_id='legacy-site' and site='  ESKİ   PROJE  ' from properties where id='legacy-property'),'Unique legacy link or original text lost';
 assert (select site_id is null from properties where id='ambiguous-property'),'Ambiguous legacy site auto-linked';
 assert not has_function_privilege('anon','public.crm_search_tags(text[],text,text,integer,integer,text)','EXECUTE'),'Anonymous tag search allowed';
end$$;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
insert into sites(id,user_id,name) values('nef',auth.uid(),'Nef Çamlıtepe'),('other',auth.uid(),'Başka Site');
insert into customers(id,user_id,name,"customerType") values('c1',auth.uid(),'Doğru Müşteri','Alıcı'),('c2',auth.uid(),'Farklı Görüşmeler','Alıcı'),('c3',auth.uid(),'Planlanan Gösterim','Alıcı');
insert into properties(id,user_id,title,site_id,site,rooms,status) values('p1',auth.uid(),'Nef 3+1','nef','Nef Çamlıtepe','3+1','Satılık'),('p2',auth.uid(),'Başka 3+1','other','Başka Site','3+1','Satılık');
insert into activities(id,user_id,type,"customerId","customerName","propertyId",date,status) values
('a1',auth.uid(),'Yer Gösterimi','c1','Doğru Müşteri','p1','2026-09-01','Tamamlandı'),
('a2',auth.uid(),'Yer Gösterimi','c2','Farklı Görüşmeler','p2','2026-09-01','Tamamlandı'),
('a3',auth.uid(),'Giden Arama','c2','Farklı Görüşmeler','p1','2026-09-01','Tamamlandı'),
('a4',auth.uid(),'Yer Gösterimi','c3','Planlanan Gösterim','p1','2026-09-22','Planlandı');
insert into requests(id,user_id,"customerId","customerName","siteId","siteName","minRooms","requestType") values('r1',auth.uid(),'c1','Doğru Müşteri','other','Başka Site','2+1','Satılık');
insert into customers(id,user_id,name,"customerType") select 'old-'||n,auth.uid(),'Eski müşteri '||lpad(n::text,3,'0'),'Mal Sahibi' from generate_series(1,65) n;
insert into crm_tags(id,user_id,name) values('00000000-0000-0000-0000-000000000010',auth.uid(),'Bahçeli istiyor');
insert into crm_tag_links(tag_id,entity_type,entity_id) values('00000000-0000-0000-0000-000000000010','customer','c1');

do $$declare result jsonb; cid uuid; begin
 result:=public.crm_search_tags(array['event:showing_done','site:nef','rooms:3+1'],'customer');
 assert result->'counts'->>'customer'='1','Cross-event false positive';
 assert result->'rows'->0->>'entity_id'='c1','Wrong customer';
 assert result->'counts'->>'property'='1','Property correlation failed';
 result:=public.crm_search_tags(array['site:other','rooms:2+1'],'customer');
 assert result->'rows'->0->>'entity_id'='c1','Request context missing';
 result:=public.crm_search_tags(array['event:showing_done','site:other','rooms:2+1'],'customer');
 assert coalesce((result->'counts'->>'customer')::int,0)=0,'Request and showing must not mix';
 result:=public.crm_search_tags(array['event:showing_planned','site:nef'],'customer');
 assert result->'rows'->0->>'entity_id'='c3','Planned showing lost';
 result:=public.crm_search_tags(array['role:Mal Sahibi'],'customer','',60,30);
 assert result->'counts'->>'customer'='65' and jsonb_array_length(result->'rows')=5,'Beyond page 50 missing';
 assert public.crm_tags_match('[{"key":"rooms:3+1"}]',array['rooms:2+1','rooms:3+1']),'Same-group alternatives';
 assert not public.crm_tags_match('[{"key":"custom:a"}]',array['custom:a','custom:b']),'Custom tags must all match';
 assert public.crm_normalize_label('  NEF   ÇAMLITEPE  ')='nef çamlıtepe','Turkish normalization';
 cid:=public.prospecting_start('{"request_id":"00000000-0000-0000-0000-000000000020","source_kind":"fsbo","name":"Örnek Sahip","phone":"5551234567","site_name":"Nef Çamlıtepe","site_id":"nef","rooms":"3+1","note":"Deneme araması yanıtsız","outcome":"no_answer","stage":"new","next_action":"Ara","next_action_at":"2099-01-01T10:00:00+03:00"}');
 assert (select site_id='nef' and rooms='3+1' from prospecting_cases where id=cid),'Atomic FSBO fields missing';
 perform public.prospecting_start('{"request_id":"00000000-0000-0000-0000-000000000020","site_id":"other","rooms":"2+1"}');
 assert (select site_id='nef' and rooms='3+1' from prospecting_cases where id=cid),'Retry overwrote fields';
end$$;

-- Relink a previously unlinked FSBO contact: its old call becomes discoverable.
do $$declare cid uuid; version_before integer; result jsonb; begin
 select id,version into cid,version_before from prospecting_cases where site_id='nef' limit 1;
 perform public.crm_update_prospect_details(cid,version_before,'other','2+1','c1');
 assert (select pc.customer_id='c1' from prospecting_cases f join prospecting_contacts pc on pc.id=f.contact_id where f.id=cid),'Contact link not saved';
 result:=public.crm_search_tags(array['source:fsbo','site:other','rooms:2+1'],'customer');
 assert result->'counts'->>'customer'='1' and result->'rows'->0->>'entity_id'='c1','Linked FSBO history missing';
 assert exists(select 1 from public.crm_tag_contexts() where entity_type='activity' and tags @> '[{"key":"source:fsbo"}]' and links @> '[{"label":"Müşteri","href":"/customers/c1"}]'),'Historical activity link missing';
 begin
  perform public.crm_update_prospect_details(cid,version_before,'nef','3+1','c2');
  raise exception 'Stale version succeeded';
 exception when raise_exception then if sqlerrm='Stale version succeeded' then raise; end if; end;
 assert (select site_id='other' and rooms='2+1' from prospecting_cases where id=cid),'Stale write modified case';
 -- Inherited custom labels must never be offered as removable labels on the activity.
 assert exists(select 1 from jsonb_array_elements(public.crm_entity_tag_batch('[{"type":"activity","id":"a1"}]')) r where r->'own_custom_tags'='[]'::jsonb and r->'tags' @> '[{"key":"custom:00000000-0000-0000-0000-000000000010"}]'),'Custom ownership lost';
 begin
  insert into crm_tags(user_id,name) values(auth.uid(),'  BAHÇELİ   İSTİYOR  ');
  raise exception 'Duplicate normalized tag succeeded';
 exception when unique_violation then null; end;
end$$;
insert into activities(id,user_id,type,"customerId","propertyId",status) values('unknown-status',auth.uid(),'Yer Gösterimi','c3','p1',null);
do $$declare result jsonb;begin
 result:=public.crm_search_tags(array['event:showing_done','site:nef'],'customer');
 assert result->'counts'->>'customer'='1','Unknown showing was counted as done';
 result:=public.crm_search_tags(array['event:showing_unknown'],'customer');
 assert result->'rows'->0->>'entity_id'='c3','Unknown showing lost';
end$$;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$declare result jsonb; begin
 result:=public.crm_search_tags();
 assert jsonb_array_length(result->'rows')=0 and jsonb_array_length(result->'facets')=0,'Private data/count leak';
 begin
 insert into crm_tag_links(tag_id,user_id,entity_type,entity_id) values('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','customer','c1');
 raise exception 'Unexpected foreign tag write';
 exception when insufficient_privilege then null; end;
 begin
 insert into properties(id,user_id,title,site_id) values('evil',auth.uid(),'Forbidden site','nef');
 raise exception 'Unexpected foreign site reference';
 exception when raise_exception then if sqlerrm='Unexpected foreign site reference' then raise; end if; end;
end$$;
select 'All connected tag database checks passed' as result;
