begin;

-- Yer gösteriminde gezdirilen birden çok portföy.
-- Her eleman: kendi portföyümüz ({propertyId, title}) veya başka bir emlakçının
-- portföyü ({brokerCustomerId, brokerName, siteId, siteName, rooms, block, unit}).
-- Mevcut RLS politikaları satır bazlı olduğu için ek politika gerekmez.
alter table public.activities
  add column if not exists shown_properties jsonb check (
    shown_properties is null or
    (jsonb_typeof(shown_properties) = 'array' and jsonb_array_length(shown_properties) <= 30)
  );

commit;
