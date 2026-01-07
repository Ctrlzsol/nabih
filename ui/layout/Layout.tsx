
import React, { useMemo } from 'react';
import { Language, Platform } from '../../config/types';
import { STRINGS } from '../../config/constants';
import { motion as motionBase, useScroll, useTransform } from 'framer-motion';
import { LogOut, ExternalLink, ShoppingCart, Tag, Search, PackageCheck, Wallet, History, Cpu, Store, Users, LayoutDashboard, Shield, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NabihLogo } from '../components/NabihLogo';

const motion = motionBase as any;

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  setLang: (l: Language) => void;
  user?: any;
  onHistoryClick?: () => void;
  platform: Platform;
  setPlatform: (p: Platform) => void;
  onAdminClick: () => void;
  onDashboardClick?: () => void;
  hideGlobalUI?: boolean;
  showAdminAccess?: boolean;
}

const GlobalParticleBackground: React.FC<{ platform: Platform }> = ({ platform }) => {
  const icons = [ShoppingCart, ShoppingCart, ShoppingCart, Tag, Search, PackageCheck, Wallet];
  const colorClass = platform === 'merchant' ? 'text-nabih-merchant' : 'text-nabih-purple';
  
  const particles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      Icon: icons[i % icons.length],
      startPos: { x: Math.random() * 100, y: Math.random() * 100 },
      path: [
        { x: Math.random() * 100, y: Math.random() * 100 },
        { x: Math.random() * 100, y: Math.random() * 100 },
        { x: Math.random() * 100, y: Math.random() * 100 }
      ],
      size: 100 + Math.random() * 200, 
      duration: 40 + Math.random() * 50,
      delay: Math.random() * -60,
      opacity: 0.03 + Math.random() * 0.04 
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      <div className="absolute inset-0 architectural-grid opacity-20" />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0.7, left: `${p.startPos.x}%`, top: `${p.startPos.y}%` }}
          animate={{ opacity: [0, p.opacity, p.opacity, 0], scale: [0.8, 1.1, 1, 0.8], left: [`${p.startPos.x}%`, `${p.path[0].x}%`, `${p.path[1].x}%`, `${p.path[2].x}%`, `${p.startPos.x}%`], top: [`${p.startPos.y}%`, `${p.path[0].y}%`, `${p.path[1].y}%`, `${p.path[2].y}%`, `${p.startPos.y}%`], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
          style={{ position: 'absolute' }}
        >
          <p.Icon size={p.size} className={colorClass} strokeWidth={0.1} />
        </motion.div>
      ))}
    </div>
  );
};

const CanvasLogoSmall = ({ color = "white" }: { color?: string }) => (
  <svg width="40" height="24" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80 group-hover:opacity-100 transition-opacity">
    <path d="M5 5H60V45H5V5Z" stroke={color} strokeWidth="3" />
    <path d="M5 5L0 10V50L5 45" fill={color} />
    <path d="M75 10C60 25 45 45 35 55L45 65C55 55 70 35 85 20L75 10Z" fill={color} />
    <circle cx="35" cy="55" r="5" fill={color} />
  </svg>
);

// NabihLogo moved to components/NabihLogo.tsx

