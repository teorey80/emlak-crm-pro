import { Property, Request, UserProfile } from '../types';

export type CriteriaStatus = 'pass' | 'partial' | 'fail';

export interface MatchCriterion {
  key: string;
  label: string;
  status: CriteriaStatus;
  score: number;
  maxScore: number;
  message: string;
  requestValue: string;
  propertyValue: string;
}

export interface MatchingCriteria {
  location: MatchCriterion;
  price: MatchCriterion;
  rooms: MatchCriterion;
  area: MatchCriterion;
  propertyType: MatchCriterion;
  floor?: MatchCriterion;
  balcony?: MatchCriterion;
}

export type MatchBadge = 'perfect' | 'good' | 'medium' | 'low';

export interface MatchResult {
  request: Request;
  property: Property;
  score: number;
  reasons: string[];
  matchReasons?: string[];
  criteria: MatchCriterion[];
  matchingCriteria: MatchingCriteria;
  comparisonRows: MatchCriterion[];
  badge: MatchBadge;
  level: 'high' | 'medium' | 'low';
  requestOwnerName?: string;
  propertyOwnerName?: string;
  isCrossConsultant?: boolean;
}

const ROOM_REGEX = /(\d+)\s*\+\s*(\d+)/;
const ACTIVE_LISTING = 'Aktif';
const DISTRICT_ALL = 'Tümü';

const normalizeText = (value?: string | null): string => (value || '').trim().toLocaleLowerCase('tr');

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseRoom = (value?: string): number | null => {
  if (!value) return null;
  const roomMatch = value.match(ROOM_REGEX);
  if (roomMatch) return Number(roomMatch[1]);
  const direct = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(direct) && direct > 0 ? direct : null;
};

const getListingStatus = (property: Property): string => {
  return property.listingStatus || property.listing_status || ACTIVE_LISTING;
};

const locationContains = (text: string | undefined, target: string | undefined): boolean => {
  if (!text || !target) return false;
  return normalizeText(text).includes(normalizeText(target));
};

const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  return `${value.toLocaleString('tr-TR')} TL`;
};

const formatArea = (value?: number | null): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  return `${value.toLocaleString('tr-TR')} m²`;
};

const extractAreaRange = (request: Request): { min: number | null; max: number | null } => {
  const rawRequest = request as any;
  const min = toNumber(rawRequest.minArea ?? rawRequest.min_area ?? rawRequest.minM2 ?? rawRequest.min_m2);
  const max = toNumber(rawRequest.maxArea ?? rawRequest.max_area ?? rawRequest.maxM2 ?? rawRequest.max_m2);
  return { min, max };
};

const getPropertyArea = (property: Property): number | null => {
  const areaCandidates = [property.area, property.netArea, property.grossArea];
  for (const value of areaCandidates) {
    const parsed = toNumber(value);
    if (parsed && parsed > 0) return parsed;
  }
  return null;
};

const extractMaxFloor = (request: Request): number | null => {
  const rawRequest = request as any;
  return toNumber(rawRequest.maxFloor ?? rawRequest.max_floor ?? rawRequest.floorMax ?? rawRequest.floor_max);
};

const extractBalconyPreference = (request: Request): boolean | null => {
  const rawRequest = request as any;
  if (typeof rawRequest.balconyRequired === 'boolean') return rawRequest.balconyRequired;
  if (typeof rawRequest.balcony_required === 'boolean') return rawRequest.balcony_required;
  if (typeof rawRequest.balcony === 'string') {
    const normalized = normalizeText(rawRequest.balcony);
    if (normalized === 'var' || normalized === 'evet') return true;
    if (normalized === 'yok' || normalized === 'hayır') return false;
  }
  return null;
};

const hasBalcony = (property: Property): boolean | null => {
  if (typeof property.balcony === 'number') return property.balcony > 0;
  if (typeof property.balkon === 'string') {
    const normalized = normalizeText(property.balkon);
    if (normalized === 'var') return true;
    if (normalized === 'yok') return false;
  }
  return null;
};

