# EmlakCRM Pro — CLAUDE.md

## Proje Özeti

**EmlakCRM Pro** — Nest Life Gayrimenkul için geliştirilmiş SaaS tabanlı müşteri ve portföy yönetim sistemi.

- **Sahibi:** Adem Aslan — İstanbul Çekmeköy/Alemdağ emlak danışmanı
- **Durum:** Canlıda, aktif kullanımda (Vercel)
- **Mimari:** Multi-tenant, ofis bazlı veri izolasyonu

---

## Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Routing | React Router 7 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google OAuth + Email) |
| Storage | Cloudinary (fotoğraf CDN) |
| Icons | Lucide React |
| Deploy | Vercel |

---

## Proje Yapısı

```
src/
├── pages/           # Sayfa componentleri (26 dosya)
├── components/      # Ortak componentler (9 dosya)
├── context/         # DataContext, ThemeContext
├── services/        # supabaseClient, config, diğer servisler
├── constants/       # propertyConstants, turkeyLocations, themes
└── utils/           # validation
supabase/
└── migrations/      # 43+ SQL migration dosyası
```

### Sayfalar (src/pages/)

| Dosya | Açıklama |
|-------|----------|
| `Dashboard.tsx` | Ana dashboard, KPI'lar |
| `PropertyList.tsx` | Portföy listesi, filtreleme |
| `PropertyDetail.tsx` | Mülk detayı + geçmiş aktiviteler |
| `PropertyForm.tsx` | Mülk oluştur/düzenle (74KB, karmaşık form) |
| `CustomerList.tsx` | Müşteri veritabanı |
| `CustomerDetail.tsx` | Müşteri profili + aktiviteler |
| `CustomerForm.tsx` | Müşteri oluştur/düzenle |
| `ActivityList.tsx` | Tüm aktiviteler |
| `ActivityForm.tsx` | Aktivite oluştur/düzenle |
| `RequestList.tsx` | Müşteri talep listesi |
| `RequestForm.tsx` | Talep oluştur/düzenle |
| `RequestDetail.tsx` | Talep detayı |
| `SaleForm.tsx` | Satış/kiralama işlem formu |
| `Reports.tsx` | Raporlar ve analitik |
| `CalendarPage.tsx` | Aktivite takvimi |
| `MatchCenter.tsx` | Mülk-talep eşleştirme |
| `Team.tsx` | Ekip yönetimi, roller (50KB) |
| `Settings.tsx` | Kullanıcı ayarları + ofis üyeliği (55KB) |
| `AdminPanel.tsx` | Admin paneli |
| `WebBuilder.tsx` | Sürükle-bırak web builder |
| `PublicSite.tsx` | Müşteri taraflı site |
| `LandingPage.tsx` | Landing sayfası |

### Ortak Componentler (src/components/)

| Dosya | Açıklama |
|-------|----------|
| `Sidebar.tsx` | Sol navigasyon |
| `TopBar.tsx` | Üst navigasyon |
| `NotificationBell.tsx` | Gerçek zamanlı bildirimler |
| `QuickActions.tsx` | FAB + hızlı arama/arama modalları |
| `SaleForm.tsx` | Satış/kiralama formu |
| `RentalForm.tsx` | Kiralama formu |
| `DocumentManager.tsx` | Döküman yönetimi |
| `AddToCalendarButton.tsx` | Takvim entegrasyonu |
| `ErrorBoundary.tsx` | Hata yakalama |

### Servisler (src/services/)

| Dosya | Açıklama |
|-------|----------|
| `supabaseClient.ts` | **Ana Supabase client** — her yerde bu kullanılır |
| `config.ts` | Env değişkenleri + fallback değerler |
| `notificationService.ts` | Bildirim CRUD + realtime |
| `subscriptionService.ts` | Plan limitleri, abonelik kontrol |
| `matchService.ts` | Mülk-talep eşleştirme algoritması |
| `officeService.ts` | Davet linkleri, ofis katılım, rol değişiklikleri |
| `cloudinaryService.ts` | Fotoğraf yükleme/optimizasyon |
| `emailService.ts` | Email şablonları (Resend — henüz aktif değil) |
| `geminiService.ts` | Google Gemini AI entegrasyonu |
| `googleDriveService.ts` | Google Drive döküman entegrasyonu |
| `keepAliveService.ts` | Oturum keep-alive |

---

## Veri Modelleri (src/types.ts)

### Ana Entity'ler

**Property (Mülk)**
- `listingStatus`: Aktif | Pasif | Satıldı | Kiralandı | Kapora Alındı
- `category`: KONUT | ISYERI | ARSA
- `officeId`, `visibility`: Multi-tenant destek
- Deposit alanları: `depositAmount`, `depositDate`, `depositBuyerId`

**Customer (Müşteri)**
- `status`: Aktif | Potansiyel | Pasif
- `type`: Alıcı | Satıcı | Kiracı | Kiracı Adayı | Mal Sahibi
- `officeId`, `userId`: Sahiplik

**Activity (Aktivite)**
- Tipler: Yer Gösterimi | Gelen/Giden Arama | Ofis Toplantısı | Tapu İşlemi | Kapora Alındı | Diğer
- `status`: Olumlu | Olumsuz | Düşünüyor | Tamamlandı | Planlandı

**Sale (Satış/Kiralama)**
- Komisyon alanları: `buyerCommissionAmount/Rate`, `sellerCommissionAmount/Rate`
- Kiralık için: `monthlyRent`, `depositAmount`, `leaseDuration`, `leaseEndDate`
- Gelir dağılımı: `officeShareRate`, `consultantShareRate`

