-- Esra Ekrekli'nin unvanını "Broker" olarak güncelle
-- Bu script esraekrekli.com domain'ine sahip profil kaydını bulur ve brokerTitle ekler

UPDATE profiles
SET site_config = jsonb_set(
    COALESCE(site_config, '{}'),
    '{brokerTitle}',
    '"Broker"'
)
WHERE site_config->>'domain' ILIKE '%esraekrekli%'
   OR site_config->>'domain' ILIKE 'esraekrekli.com';

-- Kontrol: Güncellenen kayıtları göster
SELECT id, full_name, site_config->>'domain' as domain, site_config->>'brokerTitle' as broker_title
FROM profiles
WHERE site_config->>'domain' ILIKE '%esraekrekli%'
   OR site_config->>'domain' ILIKE 'esraekrekli.com';
