# Portföy Takibi — ilk sürüm

17 Eylül 2026. Canlı Supabase kurulumu ve Vercel production yayını tamamlandı. Canlı sürüm: 7ee559fea3b3354ac6f6fd144dd3f46244e2795c. Müşteri verisi aktarımı yapılmadı.

## Kullanım

- Menü: **Portföy Takibi** (`/#/prospecting`).
- **Bugün:** geciken, bugüne planlanan ve tarih bekleyen açık süreçler.
- **Kanban:** Aranacak → Takipte → Portföy görüşmesi → Yetkilendirme.
- **Veri havuzu:** henüz üzerinde çalışılmaya başlanmamış kayıtlar.
- **Bekleyen / kapanan:** başka danışmandaki, ileri tarihe bırakılmış, kazanılmış, pasif ve arama dışı kayıtlar.
- Kart açma veya sürükleme, not + aşama + tarihli sonraki adım panelini açar.
- Ulaşılamadı sonucu aşamayı korur. Sadece takip planla seçeneği görüşme yapılmış gibi kaydedilmez.
- Portföye dönüştü, kazanım sürecini tamamlar; ayrıca ilan/satış oluşturmaz.
- Aranmasın tercihi aynı kullanıcıdaki aynı telefonla eşleşen kayıtların takiplerini de durdurur.
- Arama, yüklenen ilk 50 kayıtla sınırlı değildir. Tüm sayfalar alınır; kişi, telefon, site, blok, daire, eski notlar ve kaynak bilgilerinde arama yapılır.

## Kaynak ve aktarım

Kaynak: kullanıcı tarafından paylaşılan **Kanban Nef** Google E-Tablosu.

- `CRM_Kayitlar`: kayıt kimliği, malik, telefon, güncel aşama, iletişim tercihi, işlem türü, kaynak notları.
- `CRM_Gorusmeler`: tarih/özet/aşaması tamamlanmış görüşmeler. Saati bilinmeyen eski görüşmeler yalnızca tarih olarak gösterilir.
- `Rapor`: kayıt bağlantısının işaret ettiği satırdaki daire bilgileri ve kaynak tarihleri. Eski aşama açıklaması metadata olarak korunur; güncel aşamanın üzerine yazılmaz.
- Gemini'nin rapor, özet ve görsel pano sayfaları içeri alınmaz. Kullanım durumundan satış niyeti çıkarılmaz. Kiracı/diğer kişi telefonları malik telefonu yerine kullanılmaz.

Hazırlanan aktarım dosyası repo dışındadır; kişisel bilgiler commit edilmemelidir:

`/Users/ademaslan/.codex/visualizations/2026/09/17/01a0ae69-4379-75f0-94e9-97a19a93e8f3/nef-crm-aktarim.json`

Doğrulanmış içerik: 477 daire/süreç kaydı, 197 kaynak notu, 2 tarihli görüşme, 4 arama dışı kişi. Aynı ad ve normalize telefon eşleşmelerinden 449 kişi kaydı oluşur; daire kayıtları birleştirilmez. 8 kayıt kontrol notu taşır (6 mükerrer daire satırı, 1 eksik telefon, 1 eksik görüşme taslağı).

İlk deneme seçimi: kontrol uyarısı ve iletişim yasağı olmayan 30 kayıt: 2 portföy görüşmesi, 5 takip, 11 başka emlakçıda, 12 aranacak. Seçim aktarım önizlemesinde değiştirilebilir.

Kaynak tablo ID + kaynak kayıt ID birleşimi, tekrar aktarımda mevcut kayıtların atlanmasını sağlar. Yeniden aktarım mevcut aşamayı veya yeni notları değiştirmez. Bu sürümde Google E-Tablo ile sürekli senkronizasyon yoktur; tek seferlik aktarım vardır.

## Uygulama dosyaları

- `src/pages/Prospecting.tsx`: çalışma alanı ve görünüm filtreleri.
- `src/components/ProspectConversation.tsx`: görüşme, planlama, tarih ve geçmiş paneli.
- `src/components/ProspectImport.tsx`: dosya okuma, önizleme, ilk deneme ve aktarım.
- `src/services/prospectingService.ts`: mevcut Supabase client üzerinden sayfalama ve RPC.
- `src/utils/prospecting.ts`: Türkçe arama, telefon/tarih işlemleri, CSV/JSON kontrolü.
- `src/types.ts`, `src/App.tsx`, `src/components/Sidebar.tsx`: modeller, rota ve menü.
- `supabase/migrations/41_prospecting_workflow.sql`: kişi, süreç, geçmiş tabloları; RLS ve atomik RPC'ler.
- `prospecting-preview.html`, `src/pages/ProspectingPreview.tsx`: yalnızca geliştirme ortamında örnek veriyle çalışan deneme. Üretim derleme girişine eklenmez.

Mevcut DataContext, müşteri/portföy tabloları, bunların RLS politikaları ve abonelik limitleri değiştirilmedi. Yeni potansiyel kişi kayıtları mevcut müşteri kayıtlarına otomatik birleştirilmez.

