import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, Calendar, BarChart3, Globe, Shield,
  Check, ArrowRight, Phone, Mail, MapPin, Star
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Building2,
      title: 'Portföy Yönetimi',
      description: 'Tüm gayrimenkul portföyünüzü tek bir yerden yönetin. Detaylı ilan bilgileri, fotoğraflar ve konum.'
    },
    {
      icon: Users,
      title: 'Müşteri Takibi',
      description: 'Müşterilerinizi kategorize edin, notlar ekleyin ve iletişim geçmişini takip edin.'
    },
    {
      icon: Calendar,
      title: 'Aktivite Yönetimi',
      description: 'Görüşmeler, yer gösterimleri ve randevularınızı planlayın, takip edin.'
    },
    {
      icon: BarChart3,
      title: 'Raporlama',
      description: 'Satış performansınızı, komisyon gelirlerinizi ve hedeflerinizi analiz edin.'
    },
    {
      icon: Globe,
      title: 'Kişisel Web Sitesi',
      description: 'Kendi domain\'inizle profesyonel bir emlak web sitesi oluşturun.'
    },
    {
      icon: Shield,
      title: 'Güvenli Altyapı',
      description: 'Verileriniz güvenli sunucularda, şifreli bağlantılarla korunur.'
    }
  ];

  const plans = [
    {
      name: 'Ücretsiz',
      price: '0',
      period: '',
      description: 'Başlangıç için ideal',
      features: [
        '20 Portföy',
        '50 Müşteri',
        'Sınırsız Aktivite',
        'Kişisel Web Sitesi',
        'Temel Raporlar'
      ],
      cta: 'Hemen Başla',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '199',
      period: '/ay',
      description: 'Profesyonel danışmanlar için',
      features: [
        'Sınırsız Portföy',
        'Sınırsız Müşteri',
        'Sınırsız Aktivite',
        'Özel Domain Desteği',
        'Gelişmiş Raporlar',
        'Öncelikli Destek',
        'Ofis Yönetimi'
      ],
      cta: 'Pro\'ya Yükselt',
      highlighted: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Emlak CRM</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Özellikler</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Fiyatlandırma</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">İletişim</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 font-medium transition"
              >
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Türkiye'nin Emlak CRM'i
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Emlak Danışmanları İçin
              <span className="text-blue-600"> Profesyonel CRM</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Portföyünüzü yönetin, müşterilerinizi takip edin, satışlarınızı analiz edin.
              Tek platformda tüm emlak operasyonlarınız.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-blue-600/25"
              >
                Ücretsiz Hesap Oluştur
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition border border-gray-200"
              >
                Özellikleri Keşfet
              </a>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Kredi kartı gerekmez • 20 portföy ücretsiz • Hemen başlayın
            </p>
          </div>

          {/* Hero Image/Screenshot Placeholder */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-4 max-w-5xl mx-auto">
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Dashboard Önizleme</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              İhtiyacınız Olan Her Şey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Emlak danışmanlığı süreçlerinizi baştan sona yönetmek için tasarlandı
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition">
                  <feature.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Basit ve Şeffaf Fiyatlandırma
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              İhtiyacınıza göre plan seçin, istediğiniz zaman yükseltin
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/25 scale-105'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
                    En Popüler
                  </div>
                )}

                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-4 ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}₺
                  </span>
                  <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-500'}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${plan.highlighted ? 'text-blue-200' : 'text-blue-600'}`} />
                      <span className={plan.highlighted ? 'text-white' : 'text-gray-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz hesap oluşturun, dakikalar içinde portföyünüzü yönetmeye başlayın.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition"
          >
            Ücretsiz Hesap Oluştur
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Emlak CRM</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Emlak danışmanları ve ofisleri için profesyonel müşteri ilişkileri yönetim sistemi.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition">Özellikler</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Fiyatlandırma</a></li>
                <li><Link to="/login" className="hover:text-white transition">Giriş Yap</Link></li>
                <li><Link to="/register" className="hover:text-white transition">Kayıt Ol</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">İletişim</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>destek@emlakcrm.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+90 555 123 4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>İstanbul, Türkiye</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Emlak CRM. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
