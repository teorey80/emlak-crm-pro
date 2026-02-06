// Emlak İlan Giriş Sabitleri - Sahibinden.com Uyumlu

// ===================== KATEGORİ HİYERARŞİSİ =====================

export const PROPERTY_CATEGORIES = {
  KONUT: {
    label: 'Konut',
    subCategories: ['Satılık', 'Kiralık', 'Devren Satılık'],
    types: [
      'Daire', 'Rezidans', 'Müstakil Ev', 'Villa', 'Çiftlik Evi',
      'Köşk & Konak', 'Yalı', 'Yalı Dairesi', 'Yazlık', 'Kooperatif'
    ]
  },
  ISYERI: {
    label: 'İşyeri',
    subCategories: ['Satılık', 'Kiralık', 'Devren Satılık', 'Devren Kiralık'],
    types: [
      'Akaryakıt İstasyonu', 'Apartman Dairesi', 'Atölye', 'AVM', 'Büfe',
      'Büro & Ofis', 'Çiftlik', 'Depo & Antrepo', 'Düğün Salonu',
      'Dükkan & Mağaza', 'Enerji Santrali', 'Fabrika & Üretim Tesisi',
      'Hastane & Sağlık Tesisi', 'Hotel & Apart', 'İmalathane', 'Okul & Kurs',
      'Plaza & İş Merkezi', 'Restaurant & Lokanta', 'Showroom', 'Villa', 'Diğer'
    ]
  },
  ARSA: {
    label: 'Arsa',
    subCategories: ['Kat Karşılığı', 'Satılık', 'Kiralık'],
    types: ['Arsa', 'Tarla', 'Bağ & Bahçe', 'Çiftlik']
  }
};

// ===================== ODA SAYISI =====================

export const ROOM_OPTIONS = [
  { value: '1+0', label: 'Stüdyo (1+0)' },
  { value: '1+1', label: '1+1' },
  { value: '1.5+1', label: '1.5+1' },
  { value: '2+0', label: '2+0' },
  { value: '2+1', label: '2+1' },
  { value: '2.5+1', label: '2.5+1' },
  { value: '2+2', label: '2+2' },
  { value: '3+0', label: '3+0' },
  { value: '3+1', label: '3+1' },
  { value: '3.5+1', label: '3.5+1' },
  { value: '3+2', label: '3+2' },
  { value: '4+0', label: '4+0' },
  { value: '4+1', label: '4+1' },
  { value: '4.5+1', label: '4.5+1' },
  { value: '4+2', label: '4+2' },
  { value: '4+3', label: '4+3' },
  { value: '5+1', label: '5+1' },
  { value: '5+2', label: '5+2' },
  { value: '5+3', label: '5+3' },
  { value: '6+1', label: '6+1' },
  { value: '6+2', label: '6+2' },
  { value: '6+3', label: '6+3' },
  { value: '7+1', label: '7+1' },
  { value: '7+2', label: '7+2' },
  { value: '7+3', label: '7 ve üzeri' },
];

// ===================== BİNA YAŞI =====================

export const BUILDING_AGE_OPTIONS = [
  { value: 0, label: '0 (Sıfır)' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5-10 arası' },
  { value: 11, label: '11-15 arası' },
  { value: 16, label: '16-20 arası' },
  { value: 21, label: '21-25 arası' },
  { value: 26, label: '26-30 arası' },
  { value: 31, label: '31 ve üzeri' },
];

// ===================== KAT SEÇENEKLERİ =====================

export const FLOOR_OPTIONS = [
  { value: -2, label: 'Bodrum ve Altı' },
  { value: -1, label: 'Bodrum Kat' },
  { value: 0, label: 'Zemin Kat' },
  { value: -10, label: 'Bahçe Katı' },
  { value: -11, label: 'Yüksek Giriş' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: `${i + 1}. Kat` })),
  { value: 99, label: 'Çatı Katı' },
];

export const FLOOR_COUNT_OPTIONS = [
  ...Array.from({ length: 40 }, (_, i) => ({ value: i + 1, label: `${i + 1}` })),
];

// ===================== ISITMA =====================

export const HEATING_OPTIONS = [
  'Yok',
  'Soba',
  'Doğalgaz (Kombi)',
  'Kat Kaloriferi',
  'Merkezi',
  'Merkezi (Pay Ölçer)',
  'Klima',
  'Fancoil Ünite',
  'Güneş Enerjisi',
  'Yerden Isıtma',
  'Jeotermal',
  'Elektrikli Radyatör',
  'VRV',
  'Isı Pompası',
];

// ===================== BANYO SAYISI =====================

