// Web İçerikleri → Rehber Formu (Yeni / Düzenle)
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { guidesService, Guide, GuideCategory } from '../../services/guidesService';
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
type LinkItem = { label: string; url: string };

const emptyForm: Partial<Guide> = {
    slug: '',
    category: 'bilgi',
    title: '',
    subtitle: '',
    district: '',
    cover_image_url: '',
    video_url: '',
    gallery: [],
    quick_answer: '',
    tldr: [],
    body: '',
    related_links: [],
    faqs: [],
    meta_description: '',
    read_minutes: 5,
    published: false,
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <label className="block">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        {hint && <span className="block text-xs text-gray-500 dark:text-slate-500 mb-1">{hint}</span>}
        <div className="mt-1">{children}</div>
    </label>
);

const GuideForm: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [form, setForm] = useState<Partial<Guide>>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [slugTouched, setSlugTouched] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        guidesService.getById(id!)
            .then((d) => { if (d) setForm(d); })
            .catch((e) => toast.error(e?.message || 'Yüklenemedi'))
            .finally(() => setLoading(false));
    }, [id, isEdit]);

    const set = <K extends keyof Guide>(key: K, value: Guide[K]) => {
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
    const ImageUpload: React.FC<{ value: string; onChange: (url: string) => void; folder?: string }> = ({ value, onChange, folder = 'guides' }) => {
        const [uploading, setUploading] = useState(false);

        const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!isCloudinaryConfigured()) {
                toast.error('Cloudinary yapılandırılmamış. URL\'i manuel yapıştır veya .env.local\'a env değişkenleri ekle.');
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
                e.target.value = '';
            }
        };

        return (
            <div className="space-y-2">
                {value && (
                    <div className="relative inline-block">
                        <img src={value} alt="" className="h-32 w-auto rounded-lg border border-gray-200 dark:border-slate-700 object-cover" />
                        <button type="button" onClick={() => onChange('')} title="Kaldır"
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button>
                    </div>
                )}
                <div className="flex gap-2 flex-wrap">
                    <input type="text" className={inputCls + ' flex-1 min-w-[200px]'} value={value}
                        onChange={(e) => onChange(e.target.value)} placeholder="URL yapıştır veya aşağıdan dosya seç" />
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

    // Galeri yükleyici — çoklu dosya
    type GalleryItem = { url: string; caption?: string };
    const GalleryUpload: React.FC<{ value: GalleryItem[]; onChange: (v: GalleryItem[]) => void; folder?: string }> = ({ value, onChange, folder = 'guides' }) => {
        const [uploading, setUploading] = useState(false);
        const [progress, setProgress] = useState('');

        const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            if (!isCloudinaryConfigured()) {
                toast.error('Cloudinary yapılandırılmamış. .env.local\'a env değişkenleri ekle.');
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
                if (added.length) onChange([...value, ...added]);
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
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button>
                                <input type="text" value={g.caption || ''} placeholder="Açıklama (opsiyonel)"
                                    onChange={(e) => { const next = [...value]; next[i] = { ...next[i], caption: e.target.value }; onChange(next); }}
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
            </div>
        );
    };

    // Dinamik string-list (TL;DR maddeleri)
    const StringList: React.FC<{ label: string; hint?: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }> = ({ label, hint, values, onChange, placeholder }) => (
        <Field label={label} hint={hint}>
            <div className="space-y-2">
                {values.map((v, i) => (
                    <div key={i} className="flex gap-2">
                        <input className={inputCls} value={v} onChange={(e) => { const next = [...values]; next[i] = e.target.value; onChange(next); }} placeholder={placeholder} />
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

    // İlgili bağlantılar (label + url)
    const LinkList: React.FC<{ values: LinkItem[]; onChange: (v: LinkItem[]) => void }> = ({ values, onChange }) => (
        <Field label="İlgili Bağlantılar" hint="Yazının içinden ilgili proje/rehber sayfalarına bağlantı (iç linkler SEO'ya iyi gelir).">
            <div className="space-y-2">
                {values.map((v, i) => (
                    <div key={i} className="flex gap-2 flex-wrap">
                        <input className={inputCls + ' flex-1 min-w-[140px]'} value={v.label} placeholder="Bağlantı metni"
                            onChange={(e) => { const next = [...values]; next[i] = { ...next[i], label: e.target.value }; onChange(next); }} />
                        <input className={inputCls + ' flex-1 min-w-[180px]'} value={v.url} placeholder="/projeler/nef-camlitepe veya https://..."
                            onChange={(e) => { const next = [...values]; next[i] = { ...next[i], url: e.target.value }; onChange(next); }} />
                        <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...values, { label: '', url: '' }])}
                    className="text-sm text-[#1193d4] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Bağlantı Ekle
                </button>
            </div>
        </Field>
    );

    // SSS
    const FaqList: React.FC<{ values: FaqItem[]; onChange: (v: FaqItem[]) => void }> = ({ values, onChange }) => (
        <Field label="Sık Sorulan Sorular (SSS)" hint="Her soru-cevap, sayfada açılır kutu olur ve FAQ schema üretir — AI aramaları sever.">
            <div className="space-y-3">
                {values.map((v, i) => (
                    <div key={i} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                            <input className={inputCls} value={v.q} placeholder="Soru" onChange={(e) => { const next = [...values]; next[i] = { ...next[i], q: e.target.value }; onChange(next); }} />
                            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea className={`${inputCls} min-h-[60px]`} value={v.a} placeholder="Cevap"
                            onChange={(e) => { const next = [...values]; next[i] = { ...next[i], a: e.target.value }; onChange(next); }} />
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
            toast.error('Başlık ve URL slug zorunlu');
            return;
        }
        setSaving(true);
        try {
            if (isEdit && id) {
                await guidesService.update(id, form);
                toast.success('Güncellendi');
            } else {
                const created = await guidesService.create(form);
                toast.success('Oluşturuldu');
                navigate(`/web-content/guides/${created.id}/edit`);
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
            await guidesService.togglePublish(id, next);
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
                    <Link to="/web-content/guides" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1193d4] mb-2">
                        <ArrowLeft className="w-4 h-4" /> Rehber listesine dön
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {isEdit ? 'Rehberi Düzenle' : 'Yeni Rehber'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Form alanlarını doldur, "Kaydet"e bas, sonra "Yayınla"yı aç. ademaslan.com/rehberler/{form.slug || 'slug'} adresinde görünecek.
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
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Başlık *" hint="Soru biçimi AI aramada güçlüdür (örn. 'Enerji Kimlik Belgesi nasıl sorgulanır?')">
                            <input className={inputCls} value={form.title || ''} onChange={(e) => onTitleChange(e.target.value)}
                                placeholder="Enerji Kimlik Belgesi nasıl sorgulanır?" required />
                        </Field>
                        <Field label="Kategori *">
                            <select className={inputCls} value={form.category || 'bilgi'} onChange={(e) => set('category', e.target.value as GuideCategory)}>
                                <option value="bilgi">Bilgi Rehberi (how-to, mevzuat)</option>
                                <option value="bolge">Bölge Rehberi (Alemdağ, Nişantepe…)</option>
                                <option value="alici">Alıcı Rehberi (ilk ev alma vb.)</option>
                                <option value="soru-cevap">Soru-Cevap</option>
                            </select>
                        </Field>
                    </div>
                    <Field label="URL Slug *" hint="Sayfanın adresinde görünür (ademaslan.com/rehberler/[slug])">
                        <input className={inputCls} value={form.slug || ''}
                            onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
                            placeholder="enerji-kimlik-belgesi-sorgulama" required />
                    </Field>
                    <Field label="Alt Başlık / Kısa Özet" hint="Liste kartında ve sayfa girişinde görünür.">
                        <input className={inputCls} value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)}
                            placeholder="E-Devlet üzerinden EKB sorgulama adımları ve sık yapılan hatalar" />
                    </Field>
                    <Field label="İlçe / Bölge (opsiyonel)" hint="Sadece Bölge Rehberi için doldur (örn. Alemdağ).">
                        <input className={inputCls} value={form.district || ''} onChange={(e) => set('district', e.target.value)} placeholder="Alemdağ" />
                    </Field>
                </section>

                {/* MEDYA */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Medya</h2>
                    <Field label="Kapak Görseli" hint="Sayfa üstündeki ve liste kartındaki görsel.">
                        <ImageUpload value={form.cover_image_url || ''} onChange={(url) => set('cover_image_url', url)} />
                    </Field>
                    <Field label="YouTube Video Linki" hint="İlgili video/reel. Watch URL'i yapıştır; sayfaya otomatik embed olur.">
                        <input className={inputCls} value={form.video_url || ''} onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtu.be/..." />
                    </Field>
                    <Field label="Galeri Fotoğrafları (opsiyonel)">
                        <GalleryUpload value={(form.gallery || []) as { url: string; caption?: string }[]} onChange={(v) => set('gallery', v)} />
                    </Field>
                </section>

                {/* İÇERİK */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">İçerik</h2>
                    <Field label="Hızlı Cevap (Özet)" hint="2-3 cümle. Sayfanın başında kutu olarak gösterilir. Google AI Overviews bunu alıntılar.">
                        <textarea className={`${inputCls} min-h-[100px]`} value={form.quick_answer || ''} onChange={(e) => set('quick_answer', e.target.value)} />
                    </Field>
                    <StringList label="Önemli Çıkarımlar (TL;DR)" hint="3-4 madde. AI'ların doğrudan alıntıladığı özet." values={(form.tldr || []) as string[]} onChange={(v) => set('tldr', v)} placeholder="Bir madde..." />
                    <Field label="İçerik (Ana Metin)" hint="Asıl yazı. HTML kullanabilirsin (başlık için <h3>, kalın için <strong>, liste için <ul><li>). Paragrafları boş satırla ayır.">
                        <textarea className={`${inputCls} min-h-[300px] font-mono text-sm`} value={form.body || ''} onChange={(e) => set('body', e.target.value)} />
                    </Field>
                    <LinkList values={(form.related_links || []) as LinkItem[]} onChange={(v) => set('related_links', v)} />
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
                        <input type="number" className={inputCls} value={form.read_minutes || 5} onChange={(e) => set('read_minutes', parseInt(e.target.value) || 5)} />
                    </Field>
                </section>
            </div>

            {/* Sabit alt buton bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 flex justify-end gap-2 z-30">
                <Link to="/web-content/guides" className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg">
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

export default GuideForm;
