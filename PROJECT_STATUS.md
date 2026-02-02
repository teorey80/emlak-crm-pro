# CLAUDE / CHATGPT / BAŞKA AI'YA AKTARILABİLİR PROJE DURUMU
**Son Güncelleme:** 2026-01-29

---

## PROJE ÖZETİ

| Alan | Değer |
|------|-------|
| **Proje Adı** | Emlak CRM Pro |
| **Repo** | https://github.com/teorey80/emlak-crm-pro |
| **Deploy** | Vercel (production) |
| **Veritabanı** | Supabase (PostgreSQL + Auth + RLS) |
| **Amaç** | Emlak danışmanları için müşteri, portföy ve aktivite yönetim sistemi |
| **Hedef Kullanıcı** | Emlak ofisleri, bireysel emlak danışmanları |
| **Temel Problem** | Müşteri takibi, ilan yönetimi, arama/mesaj kayıtları, satış takibi |

---

## TEKNİK MİMARİ

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS (CDN - dev), PostCSS (prod) |
| State | React Context (DataContext) |
| Backend | Supabase (BaaS) |
| Auth | Supabase Auth |
| Güvenlik | Row Level Security (RLS) |
| Hosting | Vercel |

---

## MEVCUT ÇALIŞAN ÖZELLİKLER

### Temel Modüller
- ✅ Kullanıcı kaydı ve girişi (Supabase Auth)
- ✅ Ofis bazlı çoklu kullanıcı desteği
- ✅ Portföy (Property) CRUD
- ✅ Müşteri (Customer) CRUD
- ✅ Aktivite (Activity) CRUD
- ✅ Talep (Request) CRUD
- ✅ Satış (Sale) takibi

### Hızlı Kayıt Sistemi
- ✅ Hızlı Arama Kaydı (QuickCallModal)
  - Gelen/Giden arama seçimi
  - Telefon ile müşteri eşleştirme
  - Yeni müşteri otomatik oluşturma
  - Portföy ilişkilendirme
  - Aksiyon tipi (Bilgi/Randevu/Talep)
  - Görüşme sonucu (Olumlu/Olumsuz/Düşünüyor)
  - **Tarih seçici** (varsayılan: bugün)
  - Not alanı

- ✅ Hızlı Mesaj Kaydı (QuickMessageModal)
  - Kanal seçimi (WhatsApp/SMS/Email)
  - Tarih seçici
  - Konu ve içerik alanları

### Public Site
- ✅ Domain bazlı public site routing
- ✅ 3 layout: standard, map, grid
- ✅ Aktif ilanların listelenmesi
- ✅ İlan detay modal
- ✅ WhatsApp iletişim butonu

---

## BU SOHBETTE YAPILAN DEĞİŞİKLİKLER

### 1. Kayıt Hatası Düzeltmesi
**Problem:** "Kayıt sırasında hata oluştu" hatası

**Kök Nedenler:**
1. `addCustomer` fonksiyonu `Promise<void>` döndürüyordu, ama çağıran kod `Customer` objesi bekliyordu
2. Yeni kayıtlar için `id` otomatik oluşturulmuyordu
3. RLS politikalarında INSERT için `WITH CHECK` clause eksikti

**Çözümler:**

`src/context/DataContext.tsx`:
- `addCustomer` artık `Promise<Customer>` döndürüyor
- `crypto.randomUUID()` ile auto ID generation eklendi
- Hata durumunda optimistic update rollback eklendi
- Aynı düzeltmeler `addActivity` için de yapıldı

### 2. RLS Politika Düzeltmesi
**Dosya:** `supabase/migrations/27_fix_insert_rls_policies.sql`

Her tablo için ayrı politikalar:
- SELECT: USING (user_id = auth.uid())
- UPDATE: USING (user_id = auth.uid())
- DELETE: USING (user_id = auth.uid())
- INSERT: WITH CHECK (user_id = auth.uid()) -- KRİTİK

**Etkilenen tablolar:** customers, activities, requests

### 3. Hızlı Arama Kaydına Tarih Alanı
**Dosya:** `src/components/QuickActions.tsx`

- `callDate` state eklendi (varsayılan: bugün)
- Tarih input'u UI'a eklendi
- Aktivite kaydında seçilen tarih kullanılıyor

---

## DOSYA YAPISI (ÖNEMLİ DOSYALAR)

```
src/
├── context/DataContext.tsx      # Ana state yönetimi, CRUD fonksiyonları
├── components/QuickActions.tsx  # FAB + QuickCallModal + QuickMessageModal
├── pages/
│   ├── PropertyList.tsx
│   ├── PropertyDetail.tsx
│   └── PublicSite.tsx
├── services/
│   ├── supabaseClient.ts
│   └── publicSiteService.ts
└── types.ts                     # Tüm type tanımları

supabase/migrations/
├── 07_nuclear_privacy_fix.sql   # Ana RLS politikaları
├── 20_public_site_access.sql    # Public site erişim
├── 26_deposit_tracking.sql      # Kapora takibi
└── 27_fix_insert_rls_policies.sql  # INSERT politika düzeltmesi (YENİ)
```

---

## VERİTABANI ŞEMASI (ANA TABLOLAR)

| Tablo | Amaç | RLS |
|-------|------|-----|
| profiles | Kullanıcı profilleri | office_id bazlı |
| offices | Ofis bilgileri | owner/member bazlı |
| properties | Emlak ilanları | office geniş görünüm, user düzenleme |
| customers | Müşteriler | sadece kendi user_id |
| activities | Aktiviteler | sadece kendi user_id |
| requests | Talepler | sadece kendi user_id |
| sales | Satışlar | office bazlı |

---

## AÇIK KONULAR / RİSKLER

1. **Tailwind CDN uyarısı** - Development'ta CDN kullanılıyor, production'da PostCSS olmalı
2. **Bundle size** - index.js 831KB, code splitting önerilir
3. **Chrome extension hatası** - "message port closed" hatası uygulamadan kaynaklanmıyor

---

## DEPLOY SÜRECİ

1. Kod değişikliği yap
2. `git add -A && git commit -m "mesaj" && git push`
3. Vercel otomatik deploy eder
4. SQL değişikliği varsa → Supabase Dashboard → SQL Editor'da çalıştır