## Doğrulama

- `npm run test:prospecting`: CSV, Türkçe arama, telefon biçimleri, İstanbul tarihleri, geciken işler, veri doğrulama ve tekrar önizleme kontrolleri.
- `supabase/prospecting_workflow.test.sql`: izole yerel PostgreSQL'de çalıştırıldı. Kaynak ID tekrarları, aynı kişinin farklı daireleri, atomik kaydetme, işlem tekrarı, eski sürümle yazma engeli, tarih zorunluluğu, iletişim yasağı, aynı ofisteki farklı kullanıcıların izolasyonu ve anonim erişim reddi sınandı. Test transaction'ı geri alınır.
- 477 gerçek kaynak kaydının tamamı yalnızca geçici yerel veritabanında denenip geri alındı. Tekrar aktarımda 477 kayıt atlandı, yeni kayıt oluşmadı.
- Tarayıcıda örnek veriyle ekran yüklenmesi, kart açma, not kaydetme, aşama değişimi, geçmiş, arama dışına alma, arama ve 390px mobil görünüm sınandı.
- Üretim derlemesi geçiyor. Projede bu değişiklikten önce bulunan 29 TypeScript hatası devam ediyor; bu çalışma yeni tip hatası eklemiyor. Canlı oturumdan 30 kayıt aktarımı, yenileme sonrası kalıcılık, kaynak etiketi, eski görüşme filtresi ve geçmiş paneli doğrulandı. Gerçek kişilere deneme görüşmesi eklenmedi.

## Canlıya alma sırası

1. Yalnız bu modülün değişikliklerini gözden geçir. Çalışma ağacındaki diğer işler bu kapsama dahil değildir.
2. Yeni migration 41'i hedef CRM projesine uygula; migration 40 veya diğer bekleyen dosyaları topluca uygulama.
3. Uygulamayı yayınla; oturum açmış kullanıcının Portföy Takibi ekranında boş listeyi ve erişim kurallarını doğrula.
4. Kullanıcının kendi oturumundan hazırlanmış dosyanın önizlemesini açıp ilk deneme için 30 kaydı seç. Başka bir kullanıcı kimliği veya ayrıcalıklı anahtarla kişisel sahiplik atama.
5. Gerçek bir görüşme + takip tarihini kaydet; sayfa yenilemede, günlük listede ve geçmişte doğrula.

Kaynak Google E-Tablosu değiştirilmedi. İlk 30 kayıt canlıya aktarıldı; kalan 447 kayıt henüz aktarılmadı.


## 17 Eylül canlı yayın sonucu

- Migration 41, Supabase `prospecting_workflow` adıyla uygulandı. Üç tabloda RLS açık, anon SELECT kapalı; iki RPC SECURITY INVOKER ve anonim EXECUTE kapalı.
- Vercel production: `dpl_EQaJPv8VH6Hw7xe4KUnfe6f3aFgU`, READY. URL: https://emlak-crm-pro-plum.vercel.app/#/prospecting
- Yayınlanan kod ağacı yerel doğrulanmış ağaçla birebir aynı. Dokuz test ve üretim derlemesi geçti.
- Ana düğme metni “İçeri aktar” olarak düzeltildi.
- Canlı giriş sayfası doğrulandı. Google girişi mevcut OAuth istemcisinin silindiğini bildiriyor: `401 deleted_client`. Bu yüzden oturum açılmış canlı ekran ve gerçek veri aktarımı henüz doğrulanamadı. E-posta/şifre girişi kullanıcı tarafından tamamlanmalı veya Google OAuth bağlantısı ayrıca onarılmalı.
- Gerçek müşteri verileri GitHub'a gönderilmedi. İlk 30 kayıt aktarımı bekliyor; SQL ile kullanıcı taklidi yapılarak aktarım yapılmadı.
- 09.00 Takip aracı CRM ve Kanban okumaya hazır. 08.00 Günlük özet otomatik kaydı kalıcı olmadığından kullanıcıya güncelleme kartı sunuldu; iki raporun da tamamlandığı varsayılmamalı.


## 17 Eylül kaynak ayrımı ve ilk aktarım tamamlandı

