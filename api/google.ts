import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

function settings() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const appOrigin = process.env.APP_ORIGIN;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const encryptionSecret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !redirectUri || !appOrigin || !supabaseUrl || !serviceKey || !encryptionSecret) {
    throw new Error('Google bağlantısı sunucu ayarları tamamlanmamış.');
  }
  if (!/^https?:\/\//.test(redirectUri) || !/^https?:\/\//.test(appOrigin)) throw new Error('Google yönlendirme adresi geçersiz.');
  return { clientId, clientSecret, redirectUri, appOrigin, supabaseUrl, serviceKey, encryptionSecret };
}

function encrypt(value: string, secret: string) {
  const iv = randomBytes(12);
  const key = createHash('sha256').update(secret).digest();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decrypt(value: string, secret: string) {
  const [iv, tag, data] = value.split('.');
  if (!iv || !tag || !data) throw new Error('Google bağlantı bilgisi okunamadı.');
  const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

async function googleToken(body: URLSearchParams) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  const result = await response.json() as { access_token?: string; refresh_token?: string; scope?: string; error?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error || 'Google oturumu yenilenemedi. Bağlantıyı yeniden kurun.');
  return result;
}

async function googleFetch(token: string, url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google API ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response;
}

function calendarEventId(activityId: string) {
  return `crm${createHash('sha256').update(activityId).digest('hex').slice(0, 32)}`;
}

export default async function handler(request: Request) {
  try {
    const cfg = settings();
    const admin = createClient(cfg.supabaseUrl, cfg.serviceKey, { auth: { persistSession: false } });
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (request.method === 'GET' && (action === 'callback' || url.searchParams.has('code') || url.searchParams.has('error'))) {
      const state = url.searchParams.get('state') || '';
      const [payload, signature] = state.split('.');
      if (!payload || !signature) return respond({ error: 'Google bağlantı doğrulaması eksik.' }, 400);
      const expected = createHmac('sha256', cfg.encryptionSecret).update(payload).digest('base64url');
      if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return respond({ error: 'Google bağlantı doğrulaması başarısız.' }, 400);
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId: string; issued: number };
      if (!parsed.userId || Date.now() - parsed.issued > 10 * 60 * 1000 || parsed.issued > Date.now()) return respond({ error: 'Google bağlantısının süresi doldu.' }, 400);
      const code = url.searchParams.get('code');
      if (!code) return Response.redirect(`${cfg.appOrigin}/#/settings?google=denied`, 302);
      const token = await googleToken(new URLSearchParams({ code, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri, grant_type: 'authorization_code' }));
      if (!token.refresh_token) throw new Error('Google yenileme izni alınamadı. Hesabı kaldırıp yeniden bağlayın.');
      const profileResponse = await googleFetch(token.access_token!, 'https://www.googleapis.com/oauth2/v2/userinfo');
      const profile = await profileResponse.json() as { email?: string };
      if (!profile.email) throw new Error('Google e-posta adresi okunamadı.');
      const { error } = await admin.from('google_connections').upsert({
        user_id: parsed.userId, email: profile.email,
        refresh_token_encrypted: encrypt(token.refresh_token, cfg.encryptionSecret),
        scopes: token.scope || scopes, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      return Response.redirect(`${cfg.appOrigin}/#/settings?google=connected`, 302);
    }

    const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) return respond({ error: 'Oturum gerekli.' }, 401);
    const { data: auth, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !auth.user) return respond({ error: 'Oturum geçersiz.' }, 401);
    const userId = auth.user.id;

    if (request.method === 'GET' && action === 'connect') {
      const payload = Buffer.from(JSON.stringify({ userId, issued: Date.now(), nonce: randomBytes(16).toString('hex') })).toString('base64url');
      const signature = createHmac('sha256', cfg.encryptionSecret).update(payload).digest('base64url');
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.search = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: scopes, state: `${payload}.${signature}` }).toString();
      return respond({ url: authUrl.toString() });
    }

    if (request.method === 'GET' && action === 'status') {
      const { data, error } = await admin.from('google_connections').select('email,scopes,connected_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return respond({ connected: !!data, email: data?.email || null, scopes: data?.scopes || '' });
    }

    if (request.method === 'DELETE' && action === 'disconnect') {
      const { data } = await admin.from('google_connections').select('refresh_token_encrypted').eq('user_id', userId).maybeSingle();
      if (data) {
        const refreshToken = decrypt(data.refresh_token_encrypted, cfg.encryptionSecret);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' }).catch(() => undefined);
        const { error } = await admin.from('google_connections').delete().eq('user_id', userId);
        if (error) throw error;
      }
      return respond({ disconnected: true });
    }

    const { data: connection, error: connectionError } = await admin.from('google_connections').select('refresh_token_encrypted').eq('user_id', userId).maybeSingle();
    if (connectionError) throw connectionError;
    if (!connection) return respond({ error: 'Google hesabınızı Ayarlar sayfasından bağlayın.' }, 409);
    const refreshed = await googleToken(new URLSearchParams({
      refresh_token: decrypt(connection.refresh_token_encrypted, cfg.encryptionSecret),
      client_id: cfg.clientId, client_secret: cfg.clientSecret, grant_type: 'refresh_token',
    }));
    const token = refreshed.access_token!;
    if (refreshed.refresh_token) {
      const { error: rotateError } = await admin.from('google_connections')
        .update({ refresh_token_encrypted: encrypt(refreshed.refresh_token, cfg.encryptionSecret), updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (rotateError) throw rotateError;
    }

    if (request.method === 'GET' && action === 'drive-token') return respond({ accessToken: token });
    if (request.method !== 'POST') return respond({ error: 'İşlem desteklenmiyor.' }, 405);
    const body = await request.json() as Record<string, unknown>;

    if (action === 'calendar-upsert') {
      const activityId = String(body.activityId || '');
      const date = String(body.date || '');
      const time = String(body.time || '');
      if (!activityId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return respond({ error: 'Randevu tarihi veya saati geçersiz.' }, 400);
      const { data: activity, error } = await admin.from('activities').select('id,user_id,date,time,status').eq('id', activityId).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (!activity || activity.date !== date || String(activity.time || '').slice(0, 5) !== time || activity.status !== 'Planlandı') return respond({ error: 'Randevu kaydı bulunamadı.' }, 403);
      const start = `${date}T${time}:00`;
      const event = {
        id: calendarEventId(activityId), summary: String(body.title || 'Emlak CRM randevusu').slice(0, 255),
        description: String(body.description || '').slice(0, 5000),
        start: { dateTime: start, timeZone: 'Europe/Istanbul' },
        end: { dateTime: new Date(new Date(`${start}+03:00`).getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'Europe/Istanbul' },
      };
      const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      let response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
      if (response.status === 409) response = await fetch(`${endpoint}/${event.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
      if (!response.ok) throw new Error(`Google Takvim ${response.status}: ${(await response.text()).slice(0, 300)}`);
      return respond({ eventId: event.id });
    }

    if (action === 'calendar-delete') {
      const activityId = String(body.activityId || '');
      if (!activityId) return respond({ error: 'Aktivite gerekli.' }, 400);
      const endpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId(activityId)}`;
      const response = await fetch(endpoint, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok && response.status !== 404 && response.status !== 410) throw new Error(`Google Takvim ${response.status}`);
      return respond({ deleted: true });
    }

    if (action === 'task-sync') {
      const taskId = String(body.taskId || '');
      const { data: task, error } = await admin.from('crm_tasks').select('*').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (!task) return respond({ error: 'Görev bulunamadı.' }, 404);
      const resource = { title: task.title, notes: task.notes, due: task.due_date ? `${task.due_date}T00:00:00.000Z` : undefined, status: task.completed ? 'completed' : 'needsAction' };
      const endpoint = `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks${task.google_task_id ? `/${encodeURIComponent(task.google_task_id)}` : ''}`;
      const response = await googleFetch(token, endpoint, { method: task.google_task_id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resource) });
      const googleTask = await response.json() as { id: string };
      const { error: updateError } = await admin.from('crm_tasks').update({ google_task_id: googleTask.id, sync_error: null, updated_at: new Date().toISOString() }).eq('id', taskId).eq('user_id', userId);
      if (updateError) throw updateError;
      return respond({ googleTaskId: googleTask.id });
    }

    if (action === 'task-delete') {
      const googleTaskId = String(body.googleTaskId || '');
      if (!googleTaskId) return respond({ deleted: true });
      // A task may only be deleted after its CRM owner is verified by row ownership.
      const taskId = String(body.taskId || '');
      const { data: task } = await admin.from('crm_tasks').select('google_task_id').eq('id', taskId).eq('user_id', userId).maybeSingle();
      if (!task || task.google_task_id !== googleTaskId) return respond({ error: 'Görev bulunamadı.' }, 403);
      const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(googleTaskId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok && response.status !== 404) throw new Error(`Google Görevler ${response.status}`);
      return respond({ deleted: true });
    }
    return respond({ error: 'İşlem desteklenmiyor.' }, 404);
  } catch (error) {
    console.error('Google integration error:', error);
    return respond({ error: error instanceof Error ? error.message : 'Google işlemi başarısız.' }, 500);
  }
}
