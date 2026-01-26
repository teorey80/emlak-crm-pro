# PROJECT STATUS

**Son Güncelleme:** 2026-01-25
**Repo:** https://github.com/teorey80/emlak-crm-pro
**Canlı URL:** Vercel üzerinde deploy edilmiş (`.vercel.app` domain)

---

## PROJECT OVERVIEW

### Ne Bu Uygulama?
Türkiye pazarına yönelik bir **Emlak CRM (Müşteri İlişkileri Yönetimi)** sistemi. Emlak danışmanları ve ofisleri için geliştirilmiş.

### Ne Yapıyor?
1. Emlak ilanlarını yönetme (ekleme, düzenleme, satıldı işaretleme)
2. Müşteri takibi (alıcı, satıcı, kiracı)
3. Müşteri talepleri ile ilanları otomatik eşleştirme
4. Randevu ve aktivite takibi
5. Satış kaydı ve komisyon hesaplama
6. Kişisel/ofis web sitesi oluşturma (domain ile erişilebilir)
7. Raporlama (aylık performans, ekip performansı)

### Kim Kullanıyor?
- Bireysel emlak danışmanları
- Emlak ofisleri (birden fazla danışman)
- Broker'lar (ofis sahipleri)

---

## TECH STACK

| Katman | Teknoloji | Versiyon | Notlar |
|--------|-----------|----------|--------|
| **UI Framework** | React | 19.2.0 | Hooks kullanılıyor |
| **Dil** | TypeScript | 5.8.2 | Strict mode aktif değil |
| **Build Tool** | Vite | 6.2.0 | Hot reload çalışıyor |
| **Routing** | react-router-dom | 7.9.6 | **HashRouter** kullanıyor (`/#/path`) |
| **State** | React Context | - | `DataContext.tsx` tek global state |
| **İkonlar** | lucide-react | 0.554.0 | - |
| **Bildirimler** | react-hot-toast | 2.6.0 | - |
| **CSS** | Tailwind (inline) | - | Ayrı config yok, class'lar inline |
| **Database** | Supabase (PostgreSQL) | - | RLS aktif |
| **Auth** | Supabase Auth | - | Email/password |
| **AI** | Google Gemini | gemini-2.5-flash | İlan açıklaması, fiyat tahmini |
| **Konum API** | TurkiyeAPI | - | Mahalle verileri (api.turkiyeapi.dev) |
| **Geocoding** | Nominatim | - | OpenStreetMap adres arama (ücretsiz) |
| **Hosting** | Vercel | - | Otomatik deploy (main branch) |
| **Serverless** | Vercel Functions | - | `/api/analyze-listing.ts` |

### Environment Variables (.env.local)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
VITE_GEMINI_API_KEY=AIzaxxx
GEMINI_API_KEY=AIzaxxx  # Serverless için (VITE_ prefix'siz)
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com  # Google Drive için (opsiyonel)
VITE_GOOGLE_API_KEY=xxx  # Google Drive için (opsiyonel)
```

---

## SUPABASE TABLOLARI (Detaylı)

### Ana Tablolar

| Tablo | Primary Key | Önemli Kolonlar | RLS |
|-------|-------------|-----------------|-----|
| `properties` | `id` (text) | `title`, `price`, `type`, `status`, `user_id`, `office_id`, `listing_status`, `images` (jsonb) | Aktif |
| `customers` | `id` (text) | `name`, `phone`, `email`, `customerType`, `status`, `user_id`, `office_id` | Aktif |
| `activities` | `id` (text) | `type`, `customerId`, `propertyId`, `date`, `time`, `status`, `user_id` | Aktif |
| `requests` | `id` (text) | `customerId`, `type`, `requestType`, `minPrice`, `maxPrice`, `city`, `district`, `user_id` | Aktif |
| `sales` | `id` (uuid) | `property_id`, `sale_price`, `sale_date`, `commission_rate`, `commission_amount`, `office_share_amount`, `consultant_share_amount`, `expenses` (jsonb) | Aktif |
| `sites` | `id` (text) | `name`, `region`, `address`, `status` | Aktif |
| `profiles` | `id` (uuid = auth.users.id) | `full_name`, `email`, `office_id`, `role`, `site_config` (jsonb), `title` | Aktif |
| `offices` | `id` (uuid) | `name`, `domain`, `owner_id`, `site_config` (jsonb), `logo_url` | Aktif |
| `documents` | `id` (uuid) | `entity_type`, `entity_id`, `file_id`, `file_name`, `office_id` | Aktif |

### Enum Değerleri

```sql
-- properties.listing_status
'Aktif' | 'Pasif' | 'Satıldı' | 'Kiralandı'