const buildCriterion = (
  key: string,
  label: string,
  status: CriteriaStatus,
  score: number,
  maxScore: number,
  message: string,
  requestValue: string,
  propertyValue: string
): MatchCriterion => ({
  key,
  label,
  status,
  score,
  maxScore,
  message,
  requestValue,
  propertyValue
});

const evaluateMatch = (request: Request, property: Property) => {
  const listingStatus = getListingStatus(property);
  const isActiveListing = listingStatus === ACTIVE_LISTING || !listingStatus;
  if (!isActiveListing) return { hardPass: false };

  const transactionTypeMatch = !request.requestType || request.requestType === property.status;
  if (!transactionTypeMatch) return { hardPass: false };

  const requestDistrict = request.district && request.district !== DISTRICT_ALL ? request.district : '';
  const requestNeighborhood = (request as any).neighborhood || '';
  const requestCity = request.city || '';

  const districtMatched =
    locationContains(property.district, requestDistrict) ||
    locationContains(property.location, requestDistrict) ||
    locationContains(property.neighborhood, requestDistrict);
  const neighborhoodMatched =
    locationContains(property.neighborhood, requestNeighborhood) ||
    locationContains(property.location, requestNeighborhood);
  const cityMatched =
    locationContains(property.city, requestCity) ||
    locationContains(property.location, requestCity);

  let locationStatus: CriteriaStatus = 'fail';
  let locationScore = 0;
  let locationMessage = 'Konum talebe uymuyor';
  if (!requestDistrict && !requestNeighborhood && !requestCity) {
    locationStatus = 'partial';
    locationScore = 10;
    locationMessage = 'Talepte net konum belirtilmemiş';
  } else if (districtMatched || neighborhoodMatched) {
    locationStatus = 'pass';
    locationScore = 20;
    locationMessage = 'Konum eşleşiyor';
  } else if (cityMatched) {
    locationStatus = 'partial';
    locationScore = 10;
    locationMessage = 'Şehir uyumlu, ilçe/mahalle farklı';
  }

  const minPrice = request.minPrice ?? 0;
  const maxPrice = request.maxPrice ?? Number.MAX_SAFE_INTEGER;
  const propertyPrice = property.price || 0;
  const inPriceRange = propertyPrice >= minPrice && propertyPrice <= maxPrice;
  const nearPriceRange = !inPriceRange && propertyPrice >= minPrice * 0.9 && propertyPrice <= maxPrice * 1.1;
  const hasPriceRange = request.minPrice > 0 || request.maxPrice > 0;
  const priceStatus: CriteriaStatus = !hasPriceRange ? 'partial' : inPriceRange ? 'pass' : nearPriceRange ? 'partial' : 'fail';
  const priceScore = !hasPriceRange ? 10 : inPriceRange ? 20 : nearPriceRange ? 10 : 0;
  const priceMessage = !hasPriceRange
    ? 'Talepte net bütçe aralığı belirtilmemiş'
    : inPriceRange
      ? 'Fiyat bütçeye uygun'
      : nearPriceRange
        ? 'Fiyat tolerans içinde (±%10)'
        : 'Fiyat bütçe dışında';

  const requestedRooms = parseRoom(request.minRooms);
  const propertyRooms = parseRoom(property.rooms);
  let roomsStatus: CriteriaStatus = 'fail';
  let roomsScore = 0;
  let roomsMessage = 'Oda sayısı uyumsuz';
  if (!requestedRooms || !propertyRooms) {
    roomsStatus = 'partial';
    roomsScore = 10;
    roomsMessage = 'Oda bilgisi eksik';
  } else {
    const diff = Math.abs(requestedRooms - propertyRooms);
    if (diff === 0) {
      roomsStatus = 'pass';
      roomsScore = 20;
      roomsMessage = 'Oda sayısı tam uyumlu';
    } else if (diff === 1) {
      roomsStatus = 'partial';
      roomsScore = 10;
      roomsMessage = 'Oda sayısı tolerans içinde (±1)';
    }
  }

  const { min: minArea, max: maxArea } = extractAreaRange(request);
  const propertyArea = getPropertyArea(property);
  const hasAreaRange = minArea !== null || maxArea !== null;
  const effectiveMinArea = minArea ?? 0;
  const effectiveMaxArea = maxArea ?? Number.MAX_SAFE_INTEGER;
  const inAreaRange = propertyArea !== null && propertyArea >= effectiveMinArea && propertyArea <= effectiveMaxArea;
  const nearAreaRange =
    propertyArea !== null &&
    !inAreaRange &&
    propertyArea >= effectiveMinArea * 0.85 &&
    propertyArea <= effectiveMaxArea * 1.15;
  const areaStatus: CriteriaStatus = !hasAreaRange || propertyArea === null
    ? 'partial'
    : inAreaRange
      ? 'pass'
      : nearAreaRange
        ? 'partial'
        : 'fail';
  const areaScore = !hasAreaRange || propertyArea === null ? 10 : inAreaRange ? 20 : nearAreaRange ? 10 : 0;
  const areaMessage = !hasAreaRange
    ? 'Talepte m² aralığı belirtilmemiş'
    : propertyArea === null
      ? 'İlanda m² bilgisi eksik'
      : inAreaRange
        ? 'm² aralığına uygun'
        : nearAreaRange
          ? 'm² tolerans içinde (±%15)'
          : 'm² aralığı dışında';

  const requestType = request.type || (request as any).propertyType;
  const propertyType = property.type;
  const typeMatched = normalizeText(requestType) === normalizeText(propertyType);
  const hasTypeConstraint = !!requestType;
  const propertyTypeStatus: CriteriaStatus = !hasTypeConstraint ? 'partial' : typeMatched ? 'pass' : 'fail';
  const propertyTypeScore = !hasTypeConstraint ? 10 : typeMatched ? 20 : 0;
  const propertyTypeMessage = !hasTypeConstraint
    ? 'Talepte emlak tipi belirtilmemiş'
    : typeMatched
      ? 'Emlak tipi uyumlu'
      : 'Emlak tipi farklı';

  const floorMax = extractMaxFloor(request);
  const currentFloor = toNumber(property.currentFloor);
  let floorCriterion: MatchCriterion | undefined;
  if (floorMax !== null || currentFloor !== null) {
    let status: CriteriaStatus = 'partial';
    let message = 'Kat bilgisi eksik';
    if (floorMax !== null && currentFloor !== null) {
      if (currentFloor <= floorMax) {
        status = 'pass';
        message = 'Kat kriteri uyumlu';
      } else {
        status = 'partial';
        message = 'Kat tercihini aşıyor';
      }
    }
    floorCriterion = buildCriterion(
      'floor',
      'Kat',
      status,
      0,
      0,
      message,
      floorMax !== null ? `Maks ${floorMax}` : 'Belirtilmedi',
      currentFloor !== null ? `${currentFloor}. Kat` : '-'
    );
  }

  const balconyRequired = extractBalconyPreference(request);
  const propertyHasBalcony = hasBalcony(property);
  let balconyCriterion: MatchCriterion | undefined;
  if (balconyRequired !== null || propertyHasBalcony !== null) {
    let status: CriteriaStatus = 'partial';
    let message = 'Balkon tercihi net değil';
    if (balconyRequired !== null && propertyHasBalcony !== null) {
      if (balconyRequired === propertyHasBalcony) {
        status = 'pass';
        message = 'Balkon kriteri uyumlu';
      } else {
        status = 'fail';
        message = 'Balkon kriteri uymuyor';
      }
    }
    balconyCriterion = buildCriterion(
      'balcony',
      'Balkon',
      status,
      0,
      0,
      message,
      balconyRequired === null ? 'Belirtilmedi' : balconyRequired ? 'Var' : 'Yok',
      propertyHasBalcony === null ? '-' : propertyHasBalcony ? 'Var' : 'Yok'
    );
  }

  const locationCriterion = buildCriterion(
    'location',
    'Konum',
    locationStatus,
    locationScore,
    20,
    locationMessage,
    [requestDistrict || requestNeighborhood || '-', requestCity || '-'].join(', '),
    [property.district || property.neighborhood || '-', property.city || '-'].join(', ')
  );

  const priceCriterion = buildCriterion(
    'price',
    'Fiyat',
    priceStatus,
    priceScore,
    20,
    priceMessage,
    `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`,
    formatCurrency(propertyPrice)
  );

  const roomsCriterion = buildCriterion(
    'rooms',
    'Oda',
    roomsStatus,
    roomsScore,
    20,
    roomsMessage,
    request.minRooms || '-',
    property.rooms || '-'
  );

  const areaCriterion = buildCriterion(
    'area',
    'm²',
    areaStatus,
    areaScore,
    20,
    areaMessage,
    hasAreaRange ? `${formatArea(minArea)} - ${formatArea(maxArea)}` : 'Belirtilmedi',
    formatArea(propertyArea)
  );

  const propertyTypeCriterion = buildCriterion(
    'propertyType',
    'Emlak Tipi',
    propertyTypeStatus,
    propertyTypeScore,
    20,
    propertyTypeMessage,
    requestType || '-',
    propertyType || '-'
  );

  const mandatoryCriteria = [
    locationCriterion,
    priceCriterion,
    roomsCriterion,
    areaCriterion,
    propertyTypeCriterion
  ];

  const totalScore = mandatoryCriteria.reduce((sum, criterion) => sum + criterion.score, 0);
  const badge: MatchBadge = totalScore >= 90 ? 'perfect' : totalScore >= 70 ? 'good' : totalScore >= 50 ? 'medium' : 'low';
  const level: MatchResult['level'] = totalScore >= 90 ? 'high' : totalScore >= 70 ? 'medium' : 'low';

  const criteria = floorCriterion
    ? balconyCriterion
      ? [...mandatoryCriteria, floorCriterion, balconyCriterion]
      : [...mandatoryCriteria, floorCriterion]
    : balconyCriterion
      ? [...mandatoryCriteria, balconyCriterion]
      : mandatoryCriteria;

  const matchingCriteria: MatchingCriteria = {
    location: locationCriterion,
    price: priceCriterion,
    rooms: roomsCriterion,
    area: areaCriterion,
    propertyType: propertyTypeCriterion,
    floor: floorCriterion,
    balcony: balconyCriterion
  };

  return {
    hardPass: true,
    score: totalScore,
    criteria,
    matchingCriteria,
    comparisonRows: criteria,
    badge,
    level
  };
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
    teamMembers.forEach((member) => memberNameMap.set(member.id, member.name));
  }

  requests.forEach((request) => {
    if (request.status !== ACTIVE_LISTING) return;

    properties.forEach((property) => {
      const evaluated = evaluateMatch(request, property);
      if (!evaluated.hardPass || evaluated.score < minScore) return;

      const requestOwnerId = request.user_id;
      const propertyOwnerId = property.user_id;
      const isCrossConsultant = !!(requestOwnerId && propertyOwnerId && requestOwnerId !== propertyOwnerId);

      const reasons = evaluated.criteria
        .filter((criterion) => criterion.status !== 'fail')
        .slice(0, 5)
        .map((criterion) => criterion.label);

      matches.push({
        request,
        property,
        score: evaluated.score,
        reasons,
        matchReasons: reasons,
        criteria: evaluated.criteria,
        matchingCriteria: evaluated.matchingCriteria,
        comparisonRows: evaluated.comparisonRows,
        badge: evaluated.badge,
        level: evaluated.level,
        requestOwnerName: requestOwnerId ? memberNameMap.get(requestOwnerId) : undefined,
        propertyOwnerName: propertyOwnerId ? memberNameMap.get(propertyOwnerId) : undefined,
        isCrossConsultant
      });
    });
  });

  return matches.sort((left, right) => right.score - left.score);
};
