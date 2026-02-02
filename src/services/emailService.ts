import { supabase } from './supabaseClient';

// Email configuration - Set these in Supabase Edge Functions or env
const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || '';
const EMAIL_API_KEY = import.meta.env.VITE_EMAIL_API_KEY || '';

// Email types
export type EmailType =
    | 'role_changed'
    | 'team_joined'
    | 'team_left'
    | 'invitation_sent'
    | 'deposit_received'
    | 'sale_completed';

interface EmailData {
    to: string;
    subject: string;
    body: string;
    type: EmailType;
}

// Email templates
const EMAIL_TEMPLATES: Record<EmailType, { subject: string; body: (data: Record<string, any>) => string }> = {
    role_changed: {
        subject: 'Emlak CRM - Rolünüz Değiştirildi',
        body: (data) => `
      Merhaba ${data.userName},
      
      Emlak CRM hesabınızdaki rolünüz değiştirildi.
      
      Yeni Rol: ${data.newRole === 'broker' ? 'Broker (Ofis Yöneticisi)' : 'Danışman'}
      Değişikliği Yapan: ${data.changedByName}
      Tarih: ${new Date().toLocaleDateString('tr-TR')}
      
      Bu değişiklik hakkında sorularınız varsa ofis yöneticinize başvurabilirsiniz.
      
      Saygılarımızla,
      Emlak CRM Ekibi
    `
    },
    team_joined: {
        subject: 'Emlak CRM - Ekibe Hoş Geldiniz!',
        body: (data) => `
      Merhaba ${data.userName},
      
      ${data.officeName} ofisine başarıyla katıldınız!
      
      Rol: ${data.role === 'broker' ? 'Broker (Ofis Yöneticisi)' : 'Danışman'}
      Davet Eden: ${data.invitedByName}
      
      Artık ofis portföylerine erişebilir ve ekip içi eşleşmelerden faydalanabilirsiniz.
      
      Başarılar dileriz!
      Emlak CRM Ekibi
    `
    },
    team_left: {
        subject: 'Emlak CRM - Ofisten Ayrıldınız',
        body: (data) => `
      Merhaba ${data.userName},
      
      ${data.officeName} ofisinden ayrıldınız.
      
      Tüm verileriniz (müşteriler, portföyler, aktiviteler) sizinle kaldı ve 
      yeni bir ofise katıldığınızda taşınacaktır.
      
      Saygılarımızla,
      Emlak CRM Ekibi
    `
    },
    invitation_sent: {
        subject: 'Emlak CRM - Ofise Davet Edildiniz',
        body: (data) => `
      Merhaba,
      
      ${data.officeName} ofisine davet edildiniz!
      
      Davet Eden: ${data.inviterName}
      Rol: ${data.role === 'broker' ? 'Broker (Ofis Yöneticisi)' : 'Danışman'}
      
      Daveti kabul etmek için aşağıdaki linke tıklayın:
      ${data.inviteLink}
      
      Bu link ${data.expiresIn} gün geçerlidir.
      
      Saygılarımızla,
      Emlak CRM Ekibi
    `
    },
    deposit_received: {
        subject: 'Emlak CRM - Kapora Kaydedildi',
        body: (data) => `
      Merhaba ${data.brokerName},
      
      Ekibinizden kapora bildirimi:
      
      Danışman: ${data.consultantName}
      İlan: ${data.propertyTitle}
      Kapora Tutarı: ${data.amount.toLocaleString('tr-TR')} ₺
      Tarih: ${new Date().toLocaleDateString('tr-TR')}
      
      Saygılarımızla,
      Emlak CRM Ekibi
    `
    },
    sale_completed: {
        subject: 'Emlak CRM - Satış Tamamlandı!',
        body: (data) => `
      Merhaba ${data.brokerName},
      
      Tebrikler! Ekibinizden satış bildirimi:
      
      Danışman: ${data.consultantName}
      İlan: ${data.propertyTitle}
      Satış Tutarı: ${data.salePrice.toLocaleString('tr-TR')} ₺
      Komisyon: ${data.commission.toLocaleString('tr-TR')} ₺
      Tarih: ${new Date().toLocaleDateString('tr-TR')}
      
      Başarıların devamını dileriz!
      Emlak CRM Ekibi
    `
    }
};

