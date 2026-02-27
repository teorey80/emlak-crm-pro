import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Search, Menu, Bed, Bath, Maximize, Grid, List, Facebook, Instagram, Twitter, Linkedin, X, ChevronLeft, ChevronRight, MessageCircle, Send, Award, Home, Users, Star, Calendar, ArrowRight, Clock, User } from 'lucide-react';
import { Property, WebSiteConfig } from '../types';
import { PublicSiteData } from '../services/publicSiteService';
import toast from 'react-hot-toast';
import { FLOOR_OPTIONS } from '../constants/propertyConstants';

// Blog data for the public site
const blogPosts = [
  {
    id: 1,
    slug: 'ev-alirken-dikkat-edilmesi-gerekenler',
    title: 'Ev Alırken Dikkat Edilmesi Gerekenler',
    excerpt: 'Ev satın alırken dikkat etmeniz gereken 10 kritik nokta. Tapu işlemlerinden ekspertiz raporuna, krediden aidata kadar bilmeniz gereken her şey.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    date: '2025-02-20',
    category: 'Alıcı Rehberi',
    readTime: '8 dk'
  },
  {
    id: 2,
    slug: 'kiralik-ev-ararken-ipuclari',
    title: 'Kiralık Ev Ararken İpuçları',
    excerpt: 'Kiralık ev ararken nelere dikkat etmelisiniz? Kira kontratı, depozito, aidat ve komşuluk ilişkileri hakkında bilmeniz gerekenler.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    date: '2025-02-18',
    category: 'Kiracı Rehberi',
    readTime: '6 dk'
  },
  {
    id: 3,
    slug: 'gayrimenkul-yatirim-rehberi',
    title: 'Gayrimenkul Yatırım Rehberi 2025',
    excerpt: '2025 yılında gayrimenkul yatırımı yapacaklar için kapsamlı rehber. Hangi bölgeler değerleniyor? Nasıl kar elde edilir?',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    date: '2025-02-15',
    category: 'Yatırım',
    readTime: '10 dk'
  },
  {
    id: 4,
    slug: 'ev-satis-sureci-nasil-isler',
    title: 'Ev Satış Süreci Nasıl İşler?',
    excerpt: 'Evinizi satmaya karar verdiniz ama nereden başlayacağınızı bilmiyor musunuz? Adım adım ev satış süreci rehberi.',
    image: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=800',
    date: '2025-02-10',
    category: 'Satıcı Rehberi',
    readTime: '7 dk'
  }
];

interface PublicSiteProps {
    siteData: PublicSiteData;
}

// View types for routing
type ViewType = 'home' | 'satilik' | 'kiralik' | 'hakkimizda' | 'blog' | 'blog-post' | 'ilan';

const getFloorLabel = (value?: number) => {
    if (value === undefined || value === null) return '';
    const match = FLOOR_OPTIONS.find(opt => opt.value === value);
    return match?.label ?? String(value);
};