-- properties.status (ilan tipi)
'Satılık' | 'Kiralık'

-- properties.type (emlak tipi)
'Daire' | 'Villa' | 'Müstakil Ev' | 'Rezidans' | 'Arsa' | 'Büro & Ofis' | ...

-- customers.status
'Aktif' | 'Potansiyel' | 'Pasif'

-- customers.customerType
'Alıcı' | 'Satıcı' | 'Kiracı' | 'Kiracı Adayı' | 'Mal Sahibi'

-- activities.type
'Yer Gösterimi' | 'Gelen Arama' | 'Giden Arama' | 'Ofis Toplantısı' | 'Tapu İşlemi' | 'Diğer'

-- activities.status
'Planlandı' | 'Tamamlandı' | 'Olumlu' | 'Olumsuz' | 'Düşünüyor'

-- profiles.role
'broker' | 'consultant' | 'staff'

-- requests.requestType
'Satılık' | 'Kiralık'
```

### Supabase Migration Dosyaları (Sıralı)
`/supabase/migrations/` klasöründe **28 migration** var. Önemli olanlar:

| Dosya | Ne Yapıyor |
|-------|-----------|
| `01_multi_user_schema.sql` | offices tablosu, profiles'a office_id, role ekleme |
| `05_appointment_schema.sql` | activities tablosuna time kolonu ekleme |
| `10_final_stabilization.sql` | RLS politikalarını düzeltme |
| `19_web_site_config.sql` | profiles ve offices'a site_config jsonb ekleme |
| `20_public_site_access.sql` | Public site için anon erişim |
| `22_property_status_and_sales.sql` | sales tablosu, listing_status kolonu |
| `25_aggressive_performance_fix.sql` | Index'ler, performans iyileştirme |

---

## SAYFA YAPISI VE ROUTING

### Route Tanımları (`src/App.tsx`)

```
/login          → Login.tsx (public)
/register       → Register.tsx (public)
/web-preview    → WebPreview.tsx (public)

/ (Layout içinde, auth gerekli):
  /               → Dashboard.tsx
  /calendar       → CalendarPage.tsx
  /properties     → PropertyList.tsx
  /properties/new → PropertyForm.tsx
  /properties/:id → PropertyDetail.tsx
  /properties/edit/:id → PropertyForm.tsx
  /customers      → CustomerList.tsx
  /customers/new  → CustomerForm.tsx
  /customers/:id  → CustomerDetail.tsx
  /customers/edit/:id → CustomerForm.tsx
  /activities     → ActivityList.tsx
  /activities/new → ActivityForm.tsx
  /activities/edit/:id → ActivityForm.tsx
  /requests       → RequestList.tsx
  /requests/new   → RequestForm.tsx
  /requests/:id   → RequestDetail.tsx
  /requests/edit/:id → RequestForm.tsx
  /sites          → SiteManagement.tsx
  /web-builder    → WebBuilder.tsx
  /reports        → Reports.tsx
  /team           → Team.tsx
  /settings       → Settings.tsx
