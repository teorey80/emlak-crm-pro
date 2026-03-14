// NetGSM SMS Service
// Türkiye'nin önde gelen SMS sağlayıcısı NetGSM entegrasyonu
// API Dokümantasyonu: https://www.netgsm.com.tr/entegrasyon/

export interface SMSResult {
  success: boolean;
  code: string;
  message: string;
  sentCount?: number;
  failedCount?: number;
}

export interface SMSBatchResult {
  total: number;
  sent: SMSResult[];
  failed: { phone: string; error: string }[];
}

// NetGSM API'si CORS nedeniyle doğrudan tarayıcıdan çağrılamaz.
// Bu nedenle bir Vercel Edge Function üzerinden proxy yapılması gerekir.
// Şimdilik: SMS kuyruğunu localStorage'a kaydeder ve kullanıcıya bilgi verir.

const NETGSM_PROXY_URL = '/api/sms'; // Vercel serverless function

/**
 * Tek bir telefon numarasına SMS gönderir
 * Numarayı otomatik normalize eder: 05xx -> 905xx
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Sadece rakamları al
  const digits = phone.replace(/\D/g, '');

  // 05xxxxxxxxx -> 905xxxxxxxxx
  if (digits.startsWith('05') && digits.length === 11) {
    return '9' + digits;
  }
  // 5xxxxxxxxx -> 905xxxxxxxxx
  if (digits.startsWith('5') && digits.length === 10) {
    return '90' + digits;
  }
  // Zaten 905xxxxxxxxx
  if (digits.startsWith('905') && digits.length === 12) {
    return digits;
  }

  return digits;
}

/**
 * WhatsApp deep link oluşturur
 * wa.me formatı: https://wa.me/905xxxxxxxxx?text=Mesaj
 */
export function createWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = normalizePhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

/**
 * NetGSM API ile SMS gönderir (Vercel proxy üzerinden)
 * NOT: Vercel API route kurulmadan bu fonksiyon çalışmaz.
 * Ayarlarda NetGSM kullanıcı adı ve şifre girilmesi gerekir.
 */
export async function sendNetGSMSms(
  phones: string[],
  message: string,
  netgsmUser: string,
  netgsmPassword: string,
  header?: string
): Promise<SMSBatchResult> {
  const normalizedPhones = phones.map(normalizePhone).filter(p => p.length >= 10);

  if (normalizedPhones.length === 0) {
    return { total: 0, sent: [], failed: [{ phone: 'none', error: 'Geçerli telefon numarası bulunamadı' }] };
  }

  try {
    const response = await fetch(NETGSM_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: netgsmUser,
        password: netgsmPassword,
        phones: normalizedPhones,
        message,
        header: header || 'BILGI',
        encoding: 'TR'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result as SMSBatchResult;
  } catch (error: any) {
    // Proxy kurulmamışsa hata mesajı döndür
    const errorMsg = error?.message || 'Bilinmeyen hata';
    return {
      total: normalizedPhones.length,
      sent: [],
      failed: normalizedPhones.map(p => ({
        phone: p,
        error: `Bağlantı hatası: ${errorMsg}. SMS API endpoint'i kurulumunu tamamlayın.`
      }))
    };
  }
}

/**
 * NetGSM kimlik bilgileri doğrulama testi
 */
export async function testNetGSMCredentials(user: string, password: string): Promise<{ valid: boolean; message: string }> {
  try {
    const result = await sendNetGSMSms(
      ['905000000000'], // Test numarası
      'Test mesajı',
      user,
      password
    );
    // Eğer 00 veya 01 kodu gelirse başarılı
    if (result.sent.some(s => s.code === '00' || s.code === '01')) {
      return { valid: true, message: 'NetGSM kimlik bilgileri doğrulandı' };
    }
    return { valid: false, message: 'Geçersiz NetGSM kimlik bilgileri' };
  } catch {
    return { valid: false, message: 'NetGSM bağlantı hatası - API endpoint kurulumunu kontrol edin' };
  }
}

/**
 * SMS şablonlarına değişken yerleştirir
 * {{isim}}, {{tarih}}, {{adres}} gibi
 */
export function applyTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// Hazır mesaj şablonları
export const MESSAGE_TEMPLATES = [
  {
    id: 'bayram_genel',
    name: '🎉 Bayram Tebriği (Genel)',
    text: 'Sayın {{isim}}, bu özel günde sizi ve sevdiklerinizi kutlar, sağlık ve mutluluk dolu bir bayram geçirmenizi dilerim. Saygılarımla, {{danismanAdi}}'
  },
  {
    id: 'ramazan_bayrami',
    name: '🌙 Ramazan Bayramı',
    text: 'Sayın {{isim}}, Ramazan Bayramınızı en içten dileklerimle kutlarım. Sağlık, mutluluk ve huzur dolu günler dilerim. {{danismanAdi}} - Emlak Danışmanınız'
  },
  {
    id: 'kurban_bayrami',
    name: '🐏 Kurban Bayramı',
    text: 'Sayın {{isim}}, Kurban Bayramınızı tebrik eder, hayırlı ve bereketli bir bayram geçirmenizi dilerim. {{danismanAdi}} - Emlak Danışmanınız'
  },
  {
    id: 'yilbasi',
    name: '🎊 Yılbaşı Kutlaması',
    text: 'Sayın {{isim}}, Yeni Yılınızı kutlarım! Sağlık, mutluluk ve başarı dolu bir yıl diliyorum. {{danismanAdi}} - Emlak Danışmanınız'
  },
  {
    id: 'genel_tesekkur',
    name: '🤝 Genel Teşekkür',
    text: 'Sayın {{isim}}, bize duyduğunuz güven için teşekkür ederim. İlerideki emlak ihtiyaçlarınızda da yanınızda olmaktan mutluluk duyarım. {{danismanAdi}}'
  }
];
