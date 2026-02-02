-- Kendinizi Pro plana yükseltin
-- Bu sorguyu Supabase SQL Editor'da çalıştırın

-- Önce mevcut subscription'ı kontrol edin
SELECT id, user_id, plan, status FROM subscriptions WHERE user_id = auth.uid();

-- Subscription yoksa oluşturun, varsa güncelleyin
INSERT INTO subscriptions (user_id, plan, status, period_start, period_end)
VALUES (
    auth.uid(), 
    'pro', 
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    plan = 'pro',
    status = 'active',
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 year',
    updated_at = NOW();

-- Sonucu kontrol edin
SELECT * FROM subscriptions WHERE user_id = auth.uid();
