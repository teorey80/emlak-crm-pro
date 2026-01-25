# PROJECT STATUS

Son Güncelleme: 2026-01-25

---

## PROJECT OVERVIEW

### Uygulamanın Amacı
Emlak CRM Pro, emlak ofisleri ve danışmanları için geliştirilmiş bir müşteri ilişkileri yönetim (CRM) sistemidir. Gayrimenkul ilanlarını, müşterileri, randevuları ve satışları tek bir platformda yönetmeyi sağlar.

### Kimler İçin
- Emlak danışmanları (bireysel kullanım)
- Emlak ofisleri (çoklu kullanıcı/ekip)
- Türkiye pazarına yönelik (Türkçe arayüz, sahibinden.com uyumlu)

### Hangi Problemi Çözüyor
- Emlak ilanlarının merkezi yönetimi
- Müşteri takibi ve eşleştirme (talep-ilan eşleştirme)
- Randevu ve aktivite yönetimi
- Satış takibi ve komisyon hesaplama
- Kişisel/ofis web sitesi oluşturma
- Ekip içi veri paylaşımı

---

## TECH STACK

### Frontend
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.8.2 | Tip güvenliği için |
| Vite | 6.2.0 | Build tool ve dev server |
| react-router-dom | 7.9.6 | Sayfa yönlendirme (HashRouter kullanıyor) |
| lucide-react | 0.554.0 | İkon kütüphanesi |
| react-hot-toast | 2.6.0 | Bildirim (toast) mesajları |
| TailwindCSS | - | Inline CSS class'ları ile kullanılıyor (ayrı config yok) |

### Backend
| Teknoloji | Açıklama |
|-----------|----------|
| Supabase | PostgreSQL veritabanı + Auth + Realtime + RLS |
| Vercel Serverless | API endpoint'leri (`/api/analyze-listing`, `/api/keep-alive`) |

### AI Entegrasyonu
| Teknoloji | Kullanım Alanı |
|-----------|---------------|
| Google Gemini AI (gemini-2.5-flash) | İlan açıklaması oluşturma, fiyat tahmini, URL'den ilan import |

### Database
- **PostgreSQL** (Supabase üzerinden)
- Row Level Security (RLS) aktif
- Çoklu tablo yapısı (properties, customers, activities, requests, sales, profiles, offices, sites, documents)

### Auth Sistemi
- **Supabase Auth** (email/password)
- Kayıt olunca otomatik profil oluşturma (trigger)
- Session yönetimi React Context ile

### Deployment
| Platform | Kullanım |
|----------|----------|
| Vercel | Frontend hosting + Serverless functions |
| Supabase | Database + Auth |
| Cron Job | Günlük keep-alive (`/api/keep-alive` - 08:00 UTC) |

---

## CURRENT STATE

### Çalışan Özellikler

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Login/Register | Çalışıyor | Supabase Auth ile |
| Dashboard | Çalışıyor | İstatistikler, akıllı eşleştirmeler, günlük program |
| Emlak Yönetimi | Çalışıyor | 6 adımlı wizard form, sahibinden.com uyumlu |
| Müşteri Yönetimi | Çalışıyor | CRUD, detay sayfası, etkileşim geçmişi |
| Aktiviteler | Çalışıyor | Randevu, arama, gösterim takibi |
| Talepler | Çalışıyor | Müşteri talepleri, akıllı eşleştirme |
| Satış Takibi | Çalışıyor | Komisyon hesaplama, gider takibi |
| Takvim | Çalışıyor | Aktivitelerin takvim görünümü |
| Site Yönetimi | Çalışıyor | Konut siteleri kayıt |
| Web Builder | Çalışıyor | Kişisel/ofis web sitesi oluşturma |
| Public Site | Çalışıyor | Domain bazlı public site render |
| Ekip | Çalışıyor | Ofis üyelerini görüntüleme |
| Raporlar | Çalışıyor | Performans grafikleri |
| Ayarlar | Çalışıyor | Profil, hedefler |
| Dark Mode | Çalışıyor | Sistem/manuel geçiş |
| AI Özellikler | Çalışıyor | Açıklama oluşturma, fiyat tahmini |

### Sorunsuz Çalışan Sayfalar
- `/` - Dashboard
- `/login` - Giriş
- `/register` - Kayıt
- `/properties` - Emlak listesi (sıralanabilir kolonlar, filtreler)
- `/properties/new` - Yeni emlak (6 adımlı wizard)
- `/properties/:id` - Emlak detay
- `/customers` - Müşteri listesi (sıralanabilir kolonlar)
- `/customers/new` - Yeni müşteri
- `/customers/:id` - Müşteri detay
- `/activities` - Aktivite listesi
- `/requests` - Talep listesi
- `/calendar` - Takvim
- `/reports` - Raporlar
- `/team` - Ekip
- `/settings` - Ayarlar
- `/web-builder` - Web sitesi oluşturucu

### Canlı Ortam Durumu
- **Vercel**: Deploy edilmiş ve çalışıyor
- **Supabase**: Aktif, veritabanı çalışıyor
- **Public Site**: Domain eşleştirme ile aktif

