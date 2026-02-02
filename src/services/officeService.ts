import { supabase } from './supabaseClient';

// Types
export interface OfficeInvitation {
    id: string;
    office_id: string;
    token: string;
    role: 'consultant' | 'broker';
    expires_at: string | null;
    max_uses: number;
    current_uses: number;
    created_by: string;
    created_at: string;
    offices?: {
        id: string;
        name: string;
        logo?: string;
    };
}

export interface JoinOfficeResult {
    success: boolean;
    office?: { id: string; name: string };
    error?: string;
}

// =====================================================
// DAVET LİNKİ OLUŞTURMA (Broker için)
// =====================================================
export async function createInviteLink(
    officeId: string,
    role: 'consultant' | 'broker' = 'consultant',
    maxUses: number = 10,
    expiresInDays: number = 7
): Promise<{ link: string; token: string } | null> {
    try {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('office_invitations')
            .insert({
                office_id: officeId,
                token,
                role,
                expires_at: expiresAt.toISOString(),
                max_uses: maxUses,
                current_uses: 0,
                created_by: user.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Generate link based on current URL structure
        const baseUrl = window.location.origin;
        const hashRouter = window.location.hash !== '';
        const link = hashRouter
            ? `${baseUrl}/#/join/${token}`
            : `${baseUrl}/join/${token}`;

        return { link, token };
    } catch (error) {
        console.error('Error creating invite link:', error);
        return null;
    }
}

// =====================================================
// DAVET LİNKİ DOĞRULAMA
// =====================================================
export async function validateInvitation(token: string): Promise<OfficeInvitation | null> {
    try {
        const { data, error } = await supabase
            .from('office_invitations')
            .select('*, offices(id, name, logo)')
            .eq('token', token)
            .single();

        if (error || !data) {
            console.error('Invalid invitation:', error);
            return null;
        }

        // Check expiration
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            console.error('Invitation expired');
            return null;
        }

        // Check usage limit
        if (data.max_uses && data.current_uses >= data.max_uses) {
            console.error('Invitation usage limit reached');
            return null;
        }

        return data as OfficeInvitation;
    } catch (error) {
        console.error('Error validating invitation:', error);
        return null;
    }
}

// =====================================================
// OFİSE KATILMA
// =====================================================
export async function joinOffice(token: string): Promise<JoinOfficeResult> {
    try {
        // 1. Validate invitation
        const invitation = await validateInvitation(token);
        if (!invitation) {
            return { success: false, error: 'Geçersiz veya süresi dolmuş davet linki' };
        }

        const { data: userAuth } = await supabase.auth.getUser();
        if (!userAuth.user) {
            return { success: false, error: 'Giriş yapmalısınız' };
        }

        const userId = userAuth.user.id;

        // 2. Get current profile
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('office_id, role')
            .eq('id', userId)
            .single();

        // 3. Log membership history
        await supabase.from('office_membership_history').insert({
            user_id: userId,
            old_office_id: currentProfile?.office_id || null,
            new_office_id: invitation.office_id,
            action: currentProfile?.office_id ? 'transferred' : 'joined',
            old_role: currentProfile?.role || null,
            new_role: invitation.role,
            performed_by: userId
        });

        // 4. Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                office_id: invitation.office_id,
                role: invitation.role,
                invited_by: invitation.created_by
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 5. Increment invitation usage
        await supabase
            .from('office_invitations')
            .update({ current_uses: invitation.current_uses + 1 })
            .eq('id', invitation.id);

        // 6. Notify broker
        await supabase.from('notifications').insert({
            user_id: invitation.created_by,
            type: 'team_joined',
            title: '👋 Yeni Ekip Üyesi',
            message: 'Ekibinize yeni bir danışman katıldı.',
            data: { new_member_id: userId, office_id: invitation.office_id }
        });

        return {
            success: true,
            office: invitation.offices as { id: string; name: string }
        };
    } catch (error) {
        console.error('Error joining office:', error);
        return { success: false, error: 'Ofise katılırken bir hata oluştu' };
    }
}

// =====================================================
// OFİSTEN AYRILMA
// =====================================================
export async function leaveOffice(): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (!userAuth.user) {
            return { success: false, error: 'Giriş yapmalısınız' };
        }

        const userId = userAuth.user.id;

        // Get current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('office_id, role')
            .eq('id', userId)
            .single();

        if (!profile?.office_id) {
            return { success: false, error: 'Zaten bir ofiste değilsiniz' };
        }

        // Check if user is the only broker
        if (profile.role === 'broker') {
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('office_id', profile.office_id)
                .eq('role', 'broker');

            if (count === 1) {
                return {
                    success: false,
                    error: 'Ofisten ayrılmadan önce başka bir broker atamalısınız'
                };
            }
        }

        // Log membership history
        await supabase.from('office_membership_history').insert({
            user_id: userId,
            old_office_id: profile.office_id,
            new_office_id: null,
            action: 'left',
            old_role: profile.role,
            new_role: 'consultant',
            performed_by: userId
        });

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({
                office_id: null,
                role: 'consultant',
                invited_by: null
            })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error leaving office:', error);
        return { success: false, error: 'Ofisten ayrılırken bir hata oluştu' };
    }
}

// =====================================================
// ROL DEĞİŞTİRME (Broker için)
// =====================================================
export async function changeUserRole(
    targetUserId: string,
    newRole: 'consultant' | 'broker'
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: userAuth } = await supabase.auth.getUser();
        if (!userAuth.user) {
            return { success: false, error: 'Giriş yapmalısınız' };
        }

        // Get current user's profile (must be broker)
        const { data: brokerProfile } = await supabase
            .from('profiles')
            .select('office_id, role')
            .eq('id', userAuth.user.id)
            .single();

        if (brokerProfile?.role !== 'broker') {
            return { success: false, error: 'Bu işlem için broker yetkisi gerekli' };
        }

        // Get target user's profile
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('office_id, role')
            .eq('id', targetUserId)
            .single();

        if (targetProfile?.office_id !== brokerProfile.office_id) {
            return { success: false, error: 'Bu kullanıcı sizin ofisinizde değil' };
        }

        // Log history
        await supabase.from('office_membership_history').insert({
            user_id: targetUserId,
            old_office_id: targetProfile.office_id,
            new_office_id: targetProfile.office_id,
            action: 'role_changed',
            old_role: targetProfile.role,
            new_role: newRole,
            performed_by: userAuth.user.id
        });

        // Update role
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId);

        if (error) throw error;

        // Notify user
        await supabase.from('notifications').insert({
            user_id: targetUserId,
            type: 'role_changed',
            title: '🔄 Rolünüz Değişti',
            message: `Rolünüz ${newRole === 'broker' ? 'Broker' : 'Danışman'} olarak güncellendi.`,
            data: { new_role: newRole }
        });

        return { success: true };
    } catch (error) {
        console.error('Error changing role:', error);
        return { success: false, error: 'Rol değiştirirken bir hata oluştu' };
    }
}

// =====================================================
// DAVET LİNKLERİNİ LİSTELE (Broker için)
// =====================================================
export async function getOfficeInvitations(officeId: string): Promise<OfficeInvitation[]> {
    try {
        const { data, error } = await supabase
            .from('office_invitations')
            .select('*')
            .eq('office_id', officeId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching invitations:', error);
        return [];
    }
}

// =====================================================
// DAVET LİNKİNİ SİL
// =====================================================
export async function deleteInvitation(invitationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('office_invitations')
            .delete()
            .eq('id', invitationId);

        return !error;
    } catch (error) {
        console.error('Error deleting invitation:', error);
        return false;
    }
}
