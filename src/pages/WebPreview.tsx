
import React from 'react';
import { useData } from '../context/DataContext';
import { MapPin, Phone, Mail, Search, Menu, Bed, Bath, Maximize, ArrowLeft, Grid, List, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Property, WebSiteConfig } from '../types';

const WebPreview: React.FC = () => {
    const { webConfig, properties, office } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const targetSite = (location.state as any)?.targetSite || 'personal';

    // Filter properties based on target
    // Office site shows all properties in the office
    // Personal site shows only those marked for personal site
    const siteProperties = targetSite === 'office'
        ? properties
        : properties.filter(p => p.publishedOnPersonalSite);

    // Layout Rendering Logic
    const renderLayout = () => {
        switch (webConfig.layout) {
            case 'map':
                return <MapLayout config={webConfig} properties={siteProperties} />;
            case 'grid':
                return <GridLayout config={webConfig} properties={siteProperties} />;
            case 'standard':
            default:
                return <StandardLayout config={webConfig} properties={siteProperties} />;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans relative">
            {/* Floating Back to Editor Button */}
            <div className="fixed bottom-6 right-6 z-[100]">
                <button
                    onClick={() => navigate('/web-builder')}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform font-bold border-2 border-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Düzenleyiciye Dön
                </button>
            </div>

            {renderLayout()}
        </div>
    );
};

// --- SUB COMPONENTS FOR LAYOUTS ---

// 1. STANDARD LAYOUT (Hero + Grid)
const StandardLayout: React.FC<{ config: WebSiteConfig, properties: Property[] }> = ({ config, properties }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header config={config} />

            {/* Hero Section */}
            <div className="relative h-[500px] bg-slate-900">
                <img
                    src="https://images.unsplash.com/photo-1600596542815-e32cb53138bd?q=80&w=2000&auto=format&fit=crop"
                    alt="Hero"
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
                <PropertyGrid properties={properties} config={config} />
            </div>

            <Footer config={config} />
        </div>
    );
};

// 2. MAP LAYOUT (Split Screen)
const MapLayout: React.FC<{ config: WebSiteConfig, properties: Property[] }> = ({ config, properties }) => {
    return (
        <div className="h-screen flex flex-col">
            <Header config={config} compact />
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
                        <PropertyGrid properties={properties} config={config} columns={2} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. GRID LAYOUT (Clean Grid)
const GridLayout: React.FC<{ config: WebSiteConfig, properties: Property[] }> = ({ config, properties }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header config={config} />

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

                <PropertyGrid properties={properties} config={config} />
            </div>

            <Footer config={config} />
        </div>
    );
};

// --- SHARED COMPONENTS ---

const Header: React.FC<{ config: WebSiteConfig, compact?: boolean }> = ({ config, compact }) => (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className={`container mx-auto px-4 ${compact ? 'py-3' : 'py-5'} flex justify-between items-center`}>
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg text-white" style={{ backgroundColor: config.primaryColor }}>
                    <Grid className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-none">{config.domain || config.siteTitle}</h1>
                    {!compact && <span className="text-xs text-gray-500">Gayrimenkul Çözümleri</span>}
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <a href="#" className="hover:text-black">Anasayfa</a>
                <a href="#" className="hover:text-black">Satılık</a>
                <a href="#" className="hover:text-black">Kiralık</a>
                <a href="#" className="hover:text-black">Hakkımızda</a>
                <a href="#" className="px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: config.primaryColor }}>
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
                        <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                            <span>Merkez Mah. Emlak Cad. No:1<br />İstanbul, Türkiye</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-slate-500" />
                            <span>{config.phone}</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-500" />
                            <span>{config.email}</span>
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

const PropertyGrid: React.FC<{ properties: Property[], config: WebSiteConfig, columns?: number }> = ({ properties, config, columns }) => {
    if (properties.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                    <Grid className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Henüz İlan Yok</h3>
                <p className="text-gray-500">Web sitenizde yayınlanmak üzere işaretlenmiş emlak bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8`}>
            {properties.map(property => (
                <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                    <div className="relative h-64 overflow-hidden">
                        <img
                            src={property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                            alt={property.title}
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
                                {property.price.toLocaleString('tr-TR')} {property.currency}
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

export default WebPreview;
