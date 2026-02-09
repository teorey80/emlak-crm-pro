import { supabase } from './supabaseClient';
import { notifyMatch } from './notificationService';

// Types
export interface Match {
    id: string;
    request_id: string;
    property_id: string;
    request_owner_id: string;
    property_owner_id: string;
    score: number;
    status: MatchStatus;
    notes: string | null;
    contacted_at: string | null;
    created_at: string;
    updated_at: string;
}

export type MatchStatus =
    | 'pending'           // Yeni eşleşme
    | 'contacted'         // İletişime geçildi
    | 'viewing_scheduled' // Görüşme planlandı
    | 'offer_made'        // Teklif verildi
    | 'closed_won'        // Satış yapıldı
    | 'closed_lost'       // Satış olmadı
    | 'cancelled';        // İptal

export interface MatchResult {
    requestId: string;
    propertyId: string;
    score: number;
    requestOwnerId: string;
    propertyOwnerId: string;
    isCrossConsultant: boolean;
    propertyTitle: string;
    propertyPrice: number;
    propertyLocation: string;
}

// =====================================================
// EŞLEŞME SKORU HESAPLAMA
// =====================================================
function calculateMatchScore(request: any, property: any): number {
    let score = 0;
    let maxScore = 0;
    const minPrice = request.minPrice ?? request.min_price ?? 0;
    const maxPrice = request.maxPrice ?? request.max_price ?? Infinity;
    const requestType = request.propertyType ?? request.property_type;
    const minRooms = request.minRooms ?? request.min_rooms ?? 0;
    const maxRooms = request.maxRooms ?? request.max_rooms ?? Infinity;

    // Fiyat uyumu (40 puan max)
    if (request.minPrice || request.min_price || request.maxPrice || request.max_price) {
        maxScore += 40;
        const price = property.price || 0;

        if (price >= minPrice && price <= maxPrice) {
            score += 40;
        } else if (price <= maxPrice * 1.15 && price >= minPrice * 0.85) {
            score += 20; // %15 tolerans
        }
    }

    // Konum uyumu (30 puan max)
    if (request.city || request.district) {
        maxScore += 30;
        const location = (property.location || '').toLowerCase();
        const city = (request.city || '').toLowerCase();
        const district = (request.district || '').toLowerCase();

        if (district && location.includes(district)) {
            score += 30; // İlçe eşleşmesi
        } else if (city && location.includes(city)) {
            score += 20; // Şehir eşleşmesi
        }
    }

    // Oda sayısı uyumu (15 puan max)
    if (request.minRooms || request.min_rooms || request.maxRooms || request.max_rooms) {
        maxScore += 15;
        const rooms = property.rooms || 0;

        if (rooms >= minRooms && rooms <= maxRooms) {
            score += 15;
        }
    }

    // Tip uyumu (15 puan max)
    if (requestType) {
        maxScore += 15;
        if (property.type === requestType) {
            score += 15;
        }
    }

    // Yüz normalleştirme
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// =====================================================
// TALEP İÇİN EŞLEŞME BUL
// =====================================================
export async function findMatchesForRequest(
    requestId: string,
    minScore: number = 60
): Promise<MatchResult[]> {
    try {
        // Get request details
        const { data: request, error: requestError } = await supabase
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (requestError || !request) {
            console.error('Request not found:', requestError);
            return [];
        }

        // Get matching properties
        let query = supabase
            .from('properties')
            .select('*')
            .eq('listing_status', 'Aktif');

        // Apply filters
        const requestTransactionType = request.requestType ?? request.request_type;
        const requestMinPrice = request.minPrice ?? request.min_price;
        const requestMaxPrice = request.maxPrice ?? request.max_price;
        const requestPropertyType = request.propertyType ?? request.property_type;

        if (requestTransactionType) {
            query = query.eq('status', requestTransactionType);
        }
        if (requestMinPrice) {
            query = query.gte('price', requestMinPrice * 0.85);
        }
        if (requestMaxPrice) {
            query = query.lte('price', requestMaxPrice * 1.15);
        }
        if (requestPropertyType) {
            query = query.eq('type', requestPropertyType);
        }

        const { data: properties, error: propError } = await query;

        if (propError || !properties) {
            console.error('Error fetching properties:', propError);
            return [];
        }

        // Calculate scores and filter
        const matches: MatchResult[] = properties
            .map(property => {
                const score = calculateMatchScore(request, property);
                return {
                    requestId,
                    propertyId: property.id,
                    score,
                    requestOwnerId: request.user_id,
                    propertyOwnerId: property.user_id,
                    isCrossConsultant: request.user_id !== property.user_id,
                    propertyTitle: property.title || 'İsimsiz İlan',
                    propertyPrice: property.price || 0,
                    propertyLocation: property.location || ''
                };
            })
            .filter(m => m.score >= minScore)
            .sort((a, b) => b.score - a.score);

        return matches;
    } catch (error) {
        console.error('Error finding matches:', error);
        return [];
    }
}

// =====================================================
// EŞLEŞME KAYDET VE BİLDİRİM GÖNDER
// =====================================================
export async function saveMatchAndNotify(match: MatchResult): Promise<Match | null> {
    try {
        // Check if match already exists
        const { data: existing } = await supabase
            .from('matches')
            .select('id')
            .eq('request_id', match.requestId)
            .eq('property_id', match.propertyId)
            .maybeSingle();

        if (existing) {
            console.log('Match already exists');
            return null;
        }

        // Save match
        const { data: savedMatch, error } = await supabase
            .from('matches')
            .insert({
                request_id: match.requestId,
                property_id: match.propertyId,
                request_owner_id: match.requestOwnerId,
                property_owner_id: match.propertyOwnerId,
                score: match.score,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Fetch both owner names in one query to avoid N+1 profile reads.
        const ownerIds = Array.from(new Set([match.requestOwnerId, match.propertyOwnerId]));
        const { data: owners } = await supabase
            .from('profiles')
            .select('id,full_name')
            .in('id', ownerIds);
        const ownerNameById = new Map<string, string>(
            (owners || []).map((owner: any) => [owner.id, owner.full_name || ''])
        );

        // Send notifications
        await notifyMatch(
            match.requestOwnerId,
            match.propertyOwnerId,
            match.requestId,
            match.propertyId,
            match.propertyTitle,
            match.score,
            ownerNameById.get(match.requestOwnerId),
            ownerNameById.get(match.propertyOwnerId)
        );

        return savedMatch;
    } catch (error) {
        console.error('Error saving match:', error);
        return null;
    }
}

// =====================================================
// KULLANICININ EŞLEŞMELERİNİ GETİR
// =====================================================
export async function getUserMatches(
    status?: MatchStatus
): Promise<Match[]> {
    try {
        let query = supabase
            .from('matches')
            .select('id,request_id,property_id,request_owner_id,property_owner_id,score,status,notes,contacted_at,created_at,updated_at')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
    }
}

// =====================================================
// EŞLEŞME DURUMUNU GÜNCELLE
// =====================================================
export async function updateMatchStatus(
    matchId: string,
    status: MatchStatus,
    notes?: string
): Promise<boolean> {
    try {
        const updates: Partial<Match> = {
            status,
            updated_at: new Date().toISOString()
        };

        if (status === 'contacted') {
            updates.contacted_at = new Date().toISOString();
        }

        if (notes) {
            updates.notes = notes;
        }

        const { error } = await supabase
            .from('matches')
            .update(updates)
            .eq('id', matchId);

        return !error;
    } catch (error) {
        console.error('Error updating match status:', error);
        return false;
    }
}

// =====================================================
// TÜM TALEPLER İÇİN EŞLEŞME TARAMASI
// (Background job olarak çalıştırılabilir)
// =====================================================
export async function scanAllRequestsForMatches(): Promise<number> {
    try {
        const { data: requests } = await supabase
            .from('requests')
            .select('*')
            .eq('status', 'Aktif');

        if (!requests || requests.length === 0) return 0;

        const { data: activeProperties } = await supabase
            .from('properties')
            .select('*')
            .eq('listing_status', 'Aktif');

        if (!activeProperties || activeProperties.length === 0) return 0;

        let matchCount = 0;

        for (const request of requests) {
            const matches: MatchResult[] = activeProperties
                .filter((property: any) => {
                    const requestTransactionType = request.requestType ?? request.request_type;
                    const requestPropertyType = request.propertyType ?? request.property_type;
                    const requestMinPrice = request.minPrice ?? request.min_price;
                    const requestMaxPrice = request.maxPrice ?? request.max_price;

                    if (requestTransactionType && property.status !== requestTransactionType) return false;
                    if (requestPropertyType && property.type !== requestPropertyType) return false;

                    const price = property.price || 0;
                    if (requestMinPrice && price < requestMinPrice * 0.85) return false;
                    if (requestMaxPrice && price > requestMaxPrice * 1.15) return false;

                    return true;
                })
                .map((property: any) => {
                    const score = calculateMatchScore(request, property);
                    return {
                        requestId: request.id,
                        propertyId: property.id,
                        score,
                        requestOwnerId: request.user_id,
                        propertyOwnerId: property.user_id,
                        isCrossConsultant: request.user_id !== property.user_id,
                        propertyTitle: property.title || 'İsimsiz İlan',
                        propertyPrice: property.price || 0,
                        propertyLocation: property.location || ''
                    };
                })
                .filter((match) => match.score >= 70)
                .sort((a, b) => b.score - a.score);

            for (const match of matches.slice(0, 5)) { // Max 5 eşleşme per request
                const saved = await saveMatchAndNotify(match);
                if (saved) matchCount++;
            }
        }

        return matchCount;
    } catch (error) {
        console.error('Error scanning for matches:', error);
        return 0;
    }
}
