
// ... (Keep existing imports, adding useState hook usage if needed, though it's already there)
// The file content provided in previous turn was full file replacement. I will do full file replacement again to ensure context is correct.

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getMerchantAds, createMerchantAd, updateMerchantAd, 
  updateMerchantProfile, softDeleteMerchantAd, toggleMerchantAdStatus,
  getPublicMerchantProfile, uploadAdImage, bulkCreateMerchantAds,
  createFullCampaign
} from '../../features/merchants/merchants.service';
import { MerchantAd, Language } from '../../config/types';
import { 
  PlusCircle, Eye, MousePointerClick, TrendingUp, AlertCircle, 
  CheckCircle, Clock, Image as ImageIcon, Tag, 
  Settings, Save, LayoutDashboard, List, Edit2, 
  Store, Phone, BarChart2, Store as StoreIcon,
  Globe, Trash2, PauseCircle, PlayCircle, Loader2,
  MapPin, Mail, GitBranch, Map as MapIcon, UploadCloud, FileSpreadsheet, Download, FileType, 
  Layers, Package, ArrowLeft, ArrowRight, Grid, Navigation,
  AlertTriangle, DollarSign, Calendar, ChevronRight, Search, X, Zap, MoreHorizontal
} from 'lucide-react';
import { useAppStore } from '../../stores/app.store';
import * as XLSX from 'xlsx';

interface MerchantPlatformProps {
  user: any;
  lang: Language;
}

// --- MODERN UI COMPONENTS ---

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`relative px-6 py-3 rounded-full flex items-center gap-2 text-sm font-black transition-all duration-300 ${
            active ? 'text-white' : 'text-gray-500 hover:text-nabih-merchant hover:bg-nabih-merchant/5'
        }`}
    >
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-nabih-merchant rounded-full shadow-lg shadow-nabih-merchant/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
        <span className="relative z-10 flex items-center gap-2">
            <Icon size={16} /> {label}
        </span>
    </button>
);

const StatWidget = ({ title, value, icon: Icon, color, delay }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${color} opacity-5 group-hover:scale-150 transition-transform duration-700`} />
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">{title}</p>
                <h3 className="text-4xl font-[1000] text-nabih-slate tracking-tight">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center`}>
                <Icon size={24} className={color.replace('bg-', 'text-').replace('-500', '-600')} />
            </div>
        </div>
    </motion.div>
);

