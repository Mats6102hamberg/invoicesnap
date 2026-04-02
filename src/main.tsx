import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import LoginLight from './components/LoginLight'
import WelcomeScreen from './components/WelcomeScreen'
import InvoiceHome from './components/InvoiceHome'
import NewInvoice from './components/NewInvoice'
import InvoiceList from './components/InvoiceList'
import CompanyProfile from './components/CompanyProfile'
import BusinessHub from './components/BusinessHub'
import CustomerProjects from './components/CustomerProjects'
import TimeTracking from './components/TimeTracking'
import AdminDashboard from './components/AdminDashboard'
import PricingPage from './components/PricingPage'
import HelpButton from './components/HelpButton'
import SupportChat from './components/SupportChat'
import InstallPrompt from './components/InstallPrompt'
import OfflineBanner from './components/OfflineBanner'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import { registerServiceWorker } from './utils/registerServiceWorker'
import './index.css'

registerServiceWorker();

type AppMode = 'welcome' | 'invoice-home' | 'new-invoice' | 'invoice-list' | 'company-profile' | 'business-hub' | 'customers' | 'time-tracking' | 'pricing' | 'admin';

function AppContent() {
  const { user, loading, setUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading InvoiceSnap...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginLight onLoginSuccess={(u, _token) => setUser(u)} />;
  }

  return <AppMain />;
}

function AppMain() {
  const [mode, setMode] = useState<AppMode>('welcome');
  const [showSupport, setShowSupport] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const nav = (newMode: string) => {
    setMode(newMode as AppMode);
    window.scrollTo(0, 0);
  };

  const renderMode = () => {
    switch (mode) {
      case 'welcome':
        return <WelcomeScreen onNavigate={nav} />;
      case 'invoice-home':
        return <InvoiceHome onNavigate={nav} onLogout={signOut} />;
      case 'new-invoice':
        return <NewInvoice onBack={() => nav('invoice-home')} />;
      case 'invoice-list':
        return <InvoiceList onBack={() => nav('invoice-home')} />;
      case 'company-profile':
        return <CompanyProfile onBack={() => nav('invoice-home')} />;
      case 'business-hub':
        return <BusinessHub onBack={() => nav('invoice-home')} onNavigate={nav} />;
      case 'customers':
        return <CustomerProjects onBack={() => nav('invoice-home')} />;
      case 'time-tracking':
        return <TimeTracking onBack={() => nav('invoice-home')} />;
      case 'pricing':
        return <PricingPage onBack={() => nav('invoice-home')} />;
      case 'admin':
        return <AdminDashboard onBack={() => nav('invoice-home')} />;
      default:
        return <WelcomeScreen onNavigate={nav} />;
    }
  };

  return (
    <>
      <OfflineBanner />
      {renderMode()}
      <HelpButton onClick={() => setShowSupport(true)} />
      {showSupport && <SupportChat onClose={() => setShowSupport(false)} />}
      <InstallPrompt />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
