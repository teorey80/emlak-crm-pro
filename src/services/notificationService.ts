import { supabase } from './supabaseClient';

// Types
export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string | null;
    data: Record<string, any>;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export type NotificationType =
    | 'match_found'       // Talep için uygun portföy bulundu
    | 'portfolio_interest' // Portföye ilgi var
    | 'team_joined'       // Ekibe katılım
    | 'team_left'         // Ekipten ayrılma
    | 'role_changed'      // Rol değişikliği
    | 'invitation_sent'   // Davet gönderildi
    | 'deposit_received'  // Kapora alındı
    | 'sale_completed'    // Satış tamamlandı
    | 'activity_reminder' // Aktivite hatırlatma
    | 'system';           // Sistem bildirimi

// =====================================================
// BİLDİRİM OLUŞTURMA
// =====================================================
export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message?: string,
    data?: Record<string, any>
): Promise<Notification | null> {
    try {
        const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message: message || null,
                data: data || {}
            })
            .select()
            .single();

        if (error) throw error;
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

// =====================================================
// BİLDİRİMLERİ GETIR
// =====================================================
export async function getNotifications(
    limit: number = 20,
    unreadOnly: boolean = false
): Promise<Notification[]> {
    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

// =====================================================
// OKUNMAMIŞ BİLDİRİM SAYISI
// =====================================================
export async function getUnreadCount(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

// =====================================================
// BİLDİRİMİ OKUNDU OLARAK İŞARETLE
// =====================================================
export async function markAsRead(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId);

        return !error;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

// =====================================================
// TÜM BİLDİRİMLERİ OKUNDU OLARAK İŞARETLE
// =====================================================
export async function markAllAsRead(): Promise<boolean> {
    try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return false;

        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', user.user.id)
            .eq('is_read', false);

        return !error;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
}

// =====================================================
// BİLDİRİM SİL
// =====================================================
export async function deleteNotification(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        return !error;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}

// =====================================================
// ESKİ BİLDİRİMLERİ TEMİZLE (30 günden eski)
// =====================================================
export async function cleanOldNotifications(): Promise<number> {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return 0;

        const { data, error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.user.id)
            .eq('is_read', true)
            .lt('created_at', thirtyDaysAgo.toISOString())
            .select();

        if (error) throw error;
        return data?.length || 0;
    } catch (error) {
        console.error('Error cleaning old notifications:', error);
        return 0;
    }
}

// =====================================================
// REALTIME SUBSCRIPTION
// ⚡ OPTİMİZE: userId parametresi ile sadece kendi bildirimlerini dinle
//    Böylece Supabase gereksiz veri göndermez, bant genişliği azalır
// =====================================================
export function subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void
): () => void {
    const channel = supabase
        .channel(`notifications_${userId}`) // Her kullanıcıya özel kanal adı
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}` // ⚡ Sadece bu kullanıcının bildirimleri
            },
            (payload) => {
                onNewNotification(payload.new as Notification);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

// =====================================================
// EŞLEŞME BİLDİRİMİ GÖNDER (Cross-consultant)
// =====================================================
export async function notifyMatch(
    requestOwnerId: string,
    propertyOwnerId: string,
    requestId: string,
    propertyId: string,
    propertyTitle: string,
    score: number,
    requestOwnerName?: string,
    propertyOwnerName?: string
): Promise<boolean> {
    try {
        // 1. Notify request owner (talep sahibi)
        await createNotification(
            requestOwnerId,
            'match_found',
            '🎯 Eşleşme Bulundu!',
            `Müşteriniz için uygun ilan: ${propertyTitle}`,
            {
                request_id: requestId,
                property_id: propertyId,
                score,
                property_owner_name: propertyOwnerName
            }
        );

        // 2. Notify property owner (portföy sahibi) - if different person
        if (requestOwnerId !== propertyOwnerId) {
            await createNotification(
                propertyOwnerId,
                'portfolio_interest',
                '🔔 Portföyünüze İlgi Var!',
                `${propertyTitle} için potansiyel alıcı bulundu.`,
                {
                    request_id: requestId,
                    property_id: propertyId,
                    score,
                    request_owner_name: requestOwnerName
                }
            );
        }

        return true;
    } catch (error) {
        console.error('Error notifying match:', error);
        return false;
    }
}

// =====================================================
// KAPORA BİLDİRİMİ
// =====================================================
export async function notifyDeposit(
    brokerId: string,
    consultantName: string,
    propertyTitle: string,
    amount: number
): Promise<boolean> {
    try {
        await createNotification(
            brokerId,
            'deposit_received',
            '💰 Kapora Alındı!',
            `${consultantName} - ${propertyTitle} için ${amount.toLocaleString('tr-TR')} ₺ kapora kaydedildi.`,
            { property_title: propertyTitle, amount }
        );
        return true;
    } catch (error) {
        console.error('Error notifying deposit:', error);
        return false;
    }
}

// =====================================================
// NOTIFICATION ICON HELPER
// =====================================================
export function getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
        match_found: '🎯',
        portfolio_interest: '🔔',
        team_joined: '👋',
        team_left: '👋',
        role_changed: '🔄',
        invitation_sent: '✉️',
        deposit_received: '💰',
        sale_completed: '🎉',
        activity_reminder: '⏰',
        system: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}