const AdCardModern = ({ ad, isCampaignItem = false, isRtl, onToggleStatus, onEdit, onDelete }: any) => {
    const isDeleted = ad.status === 'deleted';
    const isSuspended = ad.status === 'suspended';
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative bg-white rounded-[2rem] border overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-xl
                ${isSuspended ? 'border-red-100 bg-red-50/10' : 'border-gray-100 hover:border-nabih-merchant/30'}
                ${isDeleted ? 'opacity-50 grayscale' : ''}
            `}
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
                {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                        <ImageIcon size={32} strokeWidth={1.5} />
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badge */}
                <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} z-10`}>
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-xl shadow-lg border border-white/20 flex items-center gap-1.5
                        ${ad.status === 'active' ? 'bg-emerald-500 text-white' : 
                          ad.status === 'paused' ? 'bg-amber-500 text-white' : 
                          'bg-gray-500 text-white'}
                    `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'active' ? 'bg-white animate-pulse' : 'bg-white/50'}`}></span>
                        {ad.status}
                    </span>
                </div>

                {/* Quick Actions (Reveal on Hover) */}
                <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 z-10 ${isRtl ? '-translate-x-12 group-hover:translate-x-0' : ''}`}>
                    {!isDeleted && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(ad); }} className="w-9 h-9 bg-white text-nabih-slate rounded-full flex items-center justify-center hover:bg-nabih-merchant hover:text-white transition-all shadow-lg" title="Edit">
                            <Edit2 size={14} />
                        </button>
                    )}
                    {!isDeleted && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleStatus(ad); }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg text-white ${ad.status === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                            title={ad.status === 'active' ? 'Pause' : 'Activate'}
                        >
                            {ad.status === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(ad.id); }} className="w-9 h-9 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg" title="Delete">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-base font-black text-nabih-slate line-clamp-1 group-hover:text-nabih-merchant transition-colors" title={ad.title}>{ad.title}</h4>
                    {isCampaignItem && <Layers size={14} className="text-nabih-merchant shrink-0" />}
                </div>
                
                <p className="text-[11px] text-gray-400 font-medium line-clamp-2 mb-4 flex-1">
                    {ad.description || 'No description provided.'}
                </p>

                {/* Metrics Footer */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{isRtl ? 'مشاهدات' : 'Views'}</span>
                            <span className="text-xs font-black text-nabih-slate flex items-center gap-1">
                                <Eye size={12} className="text-nabih-merchant" /> {ad.impressions.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-100"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{isRtl ? 'نقرات' : 'Clicks'}</span>
                            <span className="text-xs font-black text-nabih-slate flex items-center gap-1">
                                <MousePointerClick size={12} className="text-blue-500" /> {ad.clicks.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    
                    <div className={`text-[10px] font-bold px-2 py-1 rounded bg-gray-50 text-gray-400 border border-gray-100`}>
                        {ad.category || 'General'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

const MerchantPlatform: React.FC<MerchantPlatformProps> = ({ user, lang }) => {
  const { actions } = useAppStore();
  const [ads, setAds] = useState<MerchantAd[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<string>('overview');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  const [localStoreName, setLocalStoreName] = useState<string | null>(user?.storeName || null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Forms & State
  const [adForm, setAdForm] = useState<Partial<MerchantAd>>({
    title: '', description: '', imageUrl: '', targetUrl: '', targetCountries: ['JO'], category: '', tags: []
  });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [campaignForm, setCampaignForm] = useState({ title: '', budget: '', startDate: '', endDate: '' });
  const [campaignProducts, setCampaignProducts] = useState<Array<{ id: number, title: string, description: string, price: string, targetUrl: string, category: string, file: File | null, preview: string | null }>>([]);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkImportMode, setBulkImportMode] = useState<'single' | 'campaign'>('single');
  const [newCampaignName, setNewCampaignName] = useState('');
  
  const [settingsForm, setSettingsForm] = useState({
      storeName: '', phone: '', email: '', websiteUrl: '', locationUrl: '', storeAddress: '', branches: [] as { name: string; phone: string }[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  // NEW: Search State for Single Ads
  const [adsSearchTerm, setAdsSearchTerm] = useState('');

  const isRtl = lang === 'ar';

  // --- LOGIC PRESERVED ---
  const fetchAds = async () => {
    if (!user?.id) return;
    try {
        const data = await getMerchantAds(user.id);
        setAds(data || []);
    } catch (e) { console.error("Failed to sync merchant ads:", e); setAds([]); }
  };

  const fetchProfileDetails = async () => {
    if(!user?.id) return;
    try {
      const details = await getPublicMerchantProfile(user.id);
      if (details) {
          setSettingsForm({
              storeName: details.storeName || '', phone: details.phone || '', email: details.email || '', 
              websiteUrl: details.websiteUrl || '', locationUrl: details.locationUrl || '', storeAddress: details.address || '', branches: details.branches || []
          });
          if (details.storeName && details.storeName !== 'Merchant') setLocalStoreName(details.storeName);
      }
    } catch (e) { console.error("Error fetching profile details", e); } 
    finally { setLoading(false); setIsProfileLoaded(true); }
  };

  useEffect(() => {
    if (user?.id) { fetchAds(); fetchProfileDetails(); }
  }, [user]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
      setNotification({ type, msg });
      setTimeout(() => setNotification(null), 4000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleAddCampaignProduct = () => setCampaignProducts([...campaignProducts, { id: Date.now(), title: '', description: '', price: '', targetUrl: '', category: user.storeCategory || 'General', file: null, preview: null }]);
  const handleRemoveCampaignProduct = (id: number) => setCampaignProducts(campaignProducts.filter(p => p.id !== id));
  const handleCampaignProductChange = (id: number, field: string, value: any) => setCampaignProducts(campaignProducts.map(p => p.id === id ? { ...p, [field]: value } : p));
  const handleCampaignProductImage = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => { handleCampaignProductChange(id, 'preview', reader.result as string); handleCampaignProductChange(id, 'file', file); };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveCampaign = async () => {
      if (!campaignForm.title || campaignProducts.length === 0) {
          showNotification('error', isRtl ? 'يرجى إدخال البيانات المطلوبة.' : 'Required fields missing.');
          return;
      }
      setIsSubmitting(true);
      try {
          const result = await createFullCampaign(user.id, localStoreName || 'Merchant', campaignForm, campaignProducts);
          if (result.success) {
              showNotification('success', isRtl ? `تم إنشاء الحملة.` : `Campaign created.`);
              setCampaignForm({ title: '', budget: '', startDate: '', endDate: '' });
              setCampaignProducts([]);
              setView('campaigns');
              fetchAds();
          } else showNotification('error', result.message || 'Failed.');
      } catch (err: any) { showNotification('error', err.message); } 
      finally { setIsSubmitting(false); }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localStoreName) { showNotification('error', 'Setup store first'); setView('settings'); return; }
    setIsSubmitting(true);
    try {
        let finalImageUrl = adForm.imageUrl;
        if (imageFile) {
            const uploadedUrl = await uploadAdImage(imageFile, user.id);
            if (uploadedUrl) finalImageUrl = uploadedUrl;
            else throw new Error("Image upload failed");
        }
        const payload = { ...adForm, imageUrl: finalImageUrl, category: user.storeCategory || 'General', merchantId: user.id, merchantName: localStoreName, entryType: 'single' as const };
        let result;
        if (editingAdId) result = await updateMerchantAd(editingAdId, payload);
        else result = await createMerchantAd(payload);
        
        if (result.success) {
             showNotification('success', isRtl ? 'تم الحفظ.' : 'Saved.');
             await fetchAds(); setView('singles'); resetAdForm();
        } else throw new Error(result.message);
    } catch (e: any) { showNotification('error', e.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setExcelFile(e.target.files[0]); };
  
  const processBulkImport = async () => {
      if (!excelFile || !user?.id) return;
      if (bulkImportMode === 'campaign' && !newCampaignName.trim()) { showNotification('error', 'Campaign name required'); return; }
      setIsProcessingBulk(true); setBulkProgress(10);
      try {
          const reader = new FileReader();
          reader.onload = async (e) => {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'array' });
              const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
              setBulkProgress(40);
              const adsToCreate = jsonData.map((row: any) => ({
                  merchantId: user.id, merchantName: localStoreName || 'Merchant',
                  title: row['Title'] || row['title'] || 'Untitled', description: row['Description'] || row['description'] || '',
                  imageUrl: row['Image URL'] || row['image_url'] || '', targetUrl: row['Target URL'] || row['link'] || '',
                  category: row['Category'] || 'General', targetCountries: ['JO']
              }));
              setBulkProgress(60);
              const result = await bulkCreateMerchantAds(adsToCreate, bulkImportMode === 'campaign' ? { isCampaign: true, name: newCampaignName } : { isCampaign: false, name: '' });
              setBulkProgress(100);
              if (result.success) {
                  showNotification('success', 'Import successful'); await fetchAds(); setView(bulkImportMode === 'campaign' ? 'campaigns' : 'singles'); setExcelFile(null); setNewCampaignName('');
              } else showNotification('error', result.message || 'Failed');
              setIsProcessingBulk(false);
          };
          reader.readAsArrayBuffer(excelFile);
      } catch (e) { setIsProcessingBulk(false); }
  };

  const downloadTemplate = () => {
      const ws = XLSX.utils.aoa_to_sheet([['Title', 'Description', 'Image URL', 'Target URL', 'Category']]);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ads Template");
      XLSX.writeFile(wb, "Nabih_Ads_Template.xlsx");
  };

  const handleDeleteAd = async (adId: string) => {
      const currentAds = [...ads];
      setAds(prev => prev.filter(a => a.id !== adId));
      try {
          const result = await softDeleteMerchantAd(adId);
          if (result.success) showNotification('success', 'Deleted');
          else throw new Error(result.message);
      } catch (e: any) {
          setAds(currentAds); showNotification('error', e.message);
      }
  };

  const handleToggleStatus = async (ad: MerchantAd) => {
      if (ad.status !== 'active' && ad.status !== 'paused') return;
      const result = await toggleMerchantAdStatus(ad.id, ad.status);
      if (result.success) { 
          showNotification('success', 'Status updated'); 
          fetchAds(); 
      } else {
          showNotification('error', result.message || 'Failed to update status');
      }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault(); if (!user?.id) return;
      setIsSubmitting(true);
      const success = await updateMerchantProfile(user.id, settingsForm);
      if (success) { showNotification('success', 'Profile saved'); setLocalStoreName(settingsForm.storeName); setView('overview'); }
      else showNotification('error', 'Failed');
      setIsSubmitting(false);
  };

  const addBranch = () => setSettingsForm({ ...settingsForm, branches: [...settingsForm.branches, { name: '', phone: '' }] });
  const removeBranch = (idx: number) => { const b = [...settingsForm.branches]; b.splice(idx, 1); setSettingsForm({ ...settingsForm, branches: b }); };
  const updateBranch = (idx: number, f: 'name'|'phone', v: string) => { const b = [...settingsForm.branches]; b[idx][f] = v; setSettingsForm({ ...settingsForm, branches: b }); };

  const startEdit = (ad: MerchantAd) => {
      setEditingAdId(ad.id);
      setAdForm({ title: ad.title, description: ad.description, imageUrl: ad.imageUrl, targetUrl: ad.targetUrl, targetCountries: ad.targetCountries, category: ad.category, tags: ad.tags });
      setImagePreview(ad.imageUrl); setView('create');
  };
  const resetAdForm = () => { setEditingAdId(null); setAdForm({ title: '', description: '', imageUrl: '', targetUrl: '', targetCountries: ['JO'], category: '', tags: [] }); setImageFile(null); setImagePreview(null); };

  // --- LISTS ---
  const singleAds = ads.filter(a => (a.entryType === 'single' || !a.entryType) && a.status !== 'deleted');
  
  // NEW: Search Filtering
  const filteredSingleAds = useMemo(() => {
      if (!adsSearchTerm.trim()) return singleAds;
      const lower = adsSearchTerm.toLowerCase();
      return singleAds.filter(ad => 
          (ad.title && ad.title.toLowerCase().includes(lower)) || 
          (ad.description && ad.description.toLowerCase().includes(lower))
      );
  }, [singleAds, adsSearchTerm]);

  const campaigns = useMemo(() => {
      const campMap = new Map<string, { id: string, name: string, ads: MerchantAd[] }>();
      ads.filter(a => a.entryType === 'campaign' && a.campaignId && a.status !== 'deleted').forEach(ad => {
          if (ad.campaignId && !campMap.has(ad.campaignId)) campMap.set(ad.campaignId, { id: ad.campaignId, name: ad.campaignName || 'Unnamed', ads: [] });
          if(ad.campaignId) campMap.get(ad.campaignId)?.ads.push(ad);
      });
      return Array.from(campMap.values());
  }, [ads]);
  const adsInSelectedCampaign = selectedCampaignId ? (campaigns.find(c => c.id === selectedCampaignId)?.ads || []) : [];
  const stats = useMemo(() => ({
    activeAds: ads.filter(a => a.status === 'active').length,
    totalImpressions: ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0),
    totalClicks: ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0)
  }), [ads]);

  // --- RENDER ---
  if (isProfileLoaded && !localStoreName && view !== 'settings') {
      return (
        <div className={`min-h-screen flex items-center justify-center bg-[#F5F5F7] pt-24 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
            <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-xl max-w-2xl w-full relative z-10">
                <div className="w-20 h-20 bg-nabih-merchant text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-nabih-merchant/20">
                    <StoreIcon size={40} />
                </div>
                <h2 className="text-3xl font-[1000] text-nabih-slate mb-4">{isRtl ? 'إعداد المتجر' : 'Store Setup'}</h2>
                <p className="text-lg text-gray-400 mb-10 font-medium">
                    {isRtl ? 'للبدء، يرجى إكمال بيانات ملفك التجاري.' : 'To get started, please complete your business profile.'}
                </p>
                <button onClick={() => setView('settings')} className="px-10 py-4 bg-nabih-merchant text-white rounded-xl font-black uppercase tracking-widest hover:bg-nabih-merchantAccent transition-all w-full">
                    {isRtl ? 'إكمال البيانات' : 'Complete Profile'}
                </button>
            </div>
        </div>
      );
  }

  if (loading && !isProfileLoaded) return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] pt-24"><Loader2 className="animate-spin text-nabih-merchant" size={48} /></div>;

  return (
    <div className={`min-h-screen bg-[#F5F5F7] pb-24 pt-28 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* HEADER SECTION (Sticky) */}
      <div className="sticky top-24 z-30 bg-[#F5F5F7]/95 backdrop-blur-xl border-b border-gray-200/50 py-6 mb-8 transition-all">
          <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Title & User Info */}
                  <div className="flex items-center gap-6 w-full md:w-auto">
                      <div 
                        className="w-16 h-16 rounded-[1.5rem] bg-nabih-merchant text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-nabih-merchant/20 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setView('settings')}
                      >
                          {(localStoreName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <h1 className="text-3xl font-[1000] text-nabih-slate tracking-tight leading-none mb-2">
                              {localStoreName || 'My Store'}
                          </h1>
                          <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${user.status === 'approved' || user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                  {user.status === 'approved' || user.status === 'active' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                  {user.status === 'approved' || user.status === 'active' ? 'Verified' : 'Pending'}
                              </span>
                              <span className="text-gray-400 text-xs font-bold">{user.email}</span>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <button onClick={() => { resetAdForm(); setView('create'); }} className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-200 text-nabih-slate rounded-xl font-black text-xs uppercase tracking-wider hover:border-nabih-merchant hover:text-nabih-merchant transition-all shadow-sm">
                          {isRtl ? 'إعلان جديد' : 'New Ad'}
                      </button>
                      <button onClick={() => { setView('create-campaign'); setCampaignProducts([]); setCampaignForm({title:'', budget:'', startDate:'', endDate:''}); }} className="flex-1 md:flex-none px-6 py-3 bg-nabih-merchant text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-nabih-merchantAccent transition-all shadow-lg shadow-nabih-merchant/20 flex items-center justify-center gap-2">
                          <Layers size={16} /> {isRtl ? 'حملة جديدة' : 'New Campaign'}
                      </button>
                  </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
                  {[
                      { id: 'overview', label: isRtl ? 'الرئيسية' : 'Overview', icon: LayoutDashboard },
                      { id: 'singles', label: isRtl ? 'الإعلانات' : 'Ads', icon: Tag },
                      { id: 'campaigns', label: isRtl ? 'الحملات' : 'Campaigns', icon: Layers },
                      { id: 'bulk-import', label: isRtl ? 'استيراد' : 'Import', icon: FileSpreadsheet },
                      { id: 'settings', label: isRtl ? 'الإعدادات' : 'Settings', icon: Settings },
                  ].map((tab) => (
                      <TabButton 
                          key={tab.id} 
                          {...tab} 
                          active={view === tab.id || (view === 'campaign-details' && tab.id === 'campaigns')} 
                          onClick={() => setView(tab.id as any)} 
                      />
                  ))}
              </div>
          </div>
      </div>

      {/* NOTIFICATIONS */}
      <AnimatePresence>
          {notification && (
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] font-bold text-sm flex items-center gap-3 border backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
                  {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {notification.msg}
              </motion.div>
          )}
      </AnimatePresence>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
              
              {/* OVERVIEW */}
              {view === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <StatWidget title={isRtl ? 'الإعلانات النشطة' : 'Active Ads'} value={stats.activeAds} icon={Zap} color="bg-emerald-500" delay={0} />
                          <StatWidget title={isRtl ? 'إجمالي الظهور' : 'Impressions'} value={stats.totalImpressions.toLocaleString()} icon={Eye} color="bg-nabih-merchant" delay={0.1} />
                          <StatWidget title={isRtl ? 'النقرات' : 'Clicks'} value={stats.totalClicks.toLocaleString()} icon={MousePointerClick} color="bg-blue-500" delay={0.2} />
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                              <div className="text-center md:text-start">
                                  <h3 className="text-2xl font-[1000] text-nabih-slate mb-2">{isRtl ? 'أهلاً بك في لوحة تحكم التاجر' : 'Welcome to Merchant Dashboard'}</h3>
                                  <p className="text-gray-400 max-w-lg">{isRtl ? 'تابع أداء إعلاناتك، أدر حملاتك، ووسع نطاق وصولك لعملاء جدد بكل سهولة.' : 'Track performance, manage campaigns, and expand your reach effortlessly.'}</p>
                              </div>
                              <div className="flex gap-4">
                                  <div className="text-center px-6 py-4 bg-gray-50 rounded-2xl">
                                      <span className="block text-3xl font-[1000] text-nabih-slate mb-1">{singleAds.length}</span>
                                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'إعلان فردي' : 'Single Ads'}</span>
                                  </div>
                                  <div className="text-center px-6 py-4 bg-gray-50 rounded-2xl">
                                      <span className="block text-3xl font-[1000] text-nabih-slate mb-1">{campaigns.length}</span>
                                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRtl ? 'حملة' : 'Campaigns'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* SINGLE ADS LIST - REDESIGNED GRID WITH SEARCH */}
              {view === 'singles' && (
                  <motion.div key="singles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      
                      {/* Header with Search */}
                      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                          <div>
                              <h3 className="text-xl font-black text-nabih-slate">{isRtl ? 'الإعلانات الفردية' : 'Single Products'}</h3>
                              <p className="text-xs font-bold text-gray-400 mt-1">{filteredSingleAds.length} {isRtl ? 'نتائج' : 'results'}</p>
                          </div>
                          
                          <div className="relative w-full md:w-80 group">
                              <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-nabih-merchant transition-colors ${isRtl ? 'right-4' : 'left-4'}`} size={18} />
                              <input 
                                  value={adsSearchTerm}
                                  onChange={(e) => setAdsSearchTerm(e.target.value)}
                                  placeholder={isRtl ? 'بحث سريع عن إعلان...' : 'Quick search...'}
                                  className={`w-full py-3 bg-gray-50 border-transparent rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-nabih-merchant focus:ring-4 focus:ring-nabih-merchant/10 transition-all ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                              />
                              {adsSearchTerm && (
                                  <button onClick={() => setAdsSearchTerm('')} className={`absolute top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-500 transition-colors ${isRtl ? 'left-3' : 'right-3'}`}>
                                      <X size={12} />
                                  </button>
                              )}
                          </div>
                      </div>
                      
                      {filteredSingleAds.length === 0 ? (
                          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                  {adsSearchTerm ? <Search size={32} /> : <Tag size={32} />}
                              </div>
                              <p className="font-bold text-gray-400 mb-6">
                                  {adsSearchTerm ? (isRtl ? 'لا توجد نتائج مطابقة للبحث.' : 'No matching ads found.') : (isRtl ? 'لم تقم بإضافة إعلانات بعد.' : 'No ads created yet.')}
                              </p>
                              {!adsSearchTerm && (
                                  <button onClick={() => setView('create')} className="px-6 py-2 bg-nabih-merchant text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all">
                                      {isRtl ? 'أضف أول إعلان' : 'Create First Ad'}
                                  </button>
                              )}
                              {adsSearchTerm && (
                                  <button onClick={() => setAdsSearchTerm('')} className="px-6 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all">
                                      {isRtl ? 'مسح البحث' : 'Clear Search'}
                                  </button>
                              )}
                          </div>
                      ) : (
                          /* SCALABLE GRID SYSTEM FOR MILLIONS OF ADS */
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {filteredSingleAds.map(ad => (
                                  <AdCardModern 
                                      key={ad.id} ad={ad} isRtl={isRtl}
                                      onToggleStatus={handleToggleStatus} onEdit={startEdit} onDelete={handleDeleteAd}
                                  />
                              ))}
                          </div>
                      )}
                  </motion.div>
              )}

              {/* CAMPAIGNS LIST */}
              {view === 'campaigns' && (
                  <motion.div key="campaigns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-black text-nabih-slate">{isRtl ? 'الحملات الإعلانية' : 'Active Campaigns'}</h3>
                      </div>

                      {campaigns.length === 0 ? (
                          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Layers size={32} />
                              </div>
                              <p className="font-bold text-gray-400">{isRtl ? 'لا توجد حملات حالياً.' : 'No campaigns yet.'}</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {campaigns.map(camp => (
                                  <div key={camp.id} onClick={() => { setSelectedCampaignId(camp.id); setView('campaign-details'); }} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-nabih-merchant/30 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-nabih-merchant/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                                      
                                      <div className="flex items-center justify-between mb-6 relative z-10">
                                          <div className="w-10 h-10 rounded-xl bg-nabih-merchant text-white flex items-center justify-center shadow-md">
                                              <Layers size={20} />
                                          </div>
                                          <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black border border-gray-100">{camp.ads.length} Items</span>
                                      </div>
                                      
                                      <h4 className="text-lg font-black text-nabih-slate mb-2 relative z-10">{camp.name}</h4>
                                      
                                      <div className="mt-auto pt-6 flex items-center gap-4 text-xs font-bold text-gray-400 relative z-10 border-t border-gray-50">
                                          <span className="flex items-center gap-1.5"><Eye size={12} className="text-nabih-merchant" /> {camp.ads.reduce((a, b) => a + (b.impressions||0), 0)}</span>
                                          <span className="flex items-center gap-1.5"><MousePointerClick size={12} className="text-blue-500" /> {camp.ads.reduce((a, b) => a + (b.clicks||0), 0)}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </motion.div>
              )}

              {/* CAMPAIGN DETAILS VIEW */}
              {view === 'campaign-details' && selectedCampaignId && (
                  <motion.div key="campaign-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                       <button onClick={() => setView('campaigns')} className="flex items-center gap-2 text-gray-400 hover:text-nabih-merchant font-black text-xs uppercase tracking-widest mb-2 transition-colors">
                           <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} /> {isRtl ? 'العودة للقائمة' : 'Back to List'}
                       </button>
                       <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between mb-8">
                           <div>
                               <h3 className="text-3xl font-[1000] text-nabih-slate mb-1">{campaigns.find(c => c.id === selectedCampaignId)?.name}</h3>
                               <p className="text-gray-400 text-sm font-bold">Campaign Overview</p>
                           </div>
                           <span className="bg-nabih-merchant text-white px-5 py-2 rounded-xl text-xs font-black tracking-wide shadow-lg shadow-nabih-merchant/20">{adsInSelectedCampaign.length} Products</span>
                       </div>
                       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                           {adsInSelectedCampaign.map(ad => (
                               <AdCardModern key={ad.id} ad={ad} isCampaignItem={true} isRtl={isRtl} onToggleStatus={handleToggleStatus} onEdit={startEdit} onDelete={handleDeleteAd} />
                           ))}
                       </div>
                  </motion.div>
              )}

              {/* CREATE / EDIT SINGLE AD FORM */}
              {view === 'create' && (
                 <motion.div key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                     <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-nabih-merchant text-white flex items-center justify-center shadow-lg shadow-nabih-merchant/20">
                                {editingAdId ? <Edit2 size={24} /> : <PlusCircle size={24} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-[1000] text-nabih-slate">{editingAdId ? (isRtl ? 'تعديل الإعلان' : 'Edit Ad') : (isRtl ? 'إعلان جديد' : 'New Ad')}</h3>
                                <p className="text-xs font-bold text-gray-400">{isRtl ? 'يرجى تعبئة البيانات بدقة' : 'Please fill in details carefully'}</p>
                            </div>
                        </div>
                        <button onClick={() => setView('singles')} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} /></button>
                    </div>
                    
                    <form onSubmit={handleSaveAd} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                       {/* Left Column: Image */}
                       <div className="lg:col-span-4 space-y-4">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-wider block px-1">{isRtl ? 'صورة المنتج' : 'Visual'}</label>
                          <div className="aspect-[4/5] border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50 hover:bg-white hover:border-nabih-merchant/50 transition-all cursor-pointer relative overflow-hidden group flex flex-col items-center justify-center text-center p-6">
                              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                              {imagePreview ? (
                                  <>
                                      <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                          <div className="bg-white/20 border border-white/30 px-4 py-2 rounded-xl text-white font-bold text-xs">{isRtl ? 'تغيير' : 'Change'}</div>
                                      </div>
                                  </>
                              ) : (
                                  <>
                                      <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-gray-300 group-hover:text-nabih-merchant transition-colors">
                                          <UploadCloud size={24} />
                                      </div>
                                      <p className="text-xs font-bold text-gray-500">{isRtl ? 'ارفع صورة' : 'Upload Image'}</p>
                                  </>
                              )}
                          </div>
                       </div>

                       {/* Right Column: Fields */}
                       <div className="lg:col-span-8 space-y-6">
                          <div className="space-y-2">
                              <label className="text-xs font-black uppercase text-gray-400 tracking-wider block px-1">{isRtl ? 'العنوان' : 'Title'}</label>
                              <input required value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-nabih-merchant outline-none font-bold text-sm text-nabih-slate transition-all placeholder:text-gray-300" placeholder={isRtl ? 'اسم المنتج أو العرض' : 'Product name or offer title'} />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider block px-1">{isRtl ? 'الفئة' : 'Category'}</label>
                                  <input required value={adForm.category} onChange={e => setAdForm({...adForm, category: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-nabih-merchant outline-none font-bold text-sm text-nabih-slate transition-all" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider block px-1">{isRtl ? 'الرابط' : 'Target URL'}</label>
                                  <input required value={adForm.targetUrl} onChange={e => setAdForm({...adForm, targetUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-nabih-merchant outline-none font-bold text-sm text-nabih-slate transition-all" placeholder="https://" />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-black uppercase text-gray-400 tracking-wider block px-1">{isRtl ? 'الوصف' : 'Description'}</label>
                              <textarea required value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-nabih-merchant outline-none font-bold text-sm text-nabih-slate transition-all min-h-[140px]" placeholder={isRtl ? 'وصف دقيق للمنتج...' : 'Detailed description...'} />
                          </div>
                          
                          <div className="pt-6">
                              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-nabih-merchant text-white font-black rounded-2xl uppercase tracking-widest hover:bg-nabih-merchantAccent transition-all shadow-xl shadow-nabih-merchant/20 text-xs flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                  {isRtl ? 'حفظ ونشر' : 'Save & Publish'}
                              </button>
                          </div>
                       </div>
                    </form>
                 </motion.div>
              )}

              {/* CAMPAIGN WIZARD (STEPPER STYLE) */}
              {view === 'create-campaign' && (
                  <motion.div key="create-campaign" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-6xl mx-auto bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                      <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-nabih-merchant text-white flex items-center justify-center shadow-lg shadow-nabih-merchant/20">
                                  <Layers size={24} />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-[1000] text-nabih-slate">{isRtl ? 'منشئ الحملات' : 'Campaign Wizard'}</h3>
                                  <p className="text-xs font-bold text-gray-400">{isRtl ? 'خطوتان لإطلاق حملتك' : 'Two steps to launch'}</p>
                              </div>
                          </div>
                          <button onClick={() => setView('campaigns')} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft size={20} className={isRtl ? 'rotate-180' : ''} /></button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                          {/* STEP 1: INFO */}
                          <div className="lg:col-span-4 space-y-6">
                              <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-32 h-32 bg-nabih-merchant/5 rounded-full -mr-10 -mt-10" />
                                   <div className="flex items-center gap-3 mb-6 relative z-10">
                                       <span className="w-8 h-8 rounded-full bg-nabih-merchant text-white flex items-center justify-center text-sm font-black shadow-md">1</span>
                                       <h4 className="font-black text-nabih-slate text-sm uppercase tracking-wider">{isRtl ? 'بيانات الحملة' : 'Details'}</h4>
                                   </div>
                                   
                                   <div className="space-y-4 relative z-10">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'اسم الحملة' : 'Title'}</label>
                                          <input value={campaignForm.title} onChange={e => setCampaignForm({...campaignForm, title: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-100 focus:border-nabih-merchant font-bold text-sm text-nabih-slate outline-none" />
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'الميزانية' : 'Budget'}</label>
                                          <div className="relative">
                                              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                              <input type="number" value={campaignForm.budget} onChange={e => setCampaignForm({...campaignForm, budget: e.target.value})} className="w-full pl-9 pr-4 py-3 bg-white rounded-xl border border-gray-100 focus:border-nabih-merchant font-bold text-sm text-nabih-slate outline-none" />
                                          </div>
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'تاريخ البدء' : 'Start Date'}</label>
                                          <input type="date" value={campaignForm.startDate} onChange={e => setCampaignForm({...campaignForm, startDate: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-100 focus:border-nabih-merchant font-bold text-sm text-nabih-slate outline-none" />
                                      </div>
                                   </div>
                              </div>
                          </div>

                          {/* STEP 2: PRODUCTS */}
                          <div className="lg:col-span-8 space-y-6">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                       <span className="w-8 h-8 rounded-full bg-nabih-merchant text-white flex items-center justify-center text-sm font-black shadow-md">2</span>
                                       <h4 className="font-black text-nabih-slate text-sm uppercase tracking-wider">{isRtl ? 'المنتجات' : 'Products'}</h4>
                                  </div>
                                  <button onClick={handleAddCampaignProduct} className="px-4 py-2 bg-nabih-merchant/10 text-nabih-merchant rounded-xl font-black text-xs uppercase tracking-wide hover:bg-nabih-merchant hover:text-white transition-all flex items-center gap-2">
                                      <PlusCircle size={14} /> {isRtl ? 'إضافة منتج' : 'Add Item'}
                                  </button>
                               </div>

                               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                  <AnimatePresence>
                                      {campaignProducts.map((prod, index) => (
                                          <motion.div key={prod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row gap-6 relative group hover:bg-white hover:shadow-lg transition-all">
                                              <div className="absolute top-4 left-4 bg-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-gray-300 border border-gray-100 shadow-sm">
                                                  {index + 1}
                                              </div>
                                              <button onClick={() => handleRemoveCampaignProduct(prod.id)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                              
                                              <div className="w-full md:w-32 h-32 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group/upload cursor-pointer shrink-0 mt-6 md:mt-0">
                                                  <input type="file" accept="image/*" onChange={(e) => handleCampaignProductImage(prod.id, e)} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                                  {prod.preview ? <img src={prod.preview} className="w-full h-full object-cover" alt="" /> : <UploadCloud size={24} className="text-gray-300 group-hover/upload:text-nabih-merchant transition-colors" />}
                                              </div>

                                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 md:mt-0">
                                                  <input value={prod.title} onChange={e => handleCampaignProductChange(prod.id, 'title', e.target.value)} placeholder={isRtl ? "اسم المنتج" : "Item Title"} className="bg-white px-4 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-nabih-merchant transition-all" />
                                                  <input value={prod.price} onChange={e => handleCampaignProductChange(prod.id, 'price', e.target.value)} placeholder={isRtl ? "السعر" : "Price"} className="bg-white px-4 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-nabih-merchant transition-all" />
                                                  <input value={prod.targetUrl} onChange={e => handleCampaignProductChange(prod.id, 'targetUrl', e.target.value)} placeholder="https://" className="md:col-span-2 bg-white px-4 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-nabih-merchant transition-all" />
                                                  <textarea value={prod.description} onChange={e => handleCampaignProductChange(prod.id, 'description', e.target.value)} placeholder={isRtl ? "وصف مختصر" : "Short description"} className="md:col-span-2 bg-white px-4 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-nabih-merchant transition-all min-h-[60px]" />
                                              </div>
                                          </motion.div>
                                      ))}
                                  </AnimatePresence>
                                  {campaignProducts.length === 0 && (
                                      <div onClick={handleAddCampaignProduct} className="py-16 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                                          <Package size={40} className="mb-3 opacity-50" />
                                          <span className="text-xs font-bold uppercase tracking-widest">{isRtl ? 'اضغط لإضافة منتجات' : 'Click to add items'}</span>
                                      </div>
                                  )}
                               </div>

                               <div className="pt-6 border-t border-gray-100 flex justify-end">
                                   <button onClick={handleSaveCampaign} disabled={isSubmitting} className="px-12 py-4 bg-nabih-merchant text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-nabih-merchantAccent transition-all flex items-center gap-3 disabled:opacity-50 hover:-translate-y-1">
                                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                      {isRtl ? 'إطلاق الحملة' : 'Launch Campaign'}
                                   </button>
                               </div>
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* BULK IMPORT */}
              {view === 'bulk-import' && (
                  <motion.div key="bulk" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl text-center">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                          <FileSpreadsheet size={40} />
                      </div>
                      <h3 className="text-3xl font-[1000] text-nabih-merchant mb-4">{isRtl ? 'استيراد جماعي' : 'Bulk Import'}</h3>
                      
                      <div className="flex justify-center gap-4 my-8 p-1.5 bg-gray-50 rounded-2xl w-fit mx-auto border border-gray-100">
                           <button onClick={() => setBulkImportMode('single')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${bulkImportMode === 'single' ? 'bg-white text-nabih-merchant shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                               {isRtl ? 'إعلانات' : 'Ads'}
                           </button>
                           <button onClick={() => setBulkImportMode('campaign')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${bulkImportMode === 'campaign' ? 'bg-white text-nabih-merchant shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                               {isRtl ? 'حملة' : 'Campaign'}
                           </button>
                      </div>

                      {bulkImportMode === 'campaign' && (
                          <div className="mb-8 text-start max-w-md mx-auto">
                              <input autoFocus value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold text-nabih-slate outline-none focus:bg-white focus:border-nabih-merchant border border-transparent transition-all text-sm text-center" placeholder={isRtl ? 'اسم الحملة الجديدة...' : 'New Campaign Name...'} />
                          </div>
                      )}

                      <div className="space-y-6 max-w-lg mx-auto">
                          <button onClick={downloadTemplate} className="text-nabih-merchant font-bold text-xs hover:underline flex items-center justify-center gap-2">
                              <Download size={14} /> {isRtl ? 'تحميل نموذج Excel' : 'Download Template'}
                          </button>

                          <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-[2.5rem] h-56 flex flex-col items-center justify-center relative hover:bg-white hover:border-nabih-merchant/30 transition-all group cursor-pointer">
                              <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                              {excelFile ? (
                                  <div className="flex flex-col items-center gap-3 text-emerald-600 relative z-10">
                                      <FileType size={48} />
                                      <span className="font-bold">{excelFile.name}</span>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center gap-3 text-gray-300 group-hover:text-nabih-merchant/50 transition-colors relative z-10">
                                      <UploadCloud size={48} />
                                      <span className="font-bold text-xs uppercase tracking-widest">{isRtl ? 'اسحب الملف هنا' : 'Drag file here'}</span>
                                  </div>
                              )}
                          </div>

                          {isProcessingBulk && (
                              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${bulkProgress}%` }} className="h-full bg-emerald-500 rounded-full" />
                              </div>
                          )}

                          <div className="flex gap-4 pt-4">
                              <button onClick={() => setView('overview')} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                              <button onClick={processBulkImport} disabled={!excelFile || isProcessingBulk} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none bg-nabih-merchant`}>
                                  {isProcessingBulk ? <Loader2 className="animate-spin mx-auto" /> : (isRtl ? 'بدء المعالجة' : 'Start Processing')}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* SETTINGS */}
              {view === 'settings' && (
                   <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                       <div className="flex items-center gap-4 mb-12 pb-8 border-b border-gray-50">
                           <div className="w-16 h-16 bg-nabih-merchant rounded-2xl flex items-center justify-center text-white shadow-lg shadow-nabih-merchant/20">
                               <Settings size={28} />
                           </div>
                           <div>
                              <h3 className="text-3xl font-[1000] text-nabih-slate">{isRtl ? 'إعدادات المتجر' : 'Store Settings'}</h3>
                              <p className="text-xs font-bold text-gray-400">{isRtl ? 'تحكم في معلومات ملفك التعريفي' : 'Manage your profile information'}</p>
                           </div>
                       </div>
                       
                       <form onSubmit={handleSaveSettings} className="space-y-10">
                           
                           <section className="space-y-6">
                              <h4 className="text-xs font-black text-nabih-slate uppercase tracking-widest flex items-center gap-2">
                                  <Store size={14} className="text-nabih-merchant" /> {isRtl ? 'البيانات الأساسية' : 'Basic Info'}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'اسم المتجر' : 'Store Name'}</label>
                                      <input required value={settingsForm.storeName} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-nabih-slate outline-none focus:bg-white focus:border-nabih-merchant focus:ring-1 focus:ring-nabih-merchant/10 transition-all" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'الهاتف' : 'Phone'}</label>
                                      <input required value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-nabih-slate outline-none focus:bg-white focus:border-nabih-merchant focus:ring-1 focus:ring-nabih-merchant/10 transition-all text-left" dir="ltr" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'البريد' : 'Email'}</label>
                                      <input type="email" value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-nabih-slate outline-none focus:bg-white focus:border-nabih-merchant focus:ring-1 focus:ring-nabih-merchant/10 transition-all" />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{isRtl ? 'الموقع الإلكتروني' : 'Website'}</label>
                                      <input value={settingsForm.websiteUrl} onChange={e => setSettingsForm({...settingsForm, websiteUrl: e.target.value})} placeholder="https://" className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold text-nabih-slate outline-none focus:bg-white focus:border-nabih-merchant focus:ring-1 focus:ring-nabih-merchant/10 transition-all" />
                                  </div>
                              </div>
                           </section>

                           <section className="space-y-6 pt-8 border-t border-gray-50">
                              <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-nabih-slate uppercase tracking-widest flex items-center gap-2">
                                      <GitBranch size={14} className="text-nabih-merchant" /> {isRtl ? 'الفروع' : 'Branches'}
                                  </h4>
                                  <button type="button" onClick={addBranch} className="text-[10px] font-black text-white bg-nabih-merchant px-3 py-1.5 rounded-lg hover:bg-nabih-merchantAccent transition-all flex items-center gap-1 shadow-md shadow-nabih-merchant/20">
                                      <PlusCircle size={10} /> {isRtl ? 'إضافة' : 'Add'}
                                  </button>
                              </div>
                              
                              <div className="space-y-3">
                                  {settingsForm.branches.map((branch, idx) => (
                                      <div key={idx} className="flex flex-col md:flex-row gap-3 items-center p-2 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-colors">
                                          <input placeholder={isRtl ? "اسم الفرع" : "Name"} value={branch.name} onChange={e => updateBranch(idx, 'name', e.target.value)} className="flex-1 bg-white px-4 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-nabih-merchant/20" />
                                          <input placeholder={isRtl ? "رقم الهاتف" : "Phone"} value={branch.phone} onChange={e => updateBranch(idx, 'phone', e.target.value)} className="flex-1 bg-white px-4 py-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-nabih-merchant/20 text-left" dir="ltr" />
                                          <button type="button" onClick={() => removeBranch(idx)} className="p-3 bg-white text-red-400 rounded-xl hover:text-red-600 hover:shadow-sm transition-all">
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  ))}
                                  {settingsForm.branches.length === 0 && (
                                      <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 text-xs font-bold">
                                          {isRtl ? 'لا توجد فروع إضافية' : 'No branches added'}
                                      </div>
                                  )}
                              </div>
                           </section>

                           <div className="pt-8 flex justify-end">
                               <button type="submit" disabled={isSubmitting} className="px-12 py-5 bg-nabih-merchant text-white font-black rounded-2xl uppercase tracking-widest hover:bg-nabih-merchantAccent transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3">
                                   {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                   {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                               </button>
                           </div>
                       </form>
                   </motion.div>
              )}

          </AnimatePresence>
      </div>
    </div>
  );
};

export default MerchantPlatform;