```

### Public Site Routing
Uygulama domain'e göre farklı davranıyor:
- `*.vercel.app`, `localhost` → CRM paneli göster
- Custom domain (örn: `emlak.example.com`) → `PublicSite.tsx` render et

---

## ÖZELLİK DURUMU (Feature Status)

### ÇALIŞAN ÖZELLİKLER

| Özellik | Sayfa | Açıklama | Test Durumu |
|---------|-------|----------|-------------|
| **Login/Register** | `Login.tsx`, `Register.tsx` | Supabase Auth, otomatik profil oluşturma | Çalışıyor |
| **Dashboard** | `Dashboard.tsx` | İstatistikler, akıllı eşleştirmeler, günlük program, AI asistan | Çalışıyor |
| **Emlak Listesi** | `PropertyList.tsx` | Filtreleme, sıralanabilir kolonlar, "Daha Fazla Yükle" | Çalışıyor |
| **Emlak Formu (Wizard)** | `PropertyForm.tsx` | 6 adımlı form, sahibinden.com uyumlu, AI açıklama | Çalışıyor |
| **Konum Seçimi** | `PropertyForm.tsx` | 81 il → ilçe → mahalle cascading dropdown, TurkiyeAPI entegrasyonu | Çalışıyor |
| **Adres Geocoding** | `PropertyForm.tsx` | Nominatim API ile adres arama, harita işaretleme | Çalışıyor |
| **Emlak Detay** | `PropertyDetail.tsx` | Galeri, harita, satışa çevirme, belge yükleme | Çalışıyor |
| **Müşteri Listesi** | `CustomerList.tsx` | Filtreleme, sıralanabilir kolonlar | Çalışıyor |
| **Müşteri Formu** | `CustomerForm.tsx` | Detaylı müşteri bilgileri | Çalışıyor |
| **Müşteri Detay** | `CustomerDetail.tsx` | Etkileşim geçmişi, eşleşen ilanlar | Çalışıyor |
| **Aktiviteler** | `ActivityList.tsx`, `ActivityForm.tsx` | Randevu, arama, gösterim takibi | Çalışıyor |
| **Talepler** | `RequestList.tsx`, `RequestForm.tsx` | Müşteri talepleri | Çalışıyor |
| **Talep-İlan Eşleştirme** | `matchingService.ts` | Otomatik skor hesaplama, cross-consultant | Çalışıyor |
| **Satış Kaydı** | `SaleForm.tsx` (modal) | Komisyon hesaplama, gider takibi | Çalışıyor |
| **Takvim** | `CalendarPage.tsx` | Aylık görünüm, aktiviteler | Çalışıyor |
| **Raporlar** | `Reports.tsx` | Portföy dağılımı, komisyon raporu | Çalışıyor |
| **Ekip** | `Team.tsx` | Üye listesi, performans, hedefler | Çalışıyor |
| **Site Yönetimi** | `SiteManagement.tsx` | Konut siteleri kayıt | Çalışıyor |
| **Web Builder** | `WebBuilder.tsx` | Kişisel/ofis site ayarları, domain | Çalışıyor |
| **Public Site** | `PublicSite.tsx` | Domain bazlı emlak sitesi | Çalışıyor |
| **Ayarlar** | `Settings.tsx` | Profil, CSV export | Çalışıyor |
| **Dark Mode** | `TopBar.tsx` | Sistem/manuel geçiş | Çalışıyor |

### ÇALIŞMIYOR / EKSİK ÖZELLİKLER

| Özellik | Durum | Sorun |
|---------|-------|-------|
| **Google Drive Belge Yükleme** | Yarım | `documents` tablosu var, frontend'de picker entegrasyonu eksik |
| **Push Notifications** | Yok | Planlanmış ama yapılmamış |
| **Email Bildirimleri** | Yok | - |
| **Çoklu Dil** | Yok | Sadece Türkçe |
| **PWA/Mobile App** | Yok | Responsive var ama PWA yok |
| **Takvim Google Sync** | Yok | `AddToCalendarButton.tsx` var ama manuel |

### RİSKLİ ALANLAR

| Alan | Risk | Detay |
|------|------|-------|
| **RLS Politikaları** | YÜKSEK | 28 migration dosyası var, geçmişte çok sorun yaşanmış. Değiştirmeden önce test et. |
| **PropertyForm yeni alanlar** | ORTA | `types.ts`'e eklenen yeni alanlar (facades, interiorFeatures vb.) DB'de olmayabilir |
| **Supabase Free Tier** | ORTA | 1 hafta inaktif kalırsa uyuyor. `/api/keep-alive` cron var. |
| **AI API Key** | DÜŞÜK | Key yoksa graceful fallback var ama AI özellikleri çalışmaz |

---

## DOSYA YAPISI (Kritik Dosyalar)

```
src/
├── App.tsx                    # Routing, auth kontrolü, domain bazlı render
├── types.ts                   # TÜM TypeScript interface'ler (Property, Customer, vb.)
├── index.tsx                  # React entry point
│
├── context/
│   └── DataContext.tsx        # GLOBAL STATE - Tüm CRUD işlemleri, session, pagination
│
├── pages/
│   ├── Dashboard.tsx          # Ana sayfa (545 satır)
│   ├── PropertyList.tsx       # Emlak listesi (630 satır)
│   ├── PropertyForm.tsx       # Emlak formu - 6 ADIMLI WİZARD (1600+ satır) ⭐ YENİ
│   ├── PropertyDetail.tsx     # Emlak detay (890 satır)
│   ├── CustomerList.tsx       # Müşteri listesi (220 satır)
│   ├── CustomerForm.tsx       # Müşteri formu (560 satır)
│   ├── CustomerDetail.tsx     # Müşteri detay (630 satır)
│   ├── ActivityList.tsx       # Aktivite listesi (285 satır)
│   ├── ActivityForm.tsx       # Aktivite formu (480 satır)
│   ├── RequestList.tsx        # Talep listesi (190 satır)
│   ├── RequestForm.tsx        # Talep formu (470 satır)
│   ├── RequestDetail.tsx      # Talep detay (190 satır)
│   ├── CalendarPage.tsx       # Takvim (445 satır)
│   ├── Reports.tsx            # Raporlar (535 satır)
│   ├── Team.tsx               # Ekip yönetimi (740 satır)
│   ├── Settings.tsx           # Ayarlar (680 satır)
│   ├── SiteManagement.tsx     # Site (konut) yönetimi (185 satır)
│   ├── WebBuilder.tsx         # Web sitesi oluşturucu (955 satır)
│   ├── WebPreview.tsx         # Web önizleme (465 satır)
│   ├── PublicSite.tsx         # Public emlak sitesi (920 satır)
│   ├── Login.tsx              # Giriş (235 satır)
│   └── Register.tsx           # Kayıt (325 satır)
│
├── components/
│   ├── Sidebar.tsx            # Sol menü navigasyonu
│   ├── TopBar.tsx             # Üst bar, dark mode toggle
│   ├── SaleForm.tsx           # Satış modal formu
│   ├── NotificationBell.tsx   # Bildirim ikonu
│   └── AddToCalendarButton.tsx
│
├── services/
│   ├── supabaseClient.ts      # Supabase bağlantısı
│   ├── config.ts              # Environment değişkenleri okuma
│   ├── geminiService.ts       # AI çağrıları (client-side)
│   ├── matchingService.ts     # Talep-ilan eşleştirme algoritması
│   ├── publicSiteService.ts   # Domain bazlı site kontrolü + cache
│   └── keepAliveService.ts    # Supabase ping
│
├── constants/
│   ├── propertyConstants.ts   # Emlak form sabitleri (sahibinden uyumlu)
│   └── turkeyLocations.ts     # 81 il, ilçeler, il koordinatları ⭐ YENİ
│
└── utils/
    └── validation.ts          # Form validasyon

