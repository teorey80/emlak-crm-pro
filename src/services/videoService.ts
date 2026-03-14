import { supabase } from './supabaseClient';

export interface YoutubeVideo {
  id: string;
  user_id: string;
  office_id?: string;
  title: string;
  youtube_url: string;
  youtube_id?: string;     // URL'den çıkarılan video ID
  description?: string;
  published: boolean;
  display_order: number;
  created_at?: string;
}

// YouTube URL'inden video ID çıkar
// Desteklenen formatlar:
//   https://www.youtube.com/watch?v=VIDEO_ID
//   https://youtu.be/VIDEO_ID
//   https://www.youtube.com/embed/VIDEO_ID
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// YouTube thumbnail URL'i oluştur
export function getYouTubeThumbnail(youtubeId: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string {
  const qualityMap = { default: 'default', hq: 'hqdefault', maxres: 'maxresdefault' };
  return `https://img.youtube.com/vi/${youtubeId}/${qualityMap[quality]}.jpg`;
}

// Embed URL oluştur
export function getYouTubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}`;
}

// Tüm videoları listele (yönetim için)
export async function listVideos(userId: string): Promise<YoutubeVideo[]> {
  const { data, error } = await supabase
    .from('youtube_videos')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[videoService] listVideos error:', error.message);
    return [];
  }
  return data || [];
}

// Yayınlanan videoları listele (web sitesi için)
export async function listPublishedVideos(userId: string): Promise<YoutubeVideo[]> {
  const { data, error } = await supabase
    .from('youtube_videos')
    .select('*')
    .eq('user_id', userId)
    .eq('published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[videoService] listPublishedVideos error:', error.message);
    return [];
  }
  return data || [];
}

// Video ekle
export async function createVideo(video: Omit<YoutubeVideo, 'id' | 'created_at'>): Promise<YoutubeVideo | null> {
  const youtubeId = extractYouTubeId(video.youtube_url);
  const { data, error } = await supabase
    .from('youtube_videos')
    .insert({ ...video, youtube_id: youtubeId || video.youtube_id })
    .select()
    .single();

  if (error) {
    console.error('[videoService] createVideo error:', error.message);
    throw error;
  }
  return data;
}

// Video güncelle
export async function updateVideo(id: string, updates: Partial<YoutubeVideo>): Promise<YoutubeVideo | null> {
  const youtubeId = updates.youtube_url ? extractYouTubeId(updates.youtube_url) : undefined;
  const { data, error } = await supabase
    .from('youtube_videos')
    .update({ ...updates, ...(youtubeId ? { youtube_id: youtubeId } : {}) })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[videoService] updateVideo error:', error.message);
    throw error;
  }
  return data;
}

// Video sil
export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase.from('youtube_videos').delete().eq('id', id);
  if (error) {
    console.error('[videoService] deleteVideo error:', error.message);
    throw error;
  }
}

// Sıralama güncelle (sürükle-bırak için)
export async function updateVideoOrder(videos: { id: string; display_order: number }[]): Promise<void> {
  for (const v of videos) {
    await supabase.from('youtube_videos').update({ display_order: v.display_order }).eq('id', v.id);
  }
}
