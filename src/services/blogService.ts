import { supabase } from './supabaseClient';

export interface BlogPost {
  id: string;
  user_id: string;
  office_id?: string;
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  cover_image_url?: string;
  tags?: string[];
  published: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Tüm blog yazılarını listele (yönetim için)
export async function listBlogPosts(userId: string): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[blogService] listBlogPosts error:', error.message);
    return [];
  }
  return data || [];
}

// Yayınlanan blog yazılarını listele (web sitesi için)
export async function listPublishedBlogPosts(userId: string): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,title,slug,summary,cover_image_url,tags,published_at,created_at')
    .eq('user_id', userId)
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[blogService] listPublishedBlogPosts error:', error.message);
    return [];
  }
  return data || [];
}

// Tekil blog yazısı (slug ile)
export async function getBlogPostBySlug(userId: string, slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) return null;
  return data;
}

// Blog yazısı oluştur
export async function createBlogPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...post,
      published_at: post.published ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    console.error('[blogService] createBlogPost error:', error.message);
    throw error;
  }
  return data;
}

// Blog yazısı güncelle
export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
    // Yayınlanıyorsa published_at set et
    ...(updates.published && !updates.published_at ? { published_at: new Date().toISOString() } : {}),
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[blogService] updateBlogPost error:', error.message);
    throw error;
  }
  return data;
}

// Blog yazısı sil
export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) {
    console.error('[blogService] deleteBlogPost error:', error.message);
    throw error;
  }
}
