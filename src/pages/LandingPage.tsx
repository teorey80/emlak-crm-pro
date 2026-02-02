import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Users, Calendar, BarChart3, Globe, Shield,
  Check, ArrowRight, Phone, Mail, MapPin, Star, Sparkles,
  Bell, Link as LinkIcon, UserPlus, Target, PieChart
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Building2,
      title: 'Portföy Yönetimi',
      description: 'Tüm gayrimenkul portföyünüzü tek bir yerden yönetin. Detaylı ilan bilgileri, fotoğraflar, kapora takibi ve konum.'
    },
    {
      icon: Users,
      title: 'Müşteri Takibi',
      description: 'Kiracı, alıcı ve mal sahiplerini kategorize edin, talepler oluşturun ve iletişim geçmişini takip edin.'
    },
    {
      icon: Calendar,
      title: 'Aktivite Yönetimi',
      description: 'Görüşmeler, yer gösterimleri, kapora alımları ve randevularınızı planlayın, takip edin.'
    },
    {
      icon: BarChart3,
      title: 'Satış ve Komisyon',
      description: 'Satış süreçlerinizi yönetin, komisyonları hesaplayın ve finansal takip yapın.'
    },
    {
      icon: Globe,
      title: 'Kişisel Web Sitesi',
      description: 'Kendi domain\'inizle profesyonel bir emlak web sitesi oluşturun. Ofis ve kişisel site desteği.'
    },
    {
      icon: Shield,
      title: 'Güvenli Altyapı',
      description: 'Verileriniz güvenli sunucularda, şifreli bağlantılarla korunur. RLS ile veri izolasyonu.'
    },
    {
      icon: UserPlus,
      title: 'Ekip Yönetimi',
      description: 'Broker olarak ekibinizi yönetin, davet linki ile yeni danışman ekleyin, roller atayın.'
    },
    {
      icon: Sparkles,
      title: 'Akıllı Eşleştirme',
      description: 'Müşteri talepleri ile portföyleriniz arasında otomatik eşleştirme. Çapraz danışman desteği.'
    },
    {
      icon: Bell,
      title: 'Bildirim Sistemi',
      description: 'Gerçek zamanlı bildirimler, eşleşme uyarıları ve ekip aktiviteleri hakkında anlık bilgi.'
    }
  ];

  const saasFeatures = [
    {
      title: 'Ofis Yapısı',
      items: ['Broker ve Danışman rolleri', 'Davet linki ile ekibe katılım', 'Rol değiştirme yetkisi', 'Ofis içi veri paylaşımı']
    },
    {
      title: 'Gizlilik',
      items: ['Müşteri bilgileri sadece sahibine', 'Portföyler ofis içinde görünür', 'Veri sahipliği kullanıcıda', 'Ofis değişse veri taşınır']
    },
    {
      title: 'Eşleştirme',
      items: ['Talep-portföy eşleştirme', 'Çapraz danışman eşleşme', 'Skor bazlı sıralama', 'Eşleşme merkezi sayfası']
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
              <span className="text-xl font-bold text-gray-900">Emlak CRM Pro</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Özellikler</a>
              <a href="#saas" className="text-gray-600 hover:text-gray-900 transition">SaaS</a>
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
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Check className="w-4 h-4" />
              SaaS Dönüşümü Tamamlandı - Canlıda!
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Emlak Ofisleri İçin
              <span className="text-blue-600"> Profesyonel CRM</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Portföyünüzü yönetin, ekibinizi koordine edin, akıllı eşleştirmelerle satışları artırın.
              Türkiye'nin modern emlak yönetim platformu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-blue-600/25"
              >
                Ücretsiz Hesap Oluştur
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition border border-gray-200"
              >
                Demo Giriş Yap
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              ✓ Sınırsız kullanım • ✓ Ekip yönetimi • ✓ Akıllı eşleştirme • ✓ Hemen başlayın
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">9+</div>
              <div className="text-gray-600 mt-1">Temel Özellik</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">100%</div>
              <div className="text-gray-600 mt-1">Türkçe</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">SaaS</div>
              <div className="text-gray-600 mt-1">Multi-tenant</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600 mt-1">Erişilebilir</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tüm İhtiyaçlarınız Tek Platformda
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Portföy yönetiminden ekip koordinasyonuna, müşteri takibinden akıllı eşleştirmeye
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

      {/* SaaS Features Section */}
      <section id="saas" className="py-20 bg-gradient-to-br from-violet-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              SaaS Özellikleri
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ofis Yönetimi ve Ekip İşbirliği
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern SaaS altyapısı ile ofis ve ekip yönetimi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {saasFeatures.map((section, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              <UserPlus className="w-5 h-5" />
              Hemen Ekibinizi Oluşturun
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ücretsiz Kullanın
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tüm özellikler şu anda ücretsiz! Hemen başlayın.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-xl shadow-blue-600/25">
              <div className="text-center">
                <div className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
                  Tam Erişim
                </div>
                <h3 className="text-3xl font-bold mb-2">Tüm Özellikler</h3>
                <p className="text-blue-100 mb-6">Sınırsız kullanım, sınırsız ekip</p>

                <div className="mb-8">
                  <span className="text-6xl font-bold">0₺</span>
                  <span className="text-blue-200">/ay</span>
                </div>

                <ul className="text-left space-y-3 mb-8">
                  {[
                    'Sınırsız Portföy',
                    'Sınırsız Müşteri',
                    'Ekip Yönetimi',
                    'Akıllı Eşleştirme',
                    'Kişisel Web Sitesi',
                    'Tüm Raporlar',
                    'Bildirim Sistemi'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-blue-200" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className="block w-full text-center py-4 px-6 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition"
                >
                  Ücretsiz Başla
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Ücretsiz hesap oluşturun, dakikalar içinde ekibinizi kurun ve portföyünüzü yönetmeye başlayın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
            >
              Ücretsiz Hesap Oluştur
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition border border-white/20"
            >
              Giriş Yap
            </Link>
          </div>
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
                <span className="text-xl font-bold text-white">Emlak CRM Pro</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Emlak danışmanları ve ofisleri için profesyonel müşteri ilişkileri yönetim sistemi.
                SaaS altyapısı ile modern, güvenli ve ölçeklenebilir.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition">Özellikler</a></li>
                <li><a href="#saas" className="hover:text-white transition">SaaS</a></li>
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
                  <a href="mailto:destek@emlakcrm.com" className="hover:text-white transition">destek@emlakcrm.com</a>
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
            <p>&copy; {new Date().getFullYear()} Emlak CRM Pro. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
