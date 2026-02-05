# Emlak CRM Pro - AI Handoff Context

## Proje Bilgileri
- **Proje Adı:** Emlak CRM Pro
- **Tech Stack:** React 18 + TypeScript + Vite + Supabase + Tailwind CSS
- **Repo:** https://github.com/teorey80/emlak-crm-pro
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ofttxfmbhulnpbegliwp
- **Live URL:** https://emlak-crm-pro-plum.vercel.app
- **Deploy:** Vercel (otomatik - main branch'e push'ta deploy)

---

## Süreç Notu
- **Her oturum sonunda** kullanıcıdan (veya diğer AI’dan) **"CONTEXT.md'yi güncelle"** talebini iste.

---

## Veritabanı Yapısı (Supabase)

### Tablolar

#### `properties` (Portföyler/İlanlar)
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | text | Primary key (PRT-XXXXXX formatı) |
| title | text | İlan başlığı |
| price | numeric | Fiyat |
| listing_status | text | Aktif, Pasif, Kapora Alındı, Satıldı, Kiralandı |
| status | text | Satılık, Kiralık |
| user_id | uuid | İlanı ekleyen danışman |
| office_id | uuid | Ofis ID |
| owner_id | text | Mal sahibi müşteri ID |
| owner_name | text | Mal sahibi adı |
| sold_date | date | Satış tarihi |
| deposit_amount | numeric | Kapora tutarı |
| deposit_date | date | Kapora tarihi |
| deposit_buyer_id | text | Kapora veren müşteri ID |

#### `customers` (Müşteriler)
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | text | Primary key |
| name | text | Müşteri adı |
| phone | text | Telefon |
| email | text | E-posta |
| customerType | text | Alıcı, Satıcı, Kiracı Adayı, Ev Sahibi |
| user_id | uuid | Danışman ID |
| office_id | uuid | Ofis ID |

#### `sales` (Satışlar)
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| property_id | text | Portföy ID |
| sale_price | numeric | Satış bedeli |
| sale_date | date | Satış tarihi |
| buyer_id | text | Alıcı müşteri ID |
| buyer_name | text | Alıcı adı |
| commission_amount | numeric | Toplam komisyon |
| buyer_commission_amount | numeric | Alıcıdan alınan komisyon |
| seller_commission_amount | numeric | Satıcıdan alınan komisyon |
| office_share_rate | numeric | Ofis pay oranı (%) |
| office_share_amount | numeric | Ofis payı tutarı |
| consultant_share_amount | numeric | Danışman payı |
| net_profit | numeric | Net kâr |
| expenses | jsonb | Giderler array |
| transaction_type | text | sale veya rental |
| has_partner_office | boolean | Ortak satış var mı |
| partner_office_name | text | Ortak ofis adı |
| partner_share_amount | numeric | Ortak ofise verilen tutar |
| partner_share_type | text | buyer_commission veya total_commission |

#### `activities` (Aktiviteler)
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | Primary key |
| type | text | Aktivite tipi (Yer Gösterimi, Gelen Arama, Tapu İşlemi, vb.) |
| customer_id | text | Müşteri ID |
| customer_name | text | Müşteri adı |
| property_id | text | Portföy ID |
| property_title | text | Portföy başlığı |
| date | date | Tarih |
| description | text | Açıklama |
| status | text | Olumlu, Olumsuz, Beklemede, Tamamlandı |

#### `requests` (Müşteri Talepleri)
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | text | Primary key |
| customer_id | text | Müşteri ID |
| type | text | Daire, Villa, vb. |
| min_price | numeric | Min bütçe |
| max_price | numeric | Max bütçe |
| city | text | Şehir |
| district | text | İlçe |

---

## Önemli Dosyalar

### Ana Mantık
- `src/context/DataContext.tsx` - Tüm CRUD işlemleri, Supabase bağlantısı
- `src/types.ts` - TypeScript tip tanımları

### Sayfalar
- `src/pages/PropertyDetail.tsx` - Portföy detay sayfası
- `src/pages/PropertyList.tsx` - Portföy listesi
- `src/pages/CustomerDetail.tsx` - Müşteri detay
- `src/pages/Dashboard.tsx` - Ana dashboard

### Bileşenler
- `src/components/SaleForm.tsx` - Satış formu (komisyon girişi, ortak satış)
- `src/components/RentalForm.tsx` - Kiralama formu
- `src/components/ActivityForm.tsx` - Aktivite ekleme

---

## Son Yapılan İşler (2026-02-04)

