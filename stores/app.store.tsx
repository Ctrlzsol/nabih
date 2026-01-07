
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
      // Strict Path Priority
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
   * Priority:
   * 1. Explicit Intent (contextPlatform passed from Login button)
   * 2. URL Path (window.location.pathname)
   * 3. Current State
   */
  const handleFetchUserData = useCallback(async (userId: string, contextPlatform?: Platform) => { 
    try {
      const profile = await getUserProfile(userId);

      if (!profile) {
          console.warn("Profile not found for user");
          return;
      }

      setUser(profile);
      if (profile.country) setCountry(profile.country);

      // --- DETERMINING TARGET PLATFORM ---
      let target: Platform = 'consumer';

      if (contextPlatform) {
          // HIGHEST PRIORITY: The button the user clicked (Consumer Login vs Admin Login)
          target = contextPlatform;
      } else if (typeof window !== 'undefined') {
          // SECOND PRIORITY: The URL path
          const path = window.location.pathname;
          if (path.includes('/admin')) target = 'admin';
          else if (path.includes('/merchant')) target = 'merchant';
          else target = platformRef.current; // Fallback to current state
      }

      console.log(`[Auth] Logic -> Target: ${target}, Roles: ${profile.roles?.join(',')}`);

      const userRoles = profile.roles || [profile.role];

      // --- ROUTING GUARDS ---

      if (target === 'consumer') {
          // STRICT: If target is consumer, GO TO SEARCH. Do NOT hijack to Admin.
          setPlatform('consumer');
          setCurrentView('search');
          return;
      }

      if (target === 'admin') {
          if (!userRoles.includes('admin')) {
              throw new Error("ACCESS_DENIED_ADMIN");
          }
          setPlatform('admin');
          setCurrentView('admin-dashboard');
          return;
      }

      if (target === 'merchant') {
          if (!userRoles.includes('merchant')) {
               throw new Error("ACCESS_DENIED_MERCHANT");
          }
          setPlatform('merchant');
          if (profile.status === 'active' || profile.status === 'approved') {
              setCurrentView('merchant-dashboard');
          } else {
              setCurrentView('pending-approval');
          }
          return;
      }

      // Default safety net
      setPlatform('consumer');
      setCurrentView('search');

    } catch (err: any) {
      console.error("Auth Fetch Error:", err);
      if (err.message === 'ACCESS_DENIED_ADMIN' || err.message === 'ACCESS_DENIED_MERCHANT') {
          await logout();
          throw err; 
      }
    }
  }, [setCountry, setPlatform]); 

  // Initialize Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      setIsInitializing(true);
      const { data: { session } } = await (supabase.auth as any).getSession();
      if (session) {
          // On reload, try to maintain context
          let initialContext: Platform | undefined = undefined;
          if (typeof window !== 'undefined') {
             const path = window.location.pathname;
             if (path.includes('/admin')) initialContext = 'admin';
             else if (path.includes('/merchant')) initialContext = 'merchant';
          }
          try {
             await handleFetchUserData(session.user.id, initialContext);
          } catch(e) {}
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
          // Pass the platform from the specific login form used
          await handleFetchUserData(userData.id, contextPlatform);
      }
  };

  const handleStartSearch = (mode: 'login' | 'signup' | 'search') => {
      if (mode === 'search') {
          // If trying to access search while logged in
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