---

## DATA & AUTH

### Supabase Tabloları

| Tablo | Açıklama | Önemli Kolonlar |
|-------|----------|-----------------|
| `properties` | Emlak ilanları | id, title, price, type, status, user_id, office_id, listing_status |
| `customers` | Müşteriler | id, name, phone, email, customerType, user_id, office_id |
| `activities` | Aktiviteler/Randevular | id, type, customerId, propertyId, date, status, user_id |
| `requests` | Müşteri talepleri | id, customerId, type, requestType, minPrice, maxPrice, city |
| `sales` | Satışlar | id, property_id, sale_price, commission_rate, consultant_id |
| `sites` | Konut siteleri | id, name, region, address |
| `profiles` | Kullanıcı profilleri | id (=auth.users.id), full_name, office_id, role, site_config |
| `offices` | Emlak ofisleri | id, name, domain, owner_id, site_config |
| `documents` | Belgeler (Google Drive) | id, entity_type, entity_id, file_id, office_id |

### Auth Akışı
1. Kullanıcı `/register` sayfasından kayıt olur
2. Supabase Auth yeni kullanıcı oluşturur
3. `handle_new_user` trigger'ı otomatik `profiles` kaydı oluşturur
4. Kullanıcı giriş yapınca `session` oluşur
5. `DataContext` session'a göre veri çeker
6. Çıkış yapınca session temizlenir

### RLS (Row Level Security)
- Tüm tablolarda RLS aktif
- Kullanıcılar sadece kendi ofislerinin verilerini görebilir
- `office_id` bazlı veri izolasyonu
- `/supabase/migrations/` klasöründe çok sayıda RLS düzeltmesi var (geçmişte sorunlar yaşanmış)

### Önemli RLS Notları
- Yeni kayıtlara mutlaka `office_id` eklenmeli
- `user_id` ve `office_id` olmadan veri kaydetme sorun yaratabilir
- Migration dosyaları sırayla çalıştırılmalı

---

## FILE / FOLDER STRUCTURE

```
emlak-crm-pro/
├── src/
│   ├── App.tsx                 # Ana uygulama, routing, auth kontrolü
│   ├── index.tsx               # Entry point
│   ├── types.ts                # TypeScript tüm interface'ler
│   ├── mockData.ts             # Demo veriler (artık kullanılmıyor)
│   │
│   ├── components/             # Paylaşılan bileşenler
│   │   ├── Sidebar.tsx         # Sol menü
│   │   ├── TopBar.tsx          # Üst bar
│   │   ├── SaleForm.tsx        # Satış kayıt modal
│   │   ├── NotificationBell.tsx
│   │   ├── AddToCalendarButton.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── pages/                  # Sayfa bileşenleri
│   │   ├── Dashboard.tsx       # Ana sayfa, istatistikler
│   │   ├── PropertyList.tsx    # Emlak listesi (sıralama, filtreleme)
│   │   ├── PropertyForm.tsx    # Emlak ekleme/düzenleme (6 adım wizard)
│   │   ├── PropertyDetail.tsx  # Emlak detay
│   │   ├── CustomerList.tsx    # Müşteri listesi
│   │   ├── CustomerForm.tsx    # Müşteri formu
│   │   ├── CustomerDetail.tsx  # Müşteri detay
│   │   ├── ActivityList.tsx    # Aktiviteler
│   │   ├── ActivityForm.tsx    # Aktivite formu
│   │   ├── RequestList.tsx     # Talepler
│   │   ├── RequestForm.tsx     # Talep formu
│   │   ├── RequestDetail.tsx   # Talep detay
│   │   ├── CalendarPage.tsx    # Takvim görünümü
│   │   ├── Reports.tsx         # Raporlar
│   │   ├── Team.tsx            # Ekip yönetimi
│   │   ├── Settings.tsx        # Ayarlar
│   │   ├── SiteManagement.tsx  # Site (konut) yönetimi
│   │   ├── WebBuilder.tsx      # Web sitesi oluşturucu
│   │   ├── WebPreview.tsx      # Web önizleme
│   │   ├── PublicSite.tsx      # Public web sitesi render
│   │   ├── Login.tsx           # Giriş sayfası
│   │   └── Register.tsx        # Kayıt sayfası
│   │
│   ├── context/
│   │   └── DataContext.tsx     # Global state, Supabase CRUD işlemleri
│   │
│   ├── services/
│   │   ├── supabaseClient.ts   # Supabase bağlantısı
│   │   ├── config.ts           # Environment değişkenleri
│   │   ├── geminiService.ts    # Google Gemini AI
│   │   ├── matchingService.ts  # Talep-emlak eşleştirme
│   │   ├── publicSiteService.ts # Public site domain kontrolü
│   │   └── keepAliveService.ts # Supabase keep-alive
│   │
│   ├── constants/
│   │   └── propertyConstants.ts # Emlak form sabitleri (sahibinden uyumlu)
│   │
│   └── utils/
│       └── validation.ts       # Form validasyon
│
├── api/                        # Vercel serverless functions
│   ├── analyze-listing.ts      # URL'den ilan analizi (AI)
│   └── keep-alive.ts           # Supabase uyandırma
│
├── supabase/
│   └── migrations/             # SQL migration dosyaları (28 adet)
│
├── package.json
├── vite.config.ts
├── vercel.json                 # Vercel config, cron job
├── tsconfig.json
├── .env.example                # Environment örneği
├── supabase_schema.sql         # Temel tablo şeması
├── migration_auth.sql          # Auth ve profiles şeması
└── migration_documents.sql     # Documents tablosu
```