api/
├── analyze-listing.ts         # Vercel serverless: URL'den ilan parse (Gemini AI)
└── keep-alive.ts              # Vercel cron: Supabase uyandırma (günlük 08:00 UTC)
```

---

## AUTH AKIŞI (Detaylı)

```
1. Kullanıcı /register'a gider
2. Form doldurur (email, password, full_name)
3. supabase.auth.signUp() çağrılır
4. Supabase auth.users'a kayıt oluşturur
5. handle_new_user() trigger'ı profiles tablosuna satır ekler
6. Kullanıcı email doğrulama yapar (opsiyonel, Supabase ayarına bağlı)
7. Login olunca session oluşur
8. DataContext session'ı yakalar, fetchUserProfile() çağırır
9. profiles tablosundan kullanıcı bilgileri çekilir
10. userProfile.officeId varsa, office bilgileri de çekilir
11. Tüm veriler (properties, customers, vb.) office_id'ye göre filtrelenir
```

### Kritik: office_id Atanması
Yeni kullanıcı kaydolunca `office_id` null oluyor. Broker'ın kullanıcıyı ofise eklemesi gerekiyor. Bu işlem için:
- `99_fix_new_user_office.sql` migration'ı var
- Veya manuel olarak Supabase'den profiles tablosunda `office_id` güncellenmeli

---

## TODO (Öncelik Sırasına Göre)

### 1. ACIL (Bu Hafta)
- [ ] **PropertyForm Test**: Yeni wizard formun 6 adımını farklı kategorilerle test et (KONUT, ARSA, İŞYERİ)
- [ ] **DB Schema Sync**: `types.ts`'deki yeni Property alanlarının (facades, interiorFeatures, zoningStatus, vb.) DB'de olduğunu kontrol et, yoksa migration yaz
- [ ] **Listing Status Filter**: PropertyList'te `listing_status` filtresi çalışıyor mu kontrol et

### 2. KISA VADE (Bu Ay)
- [ ] **Google Drive Entegrasyonu**: `PropertyDetail.tsx`'deki belge yükleme özelliğini tamamla
- [ ] **Public Site SEO**: Meta tag'leri dinamik yap, sitemap.xml oluştur
- [ ] **Mobile Responsive**: Özellikle PropertyForm wizard'ı mobilde test et
- [ ] **Yeni Kullanıcı Onboarding**: office_id olmadan giriş yapan kullanıcıya yönlendirme ekle

### 3. ORTA VADE
- [ ] **Push Notifications**: Randevu hatırlatmaları
- [ ] **Email Templates**: Supabase Edge Functions ile
- [ ] **Bulk Import**: Excel'den toplu ilan yükleme
- [ ] **Analytics Dashboard**: Daha detaylı grafikler

### 4. UZUN VADE
- [ ] **PWA**: Offline çalışma
- [ ] **Native Mobile App**: React Native veya Flutter
- [ ] **Multi-tenant SaaS**: Birden fazla bağımsız ofis

---

## SONRAKİ GELİŞTİRİCİ İÇİN NOTLAR

### YAPMA (Don't)
1. **RLS politikalarını direkt değiştirme** - Yeni migration dosyası oluştur
2. **DataContext.tsx'i büyük değişiklik yapmadan önce backup al** - Tüm CRUD buradan geçiyor
3. **HashRouter'ı BrowserRouter'a çevirme** - Vercel routing bozulur
4. **office_id olmadan veri kaydetme** - RLS hata verir
5. **Supabase free tier'da heavy query yapma** - Rate limit var

### YAP (Do)
1. **Her değişiklikten sonra farklı kullanıcılarla test et** - RLS izolasyonunu doğrula
2. **Console'u kontrol et** - `CRITICAL: Attempting to add property without office_id!` gibi uyarılar var
3. **types.ts'i güncel tut** - Yeni alan eklerken buraya da ekle
4. **Migration numarası ile dosya oluştur** - `26_xxx.sql` gibi

### Local Geliştirme
```bash
# Bağımlılıkları yükle
npm install

