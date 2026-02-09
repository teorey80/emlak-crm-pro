
export interface OfficePerformanceSettings {
  showListingCount: boolean;
  showSalesCount: boolean;
  showRentalCount: boolean;
  showRevenue: boolean;
  showCommission: boolean;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  type: string; // Daire, Villa, Rezidans, Büro & Ofis, Arsa, etc.
  status: string; // Satılık, Kiralık, Devren Satılık, etc.
  rooms: string;
  area: number; // Net m2 for list view
  bathrooms: number;
  heating: string;
  site?: string;
  images: string[];
  description: string;
  coordinates: { lat: number; lng: number };

  // Kategori Sistemi (Sahibinden uyumlu)
  category?: 'KONUT' | 'ISYERI' | 'ARSA';
  subCategory?: string; // Satılık, Kiralık, Devren, Kat Karşılığı

  // Alan Bilgileri
  grossArea?: number; // Brüt m²
  netArea?: number; // Net m²
  openArea?: number; // Açık alan m²

  // Yapı Özellikleri
  buildingAge?: number;
  currentFloor?: number; // Bulunduğu Kat
  floorCount?: number; // Toplam Kat Sayısı
  kitchenType?: string; // Açık, Kapalı, Amerikan, Ankastre
  balcony?: number; // Balkon sayısı (0-4+)
  elevator?: string; // Var, Yok
  parking?: string; // Yok, Açık, Kapalı, Açık & Kapalı

  // Durum ve Sahiplik
  furnished?: boolean; // Eşyalı mı
  usageStatus?: string; // Boş, Kiracılı, Mülk Sahibi
  dues?: number; // Aidat
  deposit?: number; // Depozito
  creditEligible?: boolean; // Krediye Uygun
  ownerType?: string; // Mülk Sahibi, Vasi, Yetkili, Vekil
  deedStatus?: string; // Kat Mülkiyetli, Hisseli, vb.
  propertyNumber?: string; // Taşınmaz Numarası
  listingSource?: string; // Kimden: Emlak Ofisinden, Sahibinden
  exchange?: string; // Takaslı: Evet, Hayır

  // Konum Bilgileri
  city?: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  isInSite?: boolean; // Site içinde mi
  siteName?: string; // Site adı

  // Mülk Sahibi Bilgileri
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;

  // Çoklu Seçim Özellikleri (arrays)
  facades?: string[]; // Cephe: Kuzey, Güney, Doğu, Batı
  interiorFeatures?: string[]; // İç Özellikler
  exteriorFeatures?: string[]; // Dış Özellikler
  neighborhoodFeatures?: string[]; // Muhit
  transportationFeatures?: string[]; // Ulaşım
  viewFeatures?: string[]; // Manzara
  residenceType?: string; // Konut Tipi: Dubleks, Tripleks, vb.
  accessibilityFeatures?: string[]; // Engelliye Uygun

  // Arsa Özel Alanları
  zoningStatus?: string; // İmar Durumu
  blockNo?: string; // Ada No
  parcelNo?: string; // Parsel No
  sheetNo?: string; // Pafta No
  kaks?: string; // KAKS (Emsal)
  gabari?: string; // Gabari
  landInfrastructure?: string[]; // Altyapı
  landLocation?: string[]; // Konum özellikleri
  landGeneralFeatures?: string[]; // Genel özellikler

  // İşyeri Özel Alanları
  tenanted?: string; // Kiracılı: Evet, Hayır, Bilinmiyor
  condition?: string; // Durumu: Sıfır, İkinci El
  workplaceFeatures?: string[]; // İşyeri özellikleri

  // Eski alanlar (geriye uyumluluk)
  imarDurumu?: string;
  adaNo?: string;
  paftaNo?: string;
  balkon?: 'Var' | 'Yok';
  asansor?: 'Var' | 'Yok';
  kimden?: string;
  krediyeUygunluk?: 'Evet' | 'Hayır';
  takas?: 'Evet' | 'Hayır';

  // Tarihler
  listingDate?: string;
  listingType?: string;

  // Publishing flags
  publishedOnMarketplace?: boolean;
  publishedOnPersonalSite?: boolean;

  // Multi-User / Office
  officeId?: string;
  office_id?: string;
  user_id?: string;
  visibility?: 'public' | 'private' | 'office_only';

  // Listing Status Management
  listingStatus?: 'Aktif' | 'Pasif' | 'Satıldı' | 'Kiralandı' | 'Kapora Alındı';
  listing_status?: string;

