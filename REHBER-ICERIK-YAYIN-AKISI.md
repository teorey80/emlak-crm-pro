# Rehber İçeriği Yayın Akışı (Video → Web Sitesi)

> **Amaç:** Adem bir YouTube videosu (genelde Shorts) verip "bunu içeriğe dönüştür / web siteme ekle"
> dediğinde, asistanın sıfırdan açıklama beklemeden uçtan uca yapması gereken işlerin tek kaynağı.
> Her yeni oturumda `emlak-crm-pro` klasörü seçildikten sonra bu dosyayı oku ve birebir uygula.

---

## 0. TL;DR — Tek bakışta akış

1. Videonun bilgisini çek (başlık, açıklama, süre, thumbnail).
2. Doğruluk için konuyu web'den teyit et (güncel mevzuat/işlem adımları).
3. SEO + Google AI dostu içerik üret (quick_answer, tldr, body, faqs…).
4. **SQL hazırla** → Adem Supabase SQL Editor'a manuel yapıştırır (DB = tek doğru kaynak).
5. Adem "ekledim" deyince: Supabase'den güncel kaydı çek → `data/guides/<slug>.json` yaz.
6. `build_guide_static.py` ile statik sayfayı üret.
7. Listeleme (`rehberler.html`) + anasayfa (`index.html`) kartlarını + `sitemap.xml`'i güncelle.
8. Deploy klasörünü doğrula → Netlify'a yayınla.

---

## 1. Sabit bilgiler (değişmez referanslar)