export const BATHROOM_OPTIONS = [
  { value: 0, label: 'Yok' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5+' },
];

// ===================== MUTFAK =====================

export const KITCHEN_OPTIONS = [
  'Açık Mutfak',
  'Kapalı Mutfak',
  'Amerikan Mutfak',
  'Ankastre',
];

// ===================== BALKON =====================

export const BALCONY_OPTIONS = [
  { value: 0, label: 'Yok' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

// ===================== OTOPARK =====================

export const PARKING_OPTIONS = [
  'Yok',
  'Açık Otopark',
  'Kapalı Otopark',
  'Açık & Kapalı Otopark',
];

// ===================== KULLANIM DURUMU =====================

export const USAGE_STATUS_OPTIONS = [
  'Boş',
  'Kiracılı',
  'Mülk Sahibi Oturuyor',
];

// ===================== TAPU DURUMU =====================

export const DEED_STATUS_OPTIONS = [
  'Kat Mülkiyetli',
  'Kat İrtifaklı',
  'Hisseli Tapu',
  'Müstakil Tapulu',
  'Kooperatif',
  'Tahsis',
];

// ===================== GAYRİMENKUL SAHİBİ =====================

export const OWNER_TYPE_OPTIONS = [
  'Mülk Sahibi',
  'Vasi',
  'Yetkili',
  'Vekil',
];

// ===================== KİMDEN =====================

export const LISTING_SOURCE_OPTIONS = [
  'Emlak Ofisinden',
  'Sahibinden',
  'İnşaat Firmasından',
  'Bankadan',
];

// ===================== İMAR DURUMU (ARSA) =====================

export const ZONING_OPTIONS = [
  'Konut',
  'Ticaret',
  'Konut + Ticaret',
  'Sanayi',
  'Turizm',
  'Tarım',
  'Zeytinlik',
  'Orman',
  'Arazi',
  'Sağlık',
  'Eğitim',
  'Enerji',
  'Diğer',
];

// ===================== KAKS (EMSAL) =====================

export const KAKS_OPTIONS = [
  { value: '', label: 'Belirtilmemiş' },
  { value: '0.05', label: '0.05' },
  { value: '0.10', label: '0.10' },
  { value: '0.15', label: '0.15' },
  { value: '0.20', label: '0.20' },
  { value: '0.25', label: '0.25' },
  { value: '0.30', label: '0.30' },
  { value: '0.40', label: '0.40' },
  { value: '0.50', label: '0.50' },
  { value: '0.60', label: '0.60' },
  { value: '0.70', label: '0.70' },
  { value: '0.80', label: '0.80' },
  { value: '0.90', label: '0.90' },
  { value: '1.00', label: '1.00' },
  { value: '1.25', label: '1.25' },
  { value: '1.50', label: '1.50' },
  { value: '1.75', label: '1.75' },
  { value: '2.00', label: '2.00' },
  { value: '2.50', label: '2.50' },
  { value: '3.00', label: '3.00' },
  { value: '4.00', label: '4.00' },
  { value: '5.00', label: '5.00' },
];

// ===================== GABARİ =====================

export const GABARI_OPTIONS = [
  { value: '', label: 'Belirtilmemiş' },
  { value: '3.50', label: '3.50 m' },
  { value: '6.50', label: '6.50 m' },
  { value: '9.50', label: '9.50 m' },
  { value: '12.50', label: '12.50 m' },
  { value: '15.50', label: '15.50 m' },
  { value: '18.50', label: '18.50 m' },
  { value: '21.50', label: '21.50 m' },
  { value: '24.50', label: '24.50 m' },
  { value: 'Serbest', label: 'Serbest' },
];

// ===================== CEPHE =====================

export const FACADE_OPTIONS = [
  'Kuzey',
  'Güney',
  'Doğu',
  'Batı',
  'Kuzey-Doğu',
  'Kuzey-Batı',
  'Güney-Doğu',
  'Güney-Batı',
];

// ===================== İÇ ÖZELLİKLER =====================

export const INTERIOR_FEATURES = [
  'ADSL',
  'Ahşap Doğrama',
  'Akıllı Ev',
  'Alarm (Hırsız)',
  'Alarm (Yangın)',
  'Alaturka Tuvalet',
  'Alüminyum Doğrama',
  'Amerikan Kapı',
  'Amerikan Mutfak',
  'Ankastre Fırın',
  'Barbekü',
  'Beyaz Eşya',
  'Boyalı',
  'Bulaşık Makinesi',
  'Buzdolabı',
  'Çamaşır Kurutma Makinesi',
  'Çamaşır Makinesi',
  'Çamaşır Odası',
  'Çelik Kapı',
  'Duşakabin',
  'Duvar Kağıdı',
  'Ebeveyn Banyosu',
  'Fırın',
  'Fiber İnternet',
  'Giyinme Odası',
  'Gömme Dolap',
  'Görüntülü Diyafon',
  'Hilton Banyo',
  'Intercom Sistemi',
  'Isıcam',
  'Jakuzi',
  'Kartonpiyer',
  'Kiler',
  'Klima',
  'Küvet',
  'Laminat Zemin',
  'Marley',
  'Mobilya',
  'Mutfak (Ankastre)',
  'Mutfak (Laminat)',
  'Mutfak Doğalgazı',
  'Panjur / Jaluzi',
  'Parke Zemin',
  'PVC Doğrama',
  'Seramik Zemin',
  'Set Üstü Ocak',
  'Spot Aydınlatma',
  'Şofben',
  'Şömine',
  'Teras',
  'Termosifon',
  'Vestiyer',
  'Wi-Fi',
  'Yüz Tanıma & Parmak İzi',
];

// ===================== DIŞ ÖZELLİKLER =====================

export const EXTERIOR_FEATURES = [
  '24 Saat Güvenlik',
  'Apartman Görevlisi',
  'Asansör',
  'Buhar Odası',
  'Çocuk Oyun Parkı',
  'Fitness',
  'Hidrofor',
  'Isı Yalıtımı',
  'Jeneratör',
  'Kablo TV',
  'Kamera Sistemi',
  'Kapıcı',
  'Kreş',
  'Müstakil Havuzlu',
  'Otomatik Kapı',
  'Sauna',
  'Ses Yalıtımı',
  'Siding',
  'Sığınak',
  'Spor Alanı',
  'Su Deposu',
  'Tenis Kortu',
  'Uydu',
  'Yangın Merdiveni',
  'Yüzme Havuzu (Açık)',
  'Yüzme Havuzu (Kapalı)',
];

// ===================== MUHİT =====================

export const NEIGHBORHOOD_FEATURES = [
  'Alışveriş Merkezi',
  'Belediye',
  'Cami',
  'Cemevi',
  'Denize Sıfır',
  'Eczane',
  'Eğlence Merkezi',
  'Fuar',
  'Göle Sıfır',
  'Hastane',
  'Havra',
  'İlkokul - Ortaokul',
  'İtfaiye',
  'Kilise',
  'Lise',
  'Market',
  'Park',
  'Plaj',
  'Polis Merkezi',
  'Sağlık Ocağı',
  'Semt Pazarı',
  'Spor Salonu',
  'Şehir Merkezi',
  'Üniversite',
];

// ===================== ULAŞIM =====================

export const TRANSPORTATION_FEATURES = [
  'Anayol',
  'Avrasya Tüneli',
  'Boğaz Köprüleri',
  'Cadde',
  'Deniz Otobüsü',
  'Dolmuş',
  'E-5',
  'Havaalanı',
  'İskele',
  'Marmaray',
  'Metro',
  'Metrobüs',
  'Minibüs',
  'Otobüs Durağı',
  'Sahil',
  'Teleferik',
  'TEM',
  'Tramvay',
  'Tren İstasyonu',
  'Troleybüs',
];

// ===================== MANZARA =====================

export const VIEW_FEATURES = [
  'Boğaz',
  'Deniz',
  'Doğa',
  'Göl',
  'Havuz',
  'Nehir',
  'Park & Yeşil Alan',
  'Şehir',
];

// ===================== KONUT TİPİ =====================

export const RESIDENCE_TYPE_OPTIONS = [
  'Ara Kat',
  'Ara Kat Dubleks',
  'Bahçe Dubleksi',
  'Bahçe Katı',
  'Bodrum',
  'Çatı Dubleksi',
  'Çatı Katı',
  'Dubleks',
  'En Üst Kat',
  'Forleks',
  'Giriş Katı',
  'Ters Dubleks',
  'Tripleks',
  'Zemin Kat',
];

// ===================== ENGELLİYE VE YAŞLIYA UYGUN =====================

export const ACCESSIBILITY_FEATURES = [
  'Araç Park Yeri',
  'Engelliye Uygun Asansör',
  'Engelliye Uygun Banyo',
  'Engelliye Uygun Mutfak',
  'Engelliye Uygun Park',
  'Geniş Koridor',
  'Giriş / Rampa',
  'Merdiven',
  'Oda Kapısı',
  'Priz / Elektrik Anahtarı',
  'Tutamak / Korkuluk',
  'Tuvalet',
  'Yüzme Havuzu',
];

// ===================== ARSA - ALTYAPI =====================

export const LAND_INFRASTRUCTURE_FEATURES = [
  'Elektrik',
  'Sanayi Elektriği',
  'Su',
  'Telefon',
  'Doğalgaz',
  'Kanalizasyon',
  'Arıtma',
  'Sondaj & Kuyu',
  'Zemin Etüdü',
  'Yolu Açılmış',
  'Yolu Açılmamış',
  'Yolu Yok',
];

// ===================== ARSA - KONUM =====================

export const LAND_LOCATION_FEATURES = [
  'Ana Yola Yakın',
  'Denize Sıfır',
  'Denize Yakın',
  'Havaalanına Yakın',
  'Toplu Ulaşıma Yakın',
  'Şehir Merkezinde',
  'Köy İçinde',
];

// ===================== ARSA - GENEL ÖZELLİKLER =====================

export const LAND_GENERAL_FEATURES = [
  'İfrazlı',
  'Parselli',
  'Projeli',
  'Köşe Parsel',
  'Kadastro Yolu Var',
  'Müstakil Parsel',
  'Hisseli',
];

// ===================== İŞYERİ - DETAY ÖZELLİKLERİ =====================

export const WORKPLACE_FEATURES = [
  'ADSL',
  'Asansör',
  'Beyaz Eşya',
  'Buzdolabı',
  'Çelik Kapı',
  'Fiber İnternet',
  'Görüntülü Diyafon',
  'Intercom Sistemi',
  'Isı Yalıtımı',
  'Jeneratör',
  'Klima',
  'Mobilya',
  'Mutfak',
  'Otopark',
  'Panel Kapı',
  'Parke Zemin',
  'PVC Doğrama',
  'Seramik Zemin',
  'Ses Yalıtımı',
  'WC',
  'Wi-Fi',
  'Yangın Merdiveni',
];

// ===================== FORM ADIM YAPISI =====================

export const FORM_STEPS = {
  KONUT: [
    { id: 'basic', title: 'Temel Bilgiler', icon: 'FileText' },
    { id: 'structure', title: 'Yapı Özellikleri', icon: 'Building' },
    { id: 'location', title: 'Konum Bilgileri', icon: 'MapPin' },
    { id: 'features', title: 'Detaylı Özellikler', icon: 'List' },
    { id: 'photos', title: 'Fotoğraflar', icon: 'Image' },
  ],
  ISYERI: [
    { id: 'basic', title: 'Temel Bilgiler', icon: 'FileText' },
    { id: 'structure', title: 'Yapı Özellikleri', icon: 'Building' },
    { id: 'location', title: 'Konum Bilgileri', icon: 'MapPin' },
    { id: 'features', title: 'Detaylı Özellikler', icon: 'List' },
    { id: 'photos', title: 'Fotoğraflar', icon: 'Image' },
  ],
  ARSA: [
    { id: 'basic', title: 'Temel Bilgiler', icon: 'FileText' },
    { id: 'land', title: 'Arsa Bilgileri', icon: 'Map' },
    { id: 'location', title: 'Konum Bilgileri', icon: 'MapPin' },
    { id: 'features', title: 'Detaylı Özellikler', icon: 'List' },
    { id: 'photos', title: 'Fotoğraflar', icon: 'Image' },
  ],
};

// ===================== DEFAULT FORM VALUES =====================

export const DEFAULT_PROPERTY_VALUES = {
  title: '',
  description: '',
  price: 0,
  currency: 'TL',
  category: 'KONUT',
  subCategory: 'Satılık',
  type: 'Daire',
  grossArea: 0,
  netArea: 0,
  rooms: '',
  buildingAge: 0,
  currentFloor: 0,
  floorCount: 1,
  heating: '',
  bathrooms: 1,
  kitchen: '',
  balcony: 0,
  elevator: 'Yok',
  parking: 'Yok',
  furnished: false,
  usageStatus: 'Boş',
  dues: 0,
  creditEligible: false,
  ownerType: 'Mülk Sahibi',
  deedStatus: 'Kat Mülkiyetli',
  propertyNumber: '',
  listingSource: 'Emlak Ofisinden',
  exchange: 'Hayır',
  city: '',
  district: '',
  neighborhood: '',
  isInSite: false,
  siteName: '',
  facades: [],
  interiorFeatures: [],
  exteriorFeatures: [],
  neighborhoodFeatures: [],
  transportationFeatures: [],
  viewFeatures: [],
  residenceType: '',
  accessibilityFeatures: [],
  images: [],
  // Arsa specific
  zoningStatus: '',
  blockNo: '',
  parcelNo: '',
  sheetNo: '',
  kaks: '',
  gabari: '',
  landInfrastructure: [],
  landLocation: [],
  landGeneralFeatures: [],
};
