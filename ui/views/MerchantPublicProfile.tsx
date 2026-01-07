
import React, { useEffect, useState } from 'react';
import { motion as motionBase } from 'framer-motion';
import { ArrowLeft, Store, Tag, MapPin, Phone, Mail, Grid, AlertCircle } from 'lucide-react';
import { getPublicMerchantProfile, getPublicMerchantAds } from '../../features/merchants/merchants.service';
import ComparisonCard from '../components/ComparisonCard';
import { ProductOption, Language } from '../../config/types';

const motion = motionBase as any;

interface MerchantPublicProfileProps {
  merchantId: string;
  lang: Language;
  onBack: () => void;
}

const MerchantPublicProfile: React.FC<MerchantPublicProfileProps> = ({ merchantId, lang, onBack }) => {
  const [profile, setProfile] = useState<any>(null);
  const [ads, setAds] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = lang === 'ar';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileData, adsData] = await Promise.all([
          getPublicMerchantProfile(merchantId),
          getPublicMerchantAds(merchantId)
        ]);

        setProfile(profileData);

        // Convert MerchantAds to ProductOptions for ComparisonCard
        const productOptions: ProductOption[] = adsData.map((ad: any) => ({
            name: ad.title,
            store: ad.merchantName,
            price: 'Check Offer', 
            currency: '',
            unitPrice: '',
            rating: 5, 
            reviewsCount: 'Featured',
            link: ad.targetUrl,
            imageUrl: ad.imageUrl,
            isBestValue: false,
            isLowestPrice: false,
            explanation: ad.description,
            score: 100,
            pros: ad.tags || [],
            cons: [],
            features: [ad.category, ...(ad.tags || [])],
            storeDomain: '',
            nabihVerdict: isRtl ? 'عرض مميز من متجر موثوق' : 'Featured offer from trusted store',
            adNumber: 'AD-' + ad.merchantId
        }));

        setAds(productOptions);
      } catch (error) {
        console.error("Failed to load merchant profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantId, lang]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-nabih-merchant border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  if (!profile) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} />
              </div>
              <h2 className="text-2xl font-black text-nabih-slate mb-4">{isRtl ? 'المتجر غير موجود' : 'Store Not Found'}</h2>
              <button onClick={onBack} className="text-nabih-purple font-bold hover:underline">{isRtl ? 'العودة للبحث' : 'Back to Search'}</button>
          </div>
      );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F7] pb-32 pt-28 px-4 md:px-8 relative z-10">
        
        {/* Navigation */}
        <button 
            onClick={onBack}
            className={`fixed top-28 ${isRtl ? 'right-8' : 'left-8'} z-50 p-4 bg-white rounded-full shadow-lg text-nabih-slate hover:text-nabih-purple transition-colors`}
        >
            <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
        </button>

        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-16">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-nabih-border shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-nabih-merchant/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-nabih-merchant text-white flex items-center justify-center text-5xl font-black shadow-xl shrink-0 z-10">
                    {profile.storeName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 text-center md:text-start z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-[1000] text-nabih-merchant tracking-tight">{profile.storeName}</h1>
                        <span className="px-4 py-1.5 bg-nabih-gold/10 text-nabih-gold rounded-full text-xs font-black uppercase tracking-widest border border-nabih-gold/20 flex items-center gap-2">
                             <Store size={14} /> {isRtl ? 'متجر موثوق' : 'Verified Store'}
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                        <span className="flex items-center gap-2 text-xs font-bold text-nabih-slate/50 bg-nabih-silver px-4 py-2 rounded-xl">
                            <Tag size={14} /> {profile.category}
                        </span>
                        {/* 
                           Note: In a real scenario, we might want to hide email/phone depending on privacy settings.
                           Showing them here as requested for the "Profile" concept. 
                        */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                       <div className="flex items-center gap-3 p-4 rounded-2xl bg-nabih-canvas border border-nabih-border">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-nabih-slate/30 shadow-sm"><Grid size={16} /></div>
                          <div className="flex flex-col text-start">
                             <span className="text-[10px] font-black uppercase text-nabih-slate/30 tracking-widest">{isRtl ? 'العروض النشطة' : 'Active Offers'}</span>
                             <span className="text-xl font-black text-nabih-slate">{ads.length}</span>
                          </div>
                       </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Ads Grid */}
        <div className="max-w-7xl mx-auto">
            <h3 className="text-2xl font-black text-nabih-slate mb-8 flex items-center gap-3">
                <Tag className="text-nabih-merchant" />
                {isRtl ? 'عروض المتجر الحالية' : 'Current Store Offers'}
            </h3>
            
            {ads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ads.map((ad, i) => (
                        <ComparisonCard 
                            key={i} 
                            option={ad} 
                            lang={lang} 
                            isGlobal={false}
                            // No onMerchantClick here to prevent recursion/redundancy
                        />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-nabih-border">
                    <p className="text-nabih-slate/40 font-bold text-lg">{isRtl ? 'لا توجد عروض نشطة حالياً لهذا المتجر.' : 'No active offers found for this store.'}</p>
                </div>
            )}
        </div>

    </motion.div>
  );
};

export default MerchantPublicProfile;
