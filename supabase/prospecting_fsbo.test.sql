-- Isolated test DB only, after migrations 41 and 42. All fixtures roll back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
insert into public.offices(id) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.profiles(id,office_id) values('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.customers(id,user_id,name,phone) values('test-c','11111111-1111-4111-8111-111111111111','Örnek Kişi','05320000000'),('other-c','22222222-2222-4222-8222-222222222222','Diğer Kişi','05320000001');
insert into public.activities(id,user_id,"customerId",type,date,status,description) values
('test-a','11111111-1111-4111-8111-111111111111','test-c','Giden Arama','2026-09-01','Düşünüyor','Bir süre kendisi satacak.'),
('test-b','11111111-1111-4111-8111-111111111111','test-c','Giden Arama','2026-09-02','Düşünüyor','İkinci arama.'),
('other-a','22222222-2222-4222-8222-222222222222','other-c','Giden Arama','2026-09-01','Düşünüyor','Başkasının notu');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
declare p jsonb; cid uuid; other_case uuid; v integer; failed boolean; n integer;
begin
  p:=jsonb_build_object('request_id',gen_random_uuid(),'source_kind','fsbo','name','Örnek Kişi','phone','05320000000','site_name','Örnek 2+1','source_url','https://example.com/ilan','channel','Sahibinden','transaction_type','Satılık','outcome','reached','note','Bir süre kendisi satacak.','stage','follow_up','next_action','Yeniden ara','next_action_at',now()+interval '14 days','closed_reason','');
  cid:=public.prospecting_start(p);
  assert (select source_kind from public.prospecting_cases where id=cid)='fsbo';
  assert (select stage from public.prospecting_cases where id=cid)='follow_up';
  assert (select count(*) from public.prospecting_events where case_id=cid and outcome='reached')=1;
  assert public.prospecting_start(p)=cid, 'Create retry should return same case';
  assert (select count(*) from public.prospecting_cases)=1;
  -- Same person can have separate apartments, not silently merged.
  other_case:=public.prospecting_start(p||jsonb_build_object('request_id',gen_random_uuid(),'site_name','Örnek 3+1','outcome','plan'));
  assert other_case<>cid;
  assert (select count(*) from public.prospecting_contacts)=1;
  select version into v from public.prospecting_cases where id=cid;
  p:=p||jsonb_build_object('request_id',gen_random_uuid(),'activity_id','test-a','case_id',cid,'expected_version',v);
  assert public.prospecting_start(p)=cid;
  assert (select count(*) from public.prospecting_events where case_id=cid and outcome='reached')=1, 'Old activity must not create a new conversation';
  assert (select count(*) from public.prospecting_events where case_id=cid and outcome='import')=1;
  assert (select date_precision from public.prospecting_events where case_id=cid and outcome='import')='day';
  assert (select count(*) from public.prospecting_activity_links)=1;
  assert (select description from public.activities where id='test-a')='Bir süre kendisi satacak.', 'Source untouched';
  assert public.prospecting_start(p||jsonb_build_object('request_id',gen_random_uuid()))=cid, 'Same activity must not link twice';
  assert (select count(*) from public.prospecting_activity_links)=1;
  failed:=false;
  begin perform public.prospecting_start(p||jsonb_build_object('request_id',gen_random_uuid(),'activity_id','test-b','expected_version',1)); exception when raise_exception then failed:=true; end;
  assert failed,'Stale version rejected';
  failed:=false;
  begin perform public.prospecting_start(p||jsonb_build_object('request_id',gen_random_uuid(),'activity_id','other-a')); exception when raise_exception then failed:=true; end;
  assert failed,'Cross-user activity denied';
  n:=(select count(*) from public.prospecting_cases);
  failed:=false;
  begin perform public.prospecting_start((p-'activity_id'-'case_id')||jsonb_build_object('request_id',gen_random_uuid(),'next_action_at',null)); exception when raise_exception then failed:=true; end;
  assert failed and (select count(*) from public.prospecting_cases)=n,'Invalid plan rolls back entire creation';
  -- Create from an old activity, no invented fresh conversation.
  other_case:=public.prospecting_start((p-'case_id')||jsonb_build_object('request_id',gen_random_uuid(),'activity_id','test-b'));
  assert (select count(*) from public.prospecting_events where case_id=other_case and outcome='reached')=0;
  assert (select count(*) from public.prospecting_events where case_id=other_case)=2;
  update public.prospecting_contacts set do_not_contact=true;
  failed:=false;
  begin perform public.prospecting_start((p-'activity_id'-'case_id')||jsonb_build_object('request_id',gen_random_uuid(),'name','Farklı İsim')); exception when raise_exception then failed:=true; end;
  assert failed,'Opt-out applies to same phone with a different name';
  raise notice 'PASS: FSBO creation, retry, separate units, old activity linking, source preservation, dates, stale writes, privacy and opt-out';
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
 assert (select count(*) from public.prospecting_activity_links)=0,'Links private';
 assert (select count(*) from public.prospecting_cases)=0,'FSBO cases private';
end $$;
reset role;
set local role anon;
do $$ declare failed boolean:=false; begin
 begin perform public.prospecting_start('{}'); exception when insufficient_privilege then failed:=true; end;
 assert failed,'Anonymous start denied';
end $$;
reset role;
rollback;
