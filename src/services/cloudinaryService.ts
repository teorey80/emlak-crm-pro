/**
 * Cloudinary Image Upload Service
 *
 * Unsigned upload kullanır — backend gerekmez, API key gizlenmez.
 * Kurulum:
 *  1. https://cloudinary.com adresinden ücretsiz hesap aç
 *  2. Dashboard → Settings → Upload → "Add upload preset" → Mode: Unsigned
 *  3. .env.local dosyasına ekle:
 *       VITE_CLOUDINARY_CLOUD_NAME=senin_cloud_name
 *       VITE_CLOUDINARY_UPLOAD_PRESET=emlak_unsigned
 *
 * Mevcut Supabase fotoğraflarına dokunulmaz — sadece yeni yüklemeler buraya gider.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export interface CloudinaryUploadResult {
  secureUrl: string;   // https:// CDN URL — DB'ye bu kaydedilir
  publicId: string;    // Silme/dönüştürme için gerekli
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Cloudinary env değişkenleri tanımlı mı?
 * Tanımlı değilse fallback olarak Supabase Storage veya base64 kullanılır.
 */
export function isCloudinaryConfigured(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Görseli yüklemeden önce tarayıcıda küçült/sıkıştır.
 * Telefon fotoğrafları çoğunlukla 5–12MB olur; bu fonksiyon uzun kenarı
 * `maxDimension` pikselle sınırlar ve JPEG olarak yeniden kodlar.
 * Böylece büyük dosyalar reddedilmez, yükleme de hızlanır.
 *
 * Hata olursa veya sıkıştırma faydasızsa orijinal dosya geri döner (güvenli fallback).
 *
 * @param file          Sıkıştırılacak dosya
 * @param maxDimension  İzin verilen en uzun kenar (px) — varsayılan 1920
 * @param quality       JPEG kalitesi 0–1 — varsayılan 0.8
 */
export async function compressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.8
): Promise<File> {
  // GIF ve görsel olmayan dosyalara dokunma
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    // Sıkıştırma faydasız olduysa orijinali koru
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file; // herhangi bir hatada orijinal dosyaya düş
  }
}

/**
 * Tek bir dosyayı Cloudinary'e yükle.
 * @param file      Yüklenecek dosya (File objesi)
 * @param folder    Cloudinary klasörü (örn: "properties", "avatars")
 * @returns         CDN URL'si içeren sonuç objesi
 */
export async function uploadToCloudinary(
  file: File,
  folder = 'emlak-crm'
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary yapılandırılmamış. .env.local dosyasına VITE_CLOUDINARY_CLOUD_NAME ve VITE_CLOUDINARY_UPLOAD_PRESET ekleyin.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET!);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Cloudinary hatası: ${err?.error?.message ?? response.statusText}`);
  }

  const data = await response.json();

  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
    format: data.format as string,
    width: data.width as number,
    height: data.height as number,
    bytes: data.bytes as number,
  };
}

/**
 * Birden fazla dosyayı paralel olarak yükle.
 * Her dosyanın sonucu (başarı veya hata) ayrı ayrı döner.
 *
 * @param files   Yüklenecek dosya listesi
 * @param folder  Cloudinary klasörü
 * @param onProgress  Her başarılı yüklemede çağrılır (URL, dosya indeksi)
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder = 'emlak-crm',
  onProgress?: (url: string, index: number) => void
): Promise<{ url: string; error?: string }[]> {
  const results = await Promise.allSettled(
    files.map((file, idx) =>
      uploadToCloudinary(file, folder).then((res) => {
        onProgress?.(res.secureUrl, idx);
        return res.secureUrl;
      })
    )
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') return { url: result.value };
    return { url: '', error: (result.reason as Error).message };
  });
}
