
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../features/users/users.service';
import { Language, Platform, UserProfile } from '../config/types';

interface AppState {
  lang: Language;
  user: any | null;
  platform: Platform;
  currentView: 'landing' | 'auth' | 'search' | 'merchant-dashboard' | 'admin-dashboard' | 'pending-approval' | 'merchant-profile';
  authMode: 'login' | 'signup' | 'update_password';
  country: string;
  isHistoryOpen: boolean;
  isInitializing: boolean;
  selectedMerchantId: string | null;
}

interface AppActions {
  setLang: (l: Language) => void;
  setPlatform: (p: Platform) => void;
  setCurrentView: (v: AppState['currentView']) => void;
  setAuthMode: (m: AppState['authMode']) => void;
  setCountry: (c: string) => void;
  setIsHistoryOpen: (o: boolean) => void;
  onLoginSuccess: (userData: any, contextPlatform: Platform) => Promise<void>;
  handleStartSearch: (mode: 'login' | 'signup' | 'search') => void;
  handleAdminClick: () => void;
  viewMerchantProfile: (merchantId: string) => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<{ state: AppState; actions: AppActions } | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('ar');
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // 1. Initialize Platform based on Pathname OR Storage
  const [platform, setPlatformState] = useState<Platform>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/admin')) return 'admin';
      if (path.includes('/merchant')) return 'merchant';
      const stored = localStorage.getItem('nabih_platform');
      if (stored === 'consumer' || stored === 'merchant' || stored === 'admin') return stored;
    }
    return 'consumer';
  });

  const platformRef = useRef(platform);
  useEffect(() => {
    platformRef.current = platform;
    if (typeof window !== 'undefined') localStorage.setItem('nabih_platform', platform);
  }, [platform]);

  const [currentView, setCurrentView] = useState<AppState['currentView']>('landing');
  const [authMode, setAuthMode] = useState<AppState['authMode']>('login');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  
  const [country, setCountryState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('country_code');
      if (stored) return stored;
      return 'JO'; // Default fallback until IP detection runs
    }
    return 'JO';
  });
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const setPlatform = useCallback((p: Platform) => {
    setPlatformState(p);
  }, []);

  const setCountry = useCallback((c: string) => {
    setCountryState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem('country_code', c);
    }
  }, []);

  const logout = async () => {
    await (supabase.auth as any).signOut();
    setUser(null);
    setCurrentView('landing');
  };

  /**
   * CORE REDIRECTION LOGIC
   * Safe implementation to prevent infinite loops if profile is missing.
   */
  const handleFetchUserData = useCallback(async (userId: string, contextPlatform?: Platform) => { 
    try {
      const profile = await getUserProfile(userId);

      // EMERGENCY CHECK: If profile is missing, don't crash, don't loop. 
      // Create a fallback so the app can continue (especially for Admins fixing data).
      if (!profile) {
          console.warn("[AppStore] Profile not found. Creating fallback session.");
          setUser({ 
              id: userId, 
              name: 'Admin (Fallback)', 
              email: 'admin@system.local',
              role: 'admin',
              roles: ['admin']
          });
          // Force admin view to allow debugging
          setPlatform('admin');
          setCurrentView('admin-dashboard');
          return;
      }

      setUser(profile);
      if (profile.country) setCountry(profile.country);

      // --- DETERMINING TARGET PLATFORM ---
      let target: Platform = 'consumer';

      if (contextPlatform) {
          target = contextPlatform;
      } else if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path.includes('/admin')) target = 'admin';
          else if (path.includes('/merchant')) target = 'merchant';
          else target = platformRef.current;
      }

      const userRoles = profile.roles || [profile.role];

      if (target === 'consumer') {
          setPlatform('consumer');
          setCurrentView('search');
          return;
      }

      if (target === 'admin') {
          if (!userRoles.includes('admin')) {
              // Soft deny
              console.warn("User attempted admin access without role");
              setPlatform('consumer');
              setCurrentView('search');
              return; 
          }
          setPlatform('admin');
          setCurrentView('admin-dashboard');
          return;
      }

      if (target === 'merchant') {
          if (!userRoles.includes('merchant')) {
               console.warn("User attempted merchant access without role");
               setPlatform('consumer');
               setCurrentView('search');
               return;
          }
          setPlatform('merchant');
          if (profile.status === 'active' || profile.status === 'approved') {
              setCurrentView('merchant-dashboard');
          } else {
              setCurrentView('pending-approval');
          }
          return;
      }

      setPlatform('consumer');
      setCurrentView('search');

    } catch (err: any) {
      console.error("Auth Fetch Error:", err);
      // Removed logout() call here to prevent infinite loop on transient errors
    }
  }, [setCountry, setPlatform]); 

  // Initialize Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      setIsInitializing(true);
      const { data: { session } } = await (supabase.auth as any).getSession();
      if (session) {
          let initialContext: Platform | undefined = undefined;
          if (typeof window !== 'undefined') {
             const path = window.location.pathname;
             if (path.includes('/admin')) initialContext = 'admin';
             else if (path.includes('/merchant')) initialContext = 'merchant';
          }
          await handleFetchUserData(session.user.id, initialContext);
      }
      setIsInitializing(false);
    };
    initAuth();

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('landing');
      } 
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [handleFetchUserData, setPlatform]);

  const onLoginSuccess = async (userData: any, contextPlatform: Platform) => {
      if (userData?.id) {
          await handleFetchUserData(userData.id, contextPlatform);
      }
  };

  const handleStartSearch = (mode: 'login' | 'signup' | 'search') => {
      if (mode === 'search') {
          if (platform === 'consumer') {
             setCurrentView('search');
          } else if (platform === 'merchant' && user?.roles?.includes('merchant')) {
             setCurrentView('merchant-dashboard');
          } else if (platform === 'admin' && user?.roles?.includes('admin')) {
             setCurrentView('admin-dashboard');
          } else {
             setPlatform('consumer');
             setCurrentView('search');
          }
      } else { 
          setAuthMode(mode as any); 
          setCurrentView('auth'); 
      } 
  };

  const handleAdminClick = () => {
      setPlatform('admin');
      if (user && (user.role === 'admin' || user.roles?.includes('admin'))) {
          setCurrentView('admin-dashboard');
      } else {
          setCurrentView('auth');
          setAuthMode('login');
      }
  };

  const viewMerchantProfile = (merchantId: string) => {
      setSelectedMerchantId(merchantId);
      setCurrentView('merchant-profile');
  };

  const value = {
    state: { lang, user, platform, currentView, authMode, country, isHistoryOpen, isInitializing, selectedMerchantId },
    actions: { setLang, setPlatform, setCurrentView, setAuthMode, setCountry, setIsHistoryOpen, onLoginSuccess, handleStartSearch, handleAdminClick, viewMerchantProfile, logout }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
