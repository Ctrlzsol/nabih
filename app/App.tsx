import React from 'react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import Layout from '../ui/layout/Layout';
import LandingView from '../ui/views/LandingView';
import MerchantPlatform from '../ui/views/MerchantPlatform';
import ConsumerPlatform from '../ui/views/ConsumerPlatform';
import AdminDashboard from '../ui/views/AdminDashboard';
import PendingApproval from '../ui/views/PendingApproval';
import AuthContainer from '../ui/views/AuthContainer';
import MerchantPublicProfile from '../ui/views/MerchantPublicProfile';
import { AppProvider, useAppStore } from '../stores/app.store';
import { STRINGS } from '../config/constants';
import { Loader2, AlertTriangle } from 'lucide-react';
import { NabihLogo } from '../ui/components/NabihLogo';

const motion = motionBase as any;

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle size={40} />
           </div>
           <h2 className="text-2xl font-black text-gray-800 mb-2">عذراً، حدث خطأ غير متوقع</h2>
           <p className="text-gray-500 mb-8 max-w-md">واجه التطبيق مشكلة تقنية أثناء التحميل. يرجى محاولة تحديث الصفحة.</p>
           <button 
             onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} 
             className="px-8 py-3 bg-[#2E0249] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
           >
             تحديث الصفحة (Reload)
           </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { state, actions } = useAppStore();
  const { lang, user, platform, currentView, authMode, country, isHistoryOpen, isInitializing, selectedMerchantId } = state;
  const isRtl = lang === 'ar';

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <NabihLogo size={32} className="animate-pulse mb-6" />
        <Loader2 className="animate-spin text-nabih-purple" size={32} />
      </div>
    );
  }

  return (
    <Layout 
      lang={lang} 
      setLang={actions.setLang} 
      user={user} 
      onHistoryClick={() => actions.setIsHistoryOpen(true)}
      platform={platform}
      setPlatform={actions.setPlatform}
      onAdminClick={actions.handleAdminClick}
      onDashboardClick={() => {
        if (user?.role === 'merchant' && (user.status === 'active' || user.status === 'approved')) {
          actions.setCurrentView('merchant-dashboard');
        }
      }}
      hideGlobalUI={currentView === 'admin-dashboard'}
      showAdminAccess={currentView === 'landing'} // ONLY show Admin link on main landing page
    >
      <AnimatePresence mode="wait">
        
        {currentView === 'landing' && (
          <LandingView 
            user={user} 
            t={STRINGS[lang]} 
            isRtl={isRtl} 
            platform={platform}
            onStart={actions.handleStartSearch} 
          />
        )}

        {currentView === 'pending-approval' && (
            <PendingApproval isRtl={isRtl} onLogout={actions.logout} />
        )}

        {currentView === 'auth' && (
            <AuthContainer 
                lang={lang}
                platform={platform}
                authMode={authMode}
                isRtl={isRtl}
                onLoginSuccess={actions.onLoginSuccess}
                onBack={() => {
                    actions.setCurrentView('landing');
                    if(platform === 'admin') actions.setPlatform('consumer');
                }}
            />
        )}

        {currentView === 'admin-dashboard' && <AdminDashboard onLogout={actions.logout} />}
        {currentView === 'merchant-dashboard' && user && <MerchantPlatform user={user} lang={lang} />}
        {currentView === 'search' && (
          <ConsumerPlatform 
            user={user} 
            lang={lang} 
            country={country} 
            setCountry={actions.setCountry} 
            isHistoryOpen={isHistoryOpen} 
            setIsHistoryOpen={actions.setIsHistoryOpen} 
          />
        )}
        
        {currentView === 'merchant-profile' && selectedMerchantId && (
            <MerchantPublicProfile 
                merchantId={selectedMerchantId} 
                lang={lang} 
                onBack={() => actions.setCurrentView('search')} 
            />
        )}
      </AnimatePresence>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;