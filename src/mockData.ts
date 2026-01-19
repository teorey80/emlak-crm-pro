
import { Property, Customer, Site, Activity, Request } from './types';

// More reliable image sources for real estate
const IMAGES = {
  luxuryHome: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop',
  apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600&auto=format&fit=crop',
  villa: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop',
  detached: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop',
  interior1: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=1600&auto=format&fit=crop',
  interior2: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?q=80&w=1600&auto=format&fit=crop'
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '20240715-001',
    title: "Şişli'de Lüks Rezidans Dairesi",
    price: 15500000,
    currency: 'TL',
    location: 'Merkez, Şişli, İstanbul',
    type: 'Daire',
    status: 'Satılık',
    rooms: '3+1',
    area: 120,
    bathrooms: 2,
    heating: 'Doğal Gaz',
    site: 'Sarı Konaklar',
    images: [
      IMAGES.luxuryHome,
      IMAGES.interior1,
      IMAGES.interior2
    ],
    description: 'Şehrin kalbinde, panoramik manzaralı, ultra lüks tasarım daire. 24 saat güvenlik, kapalı otopark ve sosyal tesis imkanları ile konforlu bir yaşam sizi bekliyor.',
    coordinates: { lat: 41.0522, lng: 28.9850 },
    city: 'İstanbul',
    district: 'Şişli',
    neighborhood: 'Merkez'
  },
  {
    id: '20240715-002',
    title: 'Çankaya Gül Sokak Fırsat Daire',
    price: 5000000,
    currency: 'TL',
    location: 'Çankaya, Ankara',
    type: 'Daire',
    status: 'Satılık',
    rooms: '2+1',
    area: 95,
    bathrooms: 1,
    heating: 'Kombi',
    images: [IMAGES.apartment],
    description: 'Merkezi konumda ferah daire. Toplu taşımaya yakın, yatırımlık.',
    coordinates: { lat: 39.9208, lng: 32.8541 },
    city: 'Ankara',
    district: 'Çankaya'
  },
  {
    id: '20240715-003',
    title: 'Bebek Deniz Manzaralı Villa',
    price: 12000000,
    currency: 'TL',
    location: 'Bebek, İstanbul',
    type: 'Villa',
    status: 'Kiralık',
    rooms: '5+1',
    area: 350,
    bathrooms: 3,
    heating: 'Yerden Isıtma',
    images: [IMAGES.villa],
    description: 'Boğaz manzaralı, özel havuzlu ve bahçeli müstakil villa.',
    coordinates: { lat: 41.0768, lng: 29.0429 },
    city: 'İstanbul',
    district: 'Beşiktaş'
  },
    {
    id: '20240715-004',
    title: 'Urla Doğayla İç İçe Taş Ev',
    price: 8000000,
    currency: 'TL',
    location: 'Urla, İzmir',
    type: 'Müstakil Ev',
    status: 'Satılık',
    rooms: '3+1',
    area: 150,
    bathrooms: 2,
    heating: 'Klima',
    images: [IMAGES.detached],
    description: 'Doğa ile iç içe huzurlu yaşam arayanlar için özel mimari taş ev.',
    coordinates: { lat: 38.3229, lng: 26.7635 },
    city: 'İzmir',
    district: 'Urla'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Ayşe Yılmaz',
    email: 'ayse.yilmaz@example.com',
    phone: '0555 123 45 67',
    status: 'Aktif',
    source: 'Web Sitesi',
    createdAt: '2024-01-15',
    avatar: 'https://i.pravatar.cc/150?u=1',
    interactions: []
  },
  {
    id: '2',
    name: 'Elif Demir',
    email: 'elif.demir@email.com',
    phone: '555-123-4567',
    status: 'Aktif',
    source: 'Web Sitesi',
    createdAt: '2024-01-15',
    avatar: 'https://i.pravatar.cc/150?u=2',
    interactions: []
  },
  {
    id: '3',
    name: 'Can Yılmaz',
    email: 'can.yilmaz@email.com',
    phone: '555-987-6543',
    status: 'Potansiyel',
    source: 'Tavsiye',
    createdAt: '2024-02-20',
    avatar: 'https://i.pravatar.cc/150?u=3',
    interactions: []
  },
   {
    id: '4',
    name: 'Mehmet Özcan',
    email: 'mehmet.ozcan@email.com',
    phone: '555-369-1470',
    status: 'Pasif',
    source: 'Sosyal Medya',
    createdAt: '2024-04-05',
    avatar: 'https://i.pravatar.cc/150?u=4',
    interactions: []
  }
];