# Dev server başlat (http://localhost:5173)
npm run dev

# Build test
npm run build

# Build önizleme
npm run preview
```

### Deploy
```bash
# Main branch'e push = otomatik Vercel deploy
git push origin main
```

### Supabase SQL Çalıştırma
1. Supabase Dashboard → SQL Editor
2. Migration dosyasını yapıştır
3. Run

---

## SON YAPILAN DEĞİŞİKLİKLER (Changelog)

| Tarih | Değişiklik | Dosyalar |
|-------|-----------|----------|
| 2026-01-26 | Mahalle API entegrasyonu + adres arama (geocoding) eklendi | `PropertyForm.tsx` |
| 2026-01-25 | Konum seçimi: 81 il, ilçeler cascading dropdown + harita eklendi | `turkeyLocations.ts` (yeni), `PropertyForm.tsx` |
| 2026-01-25 | PropertyForm 6 adımlı wizard olarak yeniden yazıldı | `PropertyForm.tsx` |
| 2026-01-25 | Sahibinden.com uyumlu form sabitleri eklendi | `propertyConstants.ts` (yeni) |
| 2026-01-25 | Property interface genişletildi (50+ yeni alan) | `types.ts` |
| 2026-01-25 | PropertyList ve CustomerList'e sıralanabilir kolonlar eklendi | `PropertyList.tsx`, `CustomerList.tsx` |
| 2026-01-25 | PropertyList filtre bölümü yeniden düzenlendi | `PropertyList.tsx` |

---

## HARİCİ API KULLANIMI

### TurkiyeAPI (Mahalle Verileri)
```
URL: https://api.turkiyeapi.dev/api/v1/neighborhoods
Params: ?province={il}&district={ilçe}&limit=500
Response: { status: "OK", data: [{ name: "Mahalle Adı" }, ...] }
Kullanım: İlçe seçilince mahalle listesi otomatik yüklenir
Rate Limit: Yok (ücretsiz)
```

### Nominatim (OpenStreetMap Geocoding)
```
URL: https://nominatim.openstreetmap.org/search
Params: ?format=json&q={adres}&limit=1&countrycodes=tr
Response: [{ lat, lon, display_name }]
Kullanım: "Adresten Bul" butonu ile adres → koordinat dönüşümü
Rate Limit: 1 istek/saniye (fazla istek yapmayın)
```

---

## YARDIMCI LİNKLER

- **Supabase Dashboard**: https://supabase.com/dashboard (proje seç)
- **Vercel Dashboard**: https://vercel.com (deploy logları)
- **Google AI Studio**: https://aistudio.google.com (API key)
- **TurkiyeAPI Docs**: https://api.turkiyeapi.dev (mahalle API)
- **Nominatim Usage**: https://nominatim.org/release-docs/develop/api/Search/ (geocoding)
- **Sahibinden.com Ilan Formu**: Referans için: https://www.sahibinden.com/ilan-ver
