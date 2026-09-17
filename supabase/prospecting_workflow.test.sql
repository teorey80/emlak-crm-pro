-- Run in an isolated Postgres/Supabase test database after migration 41. Fixtures roll back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
insert into public.offices(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.profiles(id,office_id) values
  ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);

do $$
declare result jsonb; c public.prospecting_cases; payload jsonb; event_id uuid; failed boolean;
begin
  result := public.prospecting_import('[
    {"source_key":"test:1","name":"Örnek Malik","phone":"0532 000 00 00","site_name":"Örnek Site","block":"A","unit":"03","stage":"new","events":[]},
    {"source_key":"test:2","name":"Örnek Malik","phone":"+90 532 000 00 00","site_name":"Örnek Site","block":"B","unit":"04","stage":"new","events":[]}
  ]'::jsonb);
  assert result->>'added' = '2', 'Two separate apartment cases must be imported';
  assert (select count(*) from public.prospecting_contacts) = 1, 'Exact matching name + phone should share contact';
  result := public.prospecting_import('[{"source_key":"test:1","name":"Changed","site_name":"Örnek Site","unit":"99"}]'::jsonb);
  assert result->>'skipped' = '1', 'Duplicate source must be skipped';
  assert (select unit from public.prospecting_cases where source_key='test:1') = '03', 'Reimport must not overwrite work';
  select * into c from public.prospecting_cases where source_key='test:1';
  payload := jsonb_build_object('request_id','33333333-3333-4333-8333-333333333333','case_id',c.id,
    'expected_version',c.version,'occurred_at',now(),'outcome','reached','note','Görüşüldü, yarın tekrar ara.',
    'stage','follow_up','next_action','Tekrar ara','next_action_at',now()+interval '1 day','closed_reason','');
  event_id := public.prospecting_record_event(payload);
  assert event_id is not null, 'Event must be saved';
  assert (select stage from public.prospecting_cases where id=c.id)='follow_up', 'Stage must advance';
  assert public.prospecting_record_event(payload)=event_id, 'Retry must be idempotent';
  assert (select count(*) from public.prospecting_events)=1, 'Retry must not duplicate history';
  failed := false;
  begin
    perform public.prospecting_record_event(payload || jsonb_build_object('request_id',gen_random_uuid()));
  exception when raise_exception then failed := true; end;
  assert failed, 'Stale version must fail';
  select * into c from public.prospecting_cases where id=c.id;
  payload := payload || jsonb_build_object('request_id',gen_random_uuid(),'expected_version',c.version,'stage','meeting','next_action_at',null);
  failed := false;
  begin perform public.prospecting_record_event(payload); exception when raise_exception then failed := true; end;
  assert failed, 'Open process needs a next action date';
  assert (select stage from public.prospecting_cases where id=c.id)='follow_up', 'Invalid write must not change stage';
  assert (select count(*) from public.prospecting_events)=1, 'Invalid write must not append history';
  payload := payload || jsonb_build_object('request_id',gen_random_uuid(),'outcome','no_answer','next_action_at',now()+interval '2 days');
  perform public.prospecting_record_event(payload);
  assert (select stage from public.prospecting_cases where id=c.id)='follow_up', 'No answer must preserve stage';
  select * into c from public.prospecting_cases where id=c.id;
  payload := payload || jsonb_build_object('request_id',gen_random_uuid(),'expected_version',c.version,'outcome','do_not_contact','closed_reason','Aranmak istemiyor');
  perform public.prospecting_record_event(payload);
  assert (select bool_and(do_not_contact) from public.prospecting_contacts), 'Opt-out belongs to contact';
  assert (select count(*) from public.prospecting_cases where next_action_at is not null)=0, 'All related follow-ups must be removed';
  select * into c from public.prospecting_cases where source_key='test:2';
  failed := false;
  begin
    perform public.prospecting_record_event(payload || jsonb_build_object('request_id',gen_random_uuid(),'case_id',c.id,'expected_version',c.version,'outcome','plan','stage','follow_up','next_action_at',now()+interval '2 days'));
  exception when raise_exception then failed := true; end;
  assert failed, 'Opt-out must prevent new follow-ups on other apartments';
  failed := false;
  begin
    perform public.prospecting_import('[{"source_key":"test:rollback","name":"Rollback","site_name":"Test","unit":"5"},{"name":"Invalid"}]'::jsonb);
  exception when raise_exception then failed := true; end;
  assert failed, 'Invalid import must fail';
  assert not exists(select 1 from public.prospecting_cases where source_key='test:rollback'), 'Import must be atomic';
  raise notice 'PASS: import, source idempotency, contact reuse, atomic notes, retry, stale version, dates, opt-out, rollback';
end $$;

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$
declare failed boolean := false;
begin
  assert (select count(*) from public.prospecting_cases)=0, 'Same-office users must not see private cases';
  assert (select count(*) from public.prospecting_contacts)=0, 'Other contact data must be hidden';
  assert (select count(*) from public.prospecting_events)=0, 'Other notes must be hidden';
  begin
    insert into public.prospecting_contacts(user_id,office_id,identity_key,name)
      values('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','forged','Forged');
  exception when insufficient_privilege then failed := true; end;
  assert failed, 'Cannot insert as another user';
  raise notice 'PASS: same-office private data isolation and forged owner rejection';
end $$;

reset role;
set local role anon;
do $$
declare failed boolean := false;
begin
  begin perform count(*) from public.prospecting_cases; exception when insufficient_privilege then failed := true; end;
  assert failed, 'Anonymous reads must be rejected';
  failed := false;
  begin perform public.prospecting_import('[]'::jsonb); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Anonymous RPC must be rejected';
  raise notice 'PASS: anonymous table and RPC access rejected';
end $$;
reset role;
rollback;
