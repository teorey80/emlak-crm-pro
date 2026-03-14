import React, { useState, useEffect } from 'react';
import { FileText, Youtube, Calculator, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, ArrowLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../../context/DataContext';
import {
  BlogPost, listBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost
} from '../../services/blogService';
import {
  YoutubeVideo, listVideos, createVideo, updateVideo, deleteVideo, extractYouTubeId, getYouTubeThumbnail
} from '../../services/videoService';
import MortgageCalculator from '../../components/calculators/MortgageCalculator';
import GainTaxCalculator from '../../components/calculators/GainTaxCalculator';
import RentYieldCalculator from '../../components/calculators/RentYieldCalculator';
import TapuFeeCalculator from '../../components/calculators/TapuFeeCalculator';

type Tab = 'blog' | 'videos' | 'tools';

// ─── Blog Form ─────────────────────────────────────────────────────────────────
const BlogFormModal: React.FC<{
  post?: BlogPost;
  userId: string;
  onSave: (post: BlogPost) => void;
  onClose: () => void;
}> = ({ post, userId, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<BlogPost>>({
    title: post?.title || '',
    summary: post?.summary || '',
    content: post?.content || '',
    cover_image_url: post?.cover_image_url || '',
    tags: post?.tags || [],
    published: post?.published || false,
    user_id: userId,
  });
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState((post?.tags || []).join(', '));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Başlık zorunlu'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      } as BlogPost;

      let result: BlogPost | null;
      if (post?.id) {
        result = await updateBlogPost(post.id, data);
      } else {
        result = await createBlogPost({ ...data, user_id: userId } as any);
      }
      if (result) {
        toast.success(post?.id ? 'Blog yazısı güncellendi.' : 'Blog yazısı oluşturuldu.');
        onSave(result);
      }
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {post?.id ? '✏️ Blog Yazısı Düzenle' : '📝 Yeni Blog Yazısı'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Başlık *</label>
            <input type="text" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Blog yazısı başlığı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Özet</label>
            <textarea rows={2} value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
              placeholder="Kısa özet (liste görünümünde gösterilir)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İçerik</label>
            <textarea rows={8} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none font-mono"
              placeholder="Blog içeriği..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kapak Görseli URL</label>
            <input type="url" value={form.cover_image_url || ''} onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Etiketler</label>
            <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Emlak, Yatırım, İstanbul (virgülle ayırın)" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.published || false} onChange={e => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 rounded accent-sky-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Yayınla (Web sitesinde görünsün)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#1193d4] text-white rounded-xl text-sm font-medium hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Video Form ────────────────────────────────────────────────────────────────
const VideoFormModal: React.FC<{
  video?: YoutubeVideo;
  userId: string;
  onSave: (v: YoutubeVideo) => void;
  onClose: () => void;
}> = ({ video, userId, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<YoutubeVideo>>({
    title: video?.title || '',
    youtube_url: video?.youtube_url || '',
    description: video?.description || '',
    published: video?.published || false,
    display_order: video?.display_order || 0,
    user_id: userId,
  });
  const [saving, setSaving] = useState(false);

  const previewId = form.youtube_url ? extractYouTubeId(form.youtube_url) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.youtube_url?.trim()) { toast.error('Başlık ve URL zorunlu'); return; }
    setSaving(true);
    try {
      let result: YoutubeVideo | null;
      if (video?.id) {
        result = await updateVideo(video.id, form as any);
      } else {
        result = await createVideo({ ...form, user_id: userId } as any);
      }
      if (result) {
        toast.success(video?.id ? 'Video güncellendi.' : 'Video eklendi.');
        onSave(result);
      }
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {video?.id ? '✏️ Video Düzenle' : '🎬 Video Ekle'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">YouTube URL *</label>
            <input type="url" required value={form.youtube_url || ''} onChange={e => setForm({ ...form, youtube_url: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          {previewId && (
            <div className="rounded-xl overflow-hidden aspect-video bg-black">
              <img src={getYouTubeThumbnail(previewId)} alt="Önizleme" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Başlık *</label>
            <input type="text" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Video başlığı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Açıklama</label>
            <textarea rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              placeholder="Video açıklaması" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sıra</label>
            <input type="number" min={0} value={form.display_order || 0} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
              className="w-24 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.published || false} onChange={e => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 rounded accent-red-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Yayınla (Web sitesinde görünsün)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────
const ContentManager: React.FC = () => {
  const { userProfile, session } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | undefined>();
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YoutubeVideo | undefined>();

  const userId = session?.user?.id || '';

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([listBlogPosts(userId), listVideos(userId)]).then(([posts, vids]) => {
      setBlogPosts(posts);
      setVideos(vids);
      setLoading(false);
    });
  }, [userId]);

  const handleBlogSave = (post: BlogPost) => {
    setBlogPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = post; return next; }
      return [post, ...prev];
    });
    setShowBlogForm(false);
    setEditingBlog(undefined);
  };

  const handleBlogDelete = async (id: string) => {
    if (!confirm('Bu blog yazısını silmek istiyor musunuz?')) return;
    await deleteBlogPost(id);
    setBlogPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Blog yazısı silindi.');
  };

  const handleVideoSave = (video: YoutubeVideo) => {
    setVideos(prev => {
      const idx = prev.findIndex(v => v.id === video.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = video; return next; }
      return [video, ...prev];
    });
    setShowVideoForm(false);
    setEditingVideo(undefined);
  };

  const handleVideoDelete = async (id: string) => {
    if (!confirm('Bu videoyu silmek istiyor musunuz?')) return;
    await deleteVideo(id);
    setVideos(prev => prev.filter(v => v.id !== id));
    toast.success('Video silindi.');
  };

  const tabs = [
    { id: 'blog' as Tab, label: 'Blog Yazıları', icon: FileText, count: blogPosts.length },
    { id: 'videos' as Tab, label: 'YouTube Videoları', icon: Youtube, count: videos.length },
    { id: 'tools' as Tab, label: 'Hesaplama Araçları', icon: Calculator, count: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">🌐 İçerik Yönetimi</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Web sitenizin blog yazıları, videoları ve araçlarını yönetin.
          </p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-[#1193d4] text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Blog Sekmesi */}
      {activeTab === 'blog' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingBlog(undefined); setShowBlogForm(true); }}
              className="flex items-center gap-2 bg-[#1193d4] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Blog Yazısı
            </button>
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
          ) : blogPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-10 text-center">
              <FileText className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400 font-medium">Henüz blog yazısı yok.</p>
              <p className="text-xs text-gray-400 mt-1">SEO için blog yazıları ekleyin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blogPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex items-center gap-4">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${post.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700'}`}>
                        {post.published ? '🟢 Yayında' : '⚫ Taslak'}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-white mt-0.5 truncate">{post.title}</p>
                    {post.summary && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{post.summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setEditingBlog(post); setShowBlogForm(true); }}
                      className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 hover:text-blue-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleBlogDelete(post.id)}
                      className="p-1.5 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Sekmesi */}
      {activeTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingVideo(undefined); setShowVideoForm(true); }}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Video Ekle
            </button>
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
          ) : videos.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-10 text-center">
              <Youtube className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400 font-medium">Henüz video yok.</p>
              <p className="text-xs text-gray-400 mt-1">YouTube videolarınızı web sitenizde gösterin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => (
                <div key={video.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  {video.youtube_id ? (
                    <img src={getYouTubeThumbnail(video.youtube_id)} alt={video.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                      <Youtube className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${video.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {video.published ? '🟢 Yayında' : '⚫ Taslak'}
                      </span>
                      <span className="text-[10px] text-gray-400">Sıra: {video.display_order}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{video.title}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { setEditingVideo(video); setShowVideoForm(true); }}
                        className="flex-1 py-1.5 bg-gray-50 dark:bg-slate-700 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 flex items-center justify-center gap-1">
                        <Pencil className="w-3 h-3" /> Düzenle
                      </button>
                      <button onClick={() => handleVideoDelete(video.id)}
                        className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hesaplama Araçları */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300">
            💡 Bu araçlar web sitenizin "Hesaplamalar" bölümünde ziyaretçilerinize otomatik gösterilir. Değişiklik gerekmez.
          </div>
          <MortgageCalculator />
          <GainTaxCalculator />
          <RentYieldCalculator />
          <TapuFeeCalculator />
        </div>
      )}

      {/* Modaller */}
      {showBlogForm && (
        <BlogFormModal
          post={editingBlog}
          userId={userId}
          onSave={handleBlogSave}
          onClose={() => { setShowBlogForm(false); setEditingBlog(undefined); }}
        />
      )}
      {showVideoForm && (
        <VideoFormModal
          video={editingVideo}
          userId={userId}
          onSave={handleVideoSave}
          onClose={() => { setShowVideoForm(false); setEditingVideo(undefined); }}
        />
      )}
    </div>
  );
};

export default ContentManager;