const Layout: React.FC<LayoutProps> = ({ children, lang, setLang, user, onHistoryClick, platform, setPlatform, onAdminClick, onDashboardClick, hideGlobalUI = false, showAdminAccess = false }) => {
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]);
  const headerBorder = useTransform(scrollY, [0, 50], ["rgba(235, 235, 237, 0)", "rgba(235, 235, 237, 1)"]);
  const hoverColor = platform === 'merchant' ? 'hover:text-nabih-merchant' : 'hover:text-nabih-purple';
  const hoverBg = platform === 'merchant' ? 'hover:bg-nabih-merchant' : 'hover:bg-nabih-purple';
  const borderColor = platform === 'merchant' ? 'hover:border-nabih-merchant' : 'hover:border-nabih-purple';

  const displayName = useMemo(() => {
    if (!user) return '';
    if (user.role === 'merchant' && user.storeName) return user.storeName;
    if (user.name && user.name !== 'User') return user.name; 
    if (user.full_name) return user.full_name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.email) return user.email.split('@')[0];
    return lang === 'ar' ? 'ضيف' : 'Guest';
  }, [user, lang, platform]);

  const togglePlatform = () => {
    if (!user) setPlatform(platform === 'consumer' ? 'merchant' : 'consumer');
    if (user && platform === 'admin') setPlatform('consumer');
  };

  if (hideGlobalUI) {
      return (
          <div className={`min-h-screen ${isRtl ? 'rtl' : 'ltr'} bg-[#F5F5F7] overflow-hidden`}>
              {children}
          </div>
      );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isRtl ? 'rtl' : 'ltr'} bg-white relative`}>
      <GlobalParticleBackground platform={platform} />
      <motion.header style={{ backgroundColor: headerBg, borderBottomColor: headerBorder }} className="fixed top-0 left-0 right-0 z-[100] border-b backdrop-blur-md transition-shadow">
        <div className="max-w-7xl mx-auto h-24 px-8 flex items-center justify-between relative">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 cursor-pointer group" onClick={() => window.location.reload()}>
            <NabihLogo size={22} platform={platform} />
            <span className={`text-3xl font-[1000] text-nabih-slate tracking-tighter ${hoverColor} transition-colors`}>{platform === 'merchant' && isRtl ? 'نبيه للأعمال' : (platform === 'merchant' ? 'Nabih Business' : (isRtl ? 'نبيه' : 'Nabih'))}</span>
          </motion.div>
          
          <div className="flex items-center gap-4 md:gap-8">
            {(!user || platform === 'admin') && (
              <button onClick={togglePlatform} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${platform === 'consumer' ? 'border-nabih-merchant/20 text-nabih-merchant hover:bg-nabih-merchant hover:text-white' : 'border-nabih-purple/20 text-nabih-purple hover:bg-nabih-purple hover:text-white'}`}>
                 {platform === 'consumer' ? <Store size={16} /> : <Users size={16} />}
                 <span className="hidden md:inline">{platform === 'consumer' ? (isRtl ? 'قطاع الأعمال' : 'Business Hub') : (isRtl ? 'منصة الأفراد' : 'Consumer Hub')}</span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3">
                 {/* Consumer History */}
                 {platform === 'consumer' && onHistoryClick && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onHistoryClick} className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-nabih-border flex items-center justify-center text-nabih-slate/50 ${hoverBg} hover:text-white ${borderColor} transition-all shadow-sm group`}>
                      <History size={18} className="group-hover:rotate-12 transition-transform" />
                    </motion.button>
                 )}

                 {/* Merchant Dashboard Access */}
                 {user && (user.role === 'merchant' || user.roles?.includes('merchant')) && onDashboardClick && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onDashboardClick} className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-nabih-border flex items-center justify-center text-nabih-slate/50 ${hoverBg} hover:text-white ${borderColor} transition-all shadow-sm group`} title={isRtl ? "لوحة التاجر" : "Merchant Dashboard"}>
                      <LayoutDashboard size={18} />
                    </motion.button>
                 )}
                 
                 {/* Admin icon removed from header */}

                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 md:gap-4 px-3 md:px-5 py-2 md:py-2.5 bg-nabih-silver/60 rounded-full border border-nabih-border">
                  <div className={`w-8 h-8 rounded-full ${platform === 'merchant' ? 'bg-nabih-merchant' : 'bg-nabih-purple'} flex items-center justify-center text-white text-[12px] font-black uppercase shadow-sm`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start leading-none hidden md:flex">
                     <span className="text-[12px] font-black text-nabih-slate max-w-[120px] truncate">{displayName}</span>
                  </div>
                  <div className="w-px h-6 bg-nabih-slate/10 mx-1 hidden md:block"></div>
                  <button onClick={() => (supabase.auth as any).signOut()} className="text-nabih-slate/30 hover:text-red-500 transition-colors p-1"><LogOut size={16} /></button>
                </motion.div>
              </div>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-nabih-border flex items-center justify-center text-[10px] font-black text-nabih-slate ${borderColor} ${hoverColor} transition-all tracking-widest bg-white shadow-sm`}>
              {lang === 'en' ? 'عربي' : 'EN'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="flex-grow relative z-10 bg-transparent">{children}</main>

      <footer className="bg-nabih-slate py-32 mt-40 overflow-hidden relative border-t border-white/5 z-20">
        <div className="parallax-bg-text text-[25rem] -bottom-20 left-0 opacity-[0.01] text-white select-none pointer-events-none absolute font-black tracking-tighter">NABIH</div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col items-center md:items-start mb-24 space-y-6">
            <div className="flex items-center gap-4"><NabihLogo size={20} platform={platform} /><span className="text-4xl font-black text-white tracking-tighter">{platform === 'merchant' && isRtl ? 'نبيه للأعمال' : (platform === 'merchant' ? 'Nabih Business' : (isRtl ? 'نبيه' : 'Nabih'))}</span></div>
            <p className="text-lg font-bold text-white/30 uppercase tracking-[0.2em] max-w-2xl text-center md:text-start">{t.footerDesc}</p>
          </div>
          <div className="pt-12 border-t border-white/10">
            <div className={`flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex flex-col items-center md:items-start gap-1">
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                    <Cpu size={12} className="text-nabih-gold" />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest font-display">{lang === 'ar' ? 'محرك نبيه الذكي - الاصدار 1' : 'Nabih Smart Engine - v1.0'}</span>
                </div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">LOCATION</span>
                <span className="text-[13px] font-black text-white tracking-[0.4em] uppercase">AMMAN • JORDAN</span>
              </div>
              <div className="hidden md:block w-px h-10 bg-white/10" />
              <div className="flex items-center gap-4">
                 <motion.a href="https://www.be-canvas.com" target="_blank" rel="noopener noreferrer" whileHover={{ y: -2 }} className="flex items-center gap-6 group">
                    <CanvasLogoSmall />
                    <div className={`flex flex-col ${isRtl ? 'items-end text-right' : 'items-start text-left'}`}>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em] mb-1">{t.madeBy}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2"><span className="text-[16px] md:text-[20px] font-black text-white group-hover:text-nabih-gold transition-colors tracking-tighter uppercase">CANVAS</span><ExternalLink size={12} className="opacity-20 group-hover:opacity-100 transition-opacity text-white" /></div>
                        <span className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Consultancy & Business Development</span>
                      </div>
                    </div>
                  </motion.a>
              </div>
              <div className="hidden md:block w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center md:items-end gap-1">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">NABIH PLATFORM</span>
                <span className="text-[11px] font-black text-white/40 tracking-[0.3em] uppercase">© {new Date().getFullYear()} ALL RIGHTS RESERVED</span>
                
                {/* Admin Access Footer Link - Visible if showAdminAccess is true (Landing Page) regardless of login status */}
                {showAdminAccess && (
                   <button onClick={onAdminClick} className="mt-4 flex items-center gap-2 text-white/10 hover:text-nabih-gold transition-colors group">
                      <Lock size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Admin Access</span>
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