const PublicSite: React.FC<PublicSiteProps> = ({ siteData }) => {
    const { siteConfig, properties, type, ownerName, officeName } = siteData;
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [filter, setFilter] = useState<'all' | 'satilik' | 'kiralik'>('all');
    const [showContactForm, setShowContactForm] = useState(false);
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
    const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);

    const displayName = type === 'personal' ? ownerName : officeName;

    // Update document head meta tags dynamically based on loaded site config
    useEffect(() => {
        const siteTitle = siteConfig.siteTitle || displayName || 'Emlak';
        const brokerTitle = siteConfig.brokerTitle || 'Emlak Danışmanı';
        const fullTitle = `${siteTitle} | ${brokerTitle} - Satılık ve Kiralık Emlak İlanları`;
        const description = siteConfig.aboutText ||
            `${siteTitle} - Profesyonel gayrimenkul danışmanlığı hizmeti. Satılık ve kiralık emlak ilanları.`;
        const domain = siteConfig.domain || window.location.hostname;
        const canonicalUrl = `https://${domain}/`;

        // Update document title
        document.title = fullTitle;

        // Helper to set or create a meta tag
        const setMeta = (selector: string, content: string) => {
            let el = document.querySelector(selector) as HTMLMetaElement | null;
            if (el) {
                el.setAttribute('content', content);
            } else {
                el = document.createElement('meta');
                const parts = selector.match(/\[(\w+(?::|-)?\w+)="([^"]+)"\]/);
                if (parts) {
                    el.setAttribute(parts[1], parts[2]);
                    el.setAttribute('content', content);
                    document.head.appendChild(el);
                }
            }
        };

        // Helper to set or create a link tag
        const setLink = (rel: string, href: string) => {
            let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
            if (!el) {
                el = document.createElement('link');
                el.setAttribute('rel', rel);
                document.head.appendChild(el);
            }
            el.setAttribute('href', href);
        };

        setMeta('meta[name="title"]', fullTitle);
        setMeta('meta[name="description"]', description);
        setMeta('meta[name="author"]', siteTitle);
        setMeta('meta[property="og:title"]', `${siteTitle} | ${brokerTitle}`);
        setMeta('meta[property="og:description"]', description);
        setMeta('meta[property="og:url"]', canonicalUrl);
        setMeta('meta[property="og:site_name"]', siteTitle);
        setMeta('meta[property="twitter:title"]', `${siteTitle} | ${brokerTitle}`);
        setMeta('meta[property="twitter:description"]', description);
        setMeta('meta[property="twitter:url"]', canonicalUrl);
        setLink('canonical', canonicalUrl);
    }, [siteConfig, displayName, type]);

    // Handle hash-based routing for SEO-friendly URLs
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1); // Remove #
            if (!hash || hash === '/') {
                setCurrentView('home');
                setFilter('all');
            } else if (hash === '/satilik') {
                setCurrentView('satilik');
                setFilter('satilik');
            } else if (hash === '/kiralik') {
                setCurrentView('kiralik');
                setFilter('kiralik');
            } else if (hash === '/hakkimizda') {
                setCurrentView('hakkimizda');
            } else if (hash === '/blog') {
                setCurrentView('blog');
            } else if (hash.startsWith('/blog/')) {
                setCurrentView('blog-post');
                setSelectedBlogSlug(hash.replace('/blog/', ''));
            } else if (hash.startsWith('/ilan/')) {
                setCurrentView('ilan');
                setSelectedPropertySlug(hash.replace('/ilan/', ''));
                const prop = properties.find(p => p.id === hash.replace('/ilan/', ''));
                if (prop) setSelectedProperty(prop);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [properties]);

    // Navigate function
    const navigateTo = (view: ViewType, slug?: string) => {
        if (view === 'home') {
            window.location.hash = '/';
            setFilter('all');
        } else if (view === 'satilik') {
            window.location.hash = '/satilik';
            setFilter('satilik');
        } else if (view === 'kiralik') {
            window.location.hash = '/kiralik';
            setFilter('kiralik');
        } else if (view === 'hakkimizda') {
            window.location.hash = '/hakkimizda';
        } else if (view === 'blog') {
            window.location.hash = '/blog';
        } else if (view === 'blog-post' && slug) {
            window.location.hash = `/blog/${slug}`;
        } else if (view === 'ilan' && slug) {
            window.location.hash = `/ilan/${slug}`;
        }
        setCurrentView(view);
    };

    // Filter properties based on selection
    const filteredProperties = properties.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'satilik') return p.status?.toLowerCase().includes('satılık') || p.status?.toLowerCase().includes('satilik');
        if (filter === 'kiralik') return p.status?.toLowerCase().includes('kiralık') || p.status?.toLowerCase().includes('kiralik');
        return true;
    });

    // Handle property click - navigate to detail page
    const handlePropertyClick = (property: Property) => {
        setSelectedProperty(property);
        navigateTo('ilan', property.id);
    };

    // Layout Rendering Logic
    const renderLayout = () => {
        switch (siteConfig.layout) {
            case 'map':
                return <MapLayout config={siteConfig} properties={filteredProperties} onPropertyClick={handlePropertyClick} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} />;
            case 'grid':
                return <GridLayout config={siteConfig} properties={filteredProperties} onPropertyClick={handlePropertyClick} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} />;
            case 'standard':
            default:
                return <StandardLayout config={siteConfig} properties={filteredProperties} onPropertyClick={handlePropertyClick} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} ownerName={ownerName} />;
        }
    };

    // Render About Page
    const renderAboutPage = () => (
        <div className="flex flex-col min-h-screen">
            <Header config={siteConfig} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} />
            <AboutSection config={siteConfig} ownerName={ownerName} />
            <Footer config={siteConfig} />
        </div>
    );

    // Render Blog List
    const renderBlogList = () => (
        <div className="flex flex-col min-h-screen">
            <Header config={siteConfig} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} />
            <BlogList config={siteConfig} navigateTo={navigateTo} />
            <Footer config={siteConfig} />
        </div>
    );

    // Render Blog Post
    const renderBlogPost = () => {
        const post = blogPosts.find(p => p.slug === selectedBlogSlug);
        if (!post) return renderBlogList();
        return (
            <div className="flex flex-col min-h-screen">
                <Header config={siteConfig} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} />
                <BlogPostDetail post={post} config={siteConfig} navigateTo={navigateTo} />
                <Footer config={siteConfig} />
            </div>
        );
    };

    // Render Property Detail Page (SEO-friendly)
    const renderPropertyDetail = () => {
        if (!selectedProperty) {
            navigateTo('home');
            return null;
        }
        return (
            <div className="flex flex-col min-h-screen">
                <Header config={siteConfig} filter={filter} onFilterChange={(f) => navigateTo(f === 'all' ? 'home' : f)} navigateTo={navigateTo} currentView={currentView} />
                <PropertyDetailPage property={selectedProperty} config={siteConfig} navigateTo={navigateTo} />
                <Footer config={siteConfig} />
            </div>
        );
    };

    // Determine what to render based on current view
    const renderContent = () => {
        switch (currentView) {
            case 'hakkimizda':
                return renderAboutPage();
            case 'blog':
                return renderBlogList();
            case 'blog-post':
                return renderBlogPost();
            case 'ilan':
                return renderPropertyDetail();
            default:
                return renderLayout();
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* SEO meta tags are updated dynamically via useEffect */}

            {renderContent()}

            {/* Contact Form Modal */}
            {showContactForm && (
                <ContactFormModal
                    config={siteConfig}
                    ownerName={type === 'personal' ? ownerName : officeName}
                    onClose={() => setShowContactForm(false)}
                />
            )}

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
                {/* Contact Form Button */}
                <button
                    onClick={() => setShowContactForm(true)}
                    className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                    title="İletişim Formu"
                >
                    <Mail className="w-6 h-6" />
                </button>

                {/* WhatsApp Button */}
                {siteConfig.phone && (
                    <a
                        href={`https://wa.me/${siteConfig.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 animate-bounce"
                        title="WhatsApp ile İletişim"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </a>
                )}
            </div>
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
    navigateTo: (view: ViewType, slug?: string) => void;
    currentView: ViewType;
    ownerName?: string;
}

// Profile Hero Section Component
const ProfileHero: React.FC<{ config: WebSiteConfig; ownerName?: string }> = ({ config, ownerName }) => {
    const stats = [
        { icon: Home, value: '150+', label: 'Başarılı Satış' },
        { icon: Users, value: '500+', label: 'Mutlu Müşteri' },
        { icon: Award, value: '10+', label: 'Yıllık Deneyim' },
        { icon: Star, value: '4.9', label: 'Müşteri Puanı' }
    ];

    // Use user-specific profile photo from config, fallback to initials
    const profileImage = config.profilePhotoUrl || null;
    const [imageError, setImageError] = useState(false);

    return (
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Logo Badge - Top Left on Desktop */}
                    {config.logoUrl && (
                        <div className="absolute top-6 left-6 hidden lg:block">
                            <img
                                src={config.logoUrl}
                                alt="Logo"
                                className="h-16 w-auto"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* Profile Image */}
                    <div className="relative">
                        <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                            {profileImage && !imageError ? (
                                <img
                                    src={profileImage}
                                    alt={ownerName || config.brokerTitle || 'Emlak Danışmanı'}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                                    {(ownerName || 'EA').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                            )}
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg">
                            <Award className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-2 rounded-full text-sm mb-4">
                            <Star className="w-4 h-4 text-yellow-400" />
                            {config.brokerTitle || 'Emlak Danışmanı'}
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                            {ownerName || config.siteTitle || 'Emlak Uzmanı'}
                        </h1>

                        <p className="text-xl text-gray-300 mb-6 max-w-2xl">
                            {config.aboutText || 'Gayrimenkul sektöründe uzman danışmanlık hizmeti. Hayalinizdeki evi birlikte bulalım.'}
                        </p>

                        {/* Contact Info */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                            {config.phone && (
                                <a href={`tel:${config.phone}`} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span>{config.phone}</span>
                                </a>
                            )}
                            {config.email && (
                                <a href={`mailto:${config.email}`} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span>{config.email}</span>
                                </a>
                            )}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <a
                                href={`https://wa.me/${config.phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                <MessageCircle className="w-5 h-5" />
                                WhatsApp İletişim
                            </a>
                            <a
                                href={`tel:${config.phone}`}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-white/20"
                            >
                                <Phone className="w-5 h-5" />
                                Hemen Ara
                            </a>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-gray-400 text-sm">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// 1. STANDARD LAYOUT (Hero + Grid)
const StandardLayout: React.FC<LayoutProps> = ({ config, properties, onPropertyClick, filter, onFilterChange, navigateTo, currentView, ownerName }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header config={config} filter={filter} onFilterChange={onFilterChange} navigateTo={navigateTo} currentView={currentView} />

            {/* Profile Hero Section */}
            <ProfileHero config={config} ownerName={ownerName} />

            {/* Filter Tabs */}
            <div className="bg-white border-b border-gray-100 sticky top-[73px] z-40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 py-4 overflow-x-auto">
                        <button
                            onClick={() => onFilterChange('all')}
                            className={`px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                                filter === 'all'
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={filter === 'all' ? { backgroundColor: config.primaryColor } : {}}
                        >
                            Tüm İlanlar
                        </button>
                        <button
                            onClick={() => onFilterChange('satilik')}
                            className={`px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                                filter === 'satilik'
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={filter === 'satilik' ? { backgroundColor: config.primaryColor } : {}}
                        >
                            🏠 Satılık
                        </button>
                        <button
                            onClick={() => onFilterChange('kiralik')}
                            className={`px-6 py-2.5 rounded-full font-medium transition-all whitespace-nowrap ${
                                filter === 'kiralik'
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={filter === 'kiralik' ? { backgroundColor: config.primaryColor } : {}}
                        >
                            🔑 Kiralık
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-16 flex-1">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        {filter === 'satilik' ? 'Satılık İlanlar' : filter === 'kiralik' ? 'Kiralık İlanlar' : 'Tüm İlanlar'}
                    </h2>
                    <p className="text-gray-500">
                        {properties.length} adet ilan bulundu
                    </p>
                </div>
                <PropertyGrid properties={properties} config={config} onPropertyClick={onPropertyClick} navigateTo={navigateTo} />
            </div>

            {/* Blog Preview Section */}
            <BlogPreview config={config} navigateTo={navigateTo} />

            <Footer config={config} />
        </div>
    );
};

// 2. MAP LAYOUT (Split Screen)
const MapLayout: React.FC<LayoutProps> = ({ config, properties, onPropertyClick, filter, onFilterChange, navigateTo, currentView }) => {
    return (
        <div className="h-screen flex flex-col">
            <Header config={config} compact filter={filter} onFilterChange={onFilterChange} navigateTo={navigateTo} currentView={currentView} />

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
const GridLayout: React.FC<LayoutProps> = ({ config, properties, onPropertyClick, filter, onFilterChange, navigateTo, currentView }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header config={config} filter={filter} onFilterChange={onFilterChange} navigateTo={navigateTo} currentView={currentView} />


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

const Header: React.FC<{
    config: WebSiteConfig;
    compact?: boolean;
    filter?: 'all' | 'satilik' | 'kiralik';
    onFilterChange?: (filter: 'all' | 'satilik' | 'kiralik') => void;
    navigateTo?: (view: ViewType, slug?: string) => void;
    currentView?: ViewType;
}> = ({ config, compact, filter = 'all', onFilterChange, navigateTo, currentView = 'home' }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [logoError, setLogoError] = useState(false);

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className={`container mx-auto px-4 ${compact ? 'py-3' : 'py-5'} flex justify-between items-center`}>
                <button
                    onClick={() => navigateTo?.('home')}
                    className="flex items-center gap-3 cursor-pointer"
                >
                    {config.logoUrl && !logoError ? (
                        <img
                            src={config.logoUrl}
                            alt="Logo"
                            className="h-14 w-auto"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="p-3 rounded-xl text-white" style={{ backgroundColor: config.primaryColor }}>
                            <Home className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 leading-none">{config.siteTitle || config.domain}</h1>
                        {!compact && <span className="text-sm text-gray-500">{config.brokerTitle || 'Emlak Danışmanı'}</span>}
                    </div>
                </button>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <button
                        onClick={() => navigateTo?.('home')}
                        className={`hover:text-black transition-colors ${currentView === 'home' || currentView === 'satilik' || currentView === 'kiralik' ? 'text-black font-bold' : ''}`}
                    >
                        Anasayfa
                    </button>
                    <button
                        onClick={() => navigateTo?.('satilik')}
                        className={`hover:text-black transition-colors ${currentView === 'satilik' ? 'font-bold' : ''}`}
                        style={currentView === 'satilik' ? { color: config.primaryColor } : {}}
                    >
                        Satılık
                    </button>
                    <button
                        onClick={() => navigateTo?.('kiralik')}
                        className={`hover:text-black transition-colors ${currentView === 'kiralik' ? 'font-bold' : ''}`}
                        style={currentView === 'kiralik' ? { color: config.primaryColor } : {}}
                    >
                        Kiralık
                    </button>
                    <button
                        onClick={() => navigateTo?.('hakkimizda')}
                        className={`hover:text-black transition-colors ${currentView === 'hakkimizda' ? 'font-bold' : ''}`}
                        style={currentView === 'hakkimizda' ? { color: config.primaryColor } : {}}
                    >
                        Hakkımızda
                    </button>
                    <button
                        onClick={() => navigateTo?.('blog')}
                        className={`hover:text-black transition-colors ${currentView === 'blog' || currentView === 'blog-post' ? 'font-bold' : ''}`}
                        style={currentView === 'blog' || currentView === 'blog-post' ? { color: config.primaryColor } : {}}
                    >
                        Blog
                    </button>
                    <a
                        href={`https://wa.me/${config.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                        style={{ backgroundColor: config.primaryColor }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        İletişim
                    </a>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-600"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 py-4">
                    <div className="container mx-auto px-4 flex flex-col gap-4">
                        <button onClick={() => { navigateTo?.('home'); setMobileMenuOpen(false); }} className="text-left py-2 text-slate-700 font-medium">Anasayfa</button>
                        <button onClick={() => { navigateTo?.('satilik'); setMobileMenuOpen(false); }} className="text-left py-2 text-slate-700 font-medium">Satılık</button>
                        <button onClick={() => { navigateTo?.('kiralik'); setMobileMenuOpen(false); }} className="text-left py-2 text-slate-700 font-medium">Kiralık</button>
                        <button onClick={() => { navigateTo?.('hakkimizda'); setMobileMenuOpen(false); }} className="text-left py-2 text-slate-700 font-medium">Hakkımızda</button>
                        <button onClick={() => { navigateTo?.('blog'); setMobileMenuOpen(false); }} className="text-left py-2 text-slate-700 font-medium">Blog</button>
                        <a
                            href={`https://wa.me/${config.phone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-4 rounded-lg text-white text-center flex items-center justify-center gap-2"
                            style={{ backgroundColor: config.primaryColor }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            İletişim
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
};

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

const PropertyGrid: React.FC<{ properties: Property[], config: WebSiteConfig, columns?: number, onPropertyClick: (property: Property) => void, navigateTo?: (view: ViewType, slug?: string) => void }> = ({ properties, config, columns, onPropertyClick, navigateTo }) => {
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

// About Section Component
const AboutSection: React.FC<{ config: WebSiteConfig; ownerName?: string }> = ({ config, ownerName }) => {
    const services = [
        { icon: Home, title: 'Satılık Emlak', description: 'Daire, villa, arsa ve ticari gayrimenkul satış danışmanlığı' },
        { icon: Users, title: 'Kiralık Emlak', description: 'Güvenilir kiracı bulma ve kira sözleşmesi desteği' },
        { icon: Award, title: 'Değerleme', description: 'Profesyonel gayrimenkul değerleme ve piyasa analizi' },
        { icon: Star, title: 'Yatırım Danışmanlığı', description: 'Gayrimenkul yatırım fırsatları ve portföy yönetimi' }
    ];

    return (
        <div className="py-20 bg-gray-50 flex-1">
            <div className="container mx-auto px-4">
                {/* About Header */}
                <div className="text-center mb-16">
                    <span className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        Hakkımızda
                    </span>
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">
                        {ownerName || config.siteTitle || 'Emlak Danışmanı'}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {config.aboutText || 'Gayrimenkul sektöründe uzun yıllara dayanan deneyimimiz ve profesyonel yaklaşımımızla hayalinizdeki evi bulmanıza yardımcı oluyoruz.'}
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {services.map((service, index) => (
                        <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `${config.primaryColor}15` }}>
                                <service.icon className="w-7 h-7" style={{ color: config.primaryColor }} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">{service.title}</h3>
                            <p className="text-gray-600">{service.description}</p>
                        </div>
                    ))}
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">İletişim Bilgileri</h3>
                            <p className="text-gray-600 mb-6">
                                Gayrimenkul ihtiyaçlarınız için benimle iletişime geçin. Size en uygun çözümü birlikte bulalım.
                            </p>
                            <div className="space-y-4">
                                {config.phone && (
                                    <a href={`tel:${config.phone}`} className="flex items-center gap-4 text-gray-700 hover:text-slate-900 transition-colors">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.primaryColor}15` }}>
                                            <Phone className="w-5 h-5" style={{ color: config.primaryColor }} />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Telefon</div>
                                            <div className="font-medium">{config.phone}</div>
                                        </div>
                                    </a>
                                )}
                                {config.email && (
                                    <a href={`mailto:${config.email}`} className="flex items-center gap-4 text-gray-700 hover:text-slate-900 transition-colors">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.primaryColor}15` }}>
                                            <Mail className="w-5 h-5" style={{ color: config.primaryColor }} />
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">E-posta</div>
                                            <div className="font-medium">{config.email}</div>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <a
                                href={`https://wa.me/${config.phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                <MessageCircle className="w-6 h-6" />
                                WhatsApp ile İletişim
                            </a>
                            <a
                                href={`tel:${config.phone}`}
                                className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                            >
                                <Phone className="w-6 h-6" />
                                Hemen Ara
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Blog Preview Component (for homepage)
const BlogPreview: React.FC<{ config: WebSiteConfig; navigateTo: (view: ViewType, slug?: string) => void }> = ({ config, navigateTo }) => {
    const latestPosts = blogPosts.slice(0, 3);

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <span className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            Blog
                        </span>
                        <h2 className="text-3xl font-bold text-slate-800">Emlak Rehberi</h2>
                    </div>
                    <button
                        onClick={() => navigateTo('blog')}
                        className="flex items-center gap-2 text-gray-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        Tümünü Gör <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {latestPosts.map(post => (
                        <article
                            key={post.id}
                            onClick={() => navigateTo('blog-post', post.slug)}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                                    {post.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(post.date).toLocaleDateString('tr-TR')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {post.readTime}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Blog List Component
const BlogList: React.FC<{ config: WebSiteConfig; navigateTo: (view: ViewType, slug?: string) => void }> = ({ config, navigateTo }) => {
    return (
        <div className="py-20 bg-white flex-1">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <span className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        Blog
                    </span>
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">Emlak Rehberi</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Gayrimenkul alım, satım ve kiralama süreçleri hakkında faydalı bilgiler
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map(post => (
                        <article
                            key={post.id}
                            onClick={() => navigateTo('blog-post', post.slug)}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-gray-100"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                                    {post.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(post.date).toLocaleDateString('tr-TR')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {post.readTime}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                                <button className="mt-4 text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Devamını Oku <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Blog Post Detail Component
const BlogPostDetail: React.FC<{ post: typeof blogPosts[0]; config: WebSiteConfig; navigateTo: (view: ViewType, slug?: string) => void }> = ({ post, config, navigateTo }) => {
    // Sample content - in a real app this would come from a CMS
    const content = `
        <p class="lead">Bu rehberde, ${post.title.toLowerCase()} konusunda bilmeniz gereken tüm önemli noktaları ele alacağız.</p>

        <h2>Neden Önemli?</h2>
        <p>Gayrimenkul sektöründe doğru kararlar almak, finansal geleceğiniz için kritik öneme sahiptir. ${post.excerpt}</p>

        <h2>Dikkat Edilmesi Gerekenler</h2>
        <ul>
            <li>Bütçenizi ve ödeme planınızı net olarak belirleyin</li>
            <li>Lokasyon araştırması yapın ve bölgeyi tanıyın</li>
            <li>Profesyonel destek almaktan çekinmeyin</li>
            <li>Tüm belgeleri dikkatlice inceleyin</li>
            <li>Piyasa koşullarını takip edin</li>
        </ul>

        <h2>Sonuç</h2>
        <p>Doğru bilgi ve profesyonel destek ile gayrimenkul süreçlerinizi sorunsuz bir şekilde tamamlayabilirsiniz. Sorularınız için benimle iletişime geçmekten çekinmeyin.</p>
    `;

    return (
        <article className="py-12 flex-1">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                    <button onClick={() => navigateTo('home')} className="hover:text-slate-900">Anasayfa</button>
                    <span>/</span>
                    <button onClick={() => navigateTo('blog')} className="hover:text-slate-900">Blog</button>
                    <span>/</span>
                    <span className="text-slate-800">{post.title}</span>
                </div>

                {/* Header */}
                <header className="mb-8">
                    <span className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        {post.category}
                    </span>
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">{post.title}</h1>
                    <div className="flex items-center gap-6 text-gray-500">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {post.readTime} okuma
                        </span>
                        <span className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            {config.brokerTitle || 'Emlak Danışmanı'}
                        </span>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div
                    className="prose prose-lg max-w-none prose-headings:text-slate-800 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* CTA */}
                <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Sorularınız mı var?</h3>
                    <p className="text-gray-600 mb-6">Gayrimenkul konusunda size yardımcı olmaktan mutluluk duyarım.</p>
                    <a
                        href={`https://wa.me/${config.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                    >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp ile İletişim
                    </a>
                </div>

                {/* Back to Blog */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigateTo('blog')}
                        className="text-gray-600 hover:text-slate-900 font-medium flex items-center gap-2 mx-auto"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Tüm Yazılar
                    </button>
                </div>
            </div>
        </article>
    );
};

// Property Detail Page Component (SEO-friendly full page)
const PropertyDetailPage: React.FC<{ property: Property; config: WebSiteConfig; navigateTo: (view: ViewType, slug?: string) => void }> = ({ property, config, navigateTo }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = property.images?.length ? property.images : ['https://via.placeholder.com/800x600?text=No+Image'];

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

    // Generate JSON-LD for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": property.title,
        "description": property.description || `${property.title} - ${property.location}`,
        "url": window.location.href,
        "image": images,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": property.location
        },
        "offers": {
            "@type": "Offer",
            "price": property.price,
            "priceCurrency": property.currency || "TRY"
        },
        "numberOfRooms": property.rooms,
        "numberOfBathroomsTotal": property.bathrooms,
        "floorSize": {
            "@type": "QuantitativeValue",
            "value": property.area,
            "unitCode": "MTK"
        }
    };

    return (
        <div className="py-8 flex-1">
            {/* JSON-LD Script */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <button onClick={() => navigateTo('home')} className="hover:text-slate-900">Anasayfa</button>
                    <span>/</span>
                    <button
                        onClick={() => navigateTo(property.status?.toLowerCase().includes('satılık') ? 'satilik' : 'kiralik')}
                        className="hover:text-slate-900"
                    >
                        {property.status?.toLowerCase().includes('satılık') ? 'Satılık' : 'Kiralık'}
                    </button>
                    <span>/</span>
                    <span className="text-slate-800 truncate max-w-[200px]">{property.title}</span>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Image Gallery */}
                        <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden mb-6">
                            <img
                                src={images[currentImageIndex]}
                                alt={`${property.title} - Fotoğraf ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors shadow-lg"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-colors shadow-lg"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {/* Thumbnails */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm p-2 rounded-full">
                                        {images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`w-3 h-3 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-slate-800 uppercase tracking-wider">
                                {property.status}
                            </div>
                        </div>

                        {/* Thumbnail Grid */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                {images.slice(0, 4).map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        className={`relative h-24 rounded-lg overflow-hidden ${i === currentImageIndex ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        {i === 3 && images.length > 4 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                                                +{images.length - 4}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Property Info */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
                            <h1 className="text-3xl font-bold text-slate-800 mb-4">{property.title}</h1>
                            <div className="flex items-center text-gray-500 mb-6">
                                <MapPin className="w-5 h-5 mr-2" />
                                {property.location}
                            </div>

                            {/* Key Features */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-100 mb-6">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-800 mb-1">
                                        <Bed className="w-6 h-6 text-gray-400" />
                                        {property.rooms}
                                    </div>
                                    <div className="text-sm text-gray-500">Oda Sayısı</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-800 mb-1">
                                        <Bath className="w-6 h-6 text-gray-400" />
                                        {property.bathrooms}
                                    </div>
                                    <div className="text-sm text-gray-500">Banyo</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-800 mb-1">
                                        <Maximize className="w-6 h-6 text-gray-400" />
                                        {property.area}
                                    </div>
                                    <div className="text-sm text-gray-500">m² (Brüt)</div>
                                </div>
                                {property.buildingAge !== undefined && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-800 mb-1">{property.buildingAge}</div>
                                        <div className="text-sm text-gray-500">Bina Yaşı</div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {property.description && (
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-4">Açıklama</h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Additional Details */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">İlan Detayları</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {property.type && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="text-sm text-gray-500 mb-1">Emlak Tipi</div>
                                        <div className="font-medium text-slate-800">{property.type}</div>
                                    </div>
                                )}
                                {property.currentFloor !== undefined && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="text-sm text-gray-500 mb-1">Bulunduğu Kat</div>
                                        <div className="font-medium text-slate-800">{getFloorLabel(property.currentFloor)}</div>
                                    </div>
                                )}
                                {property.totalFloors !== undefined && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="text-sm text-gray-500 mb-1">Toplam Kat</div>
                                        <div className="font-medium text-slate-800">{property.totalFloors}</div>
                                    </div>
                                )}
                                {property.heating && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="text-sm text-gray-500 mb-1">Isıtma</div>
                                        <div className="font-medium text-slate-800">{property.heating}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            {/* Price Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                <div className="text-3xl font-bold mb-2" style={{ color: config.primaryColor }}>
                                    {property.price?.toLocaleString('tr-TR')} {property.currency}
                                </div>
                                <div className="text-gray-500 mb-6">
                                    {property.area ? `${Math.round(property.price! / property.area).toLocaleString('tr-TR')} ${property.currency}/m²` : ''}
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href={`https://wa.me/${config.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba, ${property.title} ilanı hakkında bilgi almak istiyorum.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold transition-all"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        WhatsApp ile İletişim
                                    </a>
                                    <a
                                        href={`tel:${config.phone}`}
                                        className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-semibold transition-all"
                                    >
                                        <Phone className="w-5 h-5" />
                                        Hemen Ara
                                    </a>
                                </div>
                            </div>

                            {/* Agent Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="text-center mb-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3 overflow-hidden">
                                        {(config.profilePhotoUrl || config.logoUrl) ? (
                                            <img src={config.profilePhotoUrl || config.logoUrl} alt="Danışman" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                                                {(config.siteTitle || 'EA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-800">{config.siteTitle || 'Emlak Danışmanı'}</h3>
                                    <p className="text-sm text-gray-500">{config.brokerTitle || 'Emlak Danışmanı'}</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {config.phone && (
                                        <a href={`tel:${config.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-slate-900">
                                            <Phone className="w-4 h-4" />
                                            {config.phone}
                                        </a>
                                    )}
                                    {config.email && (
                                        <a href={`mailto:${config.email}`} className="flex items-center gap-2 text-gray-600 hover:text-slate-900">
                                            <Mail className="w-4 h-4" />
                                            {config.email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <button
                        onClick={() => navigateTo('home')}
                        className="text-gray-600 hover:text-slate-900 font-medium flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Tüm İlanlara Dön
                    </button>
                </div>
            </div>
        </div>
    );
};

// Contact Form Modal
const ContactFormModal: React.FC<{ config: WebSiteConfig, ownerName: string | undefined, onClose: () => void }> = ({ config, ownerName, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            toast.error('Lütfen adınızı ve telefon numaranızı girin');
            return;
        }

        setIsSubmitting(true);
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create WhatsApp message with form data
        const message = encodeURIComponent(
            `Merhaba ${ownerName || 'Emlak Danışmanı'},\n\n` +
            `Ben ${formData.name}.\n` +
            `Telefon: ${formData.phone}\n` +
            (formData.email ? `E-posta: ${formData.email}\n` : '') +
            `\nMesajım:\n${formData.message || 'Emlak ilanlarınız hakkında bilgi almak istiyorum.'}`
        );

        // Open WhatsApp with pre-filled message
        window.open(`https://wa.me/${config.phone?.replace(/\D/g, '')}?text=${message}`, '_blank');

        toast.success('Mesajınız WhatsApp ile iletiliyor...');
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold">İletişim Formu</h3>
                            <p className="text-blue-100 text-sm mt-1">Size en kısa sürede dönüş yapacağız</p>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adınız Soyadınız *</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Örn: Ahmet Yılmaz"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numaranız *</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Örn: 0532 123 45 67"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta (Opsiyonel)</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="ornek@email.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                            placeholder="Hangi bölgede, ne tür bir emlak arıyorsunuz?"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            'Gönderiliyor...'
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                WhatsApp ile Gönder
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-500">
                        Formunuz WhatsApp üzerinden iletilecektir.
                    </p>
                </form>
            </div>
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
                                <div className="text-2xl font-bold text-slate-800">{getFloorLabel(property.currentFloor)}</div>
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
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-lg font-medium transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
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
