
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMerchantAds, createMerchantAd, updateMerchantAd, updateMerchantProfile } from '../../features/merchants/merchants.service';
import { MerchantAd, Language } from '../../config/types';
import { 
  PlusCircle, Eye, MousePointerClick, TrendingUp, AlertCircle, 
  CheckCircle, Clock, Image as ImageIcon, Type, Tag, 
  Settings, Save, LayoutDashboard, List, Edit2, FileSpreadsheet,
  FileText, Store, Phone, ExternalLink, BarChart2, Store as StoreIcon
} from 'lucide-react';

interface MerchantPlatformProps {
  user: any;
  lang: Language;
}

const MerchantPlatform: React.FC<MerchantPlatformProps> = ({ user, lang }) => {
  const [ads, setAds] = useState<MerchantAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'create' | 'list' | 'settings'>('overview');
  
  const [adForm, setAdForm] = useState<Partial<MerchantAd>>({
    title: '', description: '', imageUrl: '', targetUrl: '', targetCountries: [], category: '', tags: []
  });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  
  const [settingsForm, setSettingsForm] = useState({
      storeName: user?.storeName || '',
      phone: user?.phone || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const isRtl = lang === 'ar';

  // Defensive Check: If user has no store name (missing profile), force to Settings or Show Setup
  useEffect(() => {
    if (user && !user.storeName && view !== 'settings') {
        // You could force view to 'settings' here, but let's handle it in render to avoid state loops
        // or just let them see the "Store Settings" prompt.
    }
  }, [user, view]);

  useEffect(() => {
    if (user?.id) {
        fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    // Real Data Fetching from Supabase
    try {
        const data = await getMerchantAds(user.id);
        setAds(data || []);
    } catch (e) {
        console.error(e);
        setAds([]);
    } finally {
        setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', msg: string) => {
      setNotification({ type, msg });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.storeName) {
        showNotification('error', isRtl ? 'يرجى إكمال إعدادات المتجر أولاً.' : 'Please complete store settings first.');
        setView('settings');
        return;
    }
    setIsSubmitting(true);
    
    try {
        // DYNAMIC CATEGORIZATION: Auto-inject from user profile
        const payload = {
          ...adForm,
          category: user.storeCategory || 'General', 
          merchantId: user.id,
          merchantName: user.storeName || user.name || 'Merchant'
        };

        if (editingAdId) {
            await updateMerchantAd(editingAdId, payload);
            showNotification('success', isRtl ? 'تم تعديل الإعلان وإرساله للمراجعة.' : 'Ad updated and sent for review.');
        } else {
            await createMerchantAd(payload);
            showNotification('success', isRtl ? 'تم إنشاء الإعلان بنجاح (بانتظار المراجعة).' : 'Ad created successfully (Pending Review).');
        }
        
        await fetchData();
        setView('list');
        resetAdForm();
    } catch (e) {
        showNotification('error', isRtl ? 'حدث خطأ ما.' : 'An error occurred.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id) return;
      setIsSubmitting(true);
      const success = await updateMerchantProfile(user.id, settingsForm);
      if (success) {
          showNotification('success', isRtl ? 'تم حفظ الإعدادات. يرجى إعادة تحميل الصفحة لتحديث البيانات.' : 'Settings saved. Please reload to update data.');
          // In a real app, update global user state here. For now, prompt reload.
      } else {
          showNotification('error', isRtl ? 'فشل الحفظ.' : 'Save failed.');
      }
      setIsSubmitting(false);
  };

  const startEdit = (ad: MerchantAd) => {
      setEditingAdId(ad.id);
      setAdForm({
          title: ad.title,
          description: ad.description,
          imageUrl: ad.imageUrl,
          targetUrl: ad.targetUrl,
          targetCountries: ad.targetCountries,
          category: ad.category,
          tags: ad.tags
      });
      setView('create');
  };

  const resetAdForm = () => {
      setEditingAdId(null);
      setAdForm({ title: '', description: '', imageUrl: '', targetUrl: '', targetCountries: [], category: '', tags: [] });
  };

  // Real-time Stats Calculation (Derived purely from DB data)
  const stats = useMemo(() => {
    const activeAds = ads.filter(a => a.status === 'active').length;
    const reviewAds = ads.filter(a => a.status === 'pending_review').length;
    const totalImpressions = ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const totalClicks = ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    
    const topAds = [...ads].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

    return { activeAds, reviewAds, totalImpressions, totalClicks, avgCtr, topAds };
  }, [ads]);

  const StatCard = ({ icon: Icon, label, value, colorClass, subValue }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-nabih-border shadow-sm flex flex-col gap-6 group hover:shadow-lg transition-all duration-500">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 ${colorClass.replace('bg-', 'text-')}`}>
          <Icon size={28} />
        </div>
        {subValue && <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{subValue}</span>}
      </div>
      <div className="text-right">
        <h4 className="text-4xl font-black text-nabih-slate mb-2 tracking-tighter">{value}</h4>
        <span className="text-xs font-black text-nabih-slate/40 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );

  // If user is missing storeName (Profile not fully setup), show blocked view or force setup
  if (!user?.storeName && view !== 'settings') {
      return (
        <div className={`w-full max-w-4xl mx-auto px-8 py-24 min-h-screen ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
            <div className="bg-white p-16 rounded-[3.5rem] border border-nabih-border text-center shadow-xl">
                <div className="w-24 h-24 bg-nabih-merchant text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <StoreIcon size={48} />
                </div>
                <h2 className="text-3xl font-[1000] text-nabih-slate mb-4">{isRtl ? 'إعداد متجرك' : 'Setup Your Store'}</h2>
                <p className="text-lg font-bold text-nabih-slate/40 mb-12 max-w-lg mx-auto">
                    {isRtl ? 'يرجى إكمال بيانات متجرك للبدء في استخدام لوحة التحكم وإنشاء الحملات الإعلانية.' : 'Please complete your store details to access the dashboard and start creating campaigns.'}
                </p>
                <button onClick={() => setView('settings')} className="px-10 py-5 bg-nabih-merchant text-white rounded-2xl font-black uppercase tracking-widest hover:bg-nabih-merchantAccent transition-all shadow-xl">
                    {isRtl ? 'إكمال الإعدادات' : 'Complete Setup'}
                </button>
            </div>
            
             {/* Render Settings Form only if view is forced to settings (below logic handles this via state) */}
             {view === 'settings' && (
                 <div className="mt-12">
                     {/* Reuse the settings form logic below */}
                     {/* We can just let the main return handle it by switching view state */}
                 </div>
             )}
        </div>
      );
  }

  return (
    <div className={`w-full max-w-7xl mx-auto px-8 py-24 min-h-screen ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      
      <AnimatePresence>
          {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`fixed top-24 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-50 font-black text-sm flex items-center gap-4
                    ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}
                `}
              >
                  {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  {notification.msg}
              </motion.div>
          )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-nabih-merchant rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                {(user?.storeName || user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-4xl font-[1000] text-nabih-merchant mb-2 tracking-tight">
                {isRtl ? 'لوحة تحكم التاجر' : 'Merchant Dashboard'}
              </h2>
              <div className="flex flex-wrap gap-4 items-center">
                  <span className="flex items-center gap-2 text-xs font-bold text-nabih-slate/40 uppercase tracking-widest bg-nabih-silver px-3 py-1 rounded-lg">
                    <Store size={14} /> {user?.storeName || 'Setup Required'}
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold text-nabih-slate/40 uppercase tracking-widest bg-nabih-silver px-3 py-1 rounded-lg">
                    <Tag size={14} /> {user?.storeCategory || (isRtl ? 'عام' : 'General')}
                  </span>
              </div>
            </div>
        </div>
        <div className="flex gap-4">
            <button 
              onClick={() => showNotification('error', isRtl ? 'هذه الميزة ستتوفر قريباً' : 'Feature coming soon')}
              className="bg-white border border-nabih-border text-nabih-slate px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-nabih-silver transition-all shadow-sm text-xs"
            >
                <FileSpreadsheet size={18} /> {isRtl ? 'رفع إكسل' : 'Bulk Upload'}
            </button>
            <button 
              onClick={() => { resetAdForm(); setView('create'); }}
              className="bg-nabih-merchant text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-nabih-merchantAccent transition-all shadow-xl text-xs"
            >
              <PlusCircle size={20} /> {isRtl ? 'إضافة إعلان' : 'New Ad'}
            </button>
        </div>
      </div>

      <div className="flex gap-4 mb-12 border-b border-nabih-border pb-4">
        {[
            { id: 'overview', label: isRtl ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
            { id: 'list', label: isRtl ? 'حملاتي الإعلانية' : 'My Campaigns', icon: List },
            { id: 'settings', label: isRtl ? 'إعدادات المتجر' : 'Store Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all relative
                ${view === tab.id 
                    ? 'bg-nabih-merchant text-white shadow-lg' 
                    : 'text-nabih-slate/40 hover:text-nabih-merchant hover:bg-nabih-merchant/5'}
            `}
          >
            <tab.icon size={18} />
            {tab.label}
            {view === tab.id && <motion.div layoutId="tabActive" className="absolute -bottom-5 left-0 right-0 h-1 bg-nabih-merchant rounded-full" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {view === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon={TrendingUp} label={isRtl ? 'إعلانات نشطة' : 'Active Ads'} value={stats.activeAds} colorClass="bg-emerald-500" />
                <StatCard icon={Clock} label={isRtl ? 'قيد المراجعة' : 'Under Review'} value={stats.reviewAds} colorClass="bg-amber-500" />
                <StatCard icon={Eye} label={isRtl ? 'ظهور الحملات' : 'Impressions'} value={stats.totalImpressions.toLocaleString()} colorClass="bg-nabih-purple" />
                <StatCard icon={MousePointerClick} label={isRtl ? 'عدد النقرات' : 'Clicks'} value={stats.totalClicks.toLocaleString()} colorClass="bg-blue-500" subValue={`CTR ${stats.avgCtr}%`} />
            </div>
            
            <div className="bg-white p-12 rounded-[3.5rem] border border-nabih-border shadow-sm">
                <div className="flex justify-between items-center mb-12">
                    <h3 className="text-2xl font-black text-nabih-slate">{isRtl ? 'أفضل الحملات أداءً' : 'Top Performing Ads'}</h3>
                    <BarChart2 className="text-nabih-slate/20" />
                </div>
                
                {stats.topAds.length > 0 ? (
                  <div className="space-y-6">
                     {stats.topAds.map((ad, i) => {
                       const maxClicks = Math.max(...stats.topAds.map(a => a.clicks));
                       const percentage = maxClicks > 0 ? (ad.clicks / maxClicks) * 100 : 0;
                       return (
                         <div key={ad.id} className="relative">
                            <div className="flex justify-between text-xs font-bold mb-2 text-nabih-slate/60">
                               <span>{ad.title}</span>
                               <span>{ad.clicks} {isRtl ? 'نقرات' : 'Clicks'}</span>
                            </div>
                            <div className="h-3 bg-nabih-silver/30 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }} 
                                 animate={{ width: `${percentage}%` }}
                                 transition={{ duration: 1, delay: i * 0.1 }}
                                 className="h-full bg-nabih-merchant rounded-full"
                               />
                            </div>
                         </div>
                       );
                     })}
                  </div>
                ) : (
                   <div className="h-40 flex items-center justify-center text-nabih-slate/30 font-bold uppercase tracking-widest">
                       {isRtl ? 'لا توجد بيانات كافية' : 'No data available'}
                   </div>
                )}
            </div>
          </motion.div>
        )}

        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {ads.length === 0 && (
                <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border border-dashed border-nabih-border">
                    <div className="w-20 h-20 bg-nabih-silver rounded-full flex items-center justify-center mx-auto mb-6 text-nabih-slate/20">
                        <ImageIcon size={40} />
                    </div>
                    <p className="font-black text-2xl text-nabih-slate/30 mb-8">{isRtl ? 'لم تقم بإنشاء أي حملات بعد' : 'No campaigns created yet'}</p>
                    <button onClick={() => setView('create')} className="px-10 py-4 bg-nabih-merchant text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">
                        {isRtl ? 'أنشئ حملتك الأولى' : 'Create First Campaign'}
                    </button>
                </div>
            )}
            {ads.map(ad => (
              <div key={ad.id} className="bg-white rounded-[2.5rem] border border-nabih-border p-8 relative group hover:border-nabih-merchant transition-all duration-500 shadow-sm overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                    ${ad.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : ad.status === 'pending_review' ? 'bg-amber-50 text-amber-600 border-amber-100' : ad.status === 'paused' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600 border-red-100'}
                    `}>
                    {ad.status === 'active' ? (isRtl ? 'نشط' : 'Active') : ad.status === 'pending_review' ? (isRtl ? 'قيد المراجعة' : 'Review') : ad.status === 'paused' ? (isRtl ? 'معلق (مؤقت)' : 'Paused') : (isRtl ? 'مرفوض/محذوف' : 'Rejected')}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => startEdit(ad)} className="p-3 bg-nabih-silver rounded-xl text-nabih-slate/40 hover:bg-nabih-merchant hover:text-white transition-all">
                            <Edit2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Rejection/Suspension Reason Alert */}
                {(ad.status === 'rejected' || ad.status === 'paused') && ad.rejectionReason && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4 flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <div>
                            <span className="block text-[10px] font-black text-red-600 uppercase tracking-wider mb-1">
                                {ad.status === 'rejected' ? (isRtl ? 'سبب الرفض' : 'Rejection Reason') : (isRtl ? 'سبب التعليق' : 'Suspension Reason')}
                            </span>
                            <p className="text-xs font-bold text-red-700/80 leading-relaxed">
                                {ad.rejectionReason}
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="h-48 bg-nabih-silver/30 rounded-[2rem] mb-6 overflow-hidden relative shrink-0">
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                
                <h4 className="font-black text-xl text-nabih-slate mb-3 line-clamp-1">{ad.title}</h4>
                <div className="flex justify-between items-center text-[10px] font-black text-nabih-slate/30 mb-8 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ad.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                    <span className="flex items-center gap-1"><Tag size={12} /> {ad.category || (isRtl ? 'عام' : 'General')}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-nabih-border/50 mt-auto">
                  <div className="text-center">
                    <span className="block text-[9px] font-black text-nabih-slate/30 uppercase tracking-tighter mb-1">{isRtl ? 'مشاهدات' : 'Impressions'}</span>
                    <span className="font-black text-lg text-nabih-merchant">{ad.impressions}</span>
                  </div>
                  <div className="text-center border-x border-nabih-border/50">
                    <span className="block text-[9px] font-black text-nabih-slate/30 uppercase tracking-tighter mb-1">{isRtl ? 'نقرات' : 'Clicks'}</span>
                    <span className="font-black text-lg text-nabih-merchant">{ad.clicks}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] font-black text-nabih-slate/30 uppercase tracking-tighter mb-1">{isRtl ? 'تفاعل' : 'CTR'}</span>
                    <span className="font-black text-lg text-nabih-merchant">{ad.ctr}%</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto bg-white p-16 rounded-[3.5rem] border border-nabih-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-nabih-merchant/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-3xl font-[1000] text-nabih-merchant mb-4">{editingAdId ? (isRtl ? 'تعديل الإعلان' : 'Edit Campaign') : (isRtl ? 'إطلاق حملة جديدة' : 'Launch New Campaign')}</h3>
            <p className="text-sm font-bold text-nabih-slate/40 mb-12 uppercase tracking-[0.2em]">
                {isRtl ? 'سيتم مراجعة إعلانك من قبل فريق نبيه لضمان الجودة.' : 'Our team will review your ad to ensure platform quality standards.'}
            </p>
            
            <form onSubmit={handleSaveAd} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'عنوان الإعلان' : 'Ad Title'}</label>
                    <div className="relative">
                        <Type size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-nabih-slate/20`} />
                        <input required value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className={`w-full ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-5 bg-nabih-canvas rounded-2xl border border-transparent focus:border-nabih-merchant outline-none font-black text-nabih-slate transition-all shadow-sm`} placeholder={isRtl ? "مثال: ايفون 15 بخصم 20%" : "e.g. iPhone 15 with 20% Off"} />
                    </div>
                </div>
                {/* AUTO-FILLED CATEGORY - NO SELECT */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'الفئة (تلقائي)' : 'Category (Auto)'}</label>
                    <div className="relative">
                        <Tag size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-nabih-slate/20`} />
                        <div className={`w-full ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-5 bg-nabih-silver/50 rounded-2xl border border-transparent outline-none font-black text-nabih-slate/50 transition-all cursor-not-allowed`}>
                           {user?.storeCategory || 'General'}
                        </div>
                        <span className="text-[9px] text-nabih-slate/30 mt-1 block px-2">{isRtl ? 'يتم تحديد الفئة تلقائياً بناءً على تصنيف متجرك.' : 'Category is inherited from your store settings.'}</span>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'تفاصيل الإعلان' : 'Ad Description'}</label>
                <textarea required value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} className="w-full px-6 py-5 bg-nabih-canvas rounded-2xl border border-transparent focus:border-nabih-merchant outline-none font-bold text-nabih-slate transition-all min-h-[150px] shadow-sm leading-relaxed" placeholder={isRtl ? "اشرح مميزات منتجك أو عرضك..." : "Describe your product or offer..."} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'رابط صورة المنتج' : 'Product Image URL'}</label>
                    <div className="relative">
                        <ImageIcon size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-nabih-slate/20`} />
                        <input required value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} className={`w-full ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-5 bg-nabih-canvas rounded-2xl border border-transparent focus:border-nabih-merchant outline-none font-bold text-nabih-slate transition-all text-xs shadow-sm`} placeholder="https://..." />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'رابط التوجيه (صفحة الشراء)' : 'Destination URL'}</label>
                    <div className="relative">
                        <ExternalLink size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-nabih-slate/20`} />
                        <input required value={adForm.targetUrl} onChange={e => setAdForm({...adForm, targetUrl: e.target.value})} className={`w-full ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-5 bg-nabih-canvas rounded-2xl border border-transparent focus:border-nabih-merchant outline-none font-bold text-nabih-slate transition-all text-xs shadow-sm`} placeholder="https://..." />
                    </div>
                </div>
              </div>
              
              <div className="p-6 bg-amber-50 rounded-3xl flex items-start gap-4 text-amber-800 text-xs font-bold border border-amber-100/50">
                <AlertCircle size={24} className="shrink-0 text-amber-500" />
                <p className="leading-relaxed">
                  {isRtl 
                    ? 'ملاحظة أمنية: أي تغيير في محتوى الإعلان بعد الموافقة عليه سيؤدي إلى إعادة دخوله في مرحلة التدقيق تلقائياً لضمان سلامة المحتوى للمستخدمين.' 
                    : 'Security Note: Any change to the content after approval will automatically trigger a re-review to maintain platform trust.'}
                </p>
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setView('list')} className="flex-1 py-5 bg-nabih-silver text-nabih-slate/40 font-black rounded-2xl uppercase tracking-widest hover:bg-nabih-slate hover:text-white transition-all">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-nabih-merchant text-white font-black rounded-2xl uppercase tracking-widest hover:bg-nabih-merchantAccent transition-all shadow-xl flex justify-center items-center gap-3">
                  {isSubmitting ? <Clock size={20} className="animate-spin" /> : <Save size={20} />}
                  {isRtl ? 'حفظ ونشر المراجعة' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto bg-white p-16 rounded-[3.5rem] border border-nabih-border shadow-2xl relative">
                <div className="flex items-center gap-6 mb-12">
                    <div className="p-4 bg-nabih-merchant/10 text-nabih-merchant rounded-2xl">
                        <Settings size={32} />
                    </div>
                    <h3 className="text-3xl font-[1000] text-nabih-merchant">{isRtl ? 'إعدادات المتجر الأساسية' : 'Core Store Settings'}</h3>
                </div>
                
                <form onSubmit={handleSaveSettings} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'اسم المتجر الرسمي' : 'Official Store Name'}</label>
                        <div className="relative">
                            <Store size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-nabih-slate/20`} />
                            <input value={settingsForm.storeName} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className={`w-full ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-5 bg-nabih-canvas rounded-2xl font-black text-nabih-slate outline-none focus:ring-4 ring-nabih-merchant/5 transition-all`} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-nabih-slate/40 tracking-widest">{isRtl ? 'رقم جوال التواصل' : 'Business Contact Phone'}</label>
                        <div className="relative">
                            <Phone size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-5' : 'left-5'} text-nabih-slate/20`} />
                            <input value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className={`w-full ${isRtl ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-5 bg-nabih-canvas rounded-2xl font-black text-nabih-slate outline-none focus:ring-4 ring-nabih-merchant/5 transition-all`} />
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-nabih-border/50">
                        <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-nabih-merchant text-white font-black rounded-2xl uppercase tracking-widest hover:bg-nabih-merchantAccent transition-all shadow-xl flex items-center justify-center gap-4">
                            {isSubmitting ? <Clock size={24} className="animate-spin" /> : <Save size={24} />}
                            {isRtl ? 'حفظ التحديثات' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="mt-12 p-8 bg-red-50 rounded-[2rem] border border-red-100/50">
                        <h4 className="text-red-600 font-black text-xs uppercase mb-4 tracking-widest">{isRtl ? 'منطقة الخطر' : 'Danger Zone'}</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-red-500/60 leading-relaxed">
                                {isRtl ? 'حذف الحساب سيؤدي إلى مسح جميع حملاتك الإعلانية وبيانات متجرك بشكل نهائي.' : 'Deleting account will permanently remove all campaigns and store data.'}
                            </p>
                            <button type="button" onClick={() => showNotification('error', isRtl ? 'يرجى التواصل مع الدعم الفني للحذف' : 'Contact support for deletion')} className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                                {isRtl ? 'حذف الحساب' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default MerchantPlatform;
