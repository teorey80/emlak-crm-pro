# Emlak CRM Pro - Geliştirme Özeti

**Tarih:** 23 Şubat 2025
**Commit:** `f6ddd9e`
**Branch:** `main`

---

## Yapılan 5 Geliştirme

### 1. Hızlı Arama - Yeni Müşteri Tipi Seçimi

**Dosya:** `src/components/QuickActions.tsx`

**Değişiklik:**
- Hızlı arama ile müşteri görüşmesi eklerken, eğer aranan kişi sistemde yoksa ve yeni müşteri oluşturuluyorsa, müşteri tipi seçilebilir hale getirildi
- Seçenekler: Alıcı, Alıcı Adayı, Satıcı, Kiracı Adayı, Mal Sahibi, Diğer
- Hem QuickCallModal hem QuickMessageModal'a eklendi

---

### 2. Emlaklar Sayfası - Varsayılan Filtre

**Dosya:** `src/pages/PropertyList.tsx`

**Değişiklik:**
- Sayfa açıldığında varsayılan filtreler:
  - **İlan Durumu:** Sadece "Aktif" ilanlar (önceden "Tümü" idi)
  - **Görünüm:** Sadece giriş yapan kullanıcının kendi ilanları (önceden "Tüm Ofis" idi)
- "Temizle" butonu bu yeni varsayılanlara sıfırlıyor

---

### 3. Müşteri Kaydı - Gelme Sebebi Güncellemesi

**Dosya:** `src/pages/CustomerForm.tsx`

**Değişiklik:**
- "Kaynak (Gelme Sebebi)" alanına yeni seçenekler eklendi:
  - Sahibinden.com
  - Tabela
  - Telefon
- "Diğer" seçildiğinde altında text input açılıyor (placeholder: "Lütfen belirtin...")
- Düzenleme modunda "Diğer: ..." formatındaki veriler doğru parse ediliyor

---

### 4. Müşteri Durum Otomasyonu - Pasifleştirme Sistemi

**Dosyalar:**
- `src/pages/Dashboard.tsx`
- `src/pages/CustomerList.tsx`
- `supabase/migrations/customer_auto_passivate.sql`

**Değişiklikler:**

#### Dashboard Uyarı Kartı
- "Pasife Düşmek Üzere Müşteriler" başlıklı sarı uyarı kartı eklendi
- 45-60 gün aralığındaki müşterileri listeler (maksimum 5)
- Her satırda: Müşteri adı, son aktivite tarihi, kaç gün kaldığı
- "Tümünü Gör" linki müşteriler sayfasına yönlendirir

#### Müşteri Listesi Badge'leri
- Her müşteri satırında aktivite durumu badge'i eklendi:
  - **Yeşil:** Aktif (son 45 gün içinde aktivite var)
  - **Sarı:** Uyarı (45-60 gün arası)
  - **Kırmızı:** Pasif (60+ gün)
- Badge içinde "Xg" formatında gün sayısı gösteriliyor
- Pasif müşteriler listenin sonunda sıralanıyor

#### Otomatik Pasifleştirme (Supabase)
- `get_customer_last_activity(customer_uuid)` - Son aktivite tarihini hesaplar
- `auto_passivate_customers()` - 60+ gün inaktif müşterileri "Pasif" yapar
- pg_cron job: Her gece 00:00 UTC'de otomatik çalışır

**Cron Job Kurulumu:**
```sql
SELECT * FROM cron.job;
-- jobname: auto-passivate-customers
-- schedule: 0 0 * * * (her gece)
-- active: true
```

---

### 5. Kiracı Adayı → Kiracı Otomatik Dönüşüm

**Dosyalar:**
- `src/context/DataContext.tsx`
- `src/types.ts`

**Değişiklik:**
- Kira kontratı tamamlandığında: "Kiracı Adayı" → "Kiracı"
- Satış tamamlandığında: "Alıcı Adayı" → "Alıcı"
- `addSale` fonksiyonuna `autoUpdateCustomerType()` eklendi
- Customer type'a "Alıcı Adayı" ve "Diğer" seçenekleri eklendi (tüm formlarda)

---

## Değiştirilen Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `src/components/QuickActions.tsx` | Müşteri tipi seçimi eklendi |
| `src/context/DataContext.tsx` | Otomatik tip dönüşümü eklendi |
| `src/pages/CustomerForm.tsx` | Gelme sebebi güncellendi |
| `src/pages/CustomerList.tsx` | Aktivite badge'leri eklendi |
| `src/pages/Dashboard.tsx` | Uyarı kartı eklendi |
| `src/pages/PropertyList.tsx` | Varsayılan filtreler değiştirildi |
| `src/types.ts` | CustomerType genişletildi |
| `supabase/migrations/customer_auto_passivate.sql` | SQL fonksiyonları (YENİ) |

---

## Teknik Notlar

### Müşteri Tipleri (Güncel)
```typescript
customerType?: 'Alıcı' | 'Alıcı Adayı' | 'Satıcı' | 'Kiracı' | 'Kiracı Adayı' | 'Mal Sahibi' | 'Diğer'
```

### Aktivite Durumu Hesaplama
```typescript
// Son aktivite veya kayıt tarihinden bugüne kaç gün geçti?
// 0-45 gün: active (yeşil)
// 45-60 gün: warning (sarı)
// 60+ gün: passive (kırmızı)
```

### Supabase Fonksiyonları
- `get_customer_last_activity(UUID)` → TIMESTAMP
- `auto_passivate_customers()` → INTEGER (güncellenen müşteri sayısı)

---

## Test Komutları

```sql
-- Pasifleştirilecek müşterileri önizle (DRY RUN)
SELECT c.id, c.name, c.status, get_customer_last_activity(c.id) as last_activity
FROM customers c
WHERE c.status != 'Pasif'
  AND get_customer_last_activity(c.id) < NOW() - INTERVAL '60 days';

-- Manuel pasifleştirme çalıştır
SELECT auto_passivate_customers();

-- Cron job durumunu kontrol et
SELECT * FROM cron.job;
```

---

## Proje Bilgileri

- **GitHub:** https://github.com/teorey80/emlak-crm-pro
- **Vercel:** https://vercel.com/adems-projects-eecef075/emlak-crm-pro
- **Canlı Site:** https://emlak-crm-pro-plum.vercel.app
