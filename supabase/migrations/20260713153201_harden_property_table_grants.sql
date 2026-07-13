-- İstemci rollerine yalnızca uygulamanın ihtiyaç duyduğu tablo yetkilerini ver.
-- TRUNCATE RLS tarafından korunmadığı için özellikle kaldırılmalıdır.

REVOKE ALL PRIVILEGES ON TABLE public.properties FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.properties FROM authenticated;

GRANT SELECT ON TABLE public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.properties TO authenticated;
