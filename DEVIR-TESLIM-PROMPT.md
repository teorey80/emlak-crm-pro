# ademaslan.com + EmlakCRM Pro — Devir-Teslim Prompt (kaldığım yerden devam)

> Bunu yeni pencerede asistana olduğu gibi yapıştır. Adem teknik değildir; sade Türkçe konuş,
> adım adım yönlendir, her büyük değişiklikten önce tek paragraf plan + onay al.

## KİMLİK / ALTYAPI
- Adem Aslan, Çekmeköy/Alemdağ emlak danışmanı (Nest Life Gayrimenkul). Tel/WhatsApp: +90 532 207 4087.
- **Site:** Statik HTML/CSS/JS, Netlify'da canlı (ademaslan.com). Deploy klasörü Mac'te:
  `~/Downloads/ademaslan-site-deploy-v5` (yeni pencerede erişim için bu klasörü bağlat/mount et).
  Deploy yöntemi: klasörün TAMAMI tek zip yapılıp Netlify'a sürükle-bırak. ASLA eksik/tek dosya yükletme.
- **CRM:** EmlakCRM Pro — React+TS+Vite+Supabase, Vercel. Klasör: `~/emlak-crm-pro`. Deploy:
  `cd ~/emlak-crm-pro && git add -A && git commit -m "..." && git push` (Vercel otomatik deploy).
- **Supabase:** URL https://ofttxfmbhulnpbegliwp.supabase.co | proje ref: ofttxfmbhulnpbegliwp
  anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdHR4Zm1iaHVsbnBiZWdsaXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTk5MjAsImV4cCI6MjA4MDY3NTkyMH0._ntPFIsWPmWIiOFh0h6-BymsS4Izwftom9NbfmgQe88
  user_id: 47bf31f3-ee65-4bfe-8152-7804a926849a | Cloudinary: dqrf9irup / preset emlak_upload
