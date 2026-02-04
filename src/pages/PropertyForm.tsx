import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ImagePlus, Trash2, MapPin, Wand2, Loader2, Link, FileText,
  UserPlus, X, ChevronLeft, ChevronRight, Check, Building,
  List, Image, Home, Briefcase, Map, Save, Search, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { Property, Customer } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateRealEstateAdvice } from '../services/geminiService';
import {
  PROPERTY_CATEGORIES,
  ROOM_OPTIONS,
  BUILDING_AGE_OPTIONS,
  FLOOR_OPTIONS,
  FLOOR_COUNT_OPTIONS,
  HEATING_OPTIONS,
  BATHROOM_OPTIONS,
  KITCHEN_OPTIONS,
  BALCONY_OPTIONS,
  PARKING_OPTIONS,
  USAGE_STATUS_OPTIONS,
  DEED_STATUS_OPTIONS,
  OWNER_TYPE_OPTIONS,
  LISTING_SOURCE_OPTIONS,
  ZONING_OPTIONS,
  KAKS_OPTIONS,
  GABARI_OPTIONS,
  FACADE_OPTIONS,
  INTERIOR_FEATURES,
  EXTERIOR_FEATURES,
  NEIGHBORHOOD_FEATURES,
  TRANSPORTATION_FEATURES,
  VIEW_FEATURES,
  RESIDENCE_TYPE_OPTIONS,
  ACCESSIBILITY_FEATURES,
  LAND_INFRASTRUCTURE_FEATURES,
  LAND_LOCATION_FEATURES,
  LAND_GENERAL_FEATURES,
  WORKPLACE_FEATURES,
} from '../constants/propertyConstants';
import { PROVINCES, getDistricts, getProvinceCoordinates } from '../constants/turkeyLocations';

const PropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addProperty, updateProperty, properties, customers, addCustomer, session } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI states
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);

  // URL Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Owner Modal
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');

  // Location states
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<Property>>({
    id: `PRT-${Date.now().toString().slice(-6)}`,
    title: '',
    description: '',
    price: 0,
    currency: 'TL',
    category: 'KONUT',
    subCategory: 'Satılık',
    type: 'Daire',
    status: 'Satılık',
    grossArea: 0,
    netArea: 0,
    rooms: '',
    buildingAge: 0,
    currentFloor: 0,
    floorCount: 1,
    heating: '',
    bathrooms: 1,
    kitchenType: '',
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
    zoningStatus: '',
    blockNo: '',
    parcelNo: '',
    sheetNo: '',
    kaks: '',
    gabari: '',
    landInfrastructure: [],
    landLocation: [],
    landGeneralFeatures: [],
    workplaceFeatures: [],
    coordinates: { lat: 41.0082, lng: 28.9784 },
    listingDate: new Date().toISOString().split('T')[0],
  });

  // Load existing property for edit mode
  useEffect(() => {
    if (id) {
      const existingProperty = properties.find(p => p.id === id);
      if (existingProperty) {
        setFormData({
          ...existingProperty,
          category: existingProperty.category || 'KONUT',
          subCategory: existingProperty.subCategory || existingProperty.status || 'Satılık',
        });
      }
    }
  }, [id, properties]);

  // Fetch neighborhoods when city and district change
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      if (!formData.city || !formData.district) {
        setNeighborhoods([]);
        return;
      }

      setLoadingNeighborhoods(true);
      try {
        // Use TurkiyeAPI to fetch neighborhoods
        const response = await fetch(
          `https://api.turkiyeapi.dev/api/v1/neighborhoods?province=${encodeURIComponent(formData.city)}&district=${encodeURIComponent(formData.district)}&limit=500`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.data) {
            const neighborhoodNames = data.data.map((n: any) => n.name).sort((a: string, b: string) => a.localeCompare(b, 'tr'));
            setNeighborhoods(neighborhoodNames);
          }
        }
      } catch (error) {
        console.error('Mahalle verisi alınamadı:', error);
        setNeighborhoods([]);
      } finally {
        setLoadingNeighborhoods(false);
      }
    };

    fetchNeighborhoods();
  }, [formData.city, formData.district]);

  // Address search with Nominatim geocoding
  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) return;

    setSearchingAddress(true);
    try {
      // Build search query with city/district context
      const searchQuery = [
        addressSearch,
        formData.neighborhood,
        formData.district,
        formData.city,
        'Türkiye'
      ].filter(Boolean).join(', ');

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=tr`,
        {
          headers: {
            'Accept-Language': 'tr'
          }
        }
      );

      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const { lat, lon, display_name } = results[0];
          handleChange('coordinates', {
            lat: parseFloat(lat),
            lng: parseFloat(lon)
          });
          toast.success(`Konum bulundu: ${display_name.split(',').slice(0, 2).join(',')}`);
        } else {
          toast.error('Adres bulunamadı. Farklı bir adres deneyin.');
        }
      }
    } catch (error) {
      console.error('Adres arama hatası:', error);
      toast.error('Adres arama sırasında hata oluştu');
    } finally {
      setSearchingAddress(false);
    }
  };

  // Get steps based on category
  const getSteps = () => {
    const baseSteps = [
      { id: 'category', title: 'Kategori', icon: Home },
      { id: 'basic', title: 'Temel Bilgiler', icon: FileText },
    ];

    if (formData.category === 'ARSA') {
      return [
        ...baseSteps,
        { id: 'land', title: 'Arsa Bilgileri', icon: Map },
        { id: 'location', title: 'Konum', icon: MapPin },
        { id: 'features', title: 'Özellikler', icon: List },
        { id: 'photos', title: 'Fotoğraflar', icon: Image },
      ];
    } else if (formData.category === 'ISYERI') {
      return [
        ...baseSteps,
        { id: 'structure', title: 'Yapı Bilgileri', icon: Building },
        { id: 'location', title: 'Konum', icon: MapPin },
        { id: 'features', title: 'Özellikler', icon: List },
        { id: 'photos', title: 'Fotoğraflar', icon: Image },
      ];
    }
    // KONUT
    return [
      ...baseSteps,
      { id: 'structure', title: 'Yapı Bilgileri', icon: Building },
      { id: 'location', title: 'Konum', icon: MapPin },
      { id: 'features', title: 'Özellikler', icon: List },
      { id: 'photos', title: 'Fotoğraflar', icon: Image },
    ];
  };

  const steps = getSteps();

  const handleChange = (field: keyof Property, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof Property, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    if (currentArray.includes(value)) {
      handleChange(field, currentArray.filter(v => v !== value));
    } else {
      handleChange(field, [...currentArray, value]);
    }
  };

  // AI Description Generator
  const handleGenerateDescription = async () => {
    if (!formData.type && !formData.city) {
      toast.error('Lütfen önce emlak tipi ve konum bilgilerini doldurun');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const propertyInfo = [
        formData.category && `Kategori: ${PROPERTY_CATEGORIES[formData.category as keyof typeof PROPERTY_CATEGORIES]?.label}`,
        formData.type && `Emlak Tipi: ${formData.type}`,
        formData.subCategory && `İşlem: ${formData.subCategory}`,
        formData.rooms && `Oda Sayısı: ${formData.rooms}`,
        formData.bathrooms && `Banyo: ${formData.bathrooms}`,
        formData.netArea && `Net Alan: ${formData.netArea} m²`,
        formData.grossArea && `Brüt Alan: ${formData.grossArea} m²`,
        formData.city && formData.district && `Konum: ${formData.district}, ${formData.city}`,
        formData.neighborhood && `Mahalle: ${formData.neighborhood}`,
        formData.buildingAge !== undefined && `Bina Yaşı: ${formData.buildingAge}`,
        formData.currentFloor && formData.floorCount && `Kat: ${formData.currentFloor}/${formData.floorCount}`,
        formData.heating && `Isıtma: ${formData.heating}`,
        formData.furnished && `Eşya: Eşyalı`,
        formData.parking && `Otopark: ${formData.parking}`,
        formData.elevator === 'Var' && `Asansör: Var`,
        formData.price && `Fiyat: ${formData.price.toLocaleString('tr-TR')} ${formData.currency || 'TL'}`,
        formData.interiorFeatures?.length && `İç Özellikler: ${formData.interiorFeatures.slice(0, 5).join(', ')}`,
        formData.viewFeatures?.length && `Manzara: ${formData.viewFeatures.join(', ')}`,
      ].filter(Boolean).join('\n');

      const prompt = `Aşağıdaki emlak bilgilerine göre, profesyonel ve çekici bir Türkçe ilan açıklaması yaz.
Açıklama 150-250 kelime arasında olsun. Sadece açıklama metnini yaz, başka bir şey ekleme.
Emlak bilgilerini tekrar listeleme, bunları cazip bir anlatımla açıklamaya dönüştür.
Potansiyel alıcı/kiracıyı heyecanlandıracak ve emlağın öne çıkan özelliklerini vurgulayacak şekilde yaz.

Emlak Bilgileri:
${propertyInfo}`;

      const result = await generateRealEstateAdvice(prompt);
      if (result) {
        handleChange('description', result.trim());
        toast.success('İlan açıklaması AI ile oluşturuldu!');
      }
    } catch (err: any) {
      toast.error('Açıklama oluşturulamadı');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // AI Price Estimator
  const handleEstimatePrice = async () => {
    if (!formData.type && !formData.city) {
      toast.error('Lütfen önce emlak tipi ve konum bilgilerini doldurun');
      return;
    }

    setIsEstimatingPrice(true);
    try {
      const propertyInfo = [
        formData.type && `Emlak Tipi: ${formData.type}`,
        formData.subCategory && `İşlem: ${formData.subCategory}`,
        formData.rooms && `Oda Sayısı: ${formData.rooms}`,
        formData.netArea && `Net Alan: ${formData.netArea} m²`,
        formData.grossArea && `Brüt Alan: ${formData.grossArea} m²`,
        formData.city && `Şehir: ${formData.city}`,
        formData.district && `İlçe: ${formData.district}`,
        formData.buildingAge !== undefined && `Bina Yaşı: ${formData.buildingAge}`,
        formData.currentFloor && `Bulunduğu Kat: ${formData.currentFloor}`,
        formData.heating && `Isıtma: ${formData.heating}`,
        formData.elevator === 'Var' && `Asansör: Var`,
      ].filter(Boolean).join('\n');

      const prompt = `Aşağıdaki emlak bilgilerine göre Türkiye piyasasında tahmini bir ${formData.subCategory === 'Kiralık' ? 'kira' : 'satış'} fiyatı öner.
SADECE bir sayı döndür, başka hiçbir şey yazma. Türk Lirası cinsinden yaz.
Örnek: 2500000

Emlak Bilgileri:
${propertyInfo}`;

      const result = await generateRealEstateAdvice(prompt);
      if (result) {
        const priceMatch = result.replace(/[^\d]/g, '');
        const estimatedPrice = parseInt(priceMatch, 10);
        if (estimatedPrice && !isNaN(estimatedPrice)) {
          handleChange('price', estimatedPrice);
          toast.success(`AI fiyat tahmini: ${estimatedPrice.toLocaleString('tr-TR')} TL`);
        }
      }
    } catch (err: any) {
      toast.error('Fiyat tahmini yapılamadı');
    } finally {
      setIsEstimatingPrice(false);
    }
  };

  // URL Import
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error('Lütfen bir URL girin');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Note: AI cannot directly fetch web pages, so we ask it to extract from URL pattern
      // This works best with well-structured URLs (e.g., sahibinden.com, hepsiemlak.com)
      const prompt = `Aşağıdaki emlak ilan URL'sini analiz et. URL yapısından ve pattern'den bilgi çıkarabilirsen JSON formatında döndür.
Eğer URL'den bilgi çıkaramazsan, kullanıcıya "Bu URL'den otomatik bilgi çıkarılamıyor. Lütfen ilan bilgilerini manuel olarak kopyalayıp yapıştırın." mesajını döndür.

URL: ${importUrl}

Başarılı olursan sadece JSON döndür:
{
  "title": "İlan başlığı",
  "description": "Açıklama",
  "price": 0,
  "type": "Daire/Villa/Arsa/etc",
  "rooms": "3+1",
  "grossArea": 0,
  "netArea": 0,
  "buildingAge": 0,
  "currentFloor": 0,
  "floorCount": 0,
  "city": "İl",
  "district": "İlçe"
}

Başarısız olursan: "MANUAL_IMPORT_NEEDED"`;

      const result = await generateRealEstateAdvice(prompt);
      if (result) {
        // Check if manual import is needed
        if (result.includes('MANUAL_IMPORT_NEEDED') || result.includes('otomatik bilgi çıkarılamıyor')) {
          toast.error('Bu URL\'den otomatik veri çekilemiyor. Lütfen ilan bilgilerini manuel olarak girin.', {
            duration: 5000
          });
          setShowImportModal(false);
          setImportUrl('');
          setIsAnalyzing(false);
          return;
        }

        try {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);

            // Validate that we got useful data
            if (!data.title && !data.price && !data.type) {
              throw new Error('Yetersiz veri');
            }

            setFormData(prev => ({
              ...prev,
              title: data.title || prev.title,
              description: data.description || prev.description,
              price: data.price || prev.price,
              type: data.type || prev.type,
              rooms: data.rooms || prev.rooms,
              grossArea: data.grossArea || prev.grossArea,
              netArea: data.netArea || prev.netArea,
              buildingAge: data.buildingAge ?? prev.buildingAge,
              currentFloor: data.currentFloor ?? prev.currentFloor,
              floorCount: data.floorCount || prev.floorCount,
              city: data.city || prev.city,
              district: data.district || prev.district,
            }));
            toast.success('İlan bilgileri içe aktarıldı!');
            setShowImportModal(false);
            setImportUrl('');
          } else {
            throw new Error('JSON bulunamadı');
          }
        } catch (parseError) {
          console.error('Parse error:', parseError);
          toast.error('URL\'den veri çıkarılamadı. Lütfen ilan bilgilerini manuel olarak girin.', {
            duration: 5000
          });
          setShowImportModal(false);
          setImportUrl('');
        }
      }
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error('İçe aktarma başarısız. Lütfen ilan bilgilerini manuel olarak girin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Image handling
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImages = formData.images || [];
    if (currentImages.length + files.length > 60) {
      toast.error('Maksimum 60 fotoğraf yükleyebilirsiniz');
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 5MB'dan büyük`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  // Form submission
  const handleSubmit = async () => {
    // Validation
    if (!formData.title?.trim()) {
      toast.error('İlan başlığı zorunludur');
      setCurrentStep(1);
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Fiyat girilmelidir');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const propertyData: Property = {
        ...formData,
        id: formData.id || `PRT-${Date.now()}`,
        location: `${formData.district || ''}, ${formData.city || ''}`.trim() || 'Belirtilmemiş',
        area: formData.netArea || formData.grossArea || 0,
        status: formData.subCategory || 'Satılık',
        images: formData.images || [],
        coordinates: formData.coordinates || { lat: 41.0082, lng: 28.9784 },
        listingDate: formData.listingDate || new Date().toISOString().split('T')[0],
        user_id: session?.user?.id,
      } as Property;

      if (id) {
        await updateProperty(propertyData);
        toast.success('İlan güncellendi!');
      } else {
        await addProperty(propertyData);
        toast.success('İlan oluşturuldu!');
      }
      navigate('/properties');
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick add owner
  const handleAddOwner = async () => {
    if (!newOwnerName || !newOwnerPhone) return;

    const customer: Customer = {
      id: Date.now().toString(),
      name: newOwnerName,
      phone: newOwnerPhone,
      email: '',
      status: 'Aktif',
      customerType: 'Mal Sahibi',
      source: 'İlan Girişi',
      createdAt: new Date().toISOString().split('T')[0],
      interactions: [],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newOwnerName)}&background=random`
    };

    await addCustomer(customer);
    handleChange('ownerId', customer.id);
    handleChange('ownerName', customer.name);
    handleChange('ownerPhone', customer.phone);
    setShowOwnerModal(false);
    setNewOwnerName('');
    setNewOwnerPhone('');
    toast.success('Mülk sahibi eklendi');
  };

  // Render step content
  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'category':
        return renderCategoryStep();
      case 'basic':
        return renderBasicStep();
      case 'structure':
        return renderStructureStep();
      case 'land':
        return renderLandStep();
      case 'location':
        return renderLocationStep();
      case 'features':
        return renderFeaturesStep();
      case 'photos':
        return renderPhotosStep();
      default:
        return null;
    }
  };

  // Step 1: Category Selection
  const renderCategoryStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Emlak Kategorisi Seçin</h3>
        <p className="text-gray-500 dark:text-slate-400">Hangi tür emlak ilanı oluşturmak istiyorsunuz?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PROPERTY_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              handleChange('category', key);
              handleChange('type', cat.types[0]);
              handleChange('subCategory', cat.subCategories[0]);
              handleChange('status', cat.subCategories[0]);
            }}
            className={`p-6 rounded-xl border-2 transition-all text-left ${formData.category === key
              ? 'border-[#1193d4] bg-sky-50 dark:bg-sky-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {key === 'KONUT' && <Home className={`w-8 h-8 ${formData.category === key ? 'text-[#1193d4]' : 'text-gray-400'}`} />}
              {key === 'ISYERI' && <Briefcase className={`w-8 h-8 ${formData.category === key ? 'text-[#1193d4]' : 'text-gray-400'}`} />}
              {key === 'ARSA' && <Map className={`w-8 h-8 ${formData.category === key ? 'text-[#1193d4]' : 'text-gray-400'}`} />}
              <span className="text-lg font-bold text-slate-800 dark:text-white">{cat.label}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {cat.types.slice(0, 4).join(', ')}...
            </p>
          </button>
        ))}
      </div>

      {formData.category && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">İşlem Türü</label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.subCategory}
              onChange={e => {
                handleChange('subCategory', e.target.value);
                handleChange('status', e.target.value);
              }}
            >
              {PROPERTY_CATEGORIES[formData.category as keyof typeof PROPERTY_CATEGORIES]?.subCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Emlak Tipi</label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.type}
              onChange={e => handleChange('type', e.target.value)}
            >
              {PROPERTY_CATEGORIES[formData.category as keyof typeof PROPERTY_CATEGORIES]?.types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Basic Info
  const renderBasicStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Temel Bilgiler</h3>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100"
        >
          <Link className="w-4 h-4" />
          URL'den İçe Aktar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            İlan Başlığı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            placeholder="Örn: Deniz Manzaralı 3+1 Daire"
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{formData.title?.length || 0}/100 karakter</p>
        </div>

        {/* Price */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Fiyat <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleEstimatePrice}
              disabled={isEstimatingPrice}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-100 disabled:opacity-50"
            >
              {isEstimatingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI Tahmin
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0"
              className="flex-1 p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.price ? formData.price.toLocaleString('tr-TR') : ''}
              onChange={e => {
                const val = e.target.value.replace(/\./g, '').replace(/,/g, '');
                handleChange('price', parseInt(val) || 0);
              }}
            />
            <select
              className="w-24 p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.currency}
              onChange={e => handleChange('currency', e.target.value)}
            >
              <option value="TL">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Area */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">m² (Brüt)</label>
            <input
              type="number"
              placeholder="0"
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.grossArea || ''}
              onChange={e => handleChange('grossArea', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">m² (Net)</label>
            <input
              type="number"
              placeholder="0"
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.netArea || ''}
              onChange={e => handleChange('netArea', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Açıklama</label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isGeneratingDescription ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI ile Oluştur
            </button>
          </div>
          <textarea
            rows={5}
            placeholder="İlan hakkında detaylı açıklama yazın..."
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Structure (Konut & İşyeri)
  const renderStructureStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Yapı Özellikleri</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Room Count */}
        {formData.category !== 'ARSA' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Oda Sayısı</label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.rooms}
              onChange={e => handleChange('rooms', e.target.value)}
            >
              <option value="">Seçiniz</option>
              {ROOM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Building Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bina Yaşı</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.buildingAge}
            onChange={e => handleChange('buildingAge', parseInt(e.target.value))}
          >
            {BUILDING_AGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Current Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bulunduğu Kat</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.currentFloor}
            onChange={e => handleChange('currentFloor', parseFloat(e.target.value))}
          >
            {FLOOR_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Floor Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kat Sayısı</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.floorCount}
            onChange={e => handleChange('floorCount', parseInt(e.target.value))}
          >
            {FLOOR_COUNT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Heating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Isıtma</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.heating}
            onChange={e => handleChange('heating', e.target.value)}
          >
            <option value="">Seçiniz</option>
            {HEATING_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Banyo Sayısı</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.bathrooms}
            onChange={e => handleChange('bathrooms', parseInt(e.target.value))}
          >
            {BATHROOM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Kitchen */}
        {formData.category === 'KONUT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mutfak</label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.kitchenType}
              onChange={e => handleChange('kitchenType', e.target.value)}
            >
              <option value="">Seçiniz</option>
              {KITCHEN_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Balcony */}
        {formData.category === 'KONUT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Balkon</label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.balcony}
              onChange={e => handleChange('balcony', parseInt(e.target.value))}
            >
              {BALCONY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Elevator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Asansör</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.elevator}
            onChange={e => handleChange('elevator', e.target.value)}
          >
            <option value="Yok">Yok</option>
            <option value="Var">Var</option>
          </select>
        </div>

        {/* Parking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Otopark</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.parking}
            onChange={e => handleChange('parking', e.target.value)}
          >
            {PARKING_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Furnished */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Eşya Durumu</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.furnished ? 'Evet' : 'Hayır'}
            onChange={e => handleChange('furnished', e.target.value === 'Evet')}
          >
            <option value="Hayır">Eşyasız</option>
            <option value="Evet">Eşyalı</option>
          </select>
        </div>

        {/* Usage Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kullanım Durumu</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.usageStatus}
            onChange={e => handleChange('usageStatus', e.target.value)}
          >
            {USAGE_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Dues */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Aidat (TL)</label>
          <input
            type="number"
            placeholder="0"
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.dues || ''}
            onChange={e => handleChange('dues', parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Credit Eligible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Krediye Uygun</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.creditEligible ? 'Evet' : 'Hayır'}
            onChange={e => handleChange('creditEligible', e.target.value === 'Evet')}
          >
            <option value="Hayır">Hayır</option>
            <option value="Evet">Evet</option>
          </select>
        </div>

        {/* Deed Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tapu Durumu</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.deedStatus}
            onChange={e => handleChange('deedStatus', e.target.value)}
          >
            {DEED_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Listing Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Kimden</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.listingSource}
            onChange={e => handleChange('listingSource', e.target.value)}
          >
            {LISTING_SOURCE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Exchange */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Takaslı</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.exchange}
            onChange={e => handleChange('exchange', e.target.value)}
          >
            <option value="Hayır">Hayır</option>
            <option value="Evet">Evet</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Step: Land Info (Arsa)
  const renderLandStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Arsa Bilgileri</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Zoning */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">İmar Durumu</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.zoningStatus}
            onChange={e => handleChange('zoningStatus', e.target.value)}
          >
            <option value="">Seçiniz</option>
            {ZONING_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Block No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ada No</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.blockNo}
            onChange={e => handleChange('blockNo', e.target.value)}
          />
        </div>

        {/* Parcel No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Parsel No</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.parcelNo}
            onChange={e => handleChange('parcelNo', e.target.value)}
          />
        </div>

        {/* Sheet No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pafta No</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.sheetNo}
            onChange={e => handleChange('sheetNo', e.target.value)}
          />
        </div>

        {/* KAKS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">KAKS (Emsal)</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.kaks}
            onChange={e => handleChange('kaks', e.target.value)}
          >
            {KAKS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Gabari */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gabari</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.gabari}
            onChange={e => handleChange('gabari', e.target.value)}
          >
            {GABARI_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Credit Eligible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Krediye Uygun</label>
          <select
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            value={formData.creditEligible ? 'Evet' : 'Hayır'}
            onChange={e => handleChange('creditEligible', e.target.value === 'Evet')}
          >
            <option value="Hayır">Hayır</option>
            <option value="Evet">Evet</option>
            <option value="Bilinmiyor">Bilinmiyor</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Step: Location
  const renderLocationStep = () => {
    const districts = formData.city ? getDistricts(formData.city) : [];
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(formData.coordinates?.lng || 32.8597) - 0.05}%2C${(formData.coordinates?.lat || 39.9334) - 0.03}%2C${(formData.coordinates?.lng || 32.8597) + 0.05}%2C${(formData.coordinates?.lat || 39.9334) + 0.03}&layer=mapnik&marker=${formData.coordinates?.lat || 39.9334}%2C${formData.coordinates?.lng || 32.8597}`;
    const googleMapsPickerUrl = `https://www.google.com/maps/search/?api=1&query=${formData.coordinates?.lat || 39.9334},${formData.coordinates?.lng || 32.8597}`;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Konum Bilgileri</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              İl <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.city}
              onChange={e => {
                const newCity = e.target.value;
                handleChange('city', newCity);
                handleChange('district', ''); // Reset district when city changes
                // Update coordinates to city center
                if (newCity) {
                  const coords = getProvinceCoordinates(newCity);
                  handleChange('coordinates', coords);
                }
              }}
            >
              <option value="">İl Seçiniz</option>
              {PROVINCES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* District - Cascading dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              İlçe <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50"
              value={formData.district}
              onChange={e => {
                handleChange('district', e.target.value);
                handleChange('neighborhood', ''); // Reset neighborhood when district changes
              }}
              disabled={!formData.city}
            >
              <option value="">{formData.city ? 'İlçe Seçiniz' : 'Önce İl Seçiniz'}</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          {/* Neighborhood - Cascading dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Mahalle / Köy
              {loadingNeighborhoods && <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-blue-500" />}
            </label>
            {neighborhoods.length > 0 ? (
              <select
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50"
                value={formData.neighborhood}
                onChange={e => handleChange('neighborhood', e.target.value)}
                disabled={!formData.district || loadingNeighborhoods}
              >
                <option value="">{loadingNeighborhoods ? 'Yükleniyor...' : 'Mahalle Seçiniz'}</option>
                {neighborhoods.map(neighborhood => (
                  <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder={formData.district ? 'Mahalle adı yazın' : 'Önce ilçe seçin'}
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50"
                value={formData.neighborhood}
                onChange={e => handleChange('neighborhood', e.target.value)}
                disabled={!formData.district}
              />
            )}
            {formData.district && neighborhoods.length === 0 && !loadingNeighborhoods && (
              <p className="text-xs text-gray-400 mt-1">API'den mahalle bulunamadı, manuel yazabilirsiniz</p>
            )}
          </div>

          {/* Is In Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Site İçerisinde mi?</label>
            <select
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.isInSite ? 'Evet' : 'Hayır'}
              onChange={e => handleChange('isInSite', e.target.value === 'Evet')}
            >
              <option value="Hayır">Hayır</option>
              <option value="Evet">Evet</option>
            </select>
          </div>

          {/* Site Name */}
          {formData.isInSite && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Site Adı</label>
              <input
                type="text"
                placeholder="Site adı"
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                value={formData.siteName}
                onChange={e => handleChange('siteName', e.target.value)}
              />
            </div>
          )}

          {/* Address */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Açık Adres</label>
            <textarea
              rows={2}
              placeholder="Detaylı adres bilgisi..."
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
            />
          </div>
        </div>

        {/* Map Section */}
        <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden">
          <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="font-medium text-slate-800 dark:text-white">Harita Konumu</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Use current location from address fields to search
                  const searchText = [formData.address, formData.neighborhood, formData.district, formData.city].filter(Boolean).join(', ');
                  if (searchText) {
                    setAddressSearch(searchText);
                    handleAddressSearch();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100"
              >
                <Navigation className="w-4 h-4" />
                Adresten Bul
              </button>
              <a
                href={googleMapsPickerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100"
              >
                <MapPin className="w-4 h-4" />
                Google Maps
              </a>
            </div>
          </div>

          {/* Address Search */}
          <div className="p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Adres Ara (Konum Bulmak İçin)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Örn: Bağdat Caddesi, Kadıköy, İstanbul"
                className="flex-1 p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                value={addressSearch}
                onChange={e => setAddressSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                disabled={searchingAddress || !addressSearch.trim()}
                className="px-4 py-3 bg-[#1193d4] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {searchingAddress ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Adres yazıp arayın veya "Adresten Bul" butonuna tıklayın. Konum haritada işaretlenecektir.
            </p>
          </div>

          {/* Map Preview */}
          <div className="h-72 bg-gray-100 dark:bg-slate-800 relative">
            <iframe
              key={`${formData.coordinates?.lat}-${formData.coordinates?.lng}`}
              width="100%"
              height="100%"
              src={mapUrl}
              title="Konum Haritası"
              className="border-0"
            />
            {formData.coordinates?.lat && formData.coordinates?.lng && (
              <div className="absolute bottom-2 left-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow text-xs text-slate-600 dark:text-slate-300">
                {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* Coordinate Inputs */}
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
              Koordinatları manuel girebilir veya Google Maps'ten kopyalayabilirsiniz (sağ tık → koordinatları kopyala)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Enlem (Latitude)</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Örn: 41.0082"
                  className="w-full p-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  value={formData.coordinates?.lat || ''}
                  onChange={e => handleChange('coordinates', {
                    ...formData.coordinates,
                    lat: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Boylam (Longitude)</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Örn: 28.9784"
                  className="w-full p-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  value={formData.coordinates?.lng || ''}
                  onChange={e => handleChange('coordinates', {
                    ...formData.coordinates,
                    lng: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="border-t border-gray-200 dark:border-slate-600 pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-800 dark:text-white">Mülk Sahibi Bilgileri</h4>
            <button
              type="button"
              onClick={() => setShowOwnerModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100"
            >
              <UserPlus className="w-4 h-4" />
              Yeni Ekle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Mülk Sahibi</label>
              <select
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                value={formData.ownerId || ''}
                onChange={e => {
                  const customer = customers.find(c => c.id === e.target.value);
                  handleChange('ownerId', e.target.value);
                  handleChange('ownerName', customer?.name || '');
                  handleChange('ownerPhone', customer?.phone || '');
                }}
              >
                <option value="">Seçiniz</option>
                {customers.filter(c => c.customerType === 'Mal Sahibi' || c.customerType === 'Satıcı').map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sahiplik Türü</label>
              <select
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                value={formData.ownerType}
                onChange={e => handleChange('ownerType', e.target.value)}
              >
                {OWNER_TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Taşınmaz No</label>
              <input
                type="text"
                placeholder="Taşınmaz numarası"
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                value={formData.propertyNumber}
                onChange={e => handleChange('propertyNumber', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step: Features
  const renderFeaturesStep = () => {
    const featureSections = formData.category === 'ARSA' ? [
      { title: 'Altyapı', field: 'landInfrastructure' as keyof Property, options: LAND_INFRASTRUCTURE_FEATURES },
      { title: 'Konum Özellikleri', field: 'landLocation' as keyof Property, options: LAND_LOCATION_FEATURES },
      { title: 'Genel Özellikler', field: 'landGeneralFeatures' as keyof Property, options: LAND_GENERAL_FEATURES },
      { title: 'Manzara', field: 'viewFeatures' as keyof Property, options: VIEW_FEATURES },
    ] : formData.category === 'ISYERI' ? [
      { title: 'İşyeri Özellikleri', field: 'workplaceFeatures' as keyof Property, options: WORKPLACE_FEATURES },
      { title: 'Manzara', field: 'viewFeatures' as keyof Property, options: VIEW_FEATURES },
      { title: 'Ulaşım', field: 'transportationFeatures' as keyof Property, options: TRANSPORTATION_FEATURES },
    ] : [
      { title: 'Cephe', field: 'facades' as keyof Property, options: FACADE_OPTIONS },
      { title: 'İç Özellikler', field: 'interiorFeatures' as keyof Property, options: INTERIOR_FEATURES },
      { title: 'Dış Özellikler', field: 'exteriorFeatures' as keyof Property, options: EXTERIOR_FEATURES },
      { title: 'Muhit', field: 'neighborhoodFeatures' as keyof Property, options: NEIGHBORHOOD_FEATURES },
      { title: 'Ulaşım', field: 'transportationFeatures' as keyof Property, options: TRANSPORTATION_FEATURES },
      { title: 'Manzara', field: 'viewFeatures' as keyof Property, options: VIEW_FEATURES },
      { title: 'Konut Tipi', field: 'residenceType' as keyof Property, options: RESIDENCE_TYPE_OPTIONS, single: true },
      { title: 'Engelliye Uygun', field: 'accessibilityFeatures' as keyof Property, options: ACCESSIBILITY_FEATURES },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Detaylı Özellikler</h3>

        {featureSections.map(section => (
          <div key={section.title} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
            <h4 className="font-semibold text-slate-800 dark:text-white mb-3">{section.title}</h4>
            {section.single ? (
              <select
                className="w-full md:w-64 p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                value={(formData[section.field] as string) || ''}
                onChange={e => handleChange(section.field, e.target.value)}
              >
                <option value="">Seçiniz</option>
                {section.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2">
                {section.options.map(opt => {
                  const isSelected = ((formData[section.field] as string[]) || []).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleArrayToggle(section.field, opt)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${isSelected
                        ? 'bg-[#1193d4] text-white border-[#1193d4]'
                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-[#1193d4]'
                        }`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Step: Photos
  const renderPhotosStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fotoğraflar</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">Maksimum 60 fotoğraf yükleyebilirsiniz</p>
        </div>
        <span className="text-sm font-medium text-gray-500">{formData.images?.length || 0} / 60</span>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-10 text-center cursor-pointer hover:border-[#1193d4] transition-colors"
      >
        <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-slate-400 mb-2">Fotoğraf yüklemek için tıklayın veya sürükleyin</p>
        <p className="text-sm text-gray-400">PNG, JPG, WEBP (max 5MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Image Grid */}
      {formData.images && formData.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {formData.images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img
                src={img}
                alt={`Fotoğraf ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-[#1193d4] text-white text-xs rounded">
                  Kapak
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#1193d4]"
        >
          <ChevronLeft className="w-5 h-5" />
          Geri
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          {id ? 'İlan Düzenle' : 'Yeni İlan Oluştur'}
        </h1>
        <div className="w-20" />
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => idx <= currentStep && setCurrentStep(idx)}
                  className={`flex flex-col items-center gap-1 ${idx <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-[#1193d4] text-white' :
                    isCompleted ? 'bg-emerald-500 text-white' :
                      'bg-gray-100 dark:bg-slate-700 text-gray-400'
                    }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${isActive ? 'text-[#1193d4]' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${idx < currentStep ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-600'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Geri
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-[#1193d4] text-white rounded-lg font-medium hover:opacity-90"
          >
            İleri
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {id ? 'Güncelle' : 'İlanı Kaydet'}
              </>
            )}
          </button>
        )}
      </div>

      {/* URL Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">URL'den İçe Aktar</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ⚠️ <strong>Not:</strong> Bu özellik deneyseldir. Bazı sitelerden otomatik veri çekilemeyebilir.
                Başarısız olursa lütfen ilan bilgilerini manuel olarak girin.
              </p>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              Sahibinden, Hepsiemlak, Emlakjet gibi sitelerdeki ilan linkini yapıştırın:
            </p>

            <input
              type="url"
              placeholder="https://www.sahibinden.com/ilan/..."
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white mb-4"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImportFromUrl()}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                İptal
              </button>
              <button
                onClick={handleImportFromUrl}
                disabled={isAnalyzing || !importUrl.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analiz ediliyor...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    İçe Aktar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Modal */}
      {showOwnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Yeni Mülk Sahibi</h3>
              <button onClick={() => setShowOwnerModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  value={newOwnerName}
                  onChange={e => setNewOwnerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Telefon</label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  value={newOwnerPhone}
                  onChange={e => setNewOwnerPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOwnerModal(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-white"
              >
                İptal
              </button>
              <button
                onClick={handleAddOwner}
                disabled={!newOwnerName || !newOwnerPhone}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyForm;
