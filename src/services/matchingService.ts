import { Property, Request, UserProfile } from '../types';

export type CriteriaStatus = 'pass' | 'partial' | 'fail';

export interface MatchCriterion {
  key: string;
  label: string;
  status: CriteriaStatus;
  detail?: string;
}

export interface MatchResult {
  request: Request;
  property: Property;
  score: number;
  reasons: string[];
  matchReasons?: string[];
  criteria: MatchCriterion[];
  level: 'high' | 'medium' | 'low';
  requestOwnerName?: string;
  propertyOwnerName?: string;
  isCrossConsultant?: boolean;
}

const ROOM_REGEX = /(\d+)\s*\+\s*(\d+)/;

const parseRoom = (value?: string): number | null => {
  if (!value) return null;
  const match = value.match(ROOM_REGEX);
  if (!match) return null;
  return Number(match[1]);
};

const getListingStatus = (property: Property): string => {
  return property.listingStatus || property.listing_status || 'Aktif';
};

const locationContains = (text: string | undefined, target: string | undefined): boolean => {
  if (!text || !target) return false;
  return text.toLocaleLowerCase('tr').includes(target.toLocaleLowerCase('tr'));
};

const evaluateMatch = (request: Request, property: Property) => {
  const criteria: MatchCriterion[] = [];

  const listingStatus = getListingStatus(property);
  const isActiveListing = listingStatus === 'Aktif' || !listingStatus;
  criteria.push({
    key: 'active_listing',
    label: 'Aktif ilan',
    status: isActiveListing ? 'pass' : 'fail',
    detail: isActiveListing ? undefined : `Durum: ${listingStatus}`
  });
  if (!isActiveListing) return { hardPass: false, score: 0, criteria };

  const transactionMatch = !request.requestType || request.requestType === property.status;
  criteria.push({
    key: 'transaction_type',
    label: 'İşlem türü',
    status: transactionMatch ? 'pass' : 'fail',
    detail: transactionMatch ? undefined : `Talep: ${request.requestType}, İlan: ${property.status}`
  });
  if (!transactionMatch) return { hardPass: false, score: 0, criteria };

  const cityMatch =
    !request.city ||
    locationContains(property.city, request.city) ||
    locationContains(property.location, request.city);
  criteria.push({
    key: 'city',
    label: 'Şehir',
    status: cityMatch ? 'pass' : 'fail',
    detail: cityMatch ? undefined : `Talep: ${request.city}`
  });
  if (!cityMatch) return { hardPass: false, score: 0, criteria };

  const districtRequired = request.district && request.district !== 'Tümü';
  const districtMatch = !districtRequired ||
    locationContains(property.district, request.district) ||
    locationContains(property.location, request.district);
  criteria.push({
    key: 'district',
    label: 'İlçe',
    status: districtMatch ? 'pass' : 'fail',
    detail: districtMatch ? undefined : `Talep: ${request.district}`
  });
  if (!districtMatch) return { hardPass: false, score: 0, criteria };

  let score = 0;

  const typeMatch = request.type === property.type;
  score += typeMatch ? 15 : 0;
  criteria.push({
    key: 'property_type',
    label: 'Emlak tipi',
    status: typeMatch ? 'pass' : 'fail',
    detail: typeMatch ? undefined : `Talep: ${request.type}, İlan: ${property.type}`
  });

  const price = property.price || 0;
  const minPrice = request.minPrice || 0;
  const maxPrice = request.maxPrice || Number.MAX_SAFE_INTEGER;
  const inBudget = price >= minPrice && price <= maxPrice;
  const nearBudget = !inBudget && price >= minPrice * 0.85 && price <= maxPrice * 1.15;
  if (inBudget) score += 25;
  if (nearBudget) score += 12;
  criteria.push({
    key: 'price',
    label: 'Bütçe',
    status: inBudget ? 'pass' : nearBudget ? 'partial' : 'fail',
    detail: `Talep: ${minPrice.toLocaleString('tr-TR')} - ${maxPrice.toLocaleString('tr-TR')}, İlan: ${price.toLocaleString('tr-TR')}`
  });

  const requestedRoom = parseRoom(request.minRooms);
  const propertyRoom = parseRoom(property.rooms);
  if (requestedRoom && propertyRoom) {
    const diff = Math.abs(requestedRoom - propertyRoom);
    if (diff === 0) score += 30;
    else if (diff === 1) score += 10;
    criteria.push({
      key: 'rooms',
      label: 'Oda sayısı',
      status: diff === 0 ? 'pass' : diff === 1 ? 'partial' : 'fail',
      detail: `Talep: ${request.minRooms}, İlan: ${property.rooms}`
    });
  } else {
    criteria.push({
      key: 'rooms',
      label: 'Oda sayısı',
      status: 'partial',
      detail: 'Talep veya ilan oda bilgisi eksik'
    });
    score += 5;
  }

  const siteRequired = !!request.siteName;
  const propertySite = property.siteName || property.site || '';
  const exactSiteMatch = siteRequired && request.siteName === propertySite;
  const looseSiteMatch = siteRequired && locationContains(propertySite, request.siteName);
  if (!siteRequired) {
    criteria.push({
      key: 'site',
      label: 'Site tercihi',
      status: 'partial',
      detail: 'Site tercihi yok'
    });
  } else {
    if (exactSiteMatch) score += 10;
    else if (looseSiteMatch) score += 4;
    criteria.push({
      key: 'site',
      label: 'Site tercihi',
      status: exactSiteMatch ? 'pass' : looseSiteMatch ? 'partial' : 'fail',
      detail: `Talep: ${request.siteName}, İlan: ${propertySite || '-'}`
    });
  }

  const level: MatchResult['level'] = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

  return { hardPass: true, score: Math.max(0, Math.min(100, Math.round(score))), criteria, level };
};

export const findMatches = (
  properties: Property[],
  requests: Request[],
  teamMembers?: UserProfile[],
  minScore = 30
): MatchResult[] => {
  const matches: MatchResult[] = [];

  const memberNameMap = new Map<string, string>();
  if (teamMembers) {
    teamMembers.forEach((m) => memberNameMap.set(m.id, m.name));
  }

  requests.forEach((request) => {
    if (request.status !== 'Aktif') return;

    properties.forEach((property) => {
      const evaluated = evaluateMatch(request, property);
      if (!evaluated.hardPass || evaluated.score < minScore) return;

      const requestOwnerId = request.user_id;
      const propertyOwnerId = property.user_id;
      const isCrossConsultant = !!(requestOwnerId && propertyOwnerId && requestOwnerId !== propertyOwnerId);

      const reasons = evaluated.criteria
        .filter((c) => c.status !== 'fail')
        .slice(0, 4)
        .map((c) => c.label);

      matches.push({
        request,
        property,
        score: evaluated.score,
        reasons,
        matchReasons: reasons,
        criteria: evaluated.criteria,
        level: evaluated.level,
        requestOwnerName: requestOwnerId ? memberNameMap.get(requestOwnerId) : undefined,
        propertyOwnerName: propertyOwnerId ? memberNameMap.get(propertyOwnerId) : undefined,
        isCrossConsultant
      });
    });
  });

  return matches.sort((a, b) => b.score - a.score);
};

