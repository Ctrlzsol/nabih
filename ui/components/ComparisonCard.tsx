
import React, { useState, useEffect } from 'react';
import { ProductOption, Language } from '../../config/types';
import { STRINGS, STORE_SEARCH_PATTERNS } from '../../config/constants';
import { NabihLogo } from './NabihLogo';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { 
  Store, ArrowUpRight, Diamond, Star, 
  ListChecks, ThumbsUp, ThumbsDown, ChevronDown, 
  ChevronUp, Truck, ShieldCheck, RefreshCw, MessageSquareQuote,
  Lightbulb, ImageIcon, Zap, ExternalLink, Scale, Hash, Package,
  MapPin, Share2, Globe, Search, Calendar, Coins, CheckCircle, Flame
} from 'lucide-react';

const motion = motionBase as any;

interface ComparisonCardProps {
  option: ProductOption;
  lang: Language;
  onCompareToggle?: (option: ProductOption) => void;
  isComparing?: boolean;
  isGlobal?: boolean;
  onMerchantClick?: (merchantId: string) => void;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ option, lang, onCompareToggle, isComparing, isGlobal = false, onMerchantClick }) => {
  const [expanded, setExpanded] = useState(false);
  const [imgStage, setImgStage] = useState<number>(0); 
  const [currentImgUrl, setCurrentImgUrl] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';
  
  // Detect if this is a Merchant Ad
  const isAd = !!option.adNumber;

  // Formatting Helper: If currency exists, strip non-numeric from price to avoid "100 SAR SAR"
  const displayPrice = option.currency ? option.price.replace(/[^\d.,]/g, '') : option.price;
  const displayCurrency = option.currency;

  const getStoreLogo = (domain: string) => {
      if (!domain) return '';
      return `https://logo.clearbit.com/${domain}`;
  };

  const getWebImageSearch = (query: string) => {
      return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query)}&w=600&h=600&c=7&rs=1&p=0`;
  };

  useEffect(() => {
    if (option.imageUrl && option.imageUrl.length > 10) {
        setCurrentImgUrl(option.imageUrl);
        setImgStage(0);
    } else {
        const searchQuery = `${option.name} ${option.store}`;
        setCurrentImgUrl(getWebImageSearch(searchQuery));
        setImgStage(1);
    }
  }, [option]);

  const handleImageError = () => {
    if (imgStage === 0) {
        const searchQuery = `${option.name} ${option.store}`;
        setCurrentImgUrl(getWebImageSearch(searchQuery));
        setImgStage(1);
    } else if (imgStage === 1) {
        if (option.storeDomain) {
            setCurrentImgUrl(getStoreLogo(option.storeDomain));
            setImgStage(2);
        } else {
            setImgStage(3);
        }
    } else {
        setImgStage(3);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={14} 
          className={i < Math.round(rating) ? "fill-nabih-gold text-nabih-gold" : "text-nabih-border"} 
        />
      ))}
      <span className="text-[10px] font-black text-nabih-slate/40 ml-1">
        {option.reviewsCount} {t.reviews}
      </span>
    </div>
  );

  const constructReliableLink = (productName: string, storeName: string, originalLink: string): string => {
    const normalizedStore = storeName.toLowerCase().replace(/\s/g, '');
    const patternKey = Object.keys(STORE_SEARCH_PATTERNS).find(key => 
      normalizedStore.includes(key) || key.includes(normalizedStore)
    );

    if (patternKey) {
      const pattern = STORE_SEARCH_PATTERNS[patternKey];
      let cleanName = productName.replace(/[^\w\s\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
      const words = cleanName.split(' ');
      if (words.length > 5) {
          cleanName = words.slice(0, 5).join(' ');
      }
      return pattern.replace('{{QUERY}}', encodeURIComponent(cleanName));
    }

    if (originalLink && originalLink.length > 25 && !originalLink.includes('google.com/search') && !originalLink.includes('google.com/url')) {
        return originalLink;
    }

    if (option.storeDomain && !option.storeDomain.includes('google.')) {
        const query = `site:${option.storeDomain} ${productName}`;
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    const query = `${productName} ${storeName}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  const handleVisitStore = (e: React.MouseEvent, type: 'smart' | 'raw' | 'map') => {
    e.preventDefault();
    setIsRedirecting(true);
    
    setTimeout(() => {
      let targetUrl = '';
      if (type === 'map') {
        const query = encodeURIComponent(`${option.store} ${option.storeDomain ? '' : 'store'}`);
        targetUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
      } 
      else if (type === 'smart') {
        targetUrl = constructReliableLink(option.name, option.store, option.link);
      }
      else {
        targetUrl = option.link;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setIsRedirecting(false);
    }, 1000); 
  };

  const handleShare = () => {
    const text = `*${isRtl ? 'بطاقة منتج نبيه' : 'Nabih Product Card'}*\n\n` +
      `📦 ${option.name}\n` +
      `💰 ${option.price} ${option.currency}\n` +
      `🏪 ${option.store}\n` +
      `⭐ ${option.rating}/5\n\n` +
      `💡 ${option.nabihVerdict || option.explanation}\n\n` +
      `${isRtl ? 'الرابط:' : 'Link:'} ${constructReliableLink(option.name, option.store, option.link)}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div 
      layout
      whileHover={{ y: -8 }}
      className={`bg-white rounded-[2.5rem] border p-6 flex flex-col h-full relative group transition-all duration-500 hover:shadow-premium overflow-hidden
        ${isComparing ? 'border-nabih-purple ring-2 ring-nabih-purple/20' : isAd ? 'border-nabih-merchant ring-1 ring-nabih-merchant/30 shadow-lg shadow-nabih-merchant/5' : option.isBestValue ? 'border-nabih-purple/30' : option.isLowestPrice ? 'border-emerald-500/30' : 'border-nabih-border'}
      `}
    >
      <AnimatePresence>
        {isRedirecting && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-nabih-purple/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="mb-6"><NabihLogo size={32} /></div>
            <p className="text-white font-black text-xl mb-2">{t.redirectingMsg}</p>
            <p className="text-white/60 font-bold text-sm uppercase tracking-widest">{option.store}</p>
            <div className="mt-8 flex items-center gap-2 text-nabih-gold text-xs font-black uppercase tracking-widest">
                <Search size={14} className="animate-bounce" />
                {isRtl ? 'جاري البحث عن المنتج بدقة داخل المتجر...' : 'Searching for exact item inside store...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {/* MERCHANT BADGE LOGIC */}
          {isAd ? (
            <button 
                onClick={() => onMerchantClick && option.adNumber && onMerchantClick(option.adNumber.replace('AD-', ''))}
                className="flex items-center gap-2 bg-nabih-merchant/5 border border-nabih-merchant/10 hover:bg-nabih-merchant hover:text-white hover:border-nabih-merchant rounded-xl px-3 py-1.5 transition-all group/merchant cursor-pointer"
                title={isRtl ? "زيارة صفحة التاجر" : "Visit Merchant Profile"}
            >
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-nabih-merchant group-hover/merchant:text-white transition-colors">
                    <CheckCircle size={10} className="text-nabih-gold" />
                    {isRtl ? 'تاجر نبيه' : 'Nabih Merchant'}
                </div>
                <div className="w-px h-3 bg-nabih-merchant/20 group-hover/merchant:bg-white/20"></div>
                <span className="text-[10px] font-bold text-nabih-slate group-hover/merchant:text-white transition-colors">
                    {option.store}
                </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-nabih-slate/60 bg-nabih-silver/50 px-3 py-1.5 rounded-xl">
                <Store size={12} /> {option.store}
            </div>
          )}
          
          {option.isBestValue && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-nabih-purple bg-nabih-purple/10 px-3 py-1.5 rounded-xl border border-nabih-purple/20 shadow-sm"
            >
              <Diamond size={10} className="fill-nabih-purple" /> {t.bestValue}
            </motion.div>
          )}

          {option.isLowestPrice && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase text-white bg-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500 shadow-md shadow-emerald-200"
            >
               <Zap size={10} className="fill-white" /> {t.lowestPrice}
            </motion.div>
          )}
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={handleShare}
             className="flex items-center justify-center w-8 h-8 rounded-full border border-nabih-border text-nabih-slate/50 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
             title="Share via WhatsApp"
           >
             <Share2 size={14} />
           </button>
           <button 
             onClick={() => onCompareToggle?.(option)}
             className={`flex items-center justify-center w-8 h-8 rounded-full border text-[11px] font-black transition-all active:scale-90
               ${isComparing ? 'bg-nabih-purple text-white border-nabih-purple' : 'border-nabih-border text-nabih-slate/50 bg-nabih-canvas hover:border-nabih-purple hover:text-nabih-purple'}
             `}
             title={t.selectToCompare}
           >
             {isComparing ? <Zap size={14} fill="currentColor" /> : <Scale size={14} />}
           </button>
        </div>
      </div>

      {option.campaignName && (
        <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-nabih-purple to-nabih-accent text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Flame size={12} className="fill-nabih-gold text-nabih-gold" />
                {isRtl ? 'جزء من حملة:' : 'Part of:'} {option.campaignName}
            </span>
        </div>
      )}

      <div className={`relative h-64 w-full bg-nabih-canvas/30 rounded-[2rem] mb-6 flex items-center justify-center overflow-hidden border ${isAd ? 'border-nabih-merchant/20' : 'border-nabih-border/50'} group-hover:bg-nabih-silver/20 transition-colors`}>
        {imgStage === 3 ? (
          <div className="flex flex-col items-center gap-4 text-nabih-slate/30 text-center px-6">
             <div className="w-20 h-20 rounded-full bg-nabih-silver flex items-center justify-center">
                <ImageIcon size={32} strokeWidth={1.5} />
             </div>
             <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{option.store}</span>
                <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest">{isRtl ? 'الصورة غير متوفرة' : 'Image unavailable'}</p>
             </div>
          </div>
        ) : (
          <img 
            src={currentImgUrl} 
            className={`max-h-[85%] max-w-[85%] object-contain transition-all duration-700 group-hover:scale-110 
               ${imgStage === 2 ? 'grayscale opacity-60 scale-75' : 'mix-blend-multiply'}
            `}
            alt={option.name} 
            onError={handleImageError}
          />
        )}

        <div className={`absolute bottom-4 ${isRtl ? 'right-4' : 'left-4'} flex gap-2 z-20`}>
           {option.stockStatus && (
             <span className={`text-[9px] font-black px-4 py-2 rounded-xl backdrop-blur-md border shadow-lg ${option.stockStatus.toLowerCase().includes('in stock') || option.stockStatus.includes('متوفر') || option.stockStatus.includes('Ready') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' : 'bg-rose-500/10 text-rose-600 border-rose-200/50'}`}>
                {option.stockStatus}
             </span>
           )}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xl font-[1000] text-nabih-slate leading-tight mb-2 line-clamp-2 min-h-[3rem] group-hover:text-nabih-purple transition-colors">
          {option.name}
        </h4>
        <StarRating rating={option.rating} />
      </div>

      <div className={`p-5 rounded-[2.5rem] mb-5 border relative overflow-hidden shadow-sm transition-colors
        ${isAd ? 'bg-nabih-merchant/5 border-nabih-merchant/10' : option.isLowestPrice ? 'bg-emerald-50/50 border-emerald-100' : 'bg-nabih-silver/40 border-nabih-border/60'}
      `}>
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${isAd ? 'bg-nabih-merchant/10' : option.isLowestPrice ? 'bg-emerald-400/10' : 'bg-nabih-gold/5'}`} />
        <div className="relative z-10">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-3xl font-[1000] tracking-tighter ${isAd ? 'text-nabih-merchant' : option.isLowestPrice ? 'text-emerald-700' : 'text-nabih-slate'}`}>{displayPrice}</span>
            <span className={`text-[10px] font-black uppercase ${isAd ? 'text-nabih-merchant' : option.isLowestPrice ? 'text-emerald-500' : 'text-nabih-gold'}`}>{displayCurrency}</span>
          </div>
          {option.unitPrice && (
            <div className="text-[10px] font-bold text-nabih-slate/50 flex items-center gap-1.5 bg-white/70 w-fit px-3 py-1 rounded-xl border border-nabih-border/30 shadow-sm">
              <Package size={12} className="text-nabih-purple" />
              <span className="text-nabih-purple font-black">{t.unitPrice}:</span> 
              <span className="text-nabih-slate font-black">{option.unitPrice}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { icon: ShieldCheck, color: 'text-nabih-gold', bg: 'bg-nabih-gold/5', label: t.warranty, value: option.warrantyInfo },
          { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50', label: t.returnPolicy, value: option.returnPolicy },
          { icon: Truck, color: 'text-nabih-purple', bg: 'bg-nabih-purple/5', label: t.shipping, value: option.shippingInfo }
        ].map((item, idx) => (
          <div key={idx} className={`flex flex-col items-center justify-start p-3 ${item.bg} rounded-2xl border border-nabih-border/40 text-center transition-transform hover:scale-105 min-h-[100px]`}>
            <item.icon size={18} className={`${item.color} mb-2 shrink-0`} />
            <span className="text-[8px] font-black text-nabih-slate/30 uppercase mb-1 tracking-wider shrink-0">{item.label}</span>
            <span className="text-[10px] font-bold text-nabih-slate leading-[1.2] line-clamp-2 w-full">
              {item.value || '-'}
            </span>
          </div>
        ))}
      </div>

      {option.nabihVerdict && (
        <div className={`mb-6 p-4 border rounded-3xl flex items-start gap-3 shadow-inner transition-colors
          ${isAd ? 'bg-nabih-merchant/5 border-nabih-merchant/10' : option.isLowestPrice ? 'bg-emerald-600/5 border-emerald-600/10' : 'bg-nabih-purple/5 border-nabih-purple/10'}
        `}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAd ? 'bg-nabih-merchant' : option.isLowestPrice ? 'bg-emerald-600' : 'bg-nabih-purple'}`}>
             <Lightbulb size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isAd ? 'text-nabih-merchant' : option.isLowestPrice ? 'text-emerald-600' : 'text-nabih-purple'}`}>{t.nabihVerdict}</span>
            <p className="text-[11px] font-bold text-nabih-slate leading-relaxed">{option.nabihVerdict}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start gap-3 px-2">
        <MessageSquareQuote size={20} className="text-nabih-gold/20 shrink-0" />
        <p className="text-xs font-bold text-nabih-slate/50 leading-relaxed italic">
          {option.explanation}
        </p>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-6 mb-8"
          >
            <div className="h-px bg-nabih-border/50" />
            
            {(option.shippingCost || option.deliveryTime) && (
              <div className="bg-nabih-silver/30 p-4 rounded-3xl border border-nabih-border">
                <div className="flex items-center gap-2 text-[10px] font-black text-nabih-slate/50 uppercase tracking-widest mb-3">
                  <Truck size={14} /> {t.shipping}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-nabih-purple border border-nabih-border">
                      <Coins size={14} />
                    </div>
                    <div>
                       <span className="block text-[9px] font-black text-nabih-slate/30 uppercase">{isRtl ? 'التكلفة' : 'Cost'}</span>
                       <span className="text-xs font-bold text-nabih-slate">{option.shippingCost || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-nabih-purple border border-nabih-border">
                      <Calendar size={14} />
                    </div>
                    <div>
                       <span className="block text-[9px] font-black text-nabih-slate/30 uppercase">{isRtl ? 'المدة' : 'Time'}</span>
                       <span className="text-xs font-bold text-nabih-slate">{option.deliveryTime || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 text-[10px] font-black text-nabih-purple uppercase tracking-widest mb-4">
                <ListChecks size={14} /> {t.features}
              </div>
              <ul className="grid grid-cols-1 gap-2.5">
                {option.features.map((f, i) => (
                  <li key={i} className="text-[11px] font-bold text-nabih-slate/70 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-nabih-gold rounded-full shrink-0 shadow-sm" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50">
                <span className="text-[9px] font-black text-emerald-600 uppercase block mb-3 tracking-widest">{t.pros}</span>
                {option.pros.map((p, i) => (
                  <div key={i} className="text-[10px] font-bold text-nabih-slate/60 flex items-start gap-2.5 mb-2 last:mb-0">
                    <ThumbsUp size={11} className="mt-0.5 text-emerald-500 shrink-0" /> {p}
                  </div>
                ))}
              </div>
              <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100/50">
                <span className="text-[9px] font-black text-rose-600 uppercase block mb-3 tracking-widest">{t.cons}</span>
                {option.cons.map((c, i) => (
                  <div key={i} className="text-[10px] font-bold text-nabih-slate/60 flex items-start gap-2.5 mb-2 last:mb-0">
                    <ThumbsDown size={11} className="mt-0.5 text-rose-500 shrink-0" /> {c}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto space-y-4">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full text-[9px] font-black text-nabih-slate/30 hover:text-nabih-purple transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-nabih-canvas py-4 rounded-2xl border border-nabih-border/30 hover:border-nabih-purple/30"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? (isRtl ? 'إخفاء التفاصيل' : 'Hide details') : (isRtl ? 'عرض المزيد' : 'View more')}
        </button>

        <div className="flex gap-2.5">
          <motion.a 
            href="#"
            onClick={(e) => handleVisitStore(e, 'smart')}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-grow py-5 text-[10px] md:text-[11px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2 rounded-[1.8rem] transition-all shadow-xl active:scale-[0.98] relative overflow-hidden group/btn
              ${isAd ? 'bg-nabih-merchant hover:bg-nabih-merchantAccent shadow-nabih-merchant/20' : option.isLowestPrice ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-nabih-purple hover:bg-nabih-slate shadow-nabih-purple/20'}
              text-white cursor-pointer
            `}
          >
             <Globe size={16} />
             {t.visitStore}
             <ArrowUpRight size={14} className="relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
          </motion.a>

           <motion.button
             onClick={(e) => handleVisitStore(e, 'raw')}
             whileHover={{ scale: 1.05 }}
             className="w-12 flex items-center justify-center rounded-[1.8rem] bg-nabih-silver border border-nabih-border text-nabih-slate/50 hover:bg-white hover:text-nabih-purple hover:shadow-lg transition-all"
             title={isRtl ? "الرابط كما ورد (قد يكون غير دقيق)" : "Raw Link (Use with caution)"}
           >
              <ExternalLink size={16} />
           </motion.button>

          <motion.button
            onClick={(e) => handleVisitStore(e, 'map')}
            whileHover={{ scale: 1.05 }}
            className="w-16 flex items-center justify-center rounded-[1.8rem] bg-nabih-silver border border-nabih-border text-nabih-slate/50 hover:bg-white hover:text-nabih-purple hover:shadow-lg transition-all"
            title={isRtl ? "موقع المتجر" : "Store Location"}
          >
             <MapPin size={20} />
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
};

export default ComparisonCard;
