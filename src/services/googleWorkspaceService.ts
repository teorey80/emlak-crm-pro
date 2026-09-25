import { supabase } from './supabaseClient';
import type { Activity } from '../types';

export interface GoogleConnectionStatus {
  connected: boolean;
  email: string | null;
  scopes: string;
}

async function googleRequest<T>(action: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', payload?: unknown): Promise<T> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('CRM oturumu bulunamadı.');
  const response = await fetch(`/api/google?action=${encodeURIComponent(action)}`, {
    method,
    headers: { Authorization: `Bearer ${session.access_token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
  });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || 'Google bağlantısı çalışmadı.');
  return result;
}

export const getGoogleStatus = () => googleRequest<GoogleConnectionStatus>('status');
export const getGoogleConnectUrl = async () => (await googleRequest<{ url: string }>('connect')).url;
export const disconnectGoogle = () => googleRequest<{ disconnected: boolean }>('disconnect', 'DELETE');
export const getGoogleDriveToken = async () => (await googleRequest<{ accessToken: string }>('drive-token')).accessToken;

export async function syncCalendarActivity(activity: Activity) {
  if (activity.status !== 'Planlandı' || !activity.date || !activity.time) {
    return googleRequest<{ deleted: boolean }>('calendar-delete', 'POST', { activityId: activity.id });
  }
  return googleRequest<{ eventId: string }>('calendar-upsert', 'POST', {
    activityId: activity.id,
    date: activity.date,
    time: activity.time,
    title: `${activity.type} · ${activity.customerName}`,
    description: [activity.propertyTitle, activity.description].filter(Boolean).join('\n'),
  });
}

export const deleteCalendarActivity = (activityId: string) => googleRequest<{ deleted: boolean }>('calendar-delete', 'POST', { activityId });
export const syncGoogleTask = (taskId: string) => googleRequest<{ googleTaskId: string }>('task-sync', 'POST', { taskId });
export const deleteGoogleTask = (taskId: string, googleTaskId: string) => googleRequest<{ deleted: boolean }>('task-delete', 'POST', { taskId, googleTaskId });
