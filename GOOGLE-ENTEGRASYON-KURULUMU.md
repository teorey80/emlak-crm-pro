# Google Takvim, Görevler, Drive ve Harita kurulumu

CRM kodu ve Supabase `20260925072407_google_workspace.sql` migration'ı hazırdır. Canlı Google bağlantısı için aşağıdaki proje ayarları gereklidir. Gizli değerleri Git'e veya `VITE_` önekli değişkenlere koymayın.

1. Google Cloud Console'da aynı projede **Calendar API**, **Tasks API**, **Drive API**, **Google Picker API**, **Maps JavaScript API** ve **Geocoding API**'yi etkinleştirin. Harita için Google Cloud faturalandırması ve API anahtarı kısıtları gerekebilir.
2. OAuth izin ekranında Takvim etkinlikleri, Görevler ve Drive dosya erişimi izinlerini tanımlayın. Uygulama dış kullanıcılara açılacaksa Google'ın doğrulama gereksinimlerini tamamlayın. Harici uygulama **Testing** durumunda kalırsa bu izinler için yenileme belirteci 7 gün sonra biter; kalıcı kullanım için yayın durumunu üretime taşıyın.
3. **Web application** türünde OAuth istemcisi oluşturun. Yetkili yönlendirme URI'si: `https://emlak-crm-pro-plum.vercel.app/api/google`. Yetkili JavaScript origin: `https://emlak-crm-pro-plum.vercel.app`. Kullanılan başka canlı alan adları varsa origin listesine ekleyin.
4. Vercel `emlak-crm-pro` projesinin **Production** ortamına şunları ekleyin:
   - `GOOGLE_CLIENT_ID`: OAuth istemci kimliği (mevcut `VITE_GOOGLE_CLIENT_ID` ile aynı olabilir)
   - `GOOGLE_CLIENT_SECRET`: OAuth istemci sırrı
   - `GOOGLE_REDIRECT_URI`: `https://emlak-crm-pro-plum.vercel.app/api/google`
   - `APP_ORIGIN`: `https://emlak-crm-pro-plum.vercel.app`
   - `GOOGLE_TOKEN_ENCRYPTION_KEY`: en az 32 rastgele bayttan üretilmiş uzun gizli değer
   - `SUPABASE_SERVICE_ROLE_KEY`: yalnızca Vercel sunucusuna, Supabase proje servis rolü anahtarı
   - `VITE_GOOGLE_API_KEY`: Maps JavaScript, Geocoding ve Picker API'leri için tarayıcı anahtarı; HTTP referrer kısıtını canlı alan adlarıyla sınırlandırın
   - `VITE_GOOGLE_CLIENT_ID` ve `VITE_SUPABASE_URL` mevcut doğru değerlerde kalmalı.
5. Değişkenleri kaydettikten sonra yeni bir Vercel deploy alın. CRM'de **Ayarlar → Google Bağlantısı** üzerinden hesabı bağlayın. `Planlandı` durumunda bir deneme randevusu, bir görev ve bir Drive belgesiyle uçtan uca kontrol yapın.

Google Görevler API'si görev son tarihi için saat bilgisini kabul etmez; saatli randevular Google Takvim'e gönderilir. CRM'de tamamlanan randevular geçmiş etkinlik olarak Takvim'de kalır. CRM'den silinen planlı randevuların Takvim etkinliği de silinir. Google bağlantısı kesilirse CRM kaydı saklanır, kullanıcıya eşitleme hatası gösterilir; müşteri detayında randevu, görev ekranında görev yeniden eşitlenebilir.

Eski Gemini entegrasyonu koddan kaldırıldı. Vercel'deki `VITE_GEMINI_API_KEY` ve `GEMINI_API_KEY` değişkenleri artık kullanılmıyor; Google Cloud'da eski anahtarı iptal edip Vercel'den bu değişkenleri temizleyin.