// =====================================================
// SEND EMAIL VIA SUPABASE EDGE FUNCTION
// =====================================================
export async function sendEmail(
    to: string,
    type: EmailType,
    data: Record<string, any>
): Promise<boolean> {
    try {
        const template = EMAIL_TEMPLATES[type];
        if (!template) {
            console.error('Unknown email type:', type);
            return false;
        }

        const emailData: EmailData = {
            to,
            subject: template.subject,
            body: template.body(data),
            type
        };

        // Option 1: Call Supabase Edge Function
        const { data: result, error } = await supabase.functions.invoke('send-email', {
            body: emailData
        });

        if (error) {
            console.error('Email send error:', error);
            // Fallback: Log to notifications table for manual review
            await logEmailToNotifications(to, type, data);
            return false;
        }

        console.log('Email sent successfully:', result);
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        // Fallback: Log to notifications
        await logEmailToNotifications(to, type, data);
        return false;
    }
}

// Fallback: If email fails, at least log it as notification
async function logEmailToNotifications(to: string, type: EmailType, data: Record<string, any>) {
    try {
        // Find user by email
        const { data: user } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', to)
            .single();

        if (user) {
            const template = EMAIL_TEMPLATES[type];
            await supabase.from('notifications').insert({
                user_id: user.id,
                type: `email_${type}`,
                title: template.subject,
                message: 'E-posta gönderilemedi, bildirim olarak kaydedildi.',
                data
            });
        }
    } catch (e) {
        console.error('Failed to log email to notifications:', e);
    }
}

// =====================================================
// SPECIFIC EMAIL FUNCTIONS
// =====================================================

// Role change notification
export async function sendRoleChangeEmail(
    userEmail: string,
    userName: string,
    newRole: 'consultant' | 'broker',
    changedByName: string,
    changedByEmail: string
): Promise<void> {
    // Send to the user whose role changed
    await sendEmail(userEmail, 'role_changed', {
        userName,
        newRole,
        changedByName
    });

    // Send confirmation to the broker who made the change
    await sendEmail(changedByEmail, 'role_changed', {
        userName: changedByName,
        newRole: 'confirmation',
        changedByName: `${userName} kullanıcısının rolü ${newRole === 'broker' ? 'Broker' : 'Danışman'} olarak değiştirildi.`
    });
}

// Team join notification
export async function sendTeamJoinEmail(
    userEmail: string,
    userName: string,
    officeName: string,
    role: string,
    invitedByName: string,
    invitedByEmail: string
): Promise<void> {
    // To new member
    await sendEmail(userEmail, 'team_joined', {
        userName,
        officeName,
        role,
        invitedByName
    });

    // To broker who invited
    await sendEmail(invitedByEmail, 'team_joined', {
        userName: invitedByName,
        officeName,
        role: 'notification',
        invitedByName: `${userName} ekibinize katıldı.`
    });
}

// Deposit notification to broker
export async function sendDepositEmail(
    brokerEmail: string,
    brokerName: string,
    consultantName: string,
    propertyTitle: string,
    amount: number
): Promise<void> {
    await sendEmail(brokerEmail, 'deposit_received', {
        brokerName,
        consultantName,
        propertyTitle,
        amount
    });
}

// Sale notification to broker
export async function sendSaleEmail(
    brokerEmail: string,
    brokerName: string,
    consultantName: string,
    propertyTitle: string,
    salePrice: number,
    commission: number
): Promise<void> {
    await sendEmail(brokerEmail, 'sale_completed', {
        brokerName,
        consultantName,
        propertyTitle,
        salePrice,
        commission
    });
}