- Kaynak ve görüşme durumu düzenlemesi yayınlandı: commit `d137b6a99d4685134dfd7b420050fd3133a8fe69`.
- Kullanıcının fiilen kullandığı canlı adres: https://emlak-crm-pro-temp.vercel.app/#/prospecting . Bu Vercel projesi de aynı GitHub main dalından yayınlanıyor; deployment `dpl_3YuGwAxKYFVFegSukkfm9gcejg1R` READY.
- Kullanıcının açık Chrome oturumundan, normal dosya seçiciyle ilk 30 kayıt aktarıldı. Ek tarayıcı izni verilmedi. Ayrıcalıklı SQL ile veri yazılmadı.
- Canlı doğrulama: 30 prospecting_cases, 2 eski görüşme (`outcome=import`), 0 yeni CRM görüşmesi. Mevcut müşteriler 88 olarak korundu. 447 kaynak kayıt sonraki aktarımı bekliyor.
- Kaynak etiketi kalıcı: Liste aktarımı · Kanban Nef · 17 Eylül 2026. CRM'de gerçek görüşme kaydedilince ayrıca CRM’de görüşüldü görünür. Kaynak notu, plan ve ulaşılamayan arama gerçek görüşme sayılmaz.
- Görüşme durumu filtresi ve detay geçmişi canlıda doğrulandı; sayfa yenilendikten sonra kayıtlar duruyor. Tüm 30 kayıtta takip tarihi eksik olduğundan Tarih bekleyen bölümündeler; tarih uydurulmadı.
- Mevcut Müşteriler ekranındaki eski kayıtların giriş biçimi bilinmediğinden otomatik olarak Manuel etiketi verilmedi. Yeni liste kayıtları Portföy Takibi’nde ayrı tutuluyor.
- 13 test ve üretim derlemesi geçti. Önceden var olan 29 TypeScript hatası bu değişiklikten bağımsız.
- Günlük rapor durumu değişmedi: 09.00 Takip hazır; 08.00 Günlük özet kalıcı güncellemesi henüz doğrulanmadı.


## 17 Eylül tam liste aktarımı

- Kullanıcı 30 dışındaki daireleri de aramak istediğini belirtti; önceki müşteri aktarımı izni kapsamında kalan 447 kayıt kendi Chrome oturumundan aktarıldı.
- Canlı Portföy Takibi: 477 kayıt, 4 arama dışı, 8 veri kontrol uyarısı. UI sonucu 447 kayıt aktarıldı, yeniden önizlemede 477 zaten aktarılmış. Kullanıcının A4 araması 9 sonuç getiriyor.
- FSBO değerlendirmesi: ActivityForm şu anda yalnızca tarih/tip/açıklama/durum kaydediyor; gelecekteki takip için ayrı bağlı alan yok. Prospecting görüşme+sonraki adım+tarih altyapısı uygun, ancak yeni FSBO kartı girişi ve eski aktiviteden takip kartına bağlantı henüz uygulanmadı. Öneri: kaynak FSBO, ilan bağlantısı, kişi/telefon, satılık-kiralık, aşama ve sıradaki tarih; aynı kişinin farklı ilanları ayrı süreç; eski aktiviteler korunarak seçilen kayıt kartla ilişkilendirilmeli.


## 17 Eylül FSBO uygulaması

- Yeni FSBO / takip formu: manuel/FSBO kaynağı, kanal, ilan bağlantısı, konum/blok/daire, satılık/kiralık, sonuç, not, aşama ve zorunlu ileri tarihli takip.
- Aktiviteler listesinde gelen/giden arama satırlarından Portföy takibine al bağlantısı. Eski aktivite RLS ile okunur; kullanıcı aynı kişiye ait mevcut kartı seçebilir veya yeni taşınmaz kartı açabilir. Eski aktivite kopyası geçmişte korunur; yeni konuşma sayılmaz. Eski asıl aktivite değiştirilmez.
- Kaynak filtresi: Tüm kaynaklar / Liste datası / FSBO / Manuel-diğer. Liste kayıtları mevcut kaynaklarını korur.
- Migration 42 canlıda prospecting_fsbo adıyla uygulandı. SECURITY INVOKER start RPC; anonim erişim kapalı; link tablosunda RLS ve kullanıcı sahipliği kontrolü.
- Yerel izole DB'de eski workflow testleri ve yeni FSBO testleri geçti: işlem tekrarları, aynı kişinin farklı daireleri, aktivite bağlantısı tekrarı, eski notun korunması, tarih zorunluluğu, eski sürüm engeli, çapraz kullanıcı engeli ve aynı telefona iletişim yasağı.
- 14 yardımcı test, üretim derlemesi geçti. Önceden bulunan 29 TypeScript hatası sürüyor; değişen dosyalarda yeni hata yok. Tarayıcıda sentetik FSBO görüşmesi/takip oluşturma ve kartın geçmişi doğrulandı.
- Kaynak kodu main commit 596c1f0da6ce5b2ca9c2e2375532df8ceeb78c1f; müşteri verisi yayınlanmadı. Temp Vercel deployment dpl_CTUjvz4nC8VJubb4xAPFUpJcg153 READY; emlak-crm-pro-temp.vercel.app production alias doğrulandı.
- Eski aramaların tamamı otomatik FSBO sayılmadı; kullanıcı istediği aramayı kartına bağlar. Gerçek müşterilere test amaçlı görüşme/plan yazılmadı.

- 18 Eylül canlı son kontrol: Yeni FSBO formu ve kaynak filtresi açıldı. Gerçek eski bir Giden Arama üzerinden bağlantı ekranı arama notunu ve kişiyi doğru yükledi, aynı telefona ait mevcut daire kartını seçenek olarak gösterdi. Mevcut kart seçimi de doğrulandı; gerçek kayda değişiklik kaydedilmedi. Son ekranda 477 kayıt ve 4 arama dışı korundu.