- **ÖNEMLİ kısıt:** Sandbox (bash) Supabase'e ERİŞEMEZ. Supabase verisini Claude in Chrome ile çek
  (REST URL'e git + get_page_text). DDL/INSERT için Supabase Dashboard SQL Editor'ı Chrome ile sür
  (Adem giriş yapmış durumda). anon key ile INSERT yapılamaz (RLS).
- **Tekrar kullanılacak betikler kalıcı klasörde:** `~/NeoDepo/site-yayin-araclari/`
  - `generate_static.py` → projeler için dolu statik sayfa + sitemap.xml + robots.txt üretir.
  - `build_rehber_pages.py` → rehberler.html (liste) + rehber-detay.html (dinamik) üretir.
  - `wire_rehberler.py` → siteye nav/footer/_redirects bağlar.
  - `build_ekb_sql.py` → EKB yazısının guides INSERT SQL'ini üretir (`ekb_insert.sql`).
  - `ekb_insert.sql` → HAZIR; Supabase SQL Editor'a yapıştırıp Run = EKB yazısı yayında.
  - `data/*.json` → 3 projenin Supabase verisi (statik üretim girdisi).
  NOT: Bu betiklerdeki yollar `/sessions/.../mnt/...` (sandbox) biçimindedir; yeni oturumda mount
  yolları değişebilir, betik başındaki DEPLOY/DATA yollarını güncellemen gerekebilir.

## MİMARİ (önemli)
- Proje sayfaları: `proje-detay.html` (self-contained, JS ile Supabase'den dolar) = dinamik yedek.
  AI botları JS çalıştırmadığı için her proje ayrıca DOLU statik üretilir: `/projeler/<slug>/index.html`.
  `_redirects`: `/projeler/:slug → /proje-detay.html 200` (statik dosya öncelikli, bu yedek).
- Rehberler: aynı desen. `guides` tablosu (migration 39). `/rehberler` liste, `/rehberler/<slug>` detay.
  `_redirects`: `/rehberler/:slug → /rehber-detay.html 200`.

## TAMAMLANANLAR ✅
1. 3 proje için DOLU statik sayfa (birbahce-evleri, nef-camlitepe, nef-korukoy) + sitemap.xml + robots.txt. (deploy edildi)
2. WhatsApp ölü linkleri (href="#") düzeltildi; site geneli "güven dili" CTA. (deploy edildi)
3. Google Search Console: site doğrulandı, sitemap gönderildi, durum "Başarılı".
4. Rehberler/Blog modülü FAZ 1 — CRM: `guides` tablosu (migration 39 çalıştırıldı), `guidesService.ts`,
   `WebContent/GuidesList.tsx`, `WebContent/GuideForm.tsx`, App.tsx route'ları, Sidebar "Rehberler (Blog)".
   (git push edildi, tablo Supabase'de mevcut ve boş.)
5. Rehberler/Blog FAZ 2 — Site: `rehberler.html` (liste), `rehber-detay.html` (dinamik), nav'a "Rehberler",
   footer ölü linkleri /rehberler'e bağlandı, `_redirects` rehber kuralı, sitemap'e /rehberler.
6. EKB ("Enerji Kimlik Belgesi nasıl sorgulanır?") yazısı içeriği hazır (01.11.2017 uyarısı dahil) →
   `ekb_insert.sql` üretildi.

## KALANLAR / SIRADAKİ ADIMLAR ⏳
A. **FAZ 2 zip deploy teyidi:** En güncel deploy klasörünün (rehberler.html, rehber-detay.html, güncel
   nav/footer/_redirects/sitemap dahil) Netlify'a yüklendiğinden emin ol. Değilse: klasörü zip'le, Adem'e
   sürükle-bırak için ver. Sonra ademaslan.com/rehberler açılmalı (içerik boşsa "henüz içerik yok").
B. **EKB yazısını yayına al (FAZ 3):** `~/NeoDepo/site-yayin-araclari/ekb_insert.sql` içeriğini, Adem'in
   açık olan Supabase SQL Editor'ına yapıştırıp Run et (Chrome ile). Doğrula:
   REST'ten `guides?slug=eq.enerji-kimlik-belgesi-sorgulama&published=eq.true` 1 satır dönmeli.
   (anon ile INSERT olmaz; mutlaka SQL Editor / dashboard.)
C. **Rehberler için STATİK üretimi EKLE (generate_static.py'ye):** Şu an generate_static.py sadece
   projeleri üretiyor. guides için de DOLU statik sayfa (`/rehberler/<slug>/index.html`) + sitemap'e
   guide slug'ları eklenmeli. Yöntem: Chrome ile guides verisini çek (REST select=*), data/ klasörüne
   kaydet, generate_static.py'ye build_guide_page() ekle (rehber-detay tasarımıyla, baked). Sonra
   "yayın paketi" = projeler + rehberler statikleri + sitemap birlikte üretilsin.
D. **Deploy + doğrula:** Güncel klasörü zip'le, Adem deploy etsin. ademaslan.com/rehberler ve
   /rehberler/enerji-kimlik-belgesi-sorgulama canlı + JS'siz dolu olmalı.

## BEKLEYEN KÜÇÜK İŞLER (sonraya)
- proje-detay.html DİNAMİK yedeğine "Adem Aslan kimdir?" otorite kutusu eklenmedi (statik sayfalarda var).
- Çamlıtepe galeri fotoğrafları (Adem panelden yükleyecek). Koruköy sahibinden linki (çıkınca panele).
- cekmekoy-rehberi.html ileride guides "bölge" kategorisine taşınabilir.
- Bölge/Alıcı/Soru-Cevap içerikleri (modül hazır, içerik yok).

## ÇALIŞMA KURALLARI
- Türkçe, sade, adım adım. Büyük değişiklikten önce plan + onay. CRM kodu canlı; dikkatli ol.
- investment_stats içindeki "(sahibinden)" girdileri haftalık otomatik güncellenir — elle dokunma.
- Tasarım: Newsreader+Inter, krem #FBFAF7, antrasit, aksan TERRACOTTA #B85C3F (deniz mavisi değil).
