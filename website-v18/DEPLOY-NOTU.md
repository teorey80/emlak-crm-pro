# v18 Deploy Notu — proje-detay.html (yeniden yazıldı)

## Ne değişti
- `proje-detay.html` **sıfırdan** yazıldı: tüm CSS ve loader JS dosyanın içinde (self-contained).
  Harici stylesheet bağımlılığı yok → "CSS yüklenmedi" hatası bir daha yaşanamaz.
- Eski Birbahçe kopyası + regex temizliği yaklaşımı terk edildi.
- `js/projects-loader.js` (kart listesi) zaten çalışıyor — DOKUNULMADI, aynen kalsın.

## Deploy adımları (Mac'inde)
1. Yerel `ademaslan-site-deploy` klasörünü aç.
2. Bu klasördeki `proje-detay.html` dosyasını oraya kopyala (eskisinin ÜZERİNE yaz).
3. `_redirects` dosyanda şu satırın olduğunu doğrula:
   `/projeler/:slug   /proje-detay.html   200`
4. **Klasörün tamamını** Netlify'a drag-drop yap.
   ⚠️ Sadece bu 2 dosyayı yüklersen site silinir — Netlify drop tüm siteyi değiştirir.

## Test
- https://ademaslan.com/projeler/nef-korukoy
- https://ademaslan.com/projeler/birbahce-evleri
- Lokal test: proje-detay.html?slug=nef-korukoy ile de açılır.
- Olmayan slug → "İnceleme bulunamadı" + /projeler'e dönüş butonu.

## Loader davranışı
- Supabase REST'ten `slug + published=true` ile tek kayıt çeker.
- Boş alanların bölümleri otomatik gizlenir (teslim sonrası, galeri, görüş, SSS).
- `payment_plan.pct` "%" içermiyorsa gösterilmez (Birbahçe'de adım numarasıydı).
- FAQ'lardan otomatik JSON-LD FAQPage schema üretir (SEO).
- `video_url` varsa YouTube embed eklenir (Birbahçe'de var).
- title + meta description dinamik set edilir.
