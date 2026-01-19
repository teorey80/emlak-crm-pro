import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
import { DataProvider, useData } from './context/DataContext';
import { getSiteByDomain, PublicSiteData } from './services/publicSiteService';
import { keepSupabaseAlive } from './services/keepAliveService';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar title="Emlak CRM" />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
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

// Loading Screen Component with warm-up animation
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Yükleniyor...' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);

    // Pre-warm Supabase connection in background
    keepSupabaseAlive().then(result => {
      console.log(`[LoadingScreen] DB warm-up: ${result.latency}ms`);
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-600 font-medium">{message}{dots}</p>
    </div>
  );
};

// CRM Application Component
const CRMApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/web-preview" element={<WebPreview />} />

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
  );
};

// Helper function to check if domain should skip public site check
const shouldSkipPublicSiteCheck = (hostname: string): boolean => {
  const cleanDomain = hostname.replace(/^www\./, '').toLowerCase().trim();
  const skipPatterns = [
    'localhost',
    '127.0.0.1',
    'vercel.app',
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
    <DataProvider>
      <CRMApp />
    </DataProvider>
  );
};

export default App;

