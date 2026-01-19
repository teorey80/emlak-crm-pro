import React, { useState } from 'react';
import { MapPin, Phone, Mail, Search, Menu, Bed, Bath, Maximize, Grid, List, Facebook, Instagram, Twitter, Linkedin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Property, WebSiteConfig } from '../types';
import { PublicSiteData } from '../services/publicSiteService';

interface PublicSiteProps {
    siteData: PublicSiteData;
}

const PublicSite: React.FC<PublicSiteProps> = ({ siteData }) => {
    const { siteConfig, properties, type, ownerName, officeName } = siteData;
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [filter, setFilter] = useState<'all' | 'satilik' | 'kiralik'>('all');

    // Filter properties based on selection
    const filteredProperties = properties.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'satilik') return p.status?.toLowerCase().includes('satılık') || p.status?.toLowerCase().includes('satilik');
        if (filter === 'kiralik') return p.status?.toLowerCase().includes('kiralık') || p.status?.toLowerCase().includes('kiralik');
        return true;
    });

    // Layout Rendering Logic
    const renderLayout = () => {
        switch (siteConfig.layout) {
            case 'map':
                return <MapLayout config={siteConfig} properties={filteredProperties} onPropertyClick={setSelectedProperty} filter={filter} onFilterChange={setFilter} />;
            case 'grid':
                return <GridLayout config={siteConfig} properties={filteredProperties} onPropertyClick={setSelectedProperty} filter={filter} onFilterChange={setFilter} />;
            case 'standard':
            default:
                return <StandardLayout config={siteConfig} properties={filteredProperties} onPropertyClick={setSelectedProperty} filter={filter} onFilterChange={setFilter} />;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* SEO Meta Tags */}
            <title>{siteConfig.siteTitle || (type === 'personal' ? ownerName : officeName)}</title>

            {renderLayout()}

            {/* Property Detail Modal */}
            {selectedProperty && (
                <PropertyModal
                    property={selectedProperty}
                    config={siteConfig}
                    onClose={() => setSelectedProperty(null)}
                />
            )}
        </div>
    );
};

// --- LAYOUT COMPONENTS ---

interface LayoutProps {
    config: WebSiteConfig;
    properties: Property[];
    onPropertyClick: (property: Property) => void;
    filter: 'all' | 'satilik' | 'kiralik';
    onFilterChange: (filter: 'all' | 'satilik' | 'kiralik') => void;
}

// 1. STANDARD LAYOUT (Hero + Grid)
const StandardLayout: React.FC<LayoutProps> = ({ config, properties, onPropertyClick, filter, onFilterChange }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header config={config} filter={filter} onFilterChange={onFilterChange} />


            {/* Hero Section */}
            <div className="relative h-[500px] bg-slate-900">
                <img
                    src="https://images.unsplash.com/photo-1600596542815-e32cb53138bd?q=80&w=2000&auto=format&fit=crop"
                    alt="Hero"
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
                        {config.siteTitle || "Hayalinizdeki Eve Ulaşın"}
                    </h2>
                    <p className="text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-md">
                        {config.aboutText || "En güncel satılık ve kiralık emlak ilanları."}
                    </p>

                    <div className="bg-white p-2 rounded-lg shadow-lg max-w-3xl w-full flex flex-col md:flex-row gap-2">
                        <input type="text" placeholder="Konum, site veya özellik ara..." className="flex-1 px-4 py-3 rounded bg-gray-100 text-slate-800 focus:outline-none" />
                        <select className="px-4 py-3 rounded bg-gray-100 text-slate-800 focus:outline-none w-full md:w-auto cursor-pointer">
                            <option>Satılık</option>
                            <option>Kiralık</option>
                        </select>
                        <button className="px-8 py-3 text-white font-bold rounded transition-opacity hover:opacity-90 w-full md:w-auto flex items-center justify-center gap-2" style={{ backgroundColor: config.primaryColor }}>
                            <Search className="w-5 h-5" />
                            Ara
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-16 flex-1">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-slate-800 mb-2">Öne Çıkan İlanlar</h3>
                    <p className="text-gray-500">Portföyümüzdeki en yeni fırsatlar.</p>
                </div>
                <PropertyGrid properties={properties} config={config} onPropertyClick={onPropertyClick} />
            </div>

            <Footer config={config} />
        </div>
    );
};

