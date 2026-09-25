-- 40_rls_lockdown_untracked_tables.sql
-- Supabase advisor uyarisi: rls_disabled_in_public (3 tablo)
--
-- Bu 3 tablo normal migration akisi disinda olusturuldugu icin RLS'siz kalmisti:
--   - sahibinden_listings      : haftalik sahibinden takip skill'i olusturdu
--   - sahibinden_weekly_stats  : haftalik sahibinden takip skill'i olusturdu
--   - _images_base64_backup    : base64 foto temizligi sirasinda yedek olarak acildi
--
-- Ucu de anon rolune SELECT/INSERT/UPDATE/DELETE yetkisiyle aciktaydi; anon key
-- public sitede yayinda oldugu icin disaridan okunabilir/silinebilir durumdaydilar.
--
-- Cozum: policy'siz RLS = anon/authenticated icin tam kapali.
-- service_role ve postgres (rolbypassrls) etkilenmez -> Supabase MCP uzerinden
-- calisan haftalik sahibinden isi ve tum admin erisimi aynen devam eder.

ALTER TABLE public.sahibinden_listings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sahibinden_weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._images_base64_backup   ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.sahibinden_listings     FROM anon, authenticated;
REVOKE ALL ON public.sahibinden_weekly_stats FROM anon, authenticated;
REVOKE ALL ON public._images_base64_backup   FROM anon, authenticated;

-- Geri alma (gerekirse):
--   ALTER TABLE public.<tablo> DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON public.<tablo> TO anon, authenticated;
