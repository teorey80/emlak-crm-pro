
export interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  type: 'Daire' | 'Villa' | 'Müstakil Ev' | 'Ofis' | 'İşyeri' | 'Arsa';
  status: 'Satılık' | 'Kiralık';
  rooms: string;
  area: number; // This corresponds to Net m2 usually, but we'll keep as generic area for list view
  bathrooms: number;
  heating: string;
  site?: string;
  images: string[];
  description: string;
  coordinates: { lat: number; lng: number };

  // Extended fields for Detail/Form
  grossArea?: number;
  netArea?: number;
  openArea?: number;
  buildingAge?: number;
  floorCount?: number;
  kitchenType?: string;
  parking?: string;
  furnished?: string;
  usageStatus?: string;
  deedStatus?: string;
  ownerId?: string;
  ownerName?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  dues?: number;
  deposit?: number;
  listingDate?: string;
  isInSite?: boolean;

  // Publishing flags
  publishedOnMarketplace?: boolean;
  publishedOnPersonalSite?: boolean;

  // Additional property features
  currentFloor?: number; // Bulunduğu Kat
  balkon?: 'Var' | 'Yok';
  asansor?: 'Var' | 'Yok';
  kimden?: 'Emlak Ofisinden' | 'Sahibinden' | 'İnşaat Firmasından';
  krediyeUygunluk?: 'Evet' | 'Hayır';
  takas?: 'Evet' | 'Hayır';

  // Arsa (Land) specific fields
  imarDurumu?: string;
  adaNo?: string;
  parselNo?: string;
  paftaNo?: string;
  kaks?: number;
  gabari?: number;

  // Multi-User / Office
  officeId?: string;
  office_id?: string; // DB field
  user_id?: string; // listing agent id
  visibility?: 'public' | 'private' | 'office_only';

  // Listing Status Management
  listingStatus?: 'Aktif' | 'Pasif' | 'Satıldı' | 'Kiralandı';
  listing_status?: string; // DB field
  inactiveReason?: string;
  inactive_reason?: string; // DB field
  soldDate?: string;
  sold_date?: string; // DB field
  rentedDate?: string;
  rented_date?: string; // DB field
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
  type: 'Yer Gösterimi' | 'Gelen Arama' | 'Giden Arama' | 'Ofis Toplantısı' | 'Tapu İşlemi' | 'Diğer';
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

  // Sale info
  salePrice: number;
  sale_price?: number; // DB field
  saleDate: string;
  sale_date?: string; // DB field
  buyerId?: string;
  buyer_id?: string; // DB field
  buyerName?: string;
  buyer_name?: string; // DB field

  // Commission
  commissionRate: number;  // Percentage (e.g., 3)
  commission_rate?: number; // DB field
  commissionAmount: number;
  commission_amount?: number; // DB field

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

  // Notes
  notes?: string;

  // Joined data
  propertyTitle?: string;
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