**Request (Talep)**
- `requestType`: Satılık | Kiralık
- Fiyat aralığı, konum filtreleri, oda tercihleri

**Subscription**
- `plan`: free | pro
- `status`: active | cancelled | expired
- Plan limitleri: `maxProperties`, `maxCustomers`

---

## Veritabanı (Supabase)

### Ana Tablolar
`properties`, `customers`, `activities`, `requests`, `sales`, `documents`,
`subscriptions`, `offices`, `office_invitations`, `notifications`, `matches`,
`web_site_configs`

### Güvenlik
- RLS (Row-Level Security) tüm tablolarda aktif
- Müşteriler/aktiviteler yalnızca sahibine görünür (`35_strict_privacy_rls.sql`)
- Ofis bazlı veri izolasyonu

### Migration Dosyaları
`supabase/migrations/` — 43+ dosya (01 → 37)
Yeni migration eklerken sıralı numaralandırma: `38_...sql`

---

## Geliştirme Kuralları

### Dil Kuralları
- **UI metinleri:** Türkçe (butonlar, etiketler, hata mesajları, placeholder'lar)
- **Kod:** İngilizce (component isimleri, değişkenler, fonksiyonlar, interface'ler)
- **Yorumlar:** Türkçe veya İngilizce (tutarlılık önce gelir)

### Kod Kuralları
- Supabase işlemleri için daima `src/services/supabaseClient.ts` kullan
- Mevcut dosya yapısını koru — yeni klasör oluşturma
- Mevcut component/servis pattern'lerine uy
- Tip güvenliği: `any` kullanmaktan kaçın, `src/types.ts`'deki type'ları kullan

### Güvenlik
- `.env` dosyasını asla commit etme
- RLS politikalarını bypass etme
- Cross-tenant veri sızıntısına neden olacak değişikliklerden kaçın

---

## Asistan Davranış Kuralları

### Plan Göster, Onay Al
**Her değişiklikten önce:**
1. Neyin değiştirileceğini açıkla
2. Hangi dosyaların etkileneceğini listele
3. Kullanıcı onayı bekle
4. Onay geldikten sonra uygula

### Canlı Sistem Dikkati
Bu proje production'da çalışmaktadır. Şu durumlarda ekstra dikkat:
- Veritabanı şeması değişiklikleri (yeni migration gerektirir)
- RLS politika değişiklikleri
- Auth akışı değişiklikleri
- `DataContext.tsx` değişiklikleri (tüm uygulamayı etkiler)
- Abonelik limiti mantığı değişiklikleri

---

## Veri Sorgulama ve Raporlama

Bu asistan, kod geliştirmenin yanı sıra **veri sorgulama ve raporlama** aracı olarak da kullanılmaktadır.

### Sorgulama Formatı
Kullanıcı veri sorusu sorduğunda:
1. İlgili Supabase tablosunu belirle
2. Uygun filtreleri uygula
3. Sonuçları anlaşılır Türkçe tablo/liste formatında sun
4. Toplam sayı ve özet istatistikleri ekle

### Örnek Sorgular
- "Nef 3+1 loft için yapılan aktiviteleri listele"
  → `activities` tablosunda property title'a göre filtrele
- "Bu ay kaç yeni müşteri eklendi?"
  → `customers` tablosunda `created_at >= başı_of_month` filtresi
- "Çekmeköy'deki portföy dağılımını göster"
  → `properties` tablosunda district='Çekmeköy' + category gruplama
- "Son satışları göster"
  → `sales` tablosu, son 30 gün, sale/rental ayrımı ile

### Sorgu Yazarken
- `supabaseClient` import et
- `select()`, `eq()`, `gte()`, `lte()`, `ilike()` operatörlerini kullan
- Tarihleri ISO 8601 formatında kullan
- Sonuçları Türkçe başlıklarla formatla

---

## Sık Kullanılan Pattern'ler

### Supabase Sorgu
```typescript
import { supabase } from '../services/supabaseClient';

const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('office_id', officeId)
  .order('created_at', { ascending: false });
```

### DataContext'ten Veri Okuma
```typescript
import { useData } from '../context/DataContext';
const { properties, customers, activities, sales } = useData();
```

### Toast Bildirimi
```typescript
import toast from 'react-hot-toast';
toast.success('Kayıt başarıyla eklendi');
toast.error('Bir hata oluştu');
```

---

## Önemli Dosyalar

| Dosya | Neden Önemli |
|-------|-------------|
| `src/types.ts` | Tüm veri modelleri burada — değişiklik öncesi oku |
| `src/context/DataContext.tsx` | Global state — değişiklik tüm uygulamayı etkiler |
| `src/services/supabaseClient.ts` | DB bağlantısı — import her zaman buradan |
| `src/services/config.ts` | Env + fallback — credentials burada |
| `src/constants/propertyConstants.ts` | Tüm sabit değerler (tipler, durumlar) |
| `supabase/migrations/35_strict_privacy_rls.sql` | Son RLS politikaları |
| `.env` | **Asla commit etme** |

---

## Deployment

- **Platform:** Vercel
- **Branch:** `main` → otomatik deploy
- **Env Vars:** Vercel dashboard'dan yönetilir
- Migration'lar Supabase dashboard veya CLI ile uygulanır

---

## Uygulanan Son Özellikler

- Strict Privacy RLS (müşteriler/aktiviteler yalnızca sahibine görünür)
- Kiralık kapanış sistemi (Rental Closing)
- Kapora Alındı aktivite tipi
- URL bazlı portföy filtreleme
- Ofis performans görünürlük ayarları
- Ayrı alıcı/satıcı komisyon alanları
