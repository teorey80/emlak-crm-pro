import { supabase } from './supabaseClient';
import { Property, Activity } from '../types';

/**
 * Convert Turkish characters to ASCII equivalents for PDF compatibility
 * (Helvetica font doesn't support Turkish characters)
 */
export function turkishToAscii(text: string): string {
  const map: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C'
  };
  return text.replace(/[ğĞüÜşŞıİöÖçÇ]/g, char => map[char] || char);
}

export interface ActivityGroup {
  type: string;
  count: number;
  activities: {
    date: string;
    time?: string;
    description: string;
    status: string;
  }[];
}

export interface WeeklyReportData {
  property: {
    id: string;
    title: string;
    address: string;
    type: string;
    rooms: string;
    area: number;
    price: number;
    currency: string;
    status: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalActivities: number;
    totalCalls: number;
    totalShowings: number;
    totalOther: number;
    positiveOutcomes: number;
    negativeOutcomes: number;
    pendingOutcomes: number;
  };
  activityGroups: ActivityGroup[];
  consultant: {
    name: string;
    phone?: string;
    email?: string;
  };
  office: {
    name: string;
    phone?: string;
    address?: string;
  };
  generatedAt: string;
}

/**
 * Get weekly report data for a property
 * Note: Customer names and phone numbers are NOT included for privacy
 * @param passedActivities - Activities passed from the parent component (already filtered by propertyId)
 */
export async function getPortfolioWeeklyReport(
  propertyId: string,
  startDate: string,
  endDate: string,
  userId: string,
  passedActivities?: Activity[]
): Promise<WeeklyReportData | null> {
  try {
    // 1. Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property:', propertyError);
      return null;
    }

    // 2. Get user profile (consultant info)
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('full_name, email, phone, office_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
    }

    // 3. Get office info
    let officeData = null;
    if (userProfile?.office_id) {
      const { data: office } = await supabase
        .from('offices')
        .select('name, phone, address')
        .eq('id', userProfile.office_id)
        .single();
      officeData = office;
    }

    // 4. Use passed activities (already filtered by date range from modal)
    const activityList = passedActivities || [];

    // 5. Group activities by type
    const groupedActivities: Record<string, ActivityGroup> = {};

    activityList.forEach((activity: any) => {
      const type = activity.type || 'Diğer';

      if (!groupedActivities[type]) {
        groupedActivities[type] = {
          type,
          count: 0,
          activities: []
        };
      }

      groupedActivities[type].count++;
      groupedActivities[type].activities.push({
        date: activity.date,
        time: activity.time,
        description: activity.description || '',
        status: activity.status || ''
      });
    });

    // 6. Calculate summary statistics
    const totalCalls = activityList.filter((a: any) =>
      a.type === 'Gelen Arama' || a.type === 'Giden Arama'
    ).length;

    const totalShowings = activityList.filter((a: any) =>
      a.type === 'Yer Gösterimi'
    ).length;

    const totalOther = activityList.length - totalCalls - totalShowings;

    const positiveOutcomes = activityList.filter((a: any) =>
      a.status === 'Olumlu'
    ).length;

    const negativeOutcomes = activityList.filter((a: any) =>
      a.status === 'Olumsuz'
    ).length;

    const pendingOutcomes = activityList.filter((a: any) =>
      a.status === 'Düşünüyor' || a.status === 'Planlandı'
    ).length;

    // 7. Build the report data
    const reportData: WeeklyReportData = {
      property: {
        id: property.id,
        title: property.title || '',
        address: [property.neighborhood, property.district, property.city]
          .filter(Boolean)
          .join(', ') || property.location || '',
        type: property.type || '',
        rooms: property.rooms || '',
        area: property.area || 0,
        price: property.price || 0,
        currency: property.currency || 'TL',
        status: property.status || ''
      },
      dateRange: {
        startDate,
        endDate
      },
      summary: {
        totalActivities: activityList.length,
        totalCalls,
        totalShowings,
        totalOther,
        positiveOutcomes,
        negativeOutcomes,
        pendingOutcomes
      },
      activityGroups: Object.values(groupedActivities),
      consultant: {
        name: userProfile?.full_name || 'Danışman',
        phone: userProfile?.phone,
        email: userProfile?.email
      },
      office: {
        name: officeData?.name || '',
        phone: officeData?.phone,
        address: officeData?.address
      },
      generatedAt: new Date().toISOString()
    };

    return reportData;
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return null;
  }
}

/**
 * Format date for display (Turkish format - ASCII compatible for PDF)
 */
export function formatDateTurkish(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Get activity type label in Turkish (ASCII compatible for PDF)
 */
export function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'Yer Gösterimi': 'Yer Gosterimi',
    'Gelen Arama': 'Telefon Gorusmesi (Gelen)',
    'Giden Arama': 'Telefon Gorusmesi (Giden)',
    'Ofis Toplantısı': 'Ofis Toplantisi',
    'Tapu İşlemi': 'Tapu Islemi',
    'Kira Kontratı': 'Kira Kontrati',
    'Kapora Alındı': 'Kapora Alindi',
    'Diğer': 'Diger Aktivite'
  };
  return labels[type] || turkishToAscii(type);
}
