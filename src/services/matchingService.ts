import { Property, Request, UserProfile } from '../types';

export interface MatchResult {
    request: Request;
    property: Property;
    score: number;
    reasons: string[];
    // Cross-consultant info
    requestOwnerName?: string;
    propertyOwnerName?: string;
    isCrossConsultant?: boolean;
}

export const findMatches = (
    properties: Property[],
    requests: Request[],
    teamMembers?: UserProfile[]
): MatchResult[] => {
    const matches: MatchResult[] = [];

    // Create a lookup map for team member names
    const memberNameMap = new Map<string, string>();
    if (teamMembers) {
        teamMembers.forEach(m => {
            memberNameMap.set(m.id, m.name);
        });
    }

    requests.forEach(request => {
        // Skip if request is not Active
        if (request.status !== 'Aktif') return;

        properties.forEach(property => {
            // Skip sold/rented properties
            if (property.listingStatus === 'Satıldı' || property.listingStatus === 'Kiralandı') return;

            const reasons: string[] = [];
            let score = 0;
            let isMatch = true;

            // 1. Transaction Type (Satılık/Kiralık)
            // Request.requestType vs Property.status
            if (request.requestType !== property.status) {
                isMatch = false;
            } else {
                score += 30; // Base score for correct listing type
            }

            // 2. Property Type (Daire, Villa etc)
            if (isMatch) {
                if (request.type !== property.type) {
                    isMatch = false;
                } else {
                    score += 20;
                    reasons.push('Emlak Tipi Eşleşmesi');
                }
            }

            // 3. Budget / Price
            // Request: minPrice - maxPrice
            // Property: price
            if (isMatch) {
                const price = property.price;
                if (request.maxPrice > 0 && price > request.maxPrice) isMatch = false;
                else if (request.minPrice > 0 && price < request.minPrice) isMatch = false;
                else {
                    score += 40;
                    reasons.push('Fiyat Aralığı Uygun');
                }
            }

            // 4. Location (City)
            if (isMatch && property.city && request.city) {
                if (property.city !== request.city) {
                    isMatch = false;
                } else {
                    score += 10;
                    reasons.push('Şehir Eşleşmesi');
                }
            }

            if (isMatch) {
                // Determine if this is a cross-consultant match
                const requestOwnerId = request.user_id;
                const propertyOwnerId = property.user_id;
                const isCrossConsultant = !!(requestOwnerId && propertyOwnerId && requestOwnerId !== propertyOwnerId);

                // Add bonus score for cross-consultant matches (encourages collaboration)
                if (isCrossConsultant) {
                    score += 5;
                    reasons.push('Çapraz Danışman Eşleşmesi');
                }

                matches.push({
                    request,
                    property,
                    score,
                    reasons,
                    requestOwnerName: requestOwnerId ? memberNameMap.get(requestOwnerId) : undefined,
                    propertyOwnerName: propertyOwnerId ? memberNameMap.get(propertyOwnerId) : undefined,
                    isCrossConsultant
                });
            }
        });
    });

    return matches.sort((a, b) => b.score - a.score);
};