---

## KNOWN ISSUES

### Bilinen Buglar
| Sorun | Önem | Açıklama |
|-------|------|----------|
| - | - | Şu an bilinen kritik bug yok |

### Yarım Kalan İşler
| İş | Durum | Açıklama |
|----|-------|----------|
| Google Drive Entegrasyonu | Yarım | Documents tablosu var ama frontend'de tam entegre değil |
| PropertyForm yeni alanlar | Yeni | Wizard form yeni eklendi, DB şeması güncellenebilir |
| Public Site SEO | Eksik | Meta tag'ler dinamik değil |

### Riskli / Kararsız Alanlar
| Alan | Risk | Açıklama |
|------|------|----------|
| RLS Politikaları | Orta | Geçmişte çok sorun yaşanmış (28 migration dosyası var) |
| Property type mismatch | Düşük | types.ts ile DB şeması arasında bazı farklar olabilir |
| Supabase Free Tier | Orta | Inaktif kalırsa uyuyor, keep-alive cron var |

---

## TODO (NEXT STEPS)

Öncelik sırasına göre:

1. **PropertyForm Test** - Yeni wizard formun tüm adımlarını test et
2. **DB Schema Sync** - types.ts'deki yeni alanların DB'de olduğunu doğrula
3. **Google Drive** - Document management özelliğini tamamla
4. **Public Site** - SEO meta tag'leri ekle, sitemap oluştur
5. **Performance** - Büyük veri setlerinde sayfalama test et
6. **Mobile** - Responsive tasarımı iyileştir
7. **Notifications** - Push notification ekle (opsiyonel)

---

## NOTES FOR NEXT DEVELOPER (IMPORTANT)

### Dikkat Edilmesi Gereken Noktalar

1. **office_id Zorunlu**: Yeni kayıtlara mutlaka `office_id` ekle. DataContext zaten bunu yapıyor ama manuel SQL yazarken unutma.

2. **RLS Değişikliği**: RLS policy değiştirmeden önce `/supabase/migrations/` klasörünü incele. Geçmişte çok sorun yaşanmış.

3. **HashRouter**: Uygulama `HashRouter` kullanıyor (`/#/path` formatı). Normal `BrowserRouter` değil.

4. **Environment Variables**:
   - `VITE_` prefix'i frontend için
   - Prefix'siz olanlar Vercel serverless için
   - `.env.local` dosyası .gitignore'da

5. **Supabase Uyuma**: Free tier kullanılıyorsa Supabase 1 hafta inaktif kalınca uyuyor. `/api/keep-alive` cron job her gün çalışıyor.

6. **AI API Key**: Gemini API key olmadan AI özellikleri çalışmaz ama uygulama crash olmaz (graceful fallback var).

### Dokunulmaması Gereken Yerler

1. **DataContext.tsx** - Çok kritik, dikkatli değiştir. Tüm CRUD buradan geçiyor.

2. **RLS Policies** - Production'da çalışan RLS'leri değiştirme, yeni migration ekle.

3. **supabase/migrations/** - Mevcut dosyaları değiştirme, yeni numara ile ekle.

### Geliştirme Yaklaşımı

1. **Yeni özellik** → Önce `types.ts`'e interface ekle → Sonra UI yap → Sonra DB migration

2. **Bug fix** → Önce reproduce et → Console log'ları kontrol et → RLS mi kontrol et

3. **Test** → Farklı kullanıcılarla test et (veri izolasyonu için)

4. **Deploy** → `git push origin main` Vercel otomatik deploy eder

5. **DB değişikliği** → Supabase SQL Editor'de çalıştır → Migration dosyası olarak kaydet

### Faydalı Komutlar

```bash
# Local geliştirme
npm run dev

# Build test
npm run build

# Preview build
npm run preview
```

### Supabase SQL Editor Erişimi
Supabase Dashboard → SQL Editor → Migration dosyalarını buradan çalıştır

---

## SON YAPILAN İŞLER (Log)

- **2026-01-25**: PropertyForm tamamen yeniden yazıldı (6 adımlı wizard, sahibinden.com uyumlu)
- **2026-01-25**: PropertyList ve CustomerList'e sıralanabilir kolon başlıkları eklendi
- **2026-01-25**: PropertyList filtre bölümü düzenlendi
- **2026-01-25**: propertyConstants.ts oluşturuldu (tüm form sabitleri)
- **2026-01-25**: types.ts genişletildi (yeni Property alanları)
