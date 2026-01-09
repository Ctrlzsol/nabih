
import React, { useState, useEffect } from 'react';
import { Language, Platform } from '../../config/types';
import { STRINGS } from '../../config/constants';
import { COUNTRIES } from '../../config/countries';
import { motion as motionBase } from 'framer-motion';
import { AlertCircle, Loader2, UserPlus, KeyRound, User, Mail, Lock, Phone, Globe, HelpCircle, Eye, EyeOff, ChevronDown, Check, Store, FileText, MapPin, Tag, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { registerUser } from '../../features/auth/auth.service';

const motion = motionBase as any;

interface AuthProps {
  lang: Language;
  onLogin: (userData: any, platform: Platform) => Promise<void>;
  initialMode?: 'login' | 'signup' | 'update_password';
  platform?: Platform;
}

const Auth: React.FC<AuthProps> = ({ lang, onLogin, initialMode = 'login', platform = 'consumer' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'update_password'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    country: '', // Will default to JO if not detected
    password: '', 
    storeName: '', 
    crNumber: '', 
    taxNumber: '', 
    storeCategory: '', 
    storeAddress: '' 
  });

  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  
  // Custom Styling for Admin
  const isAdmin = platform === 'admin';
  
  const primaryColor = isAdmin 
    ? 'bg-slate-800 hover:bg-slate-700' 
    : platform === 'merchant' ? 'bg-nabih-merchant' : 'bg-nabih-purple';
    
  const focusBorder = isAdmin
    ? 'focus:border-slate-500'
    : platform === 'merchant' ? 'focus:border-nabih-merchant' : 'focus:border-nabih-purple';

  const containerStyle = isAdmin 
    ? 'bg-white border-2 border-slate-200 shadow-2xl'
    : 'bg-white/95 backdrop-blur-md border border-nabih-border shadow-premium';

  const merchantCategories = [
    { id: 'electronics', labelEn: 'Electronics', labelAr: 'إلكترونيات' },
    { id: 'fashion', labelEn: 'Fashion', labelAr: 'أزياء' },
    { id: 'home', labelEn: 'Home & Decor', labelAr: 'منزل وديكور' },
    { id: 'services', labelEn: 'Services', labelAr: 'خدمات' },
    { id: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ];

  // --- 1. GEOLOCATION LOGIC ---
  useEffect(() => {
    // If country is already set, skip
    if (formData.country) return;
    
    setDetectingLocation(true);
    
    fetch('https://api.country.is/')
      .then(res => {
          if (!res.ok) throw new Error('Geo service unavailable');
          return res.json();
      })
      .then(data => {
        // data looks like { "ip": "...", "country": "JO" }
        if (data && data.country) {
          const matchedCountry = COUNTRIES.find(c => c.id === data.country);
          if (matchedCountry) {
            setFormData(prev => ({
                ...prev,
                country: matchedCountry.id,
                phone: prev.phone || (matchedCountry.prefix ? `${matchedCountry.prefix} ` : '')
            }));
          }
        }
      })
      .catch(err => {
          // FALLBACK TO JORDAN
          setFormData(prev => ({
              ...prev,
              country: 'JO',
              phone: prev.phone || '+962 '
          }));
      })
      .finally(() => setDetectingLocation(false));
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const countryData = COUNTRIES.find(c => c.id === selectedId);
    setFormData(prev => ({ 
        ...prev, 
        country: selectedId, 
        phone: countryData ? `${countryData.prefix} ` : '' 
    }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
        const normalizedEmail = formData.email.toLowerCase().trim();
        const { data, error } = await (supabase.auth as any).signInWithPassword({ 
            email: normalizedEmail, 
            password: formData.password 
        });
        
        if (error) throw error;
        
        if (data.session && data.user) {
            await onLogin({ id: data.user.id, email: normalizedEmail }, platform || 'consumer'); 
        }
    } catch (err: any) {
        // Only log unexpected errors to keep console clean
        if (err.message !== "Invalid login credentials") {
            console.error("Login Error:", err);
        }
        setLoading(false);
        
        // Handle specific Supabase errors
        if (err.message === "Invalid login credentials") {
             setErrorMsg(isRtl ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
        } else if (err.message && err.message.includes("Email not confirmed")) {
             setErrorMsg(isRtl ? "يرجى تأكيد البريد الإلكتروني لتفعيل الحساب" : "Please verify your email address to log in");
        } else if (err.message && err.message.includes("security purposes")) {
             setErrorMsg(isRtl ? "تم حظر المحاولات مؤقتاً لأسباب أمنية. حاول لاحقاً." : "Too many attempts. Please try again later.");
        } else {
             // Fallback to the message from server if available, or generic
             setErrorMsg(err.message || (isRtl ? "حدث خطأ أثناء تسجيل الدخول" : "Login failed"));
        }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg(null);

      try {
        if (!formData.country) throw new Error(isRtl ? "يرجى اختيار الدولة" : "Please select a country");

        const normalizedEmail = formData.email.toLowerCase().trim();
        await registerUser({
          email: normalizedEmail,
          password: formData.password,
          fullName: formData.name,
          phone: formData.phone,
          country: formData.country,
          role: platform === 'merchant' ? 'merchant' : 'individual',
          storeName: formData.storeName,
          crNumber: formData.crNumber,
          taxNumber: formData.taxNumber,
          storeCategory: formData.storeCategory,
          storeAddress: formData.storeAddress
        });

        setLoading(false);
        setRegistrationSuccess(true);
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(err.message);
      }
  };

  const sortedCountries = [...COUNTRIES].sort((a, b) => isRtl ? a.ar.localeCompare(b.ar) : a.en.localeCompare(b.en));

  if (registrationSuccess) {
      return (
        <div className="w-full max-w-lg bg-white p-10 rounded-[3rem] text-center shadow-2xl border border-nabih-border">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
            </div>
            <h2 className="text-2xl font-black text-nabih-slate mb-4">{isRtl ? 'تم التسجيل بنجاح!' : 'Registration Successful!'}</h2>
            <p className="text-nabih-slate/60 mb-8">
                {platform === 'merchant' 
                    ? (isRtl ? 'حسابك قيد المراجعة حالياً وسيتم تفعيله خلال مدة أقصاها 24 ساعة.' : 'Your account is currently under review and will be activated within 24 hours.')
                    : (isRtl ? 'يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.' : 'Please check your email to verify your account.')
                }
            </p>
            <button 
                onClick={() => {
                    setRegistrationSuccess(false);
                    setMode('login');
                }} 
                className="text-nabih-purple font-bold hover:underline"
            >
                {isRtl ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </button>
        </div>
      );
  }

  return (
    <div className={`w-full max-w-2xl px-4 ${isRtl ? 'rtl text-right' : 'ltr text-left'} relative z-10`} dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${containerStyle} p-10 md:p-16 rounded-[3.5rem] relative overflow-hidden`}>
        
        {isAdmin && (
           <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800" />
        )}

        <div className="mb-10 text-center">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm ${isAdmin ? 'bg-slate-100 text-slate-800' : 'bg-nabih-silver/60 text-nabih-slate'}`}>
                {isAdmin ? <ShieldCheck size={40} strokeWidth={1.5} /> : (mode === 'login' ? <KeyRound size={36} /> : <UserPlus size={36} />)}
            </div>
            <h2 className="text-3xl font-black text-nabih-slate mb-2">
                {isAdmin ? (isRtl ? 'بوابة الإدارة' : 'Admin Portal') : (mode === 'login' ? t.auth.welcome : (isRtl ? 'حساب جديد' : 'New Account'))}
            </h2>
            <p className={`font-bold uppercase tracking-widest text-xs ${isAdmin ? 'text-red-500 bg-red-50 inline-block px-3 py-1 rounded-lg' : 'text-nabih-slate/40'}`}>
                {isAdmin 
                    ? (isRtl ? 'منطقة محظورة - للمصرح لهم فقط' : 'Restricted Access - Authorized Personnel Only')
                    : (platform === 'merchant' ? (isRtl ? 'بوابة التجار' : 'Merchant Portal') : (isRtl ? 'بوابة المستخدمين' : 'User Portal'))}
            </p>
        </div>

        {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100">
                <AlertCircle size={18} /> {errorMsg}
            </div>
        )}

        {/* --- LOGIN FORM --- */}
        {/* Semantic Form with Autocomplete Attributes */}
        {mode === 'login' ? (
            <form name="loginForm" onSubmit={handleLoginSubmit} className="space-y-5" autoComplete="on">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-black uppercase text-nabih-slate/40 tracking-wider px-2">{t.auth.email}</label>
                    <div className="relative group">
                        <Mail size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-6' : 'left-6'} text-nabih-slate/30`} />
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            autoComplete="username" 
                            required 
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className={`w-full bg-nabih-canvas border border-nabih-border ${focusBorder} rounded-2xl py-4 ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-lg font-bold outline-none transition-all`} 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-black uppercase text-nabih-slate/40 tracking-wider px-2">{t.auth.password}</label>
                    <div className="relative group">
                        <Lock size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-6' : 'left-6'} text-nabih-slate/30`} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            id="password" 
                            autoComplete="current-password" 
                            required 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className={`w-full bg-nabih-canvas border border-nabih-border ${focusBorder} rounded-2xl py-4 ${isRtl ? 'pr-14 pl-14' : 'pl-14 pr-14'} text-lg font-bold outline-none transition-all`} 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-6' : 'right-6'} text-nabih-slate/30 hover:text-nabih-slate`} tabIndex={-1}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-5 ${primaryColor} text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 mt-6 shadow-xl hover:opacity-90 transition-all`}>
                    {loading ? <Loader2 className="animate-spin" /> : (isAdmin ? (isRtl ? 'دخول آمن' : 'Secure Login') : t.auth.signIn)}
                </button>
            </form>
        ) : (
            /* --- SIGNUP FORM --- */
            <form name="signupForm" onSubmit={handleSignupSubmit} className="space-y-5" autoComplete="on">
                 
                 {/* Merchant Fields */}
                 {platform === 'merchant' && (
                    <div className="p-6 bg-nabih-silver/30 rounded-3xl border border-nabih-border/50 space-y-4 mb-6">
                        <input 
                            type="text" 
                            name="storeName" 
                            id="signup-storename"
                            placeholder={t.auth.storeName} 
                            required 
                            autoComplete="organization"
                            value={formData.storeName}
                            onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                            className="w-full bg-white border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-merchant"
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <input type="text" name="crNumber" placeholder={isRtl ? "السجل التجاري" : "CR Number"} required value={formData.crNumber} onChange={(e) => setFormData({...formData, crNumber: e.target.value})} className="w-full bg-white border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-merchant text-sm" />
                            <select name="storeCategory" required value={formData.storeCategory} onChange={(e) => setFormData({...formData, storeCategory: e.target.value})} className="w-full bg-white border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-merchant text-sm">
                                <option value="">{isRtl ? "التصنيف" : "Category"}</option>
                                {merchantCategories.map(c => <option key={c.id} value={c.id}>{isRtl ? c.labelAr : c.labelEn}</option>)}
                            </select>
                        </div>
                    </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="signup-name" className="sr-only">Name</label>
                        <input 
                            type="text" 
                            name="name"
                            id="signup-name"
                            autoComplete="name" 
                            placeholder={t.auth.name} 
                            required 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-nabih-canvas border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-purple"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="signup-email" className="sr-only">Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            id="signup-email"
                            autoComplete="email" 
                            placeholder={t.auth.email} 
                            required 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-nabih-canvas border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-purple"
                        />
                    </div>
                 </div>

                 {/* Country & Phone */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="md:col-span-1 relative">
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} pointer-events-none text-nabih-slate/30`}>
                            {detectingLocation ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                        </div>
                        <select 
                            name="country" 
                            id="signup-country"
                            autoComplete="country-name"
                            value={formData.country} 
                            onChange={handleCountryChange}
                            required
                            className="w-full bg-nabih-canvas border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-purple appearance-none text-sm h-full"
                        >
                            <option value="" disabled>{detectingLocation ? (isRtl ? 'جاري تحديد الموقع...' : 'Detecting...') : t.auth.selectCountryPlaceholder}</option>
                            {sortedCountries.map(c => <option key={c.id} value={c.id}>{isRtl ? c.ar : c.en}</option>)}
                        </select>
                     </div>
                     <div className="md:col-span-2">
                        <input 
                            type="tel" 
                            name="phone" 
                            id="signup-phone"
                            autoComplete="tel" 
                            placeholder={t.auth.phone} 
                            required 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-nabih-canvas border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-purple h-full"
                        />
                     </div>
                 </div>

                 <input 
                    type="password" 
                    name="password" 
                    id="signup-password"
                    autoComplete="new-password" 
                    placeholder={t.auth.password} 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-nabih-canvas border border-nabih-border rounded-xl p-4 font-bold outline-none focus:border-nabih-purple"
                 />

                 <button type="submit" disabled={loading} className={`w-full py-5 ${primaryColor} text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 mt-6 shadow-xl hover:opacity-90 transition-all`}>
                    {loading ? <Loader2 className="animate-spin" /> : t.auth.signUp}
                </button>
            </form>
        )}

        {!isAdmin && (
            <div className="mt-8 text-center">
                <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-nabih-slate/50 hover:text-nabih-purple transition-colors">
                    {mode === 'login' ? t.auth.switchSignup : t.auth.switchLogin}
                </button>
            </div>
        )}

      </motion.div>
    </div>
  );
};

export default Auth;