// 2. MAP LAYOUT (Split Screen)
const MapLayout: React.FC<LayoutProps> = ({ config, properties, onPropertyClick, filter, onFilterChange }) => {
    return (
        <div className="h-screen flex flex-col">
            <Header config={config} compact filter={filter} onFilterChange={onFilterChange} />

            <div className="flex-1 flex overflow-hidden">
                {/* Map Side */}
                <div className="w-1/2 bg-slate-100 relative hidden lg:block border-r border-gray-200">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://maps.google.com/maps?q=Turkey&t=&z=6&ie=UTF8&iwloc=&output=embed"
                        frameBorder="0"
                        scrolling="no"
                        title="Map View"
                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                    ></iframe>
                    <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        Harita Görünümü
                    </div>
                </div>
                {/* List Side */}
                <div className="w-full lg:w-1/2 overflow-y-auto bg-white">
                    <div className="p-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Güncel İlanlar</h2>
                                <p className="text-gray-500 text-sm mt-1">{properties.length} ilan listeleniyor</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Grid className="w-4 h-4" /></button>
                                <button className="p-2 bg-gray-100 rounded hover:bg-gray-200"><List className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <PropertyGrid properties={properties} config={config} columns={2} onPropertyClick={onPropertyClick} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. GRID LAYOUT (Clean Grid)
const GridLayout: React.FC<LayoutProps> = ({ config, properties, onPropertyClick, filter, onFilterChange }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header config={config} filter={filter} onFilterChange={onFilterChange} />


            <div className="container mx-auto px-4 py-8 flex-1">
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl font-bold text-slate-800">Tüm İlanlar</h1>
                        <div className="flex gap-4 w-full md:w-auto">
                            <input type="text" placeholder="Filtrele..." className="bg-gray-100 border-none rounded-lg px-4 py-2 text-sm w-full md:w-64" />
                            <select className="bg-gray-100 border-none rounded-lg px-4 py-2 text-sm cursor-pointer">
                                <option>Sırala: Yeniden Eskiye</option>
                                <option>Fiyat: Artan</option>
                                <option>Fiyat: Azalan</option>
                            </select>
                        </div>
                    </div>
                </div>

                <PropertyGrid properties={properties} config={config} onPropertyClick={onPropertyClick} />
            </div>

            <Footer config={config} />
        </div>
    );
};

// --- SHARED COMPONENTS ---

const Header: React.FC<{ config: WebSiteConfig, compact?: boolean, filter?: 'all' | 'satilik' | 'kiralik', onFilterChange?: (filter: 'all' | 'satilik' | 'kiralik') => void }> = ({ config, compact, filter = 'all', onFilterChange }) => (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className={`container mx-auto px-4 ${compact ? 'py-3' : 'py-5'} flex justify-between items-center`}>
            <div className="flex items-center gap-2">
                {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-10 w-auto" />
                ) : (
                    <div className="p-2 rounded-lg text-white" style={{ backgroundColor: config.primaryColor }}>
                        <Grid className="w-5 h-5" />
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-none">{config.siteTitle || config.domain}</h1>
                    {!compact && <span className="text-xs text-gray-500">Gayrimenkul Çözümleri</span>}
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <button onClick={() => onFilterChange?.('all')} className={`hover:text-black ${filter === 'all' ? 'text-black font-bold' : ''}`}>Anasayfa</button>
                <button onClick={() => onFilterChange?.('satilik')} className={`hover:text-black ${filter === 'satilik' ? 'font-bold' : ''}`} style={filter === 'satilik' ? { color: config.primaryColor } : {}}>Satılık</button>
                <button onClick={() => onFilterChange?.('kiralik')} className={`hover:text-black ${filter === 'kiralik' ? 'font-bold' : ''}`} style={filter === 'kiralik' ? { color: config.primaryColor } : {}}>Kiralık</button>
                <a href="#footer" className="hover:text-black">Hakkımızda</a>
                <a href="#footer" className="px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: config.primaryColor }}>
                    İletişim
                </a>
            </nav>
            <button className="md:hidden p-2 text-slate-600">
                <Menu className="w-6 h-6" />
            </button>
        </div>
    </header>
);

const Footer: React.FC<{ config: WebSiteConfig }> = ({ config }) => (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div>
                    <h3 className="text-xl font-bold mb-4">{config.siteTitle}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        {config.aboutText || "Gayrimenkul sektöründe güvenilir çözüm ortağınız."}
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-slate-400 hover:text-white"><Facebook className="w-5 h-5" /></a>
                        <a href="#" className="text-slate-400 hover:text-white"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-slate-400 hover:text-white"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="text-slate-400 hover:text-white"><Linkedin className="w-5 h-5" /></a>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Hızlı Erişim</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-white">Anasayfa</a></li>
                        <li><a href="#" className="hover:text-white">İlanlar</a></li>
                        <li><a href="#" className="hover:text-white">Hakkımızda</a></li>
                        <li><a href="#" className="hover:text-white">İletişim</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Kategoriler</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><a href="#" className="hover:text-white">Satılık Daireler</a></li>
                        <li><a href="#" className="hover:text-white">Kiralık Ofisler</a></li>
                        <li><a href="#" className="hover:text-white">Villalar</a></li>
                        <li><a href="#" className="hover:text-white">Arsalar</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">İletişim</h4>
                    <ul className="space-y-4 text-sm text-slate-400">
                        <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-slate-500" />
                            <span>{config.phone || 'Telefon bilgisi yok'}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-500" />
                            <span>{config.email || 'E-posta bilgisi yok'}</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                &copy; 2024 {config.siteTitle}. Tüm hakları saklıdır.
            </div>
        </div>
    </footer>
);

const PropertyGrid: React.FC<{ properties: Property[], config: WebSiteConfig, columns?: number, onPropertyClick: (property: Property) => void }> = ({ properties, config, columns, onPropertyClick }) => {
    if (properties.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                    <Grid className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Henüz İlan Yok</h3>
                <p className="text-gray-500">Web sitesinde yayınlanmak üzere işaretlenmiş emlak bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8`}>
            {properties.map(property => (
                <div
                    key={property.id}
                    onClick={() => onPropertyClick(property)}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                >
                    <div className="relative h-64 overflow-hidden">
                        <img
                            src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                            alt={property.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {property.status}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <span className="text-white text-sm font-medium flex items-center gap-1">
                                <Maximize className="w-4 h-4" /> Detayları İncele
                            </span>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {property.title}
                            </h3>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mb-4">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {property.location}
                        </div>

                        <div className="flex items-center gap-4 py-4 border-t border-gray-100 mb-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Bed className="w-4 h-4 text-gray-400" />
                                <span>{property.rooms}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Bath className="w-4 h-4 text-gray-400" />
                                <span>{property.bathrooms}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Maximize className="w-4 h-4 text-gray-400" />
                                <span>{property.area} m²</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-xl font-bold" style={{ color: config.primaryColor }}>
                                {property.price?.toLocaleString('tr-TR')} {property.currency}
                            </div>
                            <button className="text-sm font-medium text-gray-500 hover:text-black">
                                Detaylar &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Property Detail Modal
const PropertyModal: React.FC<{ property: Property, config: WebSiteConfig, onClose: () => void }> = ({ property, config, onClose }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = property.images?.length ? property.images : ['https://via.placeholder.com/800x600?text=No+Image'];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Gallery */}
                <div className="relative h-80 md:h-96">
                    <img
                        src={images[currentImageIndex]}
                        alt={property.title}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {property.status}
                    </div>
                </div>

                {/* Property Info */}
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{property.title}</h2>
                            <div className="flex items-center text-gray-500">
                                <MapPin className="w-4 h-4 mr-1" />
                                {property.location}
                            </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold" style={{ color: config.primaryColor }}>
                            {property.price?.toLocaleString('tr-TR')} {property.currency}
                        </div>
                    </div>

                    {/* Key Features */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 py-6 border-y border-gray-100 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-800">{property.rooms}</div>
                            <div className="text-sm text-gray-500">Oda</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-800">{property.bathrooms}</div>
                            <div className="text-sm text-gray-500">Banyo</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-800">{property.area}</div>
                            <div className="text-sm text-gray-500">m²</div>
                        </div>
                        {property.buildingAge !== undefined && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-800">{property.buildingAge}</div>
                                <div className="text-sm text-gray-500">Bina Yaşı</div>
                            </div>
                        )}
                        {property.currentFloor !== undefined && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-800">{property.currentFloor}</div>
                                <div className="text-sm text-gray-500">Kat</div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {property.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-3">Açıklama</h3>
                            <p className="text-gray-600 leading-relaxed">{property.description}</p>
                        </div>
                    )}

                    {/* Contact CTA */}
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-slate-800">Bu ilanla ilgileniyor musunuz?</h4>
                            <p className="text-sm text-gray-500">Hemen iletişime geçin</p>
                        </div>
                        <div className="flex gap-3">
                            {config.phone && (
                                <a
                                    href={`tel:${config.phone}`}
                                    className="flex items-center gap-2 bg-white border border-gray-200 text-slate-800 px-5 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                    Ara
                                </a>
                            )}
                            <a
                                href={`https://wa.me/${config.phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white px-5 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                                style={{ backgroundColor: config.primaryColor }}
                            >
                                <Mail className="w-4 h-4" />
                                WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicSite;