| Şey | Değer |
|-----|-------|
| Supabase projesi | **EmlakPro** · project_id `ofttxfmbhulnpbegliwp` (eu-central-1, ACTIVE) |
| guides tablosu | `public.guides` → ademaslan.com `/rehberler/<slug>` |
| guides `user_id` | `47bf31f3-ee65-4bfe-8152-7804a926849a` (Adem'in kullanıcısı) |
| **Canlı deploy klasörü** | `ademaslan-site-deploy-v5/` ← SADECE BURASI yayınlanır |
| Yayın araçları | `site-yayin-araclari/` |
| Statik üretici | `site-yayin-araclari/build_guide_static.py` |
| İçerik JSON kaynağı | `site-yayin-araclari/data/guides/<slug>.json` |
| Netlify site adı | `polite-entremet-264e1f` → https://ademaslan.com |
| Netlify site_id | `8ccac27c-0099-4607-893d-913c7044280f` |

### ⚠️ Kafa karışıklığını önle
- Klasörde **eski/ölü** site sürümleri var: `ademaslan-website/`, `website-v18/`. **BUNLARA DOKUNMA.**
  Yalnızca `ademaslan-site-deploy-v5/` canlıdır.
- Kök dizindeki `CLAUDE.md` / `AGENTS.md` **CRM uygulamasını** anlatır (React+Vite, Vercel'de).
  Web sitesi (ademaslan.com) ayrı bir statik projedir ve bu dosyada anlatılır.
- `ademaslan-site-deploy-v5/` git'te **takipsiz (untracked)** → Netlify'a git ile değil, **manuel** deploy edilir.

---

## 2. guides tablosu şeması (içerik alanları)

```
slug              text  UNIQUE   → URL: /rehberler/<slug>  (kebab-case, Türkçe karaktersiz)
category          text           → 'bilgi' | 'bolge' | 'alici' | 'soru-cevap'
title             text           → SEO başlığı (soru formatı iyi çalışır)
subtitle          text           → kısa alt başlık / kart açıklaması
district          text|null      → bölge rehberiyse ilçe, değilse null
cover_image_url   text           → kapak görseli (Shorts için maxresdefault thumbnail uygundur)
video_url         text           → YouTube linki (Shorts dahil; otomatik embed'e çevrilir)
gallery           jsonb          → [] (genelde boş)
quick_answer      text           → ★ Google AI/AI Overviews için doğrudan özet cevap (2-5 cümle)
tldr              jsonb          → ["madde", ...] 4-6 kısa çıkarım
body              text (HTML)    → <h2>/<h3>/<ol>/<ul>/<strong> ile yapılandırılmış asıl içerik
related_links     jsonb          → [{"url","label"}, ...] iç linkler
faqs              jsonb          → [{"q","a"}, ...] ★ FAQ schema'ya (JSON-LD) dönüşür
meta_description  text           → ~150-160 karakter
read_minutes      integer        → tahmini okuma süresi (örn. 6)
published         boolean        → true = yayında
```

JSON-LD ve FAQ schema'sı statik üretimde **otomatik** eklenir (`build_guide_static.py`).

---

## 3. SEO + Google AI dostu içerik kuralları

Bunlar her rehberde uygulanır (mevcut EKB ve Rayiç Bedel sayfaları örnek alınabilir):

- **quick_answer** mutlaka olsun → AI Overviews / Gemini bunu doğrudan alıntılar. Net, kendi başına anlamlı.
- **tldr** = taranabilir 4-6 madde.
- **faqs** = gerçek arama sorularıyla birebir eşleşen 5-7 soru (FAQ schema → zengin sonuç).
- **body**: `<h2>`/`<h3>` başlıklarla; soru-cevap mantığı; adım adım işlemler `<ol>` ile.
- **Yerel sinyal**: Çekmeköy / Alemdağ / Nişantepe vurgusu + kapanışta yumuşak CTA (Adem'e ulaşma).
- **slug** kısa, Türkçe karaktersiz, anahtar kelimeli (örn. `rayic-bedel-sorgulama`).
- **meta_description** anahtar kelimeli, 150-160 karakter.
- **İç linkleme**: related_links ile diğer rehberlere/`/projeler`/`/hakkimda`'ya bağla.
- **Doğruluk**: mevzuat/işlem adımlarını yayından önce web'den teyit et (özellikle e-Devlet/vergi/tapu).
- **E-E-A-T**: içerik Adem'in saha deneyimi diliyle, danışman kimliğiyle yazılır.

---

## 4. Adım adım uygulama

### Adım 1 — Video bilgisini al
`mcp__workspace__web_fetch` ile YouTube linkini çek (başlık, açıklama, süre, thumbnail).
Shorts ID'si linkin sonundadır (`/shorts/<ID>`); kapak için `https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`.

### Adım 2 — Konuyu doğrula
`WebSearch` ile güncel bilgiyi teyit et. Belirsiz işlem adımlarını uydurma; resmi yolu yaz.

### Adım 3 — İçeriği üret + SQL hazırla
Mevcut bir kaydı örnek al (format birebir tutarlı olsun):
```sql
-- guides'tan örnek format çek (asistan kendisi çalıştırır)
select * from guides order by created_at desc limit 1;
```
Yeni içerik için `INSERT ... ON CONFLICT (slug) DO UPDATE` üret. **Dollar-quoting (`$g$...$g$`)** kullan
(apostrof kaçışı derdi olmaz). jsonb alanları `'...'::jsonb` olarak ver.
SQL dosyasını çıktı olarak ver → **Adem Supabase SQL Editor'a manuel yapıştırır.**
> Not: Asistan isterse `mcp__9b149971-...__execute_sql` ile DB'yi okuyabilir; ama YAZMA işlemini
> Adem'in manuel yapmasını beklemek varsayılan akıştır ("sen SQL'i hazırla, ben eklerim").

### Adım 4 — Adem "ekledim" dedikten sonra: JSON'u Supabase'den senkronla
DB tek doğru kaynaktır. Güncel satırı çek ve `data/guides/<slug>.json`'a **tek elemanlı liste** olarak yaz:
```sql
select json_build_array(to_jsonb(g)) from (
  select slug,category,title,subtitle,district,cover_image_url,video_url,gallery,
         quick_answer,tldr,body,related_links,faqs,meta_description,read_minutes,published,
         to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SSOF') created_at,
         to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SSOF') updated_at
  from guides where slug='<slug>'
) g;
```
JSON'u Python'la (`json.dump(..., ensure_ascii=False)`) yazmak, elle kaçıştan daha güvenli.

### Adım 5 — Statik sayfayı üret
`build_guide_static.py` yolları **kendi konumuna göre otomatik** çözer (oturum/mount bağımsız).
Doğrudan çalıştır:
```bash
cd <PROJE>/site-yayin-araclari
python3 build_guide_static.py    # → ademaslan-site-deploy-v5/rehberler/<slug>/index.html üretir
```
Üretici yalnızca `published=true` olanları basar; FAQ/Article JSON-LD'yi otomatik ekler.
> Gerekirse yolları çevre değişkeniyle override edebilirsin: `DEPLOY_DIR=... GUIDES_DIR=... python3 build_guide_static.py`

### Adım 6 — Listeleme + anasayfa + sitemap güncelle (STATİK — elle gerekir)
Bu sayfalar dinamik değil; yeni rehber kartını **elle** eklemen gerekir:
- `ademaslan-site-deploy-v5/rehberler.html` → grid'in başına yeni `<a class="guide-card" ...>` kartı ekle.
- `ademaslan-site-deploy-v5/index.html` → anasayfadaki rehber kartını ekle/güncelle (başlık, açıklama, tarih).
- `ademaslan-site-deploy-v5/sitemap.xml` → `<url>` satırı ekle/`lastmod`'u bugüne çek.
Eski başlık/tarih kalıntısı kalmadığını `grep` ile doğrula.

### Adım 7 — Doğrula
```bash
# eski başlık kalıntısı olmamalı; JSON-LD geçerli olmalı; embed olmalı
grep -rl "<slug eski başlık>" ademaslan-site-deploy-v5 || echo temiz
python3 -c "import re,json;h=open('ademaslan-site-deploy-v5/rehberler/<slug>/index.html').read();d=json.loads(re.search(r'ldjson[^>]*>(.*?)</script>',h,re.S).group(1));print(d['@type'],len(d.get('mainEntity',[])))"
```

### Adım 8 — Netlify'a deploy
Site git'e bağlı değil → **manuel deploy**. Netlify MCP `deploy-site` çağrısı, tek kullanımlık
yetkili bir `npx @netlify/mcp ... --proxy-path "..."` komutu döndürür.
- **Sandbox'tan çalışmaz** (ağ kısıtı: `fetch failed`). Komutu **Adem kendi terminalinde** çalıştırır:
  ```bash
  cd ~/emlak-crm-pro/ademaslan-site-deploy-v5
  npx -y @netlify/mcp@latest --site-id 8ccac27c-0099-4607-893d-913c7044280f --proxy-path "<MCP'den gelen token>"
  ```
- Alternatif: Netlify panelinde `polite-entremet-264e1f → Deploys`'a klasörü sürükle-bırak.
- Deploy bitince `get-deploy-for-site` ile `state: ready` doğrula; `web_fetch` ile canlı URL'yi kontrol et.
- (Opsiyonel) Google Search Console'dan yeni URL için "İndeksleme iste".
- **Güvenlik:** proxy-path içindeki token gizlidir; sohbet dışına/halka açık yere yazma.

---

## 5. Hızlı kontrol listesi (her yayın için)

- [ ] Video bilgisi alındı, konu web'den teyit edildi
- [ ] quick_answer + tldr + 5-7 faq + yapılandırılmış body + meta + yerel CTA yazıldı
- [ ] SQL (`ON CONFLICT (slug)`) hazırlandı → Adem ekledi
- [ ] `data/guides/<slug>.json` Supabase'den senkronlandı
- [ ] Statik sayfa üretildi (`/rehberler/<slug>/index.html`)
- [ ] rehberler.html + index.html kartları + sitemap.xml güncellendi
- [ ] Doğrulama (eski kalıntı yok, JSON-LD geçerli, embed var)
- [ ] Netlify deploy `ready` + canlı URL kontrol edildi
```