  // Kapora (Deposit) Tracking
  depositAmount?: number;        // Kapora miktarı
  deposit_amount?: number;       // DB field
  depositDate?: string;          // Kapora tarihi
  deposit_date?: string;         // DB field
  depositBuyerId?: string;       // Kapora veren müşteri ID
  deposit_buyer_id?: string;     // DB field
  depositBuyerName?: string;     // Kapora veren müşteri adı
  deposit_buyer_name?: string;   // DB field
  depositNotes?: string;         // Kapora notları
  deposit_notes?: string;        // DB field
  inactiveReason?: string;
  inactive_reason?: string;
  soldDate?: string;
  sold_date?: string;
  rentedDate?: string;
  rented_date?: string;

  // Draft
  isDraft?: boolean;
  lastSavedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Aktif' | 'Potansiyel' | 'Pasif';
  customerType?: 'Alıcı' | 'Satıcı' | 'Kiracı' | 'Kiracı Adayı' | 'Mal Sahibi';
  source: string;
  createdAt: string;
  interactions: Interaction[]; // Kept for backward compatibility but will use global Activities
  avatar: string;

  // Extended fields
  notes?: string;
  hasPets?: boolean;
  petDetails?: string;
  currentHousingStatus?: 'Kiracı' | 'Ev Sahibi' | 'Ailesiyle';
  currentRegion?: string;

  // Professional & Extra
  occupation?: string;
  company?: string;
  birthDate?: string;
  maritalStatus?: 'Evli' | 'Bekar';
  secondPhone?: string;

  // Office
  officeId?: string;
  office_id?: string;
  user_id?: string;
}

export interface Request {
  id: string;
  customerId: string;
  customerName: string;
  type: 'Daire' | 'Villa' | 'Müstakil Ev' | 'Ofis' | 'İşyeri' | 'Arsa';
  requestType: 'Satılık' | 'Kiralık'; // NEW Field
  status: 'Aktif' | 'Pasif' | 'Sonuçlandı';
  minPrice: number;
  maxPrice: number;
  currency: string;
  city: string;
  district: string; // Can be specific district or "Tümü"
  date: string;
  notes?: string;
  minRooms?: string; // e.g. "2+1"
  minArea?: number;
  maxArea?: number;
  maxFloor?: number;
  balconyRequired?: boolean;
  neighborhood?: string;
  siteId?: string; // Requested specific site
  siteName?: string; // For display

  // Office
  office_id?: string;
  user_id?: string;
}

export interface Interaction {
  id: string;
  type: 'Telefon' | 'E-posta' | 'Görüşme' | 'Gösterim';
  date: string;
  note: string;
  icon: string; // icon name
}

export interface Activity {
  id: string;
  type: 'Yer Gösterimi' | 'Gelen Arama' | 'Giden Arama' | 'Ofis Toplantısı' | 'Tapu İşlemi' | 'Kira Kontratı' | 'Kapora Alındı' | 'Diğer';
  customerId: string;
  customerName: string;
  propertyId?: string;
  propertyTitle?: string; // Optional, e.g. just a general meeting
  date: string;
  time?: string; // HH:mm format
  description: string;
  status: 'Olumlu' | 'Olumsuz' | 'Düşünüyor' | 'Tamamlandı' | 'Planlandı';

  // Office
  office_id?: string;
  user_id?: string;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  address: string;
  status: 'Aktif' | 'Pasif';
  createdAt: string;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string; // e.g., "+5%"
  trend?: 'up' | 'down' | 'neutral';
}

export interface WebSiteConfig {
  domain: string;
  siteTitle: string;
  aboutText: string;
  primaryColor: string;
  phone: string;
  email: string;
  logoUrl?: string;
  isActive: boolean;
  layout: 'standard' | 'map' | 'grid';
}



export interface UserProfile {
  id: string; // Add ID
  name: string;
  title: string;
  avatar: string;
  email?: string;
  phone?: string;
  officeId?: string;
  role?: 'broker' | 'consultant' | 'staff';
  siteConfig?: WebSiteConfig;
  // Monthly targets
  monthlyTargets?: {
    salesTarget?: number;      // Aylık satış hedefi (adet)
    revenueTarget?: number;    // Aylık ciro hedefi (TL)
    commissionTarget?: number; // Aylık komisyon hedefi (TL)
  };
  // Subscription
  subscriptionPlan?: PlanType;
  subscription_plan?: string;
  isIndividual?: boolean;
  is_individual?: boolean;
}

export interface Office {
  id: string;
  name: string;
  domain?: string;
  ownerId: string;
  owner_id?: string; // DB field
  logoUrl?: string;
  address?: string;
  phone?: string;
  siteConfig?: WebSiteConfig;
  performance_settings?: OfficePerformanceSettings;
}

