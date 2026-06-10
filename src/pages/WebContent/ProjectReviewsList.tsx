// Web İçerikleri → Proje İncelemeleri listesi
// ademaslan.com/projeler altındaki proje sayfalarını yönetir
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, EyeOff, Edit3, Trash2, ExternalLink, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectReviewsService, ProjectReview } from '../../services/projectReviewsService';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    hazir: { label: 'Hazır', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    insaat: { label: 'İnşaatta', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    yeni: { label: 'Yeni', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

const ProjectReviewsList: React.FC = () => {
    const [items, setItems] = useState<ProjectReview[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const list = await projectReviewsService.list();
            setItems(list);
        } catch (e: any) {
            toast.error('Yüklenirken hata: ' + (e?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const togglePublish = async (item: ProjectReview) => {
        const next = !item.published;
        try {
            await projectReviewsService.togglePublish(item.id, next);
            toast.success(next ? 'Yayınlandı — ademaslan.com\'da görünür' : 'Taslağa alındı');
            load();
        } catch (e: any) {
            toast.error('Hata: ' + (e?.message || ''));
        }
    };

    const remove = async (item: ProjectReview) => {
        if (!confirm(`"${item.title}" silinsin mi? Bu işlem geri alınamaz.`)) return;
        try {
            await projectReviewsService.remove(item.id);
            toast.success('Silindi');
            load();
        } catch (e: any) {
            toast.error('Hata: ' + (e?.message || ''));
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-1">
                        <Newspaper className="w-4 h-4" />
                        <span>Web İçerikleri</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Proje İncelemeleri</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        ademaslan.com/projeler sayfasında görünecek proje incelemelerini yönet.
                    </p>
                </div>
                <Link
                    to="/web-content/projects/new"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Proje Ekle
                </Link>
            </div>

            {/* Liste */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-500 dark:text-slate-400">Yükleniyor...</div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center">
                        <Newspaper className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Henüz proje incelemesi yok</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                            "Yeni Proje Ekle" ile ilk incelemeni oluştur, ademaslan.com/projeler sayfasında otomatik görünsün.
                        </p>
                        <Link
                            to="/web-content/projects/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                        >
                            <Plus className="w-4 h-4" /> İlk Projeyi Ekle
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                <th className="p-4">Proje</th>
                                <th className="p-4">Geliştirici</th>
                                <th className="p-4">Bölge</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4">Yayın</th>
                                <th className="p-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {items.map((item) => {
                                const badge = STATUS_BADGE[item.status_tag || 'hazir'] || STATUS_BADGE.hazir;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">/{item.slug}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 dark:text-slate-300">{item.developer || '—'}</td>
                                        <td className="p-4 text-sm text-gray-700 dark:text-slate-300">
                                            {item.district || '—'}
                                            {item.neighborhood && (
                                                <span className="text-gray-400 dark:text-slate-500"> · {item.neighborhood}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {item.published ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <Eye className="w-3.5 h-3.5" /> Yayında
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-slate-500">
                                                    <EyeOff className="w-3.5 h-3.5" /> Taslak
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.published && (
                                                    <a
                                                        href={`https://ademaslan.com/projeler/${item.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                                                        title="Sitede aç"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => togglePublish(item)}
                                                    className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 ${item.published ? 'text-emerald-600' : 'text-gray-400'}`}
                                                    title={item.published ? 'Taslağa al' : 'Yayınla'}
                                                >
                                                    {item.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                                <Link
                                                    to={`/web-content/projects/${item.id}/edit`}
                                                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-[#1193d4]"
                                                    title="Düzenle"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => remove(item)}
                                                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Bilgi notu */}
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
                <strong>İpucu:</strong> Bir projeyi "Yayınla" durumuna aldığında ademaslan.com/projeler sayfasında otomatik görünür.
                Site veriyi build sırasında çeker — değişikliklerin canlıya yansıması 30 saniye sürer.
            </p>
        </div>
    );
};

export default ProjectReviewsList;
