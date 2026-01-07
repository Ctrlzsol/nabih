
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { Loader2, Search, PlusCircle, AlertCircle, RefreshCcw, Wallet, Sparkles, Diamond, Tag, Check, Layers, MapPin, Globe, PlaneTakeoff, TrendingUp, CornerDownLeft, Filter, X } from 'lucide-react';
import ComparisonCard from '../components/ComparisonCard';
import ComparisonModal from '../components/ComparisonModal';
import HistoryDrawer from '../components/HistoryDrawer';
import { performComparison, saveSearchToHistory, getSearchHistory, deleteHistoryItem, clearAllHistory, searchMerchantAds } from '../../features/search/search.service';
import { ComparisonResult, Language, ProductOption, HistoryItem } from '../../config/types';
import { STRINGS, COUNTRIES } from '../../config/constants';
import { NabihLogo } from '../components/NabihLogo';
import { useAppStore } from '../../stores/app.store';

const motion = motionBase as any;

const POPULAR_SUGGESTIONS = {
  en: [
    "iPhone 15 Pro Max", "PlayStation 5 Slim", "MacBook Air M3", "Samsung Galaxy S24 Ultra",
    "Sony WH-1000XM5", "Dyson Airwrap", "Nespresso Vertuo", "Herman Miller Chair",
    "iPad Pro 12.9", "Nike Air Jordan", "LG OLED C3", "Fujifilm X100VI",
    "AirPods Pro 2", "Apple Watch Ultra 2", "Nintendo Switch OLED"
  ],
  ar: [
    "آيفون 15 برو ماكس", "بلايستيشن 5 سليم", "ماك بوك اير M3", "سامسونج جالكسي S24 الترا",
    "سماعات سوني XM5", "دايسون اير راب", "نسبريسو فيرتو", "كرسي هيرمان ميلر",
    "آيباد برو", "نايك اير جوردن", "شاشة LG OLED", "كاميرا فوجي فيلم",
    "ايربودز برو", "ساعة ابل الترا", "نينتندو سويتش"
  ]
};

const parsePrice = (priceVal: any): number => {
  if (typeof priceVal === 'number') return priceVal;
  const priceStr = String(priceVal || '');
  const normalized = priceStr.replace(/[^\d.]/g, '');
  return parseFloat(normalized) || 0;
};

const getSmartIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('price') || l.includes('cheapest') || l.includes('سعر') || l.includes('ارخص')) return Wallet;
  if (l.includes('balance') || l.includes('متوازن')) return Sparkles;
  if (l.includes('quality') || l.includes('rated') || l.includes('جودة') || l.includes('ممتاز')) return Diamond;
  return Tag;
};

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface ConsumerPlatformProps {
  user: any;
  lang: Language;
  country: string;
  setCountry: (c: string) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
}