### Satış Formu Geliştirmeleri
1. **Komisyon Girişi Ayrıldı:**
   - Alıcıdan alınan komisyon (ayrı input)
   - Satıcıdan alınan komisyon (ayrı input)
   - Tutar girilince yüzde otomatik hesaplanıyor (yanda gösteriliyor)

2. **Binlik Ayıracı:**
   - Komisyon girişlerinde yazarken 75.000 formatında
   - Kuruş gösterimi kaldırıldı

3. **Ortak Satış (Partner Office):**
   - "Ortak ofis var" toggle
   - Ortak ofis adı + yetkili kişi
   - Paylaşım türü: "Alıcı komisyonundan" veya "Toplam komisyondan"
   - Tutar manuel giriş, yüzde otomatik hesaplama
   - Net kârdan düşülüyor

### Aktivite Kaydı Düzeltmesi
- Satış sonrası Alıcı, Satıcı ve Portföy için "Tapu İşlemi" aktivitesi oluşturuluyor
- `customer_name` ve `property_title` alanları DB'ye kaydediliyor

### Satılan Mülk Gösterimi
- PropertyDetail sayfasında "Bu Mülk Satıldı" altında satış fiyatı gösteriliyor

### Portföy Görselleri (PropertyDetail)
- Görsel dizilimi daha düzenli 2x4/2x2 grid olarak revize edildi
- Görsellere tıklayınca lightbox galeri açılıyor (ileri/geri, ESC ile kapatma, küçük önizleme şeridi)
- Görsel yoksa daha şık bir placeholder kullanılıyor (SVG data URI)

---

## Bilinen Sorunlar / Dikkat Edilecekler

1. **Satış İşlemi Tutarsızlığı:**
   - Bazen satış kaydı oluşuyor ama property durumu "Aktif" kalabiliyor
   - Çözüm: PropertyDetail sayfasında "Veri Tutarsızlığı" uyarısı ve düzeltme butonu var
   - Manuel düzeltme için SQL:
   ```sql
   -- Sorunlu kayıtları bul
   SELECT p.id, p.title, p.listing_status, s.id as sale_id
   FROM properties p
   JOIN sales s ON s.property_id = p.id
   WHERE p.listing_status = 'Aktif';

   -- Satış kaydını sil
   DELETE FROM sales WHERE id = 'SALE_ID';
   ```

2. **Aktivite Tablosu Sütun Adları:**
   - Bazı sütunlar camelCase: `propertyId`, `customerId`
   - SQL sorgularında çift tırnak kullan: `"propertyId"`

---

## Kod Yapısı Notları

### DataContext.tsx - addSale Fonksiyonu
```
1. Sale nesnesi oluştur (saleForDB)
2. Optimistic update: setSales(), setProperties()
3. Aktiviteler oluştur (Alıcı, Satıcı, Portföy için)
4. DB işlemleri:
   - sales tablosuna insert
   - properties tablosunu güncelle (listing_status = 'Satıldı')
   - activities tablosuna insert
5. Hata durumunda rollback
```

### SaleForm.tsx - Komisyon Hesaplama
```
- buyerCommissionAmount: Alıcıdan alınan (manuel giriş)
- sellerCommissionAmount: Satıcıdan alınan (manuel giriş)
- totalCommissionAmount = buyer + seller
- partnerShareAmount: Ortak ofise verilecek (manuel giriş)
- grossProfit = totalCommission - expenses
- netProfit = grossProfit - partnerShare
- officeShareAmount = netProfit * officeShareRate%
- consultantShareAmount = netProfit - officeShare
```

---

## Yeni AI'a Başlarken Kullanılacak Prompt

```
Proje: Emlak CRM Pro (React + TypeScript + Supabase)
Repo: https://github.com/teorey80/emlak-crm-pro

Lütfen önce şu dosyaları oku:
1. CONTEXT.md - Proje durumu ve yapısı
2. src/context/DataContext.tsx - Ana iş mantığı
3. src/types.ts - Veri tipleri
4. src/components/SaleForm.tsx - Satış formu (son güncellenen)

[YAPILACAK İŞ AÇIKLAMASI]
```

---

## Versiyon Geçmişi

| Tarih | Yapılan | AI |
|-------|---------|-----|
| 2026-02-04 | Ortak satış, komisyon ayrımı, aktivite düzeltmesi | Claude |
| 2026-02-04 | PropertyDetail galeri düzeni ve lightbox eklendi | Codex |

---

*Bu dosya AI asistanları arasında geçiş yaparken proje sürekliliğini sağlamak için oluşturulmuştur.*
