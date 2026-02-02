# Emlak CRM Pro - Proje Durumu

**Tarih:** 2 Şubat 2026  
**Durum:** 🔴 Kritik RLS Sorunları Mevcut

---

## 🚨 ACİL SORUNLAR

### 1. RLS Politikaları Bozuk
Son uygulanan `30_complete_rls_reset.sql` migration'ı tüm verileri görünmez yaptı.

**Belirtiler:**
- Hiçbir veri görünmüyor (emlaklar, müşteriler, vs.)
- Subscription/plan bilgisi görünmüyor
- Akıllı eşleştirme yanlış veri gösteriyor

**Çözüm İçin Bakılması Gerekenler:**
- `supabase/migrations/30_complete_rls_reset.sql` - Bu dosya ÇALIŞTIRILDI
- Supabase Dashboard → Authentication → Users → Kullanıcıların `user_id` değerleri
- Supabase Dashboard → Table Editor → `profiles` tablosu → `office_id` değerleri

**Potansiyel Sorun:** 
Policy'lerdeki `auth.uid()` ile tablolardaki `user_id` eşleşmiyor olabilir.

---

## ✅ TAMAMLANAN ÖZELLİKLER

### SaaS Dönüşümü
- [x] Landing Page (`/home`)
- [x] Login/Register sayfaları
- [x] Google OAuth entegrasyonu
- [x] "Şifremi Unuttum" özelliği
- [x] Şifre sıfırlama sayfası (`/reset-password`)
- [x] Admin Panel (`/admin`) - Kullanıcı yönetimi UI'ı hazır

### Veritabanı
- [x] `subscriptions` tablosu oluşturuldu
- [x] `plan_limits` tablosu oluşturuldu  
- [x] `admin_users` tablosu oluşturuldu
- [x] Trigger: Yeni kullanıcılara otomatik free plan

### Kod Değişiklikleri
- [x] `src/services/subscriptionService.ts` - Plan yönetimi
- [x] `src/pages/LandingPage.tsx` - Pazarlama sayfası
- [x] `src/pages/AdminPanel.tsx` - Admin yönetimi
- [x] `src/pages/ResetPassword.tsx` - Şifre sıfırlama
- [x] `src/pages/Settings.tsx` - Plan gösterimi eklendi
- [x] `src/pages/Login.tsx` - Google login + şifremi unuttum

---

## 🔧 YAPILMASI GEREKENLER

### 1. RLS Politikalarını Düzelt (ÖNCELİK 1)
```sql
-- Önce mevcut durumu kontrol et
SELECT id, email, office_id FROM profiles LIMIT 10;
SELECT * FROM properties LIMIT 5;
SELECT * FROM subscriptions LIMIT 5;
```

Policy'lerin çalışması için:
- `properties.user_id` = `auth.uid()` eşleşmeli
- `profiles.id` = `auth.uid()` eşleşmeli  
- `office_id` değerleri tutarlı olmalı

### 2. Veritabanı İlişkilerini Kontrol Et
- `profiles.id` → `auth.users.id` (UUID)
- `properties.user_id` → `profiles.id`
- `properties.office_id` → `offices.id`
- `customers.user_id` → `profiles.id`
- `subscriptions.user_id` → `profiles.id`

### 3. Test Kullanıcıları
| E-posta | Rol | Plan |
|---------|-----|------|
| teorey@gmail.com | Admin/Broker | Pro |
| esraekrekli@gmail.com | Danışman | Free |

---

## 📁 ÖNEMLİ DOSYALAR

### Migration Dosyaları (Supabase)
- `supabase/migrations/28_subscription_system.sql` - SaaS tabloları
- `supabase/migrations/29_fix_rls_policies.sql` - İlk RLS denemesi
- `supabase/migrations/30_complete_rls_reset.sql` - ⚠️ BU SORUNLU

### Frontend
- `src/context/DataContext.tsx` - Veri yönetimi ve subscription fetch
- `src/services/subscriptionService.ts` - Plan servisleri
- `src/pages/Settings.tsx` - Plan gösterimi (Line 234-260)

---

## 🔍 DEBUG İÇİN

### Supabase Console'da Kontrol
1. Authentication → Users → Her kullanıcının UUID'si
2. Table Editor → `profiles` → `id` ve `office_id` kontrol
3. Table Editor → `properties` → `user_id` ve `office_id` kontrol
4. SQL Editor → RLS test:
```sql
-- Bu kullanıcının görmesi gereken verileri test et
SELECT * FROM properties 
WHERE user_id = 'KULLANICI_UUID' 
   OR office_id = 'OFFICE_UUID';
```

### Browser Console'da Kontrol
```javascript
// Supabase session bilgisi
const { data } = await supabase.auth.getSession();
console.log('User ID:', data.session?.user?.id);
```

---

## 📌 NOTLAR

1. **RLS Disable etmek GEÇİCİ çözüm olabilir** (güvenlik riski):
```sql
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- Test et, çalışıyorsa tekrar ENABLE et ve policy'leri düzelt
```

2. **Vercel URL:** https://emlak-crm-pro-plum.vercel.app/

3. **GitHub Repo:** https://github.com/teorey80/emlak-crm-pro

4. **Son Commit:** `5d2d44c` - "fix: Complete RLS policy reset for all tables"
