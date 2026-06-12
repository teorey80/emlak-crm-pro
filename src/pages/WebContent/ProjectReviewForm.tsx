// Web İçerikleri → Proje İncelemesi Formu (Yeni / Düzenle)
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, X, Eye, EyeOff, Newspaper, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectReviewsService, ProjectReview } from '../../services/projectReviewsService';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../services/cloudinaryService';

// Türkçe karakterleri ASCII slug'a çevirir
function slugify(s: string): string {
    return s.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

type FaqItem = { q: string; a: string };
type ProsItem = string;

const emptyForm: Partial<ProjectReview> = {
    slug: '',
    title: '',
    developer: '',
    district: '',
    neighborhood: '',
    status_tag: 'hazir',
    delivery_date: '',
    price_range: '',
    unit_types: '',
    dues_info: '',
    hero_image_url: '',
    gallery: [],
    video_url: '',
    sahibinden_url: '',
    quick_answer: '',
    location_intro: '',
    distances: [],
    description: '',
    pros: [],
    cons: [],
    investment_notes: '',
    post_delivery: '',
    adem_opinion: '',
    faqs: [],
    meta_description: '',
    read_minutes: 10,
    published: false,
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <label className="block">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        {hint && <span className="block text-xs text-gray-500 dark:text-slate-500 mb-1">{hint}</span>}
        <div className="mt-1">{children}</div>
    </label>
);

const ProjectReviewForm: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<ProjectReview>>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [slugTouched, setSlugTouched] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        projectReviewsService.getById(id!)
            .then((d) => { if (d) setForm(d); })
            .catch((e) => toast.error(e?.message || 'Yüklenemedi'))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    const set = <K extends keyof ProjectReview>(key: K, value: ProjectReview[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const onTitleChange = (v: string) => {
        set('title', v);
        if (!slugTouched && !isEdit) {
            set('slug', slugify(v));
        }
    };

    const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1193d4]';

    // Görsel yükleyici — Cloudinary'a upload + URL yapıştırma desteği
    const ImageUpload: React.FC<{ value: string; onChange: (url: string) => void; folder?: string }> = ({ value, onChange, folder = 'project-reviews' }) => {
        const [uploading, setUploading] = useState(false);

        const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!isCloudinaryConfigured()) {
                toast.error('Cloudinary yapılandırılmamış. URL\'i manuel yapıştır veya .env.local\'a VITE_CLOUDINARY_CLOUD_NAME ve VITE_CLOUDINARY_UPLOAD_PRESET ekle.');
                return;
            }
            setUploading(true);
            try {
                const result = await uploadToCloudinary(file, folder);
                onChange(result.secureUrl);
                toast.success('Görsel yüklendi');
            } catch (err: any) {
                toast.error('Upload hatası: ' + (err?.message || ''));
            } finally {
                setUploading(false);
                e.target.value = ''; // aynı dosyayı tekrar seçebilmek için
            }
        };

        return (
            <div className="space-y-2">
                {value && (
                    <div className="relative inline-block">
                        <img src={value} alt="" className="h-32 w-auto rounded-lg border border-gray-200 dark:border-slate-700 object-cover" />
                        <button type="button" onClick={() => onChange('')}
                            title="Kaldır"
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            ×
                        </button>
                    </div>
                )}
                <div className="flex gap-2 flex-wrap">
                    <input type="text" className={inputCls + ' flex-1 min-w-[200px]'} value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="URL yapıştır veya aşağıdan dosya seç" />
                    <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg cursor-pointer flex items-center gap-2 whitespace-nowrap">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Yükleniyor...' : 'Dosya Seç'}
                        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
                    </label>
                </div>
                {!isCloudinaryConfigured() && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Cloudinary kurulumu için <code className="bg-amber-50 dark:bg-amber-900/30 px-1 rounded">.env.local</code> dosyasına env değişkenleri ekle.
                    </p>
                )}
            </div>
        );
    };

    // Galeri yükleyici — çoklu dosya seçimi, her biri Cloudinary'a yüklenir
    type GalleryItem = { url: string; caption?: string };
    const GalleryUpload: React.FC<{ value: GalleryItem[]; onChange: (v: GalleryItem[]) => void; folder?: string }> = ({ value, onChange, folder = 'project-reviews' }) => {
        const [uploading, setUploading] = useState(false);
        const [progress, setProgress] = useState('');

        const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            if (!isCloudinaryConfigured()) {
                toast.error('Cloudinary yapılandırılmamış. .env.local\'a VITE_CLOUDINARY_CLOUD_NAME ve VITE_CLOUDINARY_UPLOAD_PRESET ekle.');
                return;
            }
            setUploading(true);
            const added: GalleryItem[] = [];
            try {
                for (let i = 0; i < files.length; i++) {
                    setProgress(`${i + 1}/${files.length} yükleniyor...`);
                    const result = await uploadToCloudinary(files[i], folder);
                    added.push({ url: result.secureUrl, caption: '' });
                }
                onChange([...value, ...added]);
                toast.success(`${added.length} görsel yüklendi`);
            } catch (err: any) {
                if (added.length) onChange([...value, ...added]); // yüklenenleri kaybetme
                toast.error('Upload hatası: ' + (err?.message || ''));
            } finally {
                setUploading(false);
                setProgress('');
                e.target.value = '';
            }
        };

        return (
            <div className="space-y-3">
                {value.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {value.map((g, i) => (
                            <div key={i} className="relative group">
                                <img src={g.url} alt="" className="h-28 w-full rounded-lg border border-gray-200 dark:border-slate-700 object-cover" />
                                <button type="button" title="Kaldır"
                                    onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                    ×
                                </button>
                                <input type="text" value={g.caption || ''} placeholder="Açıklama (opsiyonel)"
                                    onChange={(e) => {
                                        const next = [...value]; next[i] = { ...next[i], caption: e.target.value }; onChange(next);
                                    }}
                                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200" />
                            </div>
                        ))}
                    </div>
                )}
                <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {uploading ? progress || 'Yükleniyor...' : 'Fotoğraf Seç (çoklu seçim yapabilirsin)'}
                    <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-500">İpucu: Dosya penceresinde Cmd (⌘) tuşuna basılı tutarak birden fazla fotoğraf seçebilirsin.</p>
            </div>
        );
    };

    // Dinamik string-list helper (pros, cons)
    const StringList: React.FC<{ label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }> = ({ label, values, onChange, placeholder }) => (
        <Field label={label}>
            <div className="space-y-2">
                {values.map((v, i) => (
                    <div key={i} className="flex gap-2">
                        <input className={inputCls} value={v} onChange={(e) => {
                            const next = [...values]; next[i] = e.target.value; onChange(next);
                        }} placeholder={placeholder} />
                        <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...values, ''])}
                    className="text-sm text-[#1193d4] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ekle
                </button>
            </div>
        </Field>
    );

    // Dinamik FAQ list
    const FaqList: React.FC<{ values: FaqItem[]; onChange: (v: FaqItem[]) => void }> = ({ values, onChange }) => (
        <Field label="Sık Sorulan Sorular (SSS)">
            <div className="space-y-3">
                {values.map((v, i) => (
                    <div key={i} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                            <input className={inputCls} value={v.q} placeholder="Soru" onChange={(e) => {
                                const next = [...values]; next[i] = { ...next[i], q: e.target.value }; onChange(next);
                            }} />
                            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea className={`${inputCls} min-h-[60px]`} value={v.a} placeholder="Cevap"
                            onChange={(e) => {
                                const next = [...values]; next[i] = { ...next[i], a: e.target.value }; onChange(next);
                            }} />
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...values, { q: '', a: '' }])}
                    className="text-sm text-[#1193d4] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Soru Ekle
                </button>
            </div>
        </Field>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title?.trim() || !form.slug?.trim()) {
            toast.error('Proje adı ve URL slug zorunlu');
            return;
        }
        setSaving(true);
        try {
            if (isEdit && id) {
                await projectReviewsService.update(id, form);
                toast.success('Güncellendi');
            } else {
                const created = await projectReviewsService.create(form);
                toast.success('Oluşturuldu');
                navigate(`/web-content/projects/${created.id}/edit`);
                return;
            }
        } catch (err: any) {
            toast.error('Kaydetme hatası: ' + (err?.message || ''));
        } finally {
            setSaving(false);
        }
    };

    const handlePublishToggle = async () => {
        if (!isEdit || !id) {
            toast.error('Önce kaydet, sonra yayınla');
            return;
        }
        const next = !form.published;
        try {
            await projectReviewsService.togglePublish(id, next);
            set('published', next);
            toast.success(next ? 'Yayınlandı' : 'Taslağa alındı');
        } catch (e: any) {
            toast.error(e?.message || 'Hata');
        }
    };

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

    return (
        <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto pb-32">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <Link to="/web-content/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1193d4] mb-2">
                        <ArrowLeft className="w-4 h-4" /> Proje listesine dön
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {isEdit ? 'Projeyi Düzenle' : 'Yeni Proje İncelemesi'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Form alanlarını doldur, "Kaydet" e bas, sonra "Yayınla"yı aç. ademaslan.com/projeler/{form.slug || 'slug'} adresinde görünecek.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handlePublishToggle}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${form.published
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {form.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {form.published ? 'Yayında' : 'Taslak'}
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-60">
                        <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* TEMEL */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Temel Bilgiler</h2>
                    <Field label="Proje Adı *">
                        <input className={inputCls} value={form.title || ''} onChange={(e) => onTitleChange(e.target.value)}
                            placeholder="Örn. Birbahçe Evleri" required />
                    </Field>
                    <Field label="URL Slug *" hint="Sayfanın adresinde görünür (ademaslan.com/projeler/[slug])">
                        <input className={inputCls} value={form.slug || ''}
                            onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
                            placeholder="birbahce-evleri" required />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Geliştirici">
                            <input className={inputCls} value={form.developer || ''} onChange={(e) => set('developer', e.target.value)} placeholder="Birleşim Grup" />
                        </Field>
                        <Field label="Durum">
                            <select className={inputCls} value={form.status_tag || 'hazir'} onChange={(e) => set('status_tag', e.target.value as any)}>
                                <option value="hazir">Hazır (Teslim Edilmiş)</option>
                                <option value="insaat">İnşaatta</option>
                                <option value="yeni">Yeni / Lansman</option>
                            </select>
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="İlçe">
                            <input className={inputCls} value={form.district || ''} onChange={(e) => set('district', e.target.value)} placeholder="Çekmeköy" />
                        </Field>
                        <Field label="Mahalle / Bölge">
                            <input className={inputCls} value={form.neighborhood || ''} onChange={(e) => set('neighborhood', e.target.value)} placeholder="Alemdağ Ormanı yanı" />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Teslim Tarihi">
                            <input className={inputCls} value={form.delivery_date || ''} onChange={(e) => set('delivery_date', e.target.value)} placeholder="2020 (Oturulan)" />
                        </Field>
                        <Field label="Fiyat Aralığı">
                            <input className={inputCls} value={form.price_range || ''} onChange={(e) => set('price_range', e.target.value)} placeholder="İletişim veya 6,2–13 M ₺" />
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Daire Tipleri">
                            <input className={inputCls} value={form.unit_types || ''} onChange={(e) => set('unit_types', e.target.value)} placeholder="1+1 · 2+1 · 3+1 · 4+1 · 5+1" />
                        </Field>
                        <Field label="Aidat Bilgisi">
                            <input className={inputCls} value={form.dues_info || ''} onChange={(e) => set('dues_info', e.target.value)} placeholder="Orta-üst bant" />
                        </Field>
                    </div>
                </section>

                {/* MEDYA */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Medya</h2>
                    <Field label="Hero Görseli" hint="Sayfa üstündeki büyük görsel. Bilgisayardan yükle veya URL yapıştır.">
                        <ImageUpload value={form.hero_image_url || ''} onChange={(url) => set('hero_image_url', url)} />
                    </Field>
                    <Field label="YouTube Video Linki" hint="Watch URL'i yapıştır (jv66EZrUduo formatı). Sayfaya otomatik embed olur.">
                        <input className={inputCls} value={form.video_url || ''} onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtu.be/jv66EZrUduo" />
                    </Field>
                    <Field label="Galeri Fotoğrafları" hint="Site içi, sosyal donatı, daire fotoğrafları. Sitede 'Galeri' bölümünde görünür.">
                        <GalleryUpload value={(form.gallery || []) as { url: string; caption?: string }[]} onChange={(v) => set('gallery', v)} />
                    </Field>
                    <Field label="Sahibinden İlanları Linki" hint="Projenin sahibinden.com ilan listesi sayfası. Her Pazartesi otomatik okunur; ortalama fiyat ve kira verileri sitedeki Yatırım bölümüne işlenir.">
                        <input className={inputCls} value={form.sahibinden_url || ''} onChange={(e) => set('sahibinden_url', e.target.value)} placeholder="https://www.sahibinden.com/emlak-konut/..." />
                    </Field>
                </section>

                {/* İÇERİK */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Hızlı Cevap ve İçerik</h2>
                    <Field label="Hızlı Cevap (Özet)" hint="2-3 cümle. Sayfanın başında kutu olarak gösterilir. Google AI Overviews bunu alıntılar.">
                        <textarea className={`${inputCls} min-h-[100px]`} value={form.quick_answer || ''} onChange={(e) => set('quick_answer', e.target.value)} />
                    </Field>
                    <Field label="Konum Analizi (Giriş Paragrafı)">
                        <textarea className={`${inputCls} min-h-[100px]`} value={form.location_intro || ''} onChange={(e) => set('location_intro', e.target.value)} />
                    </Field>
                    <Field label="Açıklama (Uzun Metin)" hint="Markdown destekler. Paragrafları boş satırla ayır.">
                        <textarea className={`${inputCls} min-h-[200px]`} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
                    </Field>
                    <Field label="Site İçi Yaşam / Teslim Sonrası">
                        <textarea className={`${inputCls} min-h-[120px]`} value={form.post_delivery || ''} onChange={(e) => set('post_delivery', e.target.value)} />
                    </Field>
                    <Field label="Yatırım Notları">
                        <textarea className={`${inputCls} min-h-[100px]`} value={form.investment_notes || ''} onChange={(e) => set('investment_notes', e.target.value)} />
                    </Field>
                    <Field label="Adem'in Görüşü" hint="Birinci tekil şahıs. Sahada gezdiğin notlardan.">
                        <textarea className={`${inputCls} min-h-[120px]`} value={form.adem_opinion || ''} onChange={(e) => set('adem_opinion', e.target.value)} />
                    </Field>
                </section>

                {/* ARTILAR / EKSİLER */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4 grid grid-cols-2 gap-4">
                    <StringList label="Artılar" values={(form.pros || []) as string[]} onChange={(v) => set('pros', v)} placeholder="Bir madde..." />
                    <StringList label="Eksiler" values={(form.cons || []) as string[]} onChange={(v) => set('cons', v)} placeholder="Bir madde..." />
                </section>

                {/* SSS */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                    <FaqList values={(form.faqs || []) as FaqItem[]} onChange={(v) => set('faqs', v)} />
                </section>

                {/* SEO */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">SEO</h2>
                    <Field label="Meta Description" hint="Google arama sonuçlarında görünen 1-2 cümle (140-160 karakter ideal)">
                        <textarea className={`${inputCls} min-h-[80px]`} value={form.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} />
                    </Field>
                    <Field label="Tahmini Okuma Süresi (dakika)">
                        <input type="number" className={inputCls} value={form.read_minutes || 10} onChange={(e) => set('read_minutes', parseInt(e.target.value) || 10)} />
                    </Field>
                </section>
            </div>

            {/* Sabit alt buton bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 flex justify-end gap-2 z-30">
                <Link to="/web-content/projects" className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg">
                    İptal
                </Link>
                <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-60">
                    <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </form>
    );
};

export default ProjectReviewForm;