export const MOCK_SITES: Site[] = [
    {
        id: '1',
        name: 'Gülbahçe Konakları',
        region: 'Kadıköy',
        address: 'Gülbahçe Mahallesi, İstanbul',
        status: 'Aktif',
        createdAt: '2023-01-15'
    },
    {
        id: '2',
        name: 'Deniz Manzaralı Evler',
        region: 'Büyükçekmece',
        address: 'Deniz Manzaralı Caddesi, İstanbul',
        status: 'Aktif',
        createdAt: '2023-02-20'
    },
    {
        id: '3',
        name: 'Orman Evleri',
        region: 'Şile',
        address: 'Orman Yolu, İstanbul',
        status: 'Pasif',
        createdAt: '2023-03-10'
    }
];

export const MOCK_ACTIVITIES: Activity[] = [
    {
        id: '101',
        type: 'Yer Gösterimi',
        customerId: '1', // Ayşe Yılmaz
        customerName: 'Ayşe Yılmaz',
        propertyId: '20240715-001', // Şişli Rezidans
        propertyTitle: "Şişli'de Lüks Rezidans Dairesi",
        date: '2024-07-28',
        description: 'Müşteri salonu çok beğendi ancak mutfağı küçük buldu. Fiyatta pazarlık istiyor.',
        status: 'Düşünüyor'
    },
    {
        id: '102',
        type: 'Telefon Görüşmesi',
        customerId: '2', // Elif Demir
        customerName: 'Elif Demir',
        date: '2024-07-29',
        description: 'Yeni portföyler hakkında bilgilendirme yapıldı.',
        status: 'Tamamlandı'
    },
    {
        id: '103',
        type: 'Yer Gösterimi',
        customerId: '1', // Ayşe Yılmaz
        customerName: 'Ayşe Yılmaz',
        propertyId: '20240715-003', // Bebek Villa
        propertyTitle: '456 Deniz Caddesi, İstanbul',
        date: '2024-07-30',
        description: 'Müşteri manzaraya bayıldı. Kiralamak için evrakları hazırlayacak.',
        status: 'Olumlu'
    }
];

export const MOCK_REQUESTS: Request[] = [
    {
        id: 'req-1',
        customerId: '1',
        customerName: 'Ayşe Yılmaz',
        type: 'Daire',
        status: 'Aktif',
        minPrice: 10000000,
        maxPrice: 20000000,
        currency: 'TL',
        city: 'İstanbul',
        district: 'Şişli',
        minRooms: '3+1',
        date: '2024-07-20',
        notes: 'Merkezi, otoparklı ve yeni bina arıyor.'
    },
    {
        id: 'req-2',
        customerId: '3',
        customerName: 'Can Yılmaz',
        type: 'Villa',
        status: 'Aktif',
        minPrice: 10000000,
        maxPrice: 30000000,
        currency: 'TL',
        city: 'İstanbul',
        district: 'Beşiktaş',
        date: '2024-08-01',
        notes: 'Boğaz manzaralı müstakil ev arıyor.'
    },
     {
        id: 'req-3',
        customerId: '2',
        customerName: 'Elif Demir',
        type: 'Daire',
        status: 'Aktif',
        minPrice: 4000000,
        maxPrice: 6000000,
        currency: 'TL',
        city: 'Ankara',
        district: 'Çankaya',
        date: '2024-08-05',
        notes: 'Yatırımlık 2+1 daire.'
    }
];