// Sale/Income Tracking
export interface SaleExpense {
  id: string;
  type: string;  // Reklam, Ulaşım, Tapu Masrafı, Diğer
  amount: number;
  description?: string;
}

export interface Sale {
  id: string;
  propertyId: string;
  property_id?: string; // DB field
  userId?: string;
  user_id?: string; // DB field
  consultantId?: string; // Who made the sale
  consultant_id?: string; // DB field
  consultantName?: string;
  consultant_name?: string; // DB field
  officeId?: string;
  office_id?: string; // DB field
  createdAt?: string;
  created_at?: string; // DB field

  // Transaction type: sale or rental
  transactionType: 'sale' | 'rental';
  transaction_type?: string; // DB field

  // Sale info (used for both sale and rental)
  salePrice: number; // For rental: total commission amount
  sale_price?: number; // DB field
  saleDate: string; // For rental: lease start date
  sale_date?: string; // DB field
  buyerId?: string; // For rental: tenant ID
  buyer_id?: string; // DB field
  buyerName?: string; // For rental: tenant name
  buyer_name?: string; // DB field

  // Rental specific fields
  monthlyRent?: number; // Aylık kira bedeli
  monthly_rent?: number; // DB field
  depositAmount?: number; // Depozito tutarı
  deposit_amount?: number; // DB field
  leaseDuration?: number; // Kira süresi (ay)
  lease_duration?: number; // DB field
  leaseEndDate?: string; // Kira bitiş tarihi
  lease_end_date?: string; // DB field

  // Commission
  commissionRate: number;  // Percentage (e.g., 3)
  commission_rate?: number; // DB field
  commissionAmount: number;
  commission_amount?: number; // DB field
  buyerCommissionAmount?: number;
  buyer_commission_amount?: number; // DB field
  buyerCommissionRate?: number;
  buyer_commission_rate?: number; // DB field
  sellerCommissionAmount?: number;
  seller_commission_amount?: number; // DB field
  sellerCommissionRate?: number;
  seller_commission_rate?: number; // DB field

  // Expenses
  expenses: SaleExpense[];
  totalExpenses: number;
  total_expenses?: number; // DB field

  // Revenue sharing
  officeShareRate: number;  // Percentage (e.g., 50)
  office_share_rate?: number; // DB field
  consultantShareRate: number;
  consultant_share_rate?: number; // DB field
  officeShareAmount: number;
  office_share_amount?: number; // DB field
  consultantShareAmount: number;
  consultant_share_amount?: number; // DB field
  netProfit: number;
  net_profit?: number; // DB field
  propertyOwnerShareRate?: number; // Cross-commission split %
  property_owner_share_rate?: number; // DB field (optional/future)

  // Notes
  notes?: string;

  // Joined data
  propertyTitle?: string;

  // Partner Office (Ortak Satış)
  hasPartnerOffice?: boolean;
  has_partner_office?: boolean; // DB field
  partnerOfficeName?: string;
  partner_office_name?: string; // DB field
  partnerOfficeContact?: string;
  partner_office_contact?: string; // DB field
  partnerShareType?: 'buyer_commission' | 'total_commission';
  partner_share_type?: string; // DB field
  partnerShareAmount?: number;
  partner_share_amount?: number; // DB field
  partnerShareRate?: number; // Calculated percentage
  partner_share_rate?: number; // DB field
}

// Document Management
export interface Document {
  id: string;
  entityType: 'property' | 'customer' | 'sale';
  entityId: string;
  documentType: string;
  fileName: string;
  fileId: string; // Google Drive file ID
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
  notes?: string;
  // DB fields
  entity_type?: string;
  entity_id?: string;
  document_type?: string;
  file_name?: string;
  file_id?: string;
  mime_type?: string;
  web_view_link?: string;
  web_content_link?: string;
  thumbnail_link?: string;
  file_size?: number;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at?: string;
  office_id?: string;
}

// ==================== SUBSCRIPTION SYSTEM ====================

export type PlanType = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  user_id?: string;
  officeId?: string;
  office_id?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startedAt: string;
  started_at?: string;
  expiresAt?: string;
  expires_at?: string;
  adminNotes?: string;
  admin_notes?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface PlanLimits {
  plan: PlanType;
  maxProperties: number; // -1 = sınırsız
  max_properties?: number;
  maxCustomers: number;  // -1 = sınırsız
  max_customers?: number;
  priceMonthly: number;
  price_monthly?: number;
  description?: string;
}

export interface AdminUser {
  id: string;
  userId: string;
  user_id?: string;
  role: 'admin' | 'super_admin';
  createdAt?: string;
  created_at?: string;
}
