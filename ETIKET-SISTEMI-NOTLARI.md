# Ortak etiket sistemi — 23 Eylül 2026

Durum: Etiket migration'ı 23 Eylül 2026'da canlı Supabase projesine uygulandı ve erişim kuralları doğrulandı. Uygulama kodu `c3971b9` olarak GitHub `main` dalına gönderildi. Hem `emlak-crm-pro` hem `emlak-crm-pro-temp` Vercel üretim dağıtımları aynı commit için READY durumunda.

## Kullanım

- Müşteri, portföy, aktivite, talep ve takip kartlarında aynı renkleri kullanan etiketler görünür.
- Etikete tıklamak `/tags` ekranını açar. Diğer etiketleri ekleyerek arama daraltılır; sonuç türü sekmeleri aynı filtreyi korur.
- Örnek: Yer gösterimi yapıldı + Nef Çamlıtepe + 3+1. Bir müşterinin ayrı görüşmelerindeki site, oda ve işlem bilgileri karıştırılmaz. Planlanmış ve durumu belirsiz gösterimler tamamlananlardan ayrıdır.
- Aynı gruptaki seçenekler alternatiftir; farklı gruplar ve her özel etiket birlikte aranır.
- Etiket düğmelerindeki sayılar etikete sahip toplam görünür kayıt sayısıdır. Sonuç sekmelerindeki sayılar seçilen birleşime aittir.
- Otomatik etiketler kaynak alanlardan üretilir. Özel etiketler karttaki açılır düzenleyiciden eklenir/kaldırılır. İlişkili kayıttan gelen özel etiketin silme düğmesi gösterilmez.
- Portföy, talep, FSBO ve bağımsız aktivite formlarında ortak site seçicisi kullanılır. Site Yönetimi'ndeki site etiketi ilgili kayıtları açar.
- FSBO kartında müşteri bağlantısı seçilebilir; bu bağlantı aynı kişinin takip kartlarında ve eski aramaların etiket aramasında kullanılır.
- Arama veritabanında yapılır; ilk 50 kayıtla sınırlı değildir. Sonuçlar 30'ar yüklenir, eski kayıt detayları gerektiğinde ayrı sorguyla açılır.

## Veri ve erişim

`supabase/migrations/20260923080503_crm_connected_tags.sql`:

- Ortak site/oda alanları, takip kişisi–müşteri bağlantısı, kişisel özel etiket tabloları ve arama RPC'leri.
- Mevcut kaynak tabloların RLS kuralları geçerlidir; hiçbir fonksiyon SECURITY DEFINER kullanmaz. Yeni tablolar ve arama yalnız authenticated rolüne açıktır.
- Eski site adları yalnız aynı kullanıcıya ait tek ve tam normalize eşleşme varsa bağlanır. Belirsiz isimler korunur; kullanıcı ilgili formdan site seçebilir. Otomatik yaklaşık birleştirme yoktur.
- Eski kişi bağlantısı yalnız aynı kullanıcı + tek eşleşen ad ve telefonla kurulabilir.
- Bağlı siteyi silmek veritabanınca engellenir; hata halinde arayüzden kaybolmaz. Müşteri silinirse takip kişisinin bağlantısı boşaltılır, takip geçmişi korunur.

## Doğrulama

- `npm run build`: başarılı; mevcut büyük paket/dinamik import uyarıları devam ediyor.
- `npm run test:tags`: 4 başarılı senaryo.
- `npm run test:prospecting`: 15 başarılı senaryo.
- `src/utils/tags.database.test.sql`: boş, yerel PostgreSQL 15 veritabanında çalıştırıldı. Migration kurulumunu, görüşme bağlamlarını, 50 üstü sayfalamayı, Türkçe normalizasyonu, eski veri eşleştirmeyi, FSBO tekrar gönderimini, sonradan müşteri bağlamayı, sürüm çakışmasını, özel etiket sahipliğini ve başka kullanıcının veri/etiket erişimini sınar. Canlıda çalıştırılmamalıdır; kendi kurgusal şemasını kurar.
- Tarayıcı: üçlü filtre, sonuç türü değiştirme, portföy bağlantısı, geri dönüş ve 65 örnek kaydın yüklenmesi doğrulandı. Dar panelde etiket seçeneklerini gizleyerek sonuçlara yer açılabilir. Önceki prospecting-preview görüşme ve yeni FSBO pencereleri de açıldı.
- TypeScript kontrolü mevcut HEAD ile karşılaştırıldı: dosya/hata kodu/adet bazında yeni hata yok. Projenin mevcut Google Drive, React tipleri, örnek veriler ve Deno dosyalarındaki hatalar nedeniyle genel `tsc --noEmit` temiz değil.
- 3.000 kurgusal müşteri + 3.000 görüşme ile yerel sorgu ölçümleri yaklaşık 2,6–3,2 saniye. Bu canlı performans ölçümü değildir. Çok uzun geçmişi olan kayıtlar büyük etiket yanıtları üretebilir; kullanımda izlenmeli.

## Deneme

`npm run dev -- --host 127.0.0.1 --port 4178 --strictPort`

`http://127.0.0.1:4178/tag-preview.html#/tags`

Bu ekran örnek veri kullanır. Tam uygulamada yeni kayıt ve etiket yazma işlemleri canlıya geçiş sonrası oturumla doğrulanmalıdır. Mac yeniden başlayınca yerel sunucu yeniden açılmalıdır.

## Yayına geçiş sırası

1. Canlı migration geçmişi doğrulandı. Bu klasörde başka işler ve farklı numara formatlarında eski migration'lar var; tüm bekleyen migration'lar topluca gönderilmemeli.
2. Yalnız bu özelliğe ait migration uygulandı, API erişim kontrolü doğrulandı.
3. Frontend yayınlandı. Yeni müşteri bağlantısı sütunu frontend tarafından beklendiğinden veritabanı adımı önce tamamlandı.
4. Gerçek oturumla site seçimi, özel etiket ekleme/kaldırma, FSBO bağlantısı ve üçlü filtre hâlâ kullanım sırasında kontrol edilmelidir. Test verisi veya müşteri listesi kaynak koduna eklenmedi.

Bu çalışma günlük rapor bağlantısı/otomasyon sorununun giderildiği anlamına gelmez; rapor bağlantısı ayrı konudur.
