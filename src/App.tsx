import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar, { MobileHeader } from './components/Sidebar';
import { QuickActionsFAB, QuickCallModal, QuickMessageModal } from './components/QuickActions';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import PropertyForm from './pages/PropertyForm';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';
import SiteManagement from './pages/SiteManagement';
import ActivityList from './pages/ActivityList';
import ActivityForm from './pages/ActivityForm';
import RequestList from './pages/RequestList';
import RequestForm from './pages/RequestForm';
import RequestDetail from './pages/RequestDetail';
import Reports from './pages/Reports';
import WebBuilder from './pages/WebBuilder';
import WebPreview from './pages/WebPreview';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import Team from './pages/Team';
import PublicSite from './pages/PublicSite';
import LandingPage from './pages/LandingPage';
import AdminPanel from './pages/AdminPanel';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { getSiteByDomain, PublicSiteData, warmupSupabase } from './services/publicSiteService';
import { keepSupabaseAlive } from './services/keepAliveService';

// Start warming up Supabase immediately when script loads
warmupSupabase();

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-200">
      {/* Mobile Header - only visible on mobile */}
      <MobileHeader onMenuClick={toggleSidebar} />

      {/* Sidebar - hidden on mobile by default, visible on desktop */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content - full width on mobile, with margin on desktop */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pt-16 lg:pt-0">
        <TopBar title="Emlak CRM" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Quick Actions FAB - appears on all pages */}
      <QuickActionsFAB
        onCallClick={() => setShowCallModal(true)}
        onMessageClick={() => setShowMessageModal(true)}
      />

      {/* Quick Entry Modals */}
      <QuickCallModal isOpen={showCallModal} onClose={() => setShowCallModal(false)} />
      <QuickMessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useData();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

  if (!session) {
    return <Login />; // Render Login directly if not authenticated
  }

  return <>{children}</>;
};

// Loading Screen Component - Shows skeleton of the public site
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Yükleniyor...' }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Skeleton Header */}
      <header className="bg-white border-b border-gray-100 py-5">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Skeleton Hero */}
      <div className="relative h-[400px] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-medium text-lg">{message}</p>
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-1/2 h-4 bg-gray-100 rounded animate-pulse"></div>
                <div className="w-1/3 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// CRM Application Component
const CRMApp: React.FC = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/web-preview" element={<WebPreview />} />
        <Route path="/admin/*" element={<AdminPanel />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarPage />} />

          <Route path="activities" element={<ActivityList />} />
          <Route path="activities/new" element={<ActivityForm />} />
          <Route path="activities/edit/:id" element={<ActivityForm />} />

          <Route path="requests" element={<RequestList />} />
          <Route path="requests/new" element={<RequestForm />} />
          <Route path="requests/edit/:id" element={<RequestForm />} />
          <Route path="requests/:id" element={<RequestDetail />} />

          <Route path="properties" element={<PropertyList />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="properties/edit/:id" element={<PropertyForm />} />

          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/new" element={<CustomerForm />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="customers/edit/:id" element={<CustomerForm />} />

          <Route path="sites" element={<SiteManagement />} />
          <Route path="web-builder" element={<WebBuilder />} />

          <Route path="reports" element={<Reports />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
    </>
  );
};

// Helper function to check if domain should skip public site check
// Only Vercel/localhost domains skip - custom domains check for public sites
const shouldSkipPublicSiteCheck = (hostname: string): boolean => {
  const cleanDomain = hostname.replace(/^www\./, '').toLowerCase().trim();

  const skipPatterns = [
    'localhost',
    '127.0.0.1',
    'vercel.app',   // CRM panel accessed via Vercel URLs
    'vercel.com',
    'netlify.app',
    'netlify.com',
    'github.io',
    '192.168.',
    '10.0.',
    'ngrok'
  ];
  return skipPatterns.some(pattern => cleanDomain.includes(pattern));
};

// Main App with Domain-Based Routing
const App: React.FC = () => {
  // CRITICAL: Check synchronously first - if it's a Vercel/localhost domain, skip ALL async checks
  const hostname = window.location.hostname;
  const skipCheck = shouldSkipPublicSiteCheck(hostname);

  const [isPublicSite, setIsPublicSite] = useState<boolean | null>(skipCheck ? false : null);
  const [publicSiteData, setPublicSiteData] = useState<PublicSiteData | null>(null);

  useEffect(() => {
    // If we already know this is not a public site domain, don't do anything
    if (skipCheck) {
      return;
    }

    const checkDomain = async () => {
      try {
        // Check if this domain is registered as a public site
        const siteData = await getSiteByDomain(hostname);

        if (siteData) {
          setIsPublicSite(true);
          setPublicSiteData(siteData);
        } else {
          setIsPublicSite(false);
        }
      } catch (error) {
        console.error('Domain check failed:', error);
        // On error, default to CRM mode
        setIsPublicSite(false);
      }
    };

    checkDomain();
  }, [hostname, skipCheck]);

  // Still checking domain (only for custom domains)
  if (isPublicSite === null) {
    return <LoadingScreen />;
  }

  // This is a public site domain - render public website
  if (isPublicSite && publicSiteData) {
    return <PublicSite siteData={publicSiteData} />;
  }

  // This is the main CRM domain - render full app with auth
  return (
    <ThemeProvider>
      <DataProvider>
        <CRMApp />
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;

