import { Property, Request } from '../types';

export interface MatchResult {
    request: Request;
    property: Property;
    score: number;
    reasons: string[];
}

export const findMatches = (properties: Property[], requests: Request[]): MatchResult[] => {
    const matches: MatchResult[] = [];

    requests.forEach(request => {
        // Skip if request is not Active
        if (request.status !== 'Aktif') return;

        properties.forEach(property => {
            // Only consider properties that are available? 
            // Property doesn't have an Active/Passive status in types.ts explicitly shown in the L9 snippet (it has status: Satilik/Kiralik).
            // But usually we should filter out sold ones. L28 usageStatus? 
            // Let's assume all fetched properties are candidates for now.

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
                matches.push({
                    request,
                    property,
                    score,
                    reasons
                });
            }
        });
    });

    return matches.sort((a, b) => b.score - a.score);
};