const ConsumerPlatform: React.FC<ConsumerPlatformProps> = ({ 
  user, lang, country, setCountry, isHistoryOpen, setIsHistoryOpen 
}) => {
  const { actions } = useAppStore(); // Access AppStore actions for merchant profile view
  const [isGlobal, setIsGlobal] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [criteria, setCriteria] = useState<string>('balanced');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [compareItems, setCompareItems] = useState<ProductOption[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCriteriaMenu, setShowCriteriaMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const t = STRINGS[lang];
  const isRtl = lang === 'ar';

  const currentTheme = useMemo(() => {
    const c = criteria.toLowerCase();
    if (c.includes('price') || c.includes('cheapest') || c.includes('أرخص') || c.includes('سعر')) {
      return {
        glow: 'from-emerald-300/60 via-emerald-100/40 to-emerald-400/60',
        ring: 'focus-within:ring-emerald-400/50',
        btn: 'bg-emerald-500 hover:bg-emerald-400',
        icon: Wallet,
        placeholder: isRtl ? 'ابحث عن أرخص خيار...' : 'Search for best price...'
      };
    }
    if (c.includes('quality') || c.includes('rated') || c.includes('جودة') || c.includes('تقييم') || c.includes('topquality')) {
      return {
        glow: 'from-amber-300/60 via-yellow-100/40 to-amber-400/60',
        ring: 'focus-within:ring-amber-400/50',
        btn: 'bg-amber-500 hover:bg-amber-400',
        icon: Diamond,
        placeholder: isRtl ? 'ابحث عن الأفضل جودة...' : 'Search for top quality...'
      };
    }
    return {
      glow: 'from-nabih-purple/60 via-nabih-gold/30 to-nabih-purple/60',
      ring: 'focus-within:ring-nabih-purple/50',
      btn: 'bg-nabih-purple hover:bg-nabih-accent',
      icon: Sparkles,
      placeholder: t.placeholder
    };
  }, [criteria, isRtl, t]);

  const loadHistory = async () => { 
    if (user) setSearchHistory(await getSearchHistory(user.id)); 
  };

  useEffect(() => {
    if (isHistoryOpen) loadHistory();
  }, [isHistoryOpen]);

  useEffect(() => {
    if (!query) {
      setShowSuggestions(false);
      return;
    }
    const baseList = isRtl ? POPULAR_SUGGESTIONS.ar : POPULAR_SUGGESTIONS.en;
    const lowerQuery = query.toLowerCase();
    const filtered = baseList.filter(item => item.toLowerCase().includes(lowerQuery));
    
    if (filtered.length > 0) {
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query, isRtl]);

  const handleSearch = useCallback(async (searchQuery?: string, searchCriteria?: any, searchCountry?: string, searchGlobal?: boolean) => {
    const q = searchQuery || query;
    const c = searchCriteria || criteria;
    const loc = searchCountry || country;
    const globalMode = searchGlobal !== undefined ? searchGlobal : isGlobal;
    
    let contextStr = '';
    if (c === 'cheapest' || c.includes('price')) contextStr = isRtl ? 'بأقل سعر' : 'cheapest price';
    if (c === 'quality' || c.includes('rated')) contextStr = isRtl ? 'أفضل جودة وتقييم' : 'best quality and rating';
    
    const categoryQuery = activeCategory ? activeCategory : '';
    const effectiveQuery = `${q} ${categoryQuery} ${contextStr}`.trim();

    if (!q.trim()) return; 

    setIsLoading(true);
    setShowSuggestions(false); 
    setResult(null);
    setAllOptions([]); 
    setSearchError(null);
    setVisibleCount(8); 
    setCompareItems([]); 
    
    try {
      // Execute both searches in parallel: Gemini AI + Local Merchant Ads
      const [aiData, merchantAds] = await Promise.all([
        performComparison(
          effectiveQuery,
          lang, 
          loc, 
          { priority: c.includes('price') ? 'price' : c.includes('quality') ? 'quality' : 'balanced', condition: 'all', limit: 12, isGlobal: globalMode }
        ),
        searchMerchantAds(q, loc)
      ]);

      // Transform Merchant Ads to match ProductOption interface
      const adOptions: ProductOption[] = merchantAds.map(ad => ({
        name: ad.title,
        store: ad.merchantName,
        price: 'Check Offer', // Placeholder price for ads
        currency: '',
        unitPrice: '',
        rating: 5, // Ads usually shown with high visibility
        reviewsCount: 'Promoted',
        link: ad.targetUrl,
        imageUrl: ad.imageUrl,
        isBestValue: false,
        isLowestPrice: false,
        explanation: ad.description,
        score: 100, // Force high score for sorting visibility
        pros: ad.tags || [],
        cons: [],
        features: [ad.category, ...(ad.tags || [])],
        storeDomain: '',
        nabihVerdict: isRtl ? 'خيار موصى به من شركاء نبيه' : 'Recommended by Nabih Partners',
        adNumber: 'AD-' + ad.merchantId // Store merchant ID here to navigate to profile
      }));

      // Combine results: Ads first, then AI results
      const combinedOptions = [...adOptions, ...aiData.options];
      
      const combinedResult = {
        ...aiData,
        options: combinedOptions
      };

      setResult(combinedResult);
      setAllOptions(combinedOptions);
      
      if (user) { 
        await saveSearchToHistory(user.id, q, loc);
        await loadHistory(); 
      }
    } catch (err: any) { 
      console.error(err); 
      setSearchError(err.message || (lang === 'ar' ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
    } finally { 
      setIsLoading(false); 
    }
  }, [query, activeCategory, country, lang, user, isGlobal, criteria, isRtl]);

  const handleLoadMore = async () => {
    if (!result) return;
    setIsLoadingMore(true);
    try {
      const currentNames = allOptions.map(o => o.name);
      const effectiveQuery = `${query} ${activeCategory || ''}`.trim();
      const moreData = await performComparison(
        effectiveQuery,
        lang,
        country,
        { priority: 'balanced', condition: 'all', limit: 12, isGlobal },
        currentNames 
      );
      if (moreData && moreData.options.length > 0) {
        setAllOptions(prev => [...prev, ...moreData.options]);
        setVisibleCount(prev => prev + moreData.options.length); 
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleFilter = (term: string, type: 'category' | 'sort') => {
    if (type === 'category') {
        setActiveCategory(prev => prev === term ? null : term);
    } else if (type === 'sort') {
        if (selectedFilters.includes(term)) {
            setSelectedFilters([]);
            if (result && result.options) setAllOptions(result.options); 
        } else {
            setSelectedFilters([term]); 
            if (result && result.options) {
                const baseList = [...result.options];
                const lowerSort = term.toLowerCase();
                
                if (lowerSort.includes('price') || lowerSort.includes('cheapest') || lowerSort.includes('سعر')) {
                    baseList.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
                    setAllOptions(baseList);
                } else if (lowerSort.includes('quality') || lowerSort.includes('rated') || lowerSort.includes('جودة')) {
                    baseList.sort((a, b) => b.rating - a.rating);
                    setAllOptions(baseList);
                } else {
                    const matches = baseList.filter(item => 
                        item.name.toLowerCase().includes(lowerSort) || 
                        item.features.some(f => f.toLowerCase().includes(lowerSort)) ||
                        item.store.toLowerCase().includes(lowerSort) ||
                        (item.nabihVerdict && item.nabihVerdict.toLowerCase().includes(lowerSort))
                    );
                    if (matches.length > 0) setAllOptions(matches);
                }
            }
        }
    }
  };

  const toggleCompare = (option: ProductOption) => {
    setCompareItems(prev => {
      const exists = prev.find(item => item.link === option.link);
      if (exists) return prev.filter(item => item.link !== option.link);
      if (prev.length >= 2) return [prev[1], option];
      return [...prev, option];
    });
  };

  const processedOptions = useMemo(() => {
    const sourceOptions = allOptions && allOptions.length > 0 ? allOptions : (result?.options || []);
    if (sourceOptions.length === 0) return [];
    
    let minPrice = Number.MAX_VALUE;
    let maxScore = -1;

    sourceOptions.forEach(opt => {
        const p = parsePrice(opt.price);
        if (p > 0 && p < minPrice) minPrice = p;
        if ((opt.score || 0) > maxScore) maxScore = (opt.score || 0);
    });
    
    return sourceOptions.map((opt) => {
      const p = parsePrice(opt.price);
      return {
        ...opt,
        isBestValue: !opt.adNumber && (opt.score || 0) === maxScore && maxScore > 0, // Ads handled separately
        isLowestPrice: !opt.adNumber && p === minPrice && minPrice !== Number.MAX_VALUE
      };
    });
  }, [allOptions, result]); 

  const selectedCountryName = COUNTRIES.find(c => c.id === country)?.[lang === 'ar' ? 'ar' : 'en'] || country;

  return (
    <motion.div key="consumer-platform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full pb-64 pt-24 bg-transparent relative z-10">
      <section className="px-4 py-12 relative z-10 min-h-[60vh] flex flex-col items-center justify-center">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center space-y-4">
           <div className="inline-flex items-center gap-2 bg-nabih-purple/5 border border-nabih-purple/10 px-4 py-1.5 rounded-full mb-4">
              <NabihLogo size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-nabih-purple font-display">AI Shopping Assistant</span>
           </div>
           <h2 className="text-5xl md:text-7xl font-black text-nabih-slate tracking-tighter leading-tight font-display">
             {t.compareHeader.main} <span className="text-nabih-purple">{t.compareHeader.phrases[0]}</span>
           </h2>
           <p className="text-nabih-slate/40 text-lg md:text-xl font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto font-display">
              {t.slogan}
           </p>
        </motion.div>

        <div className="w-full max-w-5xl relative z-50">
          <div className="relative group/search">
              <div className={`absolute -inset-2 bg-gradient-to-r ${currentTheme.glow} rounded-[3rem] blur-xl opacity-30 group-focus-within/search:opacity-50 transition-all duration-1000 animate-shimmer bg-[length:200%_100%]`} />

              <motion.div layout className={`relative bg-white/30 backdrop-blur-2xl rounded-[3rem] shadow-premium border border-white/60 p-4 md:p-6 overflow-visible transition-all duration-500`}>
                  <div className="flex flex-col gap-6">
                      
                      <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-4">
                              <div className="relative">
                                  <button onClick={() => setShowCriteriaMenu(!showCriteriaMenu)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/40 border border-white/40 text-nabih-slate font-black text-xs uppercase tracking-wider transition-all backdrop-blur-md hover:bg-white/60">
                                      <currentTheme.icon size={14} className={criteria.includes('price') ? 'text-emerald-600' : criteria.includes('quality') ? 'text-amber-500' : 'text-nabih-purple'} />
                                      <span>{t.smartCriteria[criteria as keyof typeof t.smartCriteria]}</span>
                                  </button>
                                  <AnimatePresence>
                                      {showCriteriaMenu && (
                                          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl overflow-hidden p-1 z-[60]">
                                              {['balanced', 'cheapest', 'topQuality'].map(key => {
                                                  const label = t.smartCriteria[key as keyof typeof t.smartCriteria];
                                                  const Icon = key === 'balanced' ? Sparkles : key === 'cheapest' ? Wallet : Diamond;
                                                  return (
                                                      <button key={key} onClick={() => { setCriteria(key); setShowCriteriaMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${criteria === key ? 'bg-nabih-purple/10 text-nabih-purple' : 'hover:bg-white/50 text-nabih-slate'}`}>
                                                          <Icon size={14} /> {label}
                                                      </button>
                                                  )
                                              })}
                                          </motion.div>
                                      )}
                                  </AnimatePresence>
                              </div>

                              <div className="relative">
                                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/30 hover:bg-white/50 border border-white/40 text-nabih-slate font-black text-xs uppercase tracking-wider transition-all backdrop-blur-md">
                                      <span className="text-base leading-none">{getFlagEmoji(country)}</span>
                                      <select value={country} onChange={(e) => setCountry(e.target.value)} className="bg-transparent outline-none cursor-pointer appearance-none text-nabih-slate font-bold">
                                          {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c[lang]}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </div>

                          <div className="hidden md:block">
                              <div className="flex items-center bg-white/30 rounded-full p-1 border border-white/40 backdrop-blur-md">
                                  <button onClick={() => setIsGlobal(false)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${!isGlobal ? 'bg-white text-nabih-purple shadow-sm scale-105' : 'text-nabih-slate/50 hover:text-nabih-slate'}`}>
                                      <MapPin size={12} /> {isRtl ? 'محلي' : 'Local'}
                                  </button>
                                  <button onClick={() => setIsGlobal(true)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${isGlobal ? 'bg-white text-nabih-purple shadow-sm scale-105' : 'text-nabih-slate/50 hover:text-nabih-slate'}`}>
                                      <Globe size={12} /> {isRtl ? 'عالمي' : 'Global'}
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div className="relative flex items-center">
                          <div className={`w-full h-20 bg-white rounded-[2rem] shadow-inner border border-nabih-border/50 flex items-center px-8 transition-all focus-within:ring-4 focus-within:ring-opacity-20 ${currentTheme.ring} focus-within:border-opacity-50 group-focus-within/search:scale-[1.01]`}>
                              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} onFocus={() => { if(query) setShowSuggestions(true); }} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder={currentTheme.placeholder} className={`w-full h-full text-xl md:text-2xl font-black text-nabih-slate placeholder-nabih-slate/20 outline-none bg-transparent ${isRtl ? 'text-right' : 'text-left'}`} autoFocus />
                              {query && (
                                  <button onClick={() => { setQuery(''); setShowSuggestions(false); }} className={`absolute ${isRtl ? 'left-24' : 'right-24'} p-2 bg-nabih-silver rounded-full text-nabih-slate/30 hover:text-nabih-purple hover:bg-nabih-purple/10 transition-all`}>
                                      <X size={18} />
                                  </button>
                              )}
                          </div>
                          <button onClick={() => handleSearch()} disabled={isLoading} className={`absolute ${isRtl ? 'left-2' : 'right-2'} w-16 h-16 rounded-[1.6rem] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${currentTheme.btn}`}>
                              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} strokeWidth={3} />}
                          </button>
                      </div>
                  </div>
              </motion.div>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="absolute top-full left-4 right-4 mt-6 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-2xl overflow-hidden z-[55]">
                <div className="px-8 py-5 border-b border-gray-100 bg-white/50 flex items-center gap-2">
                  <TrendingUp size={16} className="text-nabih-purple" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-nabih-slate/40">{isRtl ? 'اقتراحات شائعة' : 'Popular Suggestions'}</span>
                </div>
                <div className="py-2">
                  {suggestions.map((s, i) => (
                    <motion.button key={i} whileHover={{ backgroundColor: "rgba(46, 2, 73, 0.05)", paddingLeft: isRtl ? 24 : 32, paddingRight: isRtl ? 32 : 24 }} onClick={() => { setQuery(s); setShowSuggestions(false); setSelectedFilters([]); handleSearch(s); }} className={`w-full px-8 py-4 flex items-center justify-between text-left group transition-all duration-300 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-nabih-slate/30 group-hover:bg-nabih-purple group-hover:text-white transition-all shadow-sm">
                          <Search size={16} />
                        </div>
                        <span className="text-base font-bold text-nabih-slate group-hover:text-nabih-purple transition-colors">{s}</span>
                      </div>
                      <CornerDownLeft size={16} className="text-nabih-slate/20 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:-translate-x-1" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {result?.disambiguationOptions && result.disambiguationOptions.length > 0 && !isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-10 w-full max-w-5xl px-4 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Layers size={16} className="text-nabih-gold" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-nabih-slate">{isRtl ? 'حدد الفئة' : 'Select Category'}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {result.disambiguationOptions.map((opt, idx) => {
                  const isActive = activeCategory === opt;
                  return (
                    <motion.button key={idx} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => toggleFilter(opt, 'category')} className={`px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-3 group relative overflow-hidden ${isActive ? 'bg-nabih-purple text-white shadow-xl shadow-nabih-purple/20' : 'bg-white text-nabih-slate border border-nabih-border hover:border-nabih-purple/30 hover:shadow-md'}`}>
                      <span className="relative z-10">{opt}</span>
                      {isActive && <motion.div layoutId="catActive" className="absolute inset-0 bg-white/10" />}
                    </motion.button>
                  );
                })}
              </div>
              {activeCategory && (
                  <motion.button initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onClick={() => handleSearch()} className="mt-4 px-8 py-2 bg-emerald-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2">
                      <Check size={14} /> {isRtl ? 'تطبيق الفئة' : 'Apply Category'}
                  </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result?.smartFilterSuggestions && result.smartFilterSuggestions.length > 0 && !isLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 w-full max-w-4xl flex flex-col items-center gap-3">
               <div className="flex items-center gap-2 mb-2 opacity-50">
                  <Filter size={12} className="text-nabih-slate" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-nabih-slate">{isRtl ? 'فلترة سريعة' : 'Quick Filter'}</span>
               </div>
               <div className="flex flex-wrap justify-center gap-2">
                 {result.smartFilterSuggestions.map((filter, idx) => {
                   const Icon = getSmartIcon(filter);
                   const isActive = selectedFilters.includes(filter);
                   return (
                    <motion.button key={`sf-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} whileHover={{ scale: 1.05 }} onClick={() => toggleFilter(filter, 'sort')} className={`px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all group ${isActive ? 'bg-nabih-slate text-white border-nabih-slate shadow-md' : 'bg-transparent text-nabih-slate/60 border border-nabih-slate/20 hover:border-nabih-purple hover:text-nabih-purple'}`}>
                      <Icon size={12} className={`${isActive ? 'text-nabih-gold' : 'text-nabih-slate/40 group-hover:text-nabih-purple'} transition-colors`} />
                      {filter}
                      {isActive && <Check size={12} className="ml-1 text-emerald-400" />}
                    </motion.button>
                   );
                 })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center gap-12">
              <div className="relative w-32 h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[3px] border-nabih-purple/10 border-t-nabih-purple rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center opacity-20"><NabihLogo size={28} /></div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <h4 className="text-2xl font-black text-nabih-slate">{t.loading}</h4>
                <p className="text-sm font-black text-nabih-slate/20 uppercase tracking-[1em] animate-pulse">{t.loadingSub}</p>
              </div>
            </motion.div>
          ) : searchError ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-20 flex flex-col items-center text-center max-w-lg mx-auto gap-8">
               <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle size={48} />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-nabih-slate">{lang === 'ar' ? 'عذراً، لم نجد نتائج' : 'Sorry, No Results'}</h3>
                  <p className="text-nabih-slate/40 font-bold">{searchError}</p>
               </div>
               <button onClick={() => handleSearch()} className="flex items-center gap-3 px-8 py-4 bg-nabih-purple text-white rounded-2xl font-black uppercase tracking-widest hover:bg-nabih-slate transition-all shadow-xl">
                 <RefreshCcw size={18} /> {lang === 'ar' ? 'إعادة المحاولة' : 'Retry Search'}
               </button>
            </motion.div>
          ) : result ? (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-24">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {processedOptions.slice(0, visibleCount).map((opt, i) => (
                  <ComparisonCard 
                    key={i} 
                    option={opt} 
                    lang={lang} 
                    onCompareToggle={toggleCompare} 
                    isComparing={!!compareItems.find(item => item.link === opt.link)} 
                    isGlobal={isGlobal}
                    onMerchantClick={actions.viewMerchantProfile}
                  />
                ))}
              </div>
              <div className="flex justify-center pb-20">
                   <button onClick={handleLoadMore} disabled={isLoadingMore} className="group flex items-center gap-3 px-12 py-6 bg-white border border-nabih-border rounded-full text-nabih-purple font-black uppercase tracking-[0.3em] shadow-lg hover:bg-nabih-purple hover:text-white transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isLoadingMore ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                      {isLoadingMore ? (isRtl ? 'جاري البحث...' : 'Scanning...') : t.loadMore}
                   </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {compareItems.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-2xl bg-nabih-slate/90 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 shadow-premium flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                {compareItems.slice(0, 2).map((item, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-nabih-slate bg-white p-1 overflow-hidden shrink-0">
                    <img src={item.imageUrl} className="w-full h-full object-contain" alt="" onError={(e) => {e.currentTarget.style.display='none'}} />
                  </div>
                ))}
              </div>
              <span className="text-white font-black text-xs uppercase tracking-widest font-display">
                {Math.min(compareItems.length, 2)} {t.comparing}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCompareItems([])} className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest px-4">
                {t.clearSelection}
              </button>
              <button disabled={compareItems.length < 2} onClick={() => setShowComparisonModal(true)} className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all font-display ${compareItems.length >= 2 ? 'bg-nabih-gold text-nabih-slate shadow-glow' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}>
                {t.compareProducts}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ComparisonModal isOpen={showComparisonModal} onClose={() => setShowComparisonModal(false)} items={compareItems} lang={lang} />
      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={searchHistory} lang={lang} onDelete={async (id) => { await deleteHistoryItem(id); loadHistory(); }} onClear={async () => { if (user) { await clearAllHistory(user.id); loadHistory(); } }} onSelect={(q, c) => { setQuery(q); setCountry(c); handleSearch(q, criteria, c); }} />
    </motion.div>
  );
};

export default ConsumerPlatform;
