
import React from 'react';
import { motion as motionBase, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, ScanSearch, BrainCircuit, Scale, Target, UserPlus, LogIn, Zap, Megaphone, Crosshair, BarChart2 } from 'lucide-react';
import { Platform } from '../../config/types';
import DynamicText from '../components/DynamicText';
import StepCard from '../components/StepCard';

const motion = motionBase as any;

const LandingView: React.FC<{ user: any, t: any, isRtl: boolean, onStart: (mode: 'login' | 'signup' | 'search') => void, platform: Platform }> = ({ user, t, isRtl, onStart, platform }) => {
  const { scrollY } = useScroll();
  const opacityFade = useTransform(scrollY, [0, 500], [1, 0]);
  const primaryText = platform === 'merchant' ? 'text-nabih-merchant' : 'text-nabih-purple';
  const buttonBg = platform === 'merchant' ? 'bg-nabih-merchant' : 'bg-nabih-purple';
  const gradient = platform === 'merchant' ? 'from-nabih-merchant via-nabih-merchantAccent to-nabih-slate' : 'from-nabih-purple via-nabih-accent to-nabih-slate';

  return (
    <div className="relative w-full">
      <motion.div key="landing-hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent px-8">
        <section className="relative z-10 w-full max-w-7xl flex flex-col items-center text-center">
          <div className="mb-6 h-[12rem] md:h-[20rem] flex items-center justify-center flex-col">
             {user && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`mb-4 text-xl md:text-2xl font-black ${primaryText} tracking-tight flex items-center gap-2`}>
                  <span className="opacity-50">{isRtl ? 'مرحباً بك،' : 'Welcome,'}</span> 
                  <span className={primaryText}>{user.storeName || user.name || (isRtl ? 'شريكنا العزيز' : 'Guest')}</span>
               </motion.div>
             )}
             <DynamicText text={platform === 'merchant' && isRtl ? "نبيه للأعمال" : (platform === 'merchant' ? "Nabih Business" : (isRtl ? "نبيه" : "Nabih"))} isRtl={isRtl} typewriter={true} gradient={gradient} className="text-[6rem] md:text-[12rem] lg:text-[16rem] font-[1000] tracking-tighter drop-shadow-2xl font-display" showCursor={true} />
          </div>
          <div className="mb-16 w-full px-4 text-center">
            <DynamicText text={platform === 'merchant' ? (isRtl ? "بوابتك الذكية للريادة الرقمية" : "Smart Gateway to Digital Leadership") : t.slogan} isRtl={isRtl} infinitePulse={true} className={`text-4xl md:text-7xl font-black ${primaryText} tracking-tight mb-8 font-display`} showCursor={false} />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-base md:text-2xl font-bold text-nabih-slate/40 uppercase tracking-[0.2em] max-w-4xl mx-auto leading-relaxed">
              {platform === 'merchant' ? (isRtl ? "حول بيانات البحث إلى فرص بيعية حقيقية. استهدف عملاءك بدقة متناهية وضاعف مبيعاتك بتقنيات الذكاء الاصطناعي." : "Transform search data into real sales opportunities. Target precisely and maximize revenue with advanced AI.") : t.subtitle}
            </motion.p>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="flex flex-col md:flex-row items-center gap-10">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => user ? onStart('search') : onStart('signup')} className={`relative px-20 md:px-24 py-8 md:py-10 ${buttonBg} text-white rounded-none font-black text-xl md:text-2xl flex items-center gap-6 uppercase tracking-[0.3em] shadow-premium transition-all group overflow-hidden font-display`}>
              <div className="relative flex items-center gap-6 z-10">
                {user ? (
                  <>
                    {platform === 'merchant' ? (isRtl ? 'لوحة التحكم' : 'Go to Dashboard') : t.startSearch}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Zap size={20} className="fill-nabih-gold text-nabih-gold group-hover:scale-125 transition-transform" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-nabih-gold group-hover:text-white transition-all duration-500"><UserPlus size={24} strokeWidth={2.5} /></div>
                    {platform === 'merchant' ? (isRtl ? 'ابدأ كتاجر' : 'Start Business') : t.startFreeTrial}
                  </>
                )}
              </div>
            </motion.button>
            {!user && (
              <motion.button whileHover={{ y: -2 }} onClick={() => onStart('login')} className={`group flex items-center gap-4 px-12 py-8 bg-white/30 backdrop-blur-md border border-nabih-border rounded-none text-nabih-slate/40 font-black text-sm uppercase tracking-[0.5em] transition-all hover:bg-white hover:border-current hover:shadow-ethereal font-display ${primaryText}`}>
                <div className="w-8 h-8 rounded-xl bg-nabih-silver flex items-center justify-center text-nabih-slate/20 group-hover:bg-current group-hover:text-white transition-all duration-500"><LogIn size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" /></div>
                {t.auth.signIn}
              </motion.button>
            )}
          </motion.div>
        </section>
        <motion.div style={{ opacity: opacityFade }} className="absolute bottom-12 animate-bounce text-nabih-slate/10"><ChevronDown size={32} /></motion.div>
      </motion.div>

      <section className="py-64 bg-transparent relative overflow-hidden px-8 border-t border-nabih-border">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-40">
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-[1em] text-nabih-gold mb-12 block font-display">{platform === 'merchant' ? (isRtl ? 'ذكاء الأعمال' : 'Business Intelligence') : 'The Science Behind Choice'}</motion.span>
            <div className="h-28 md:h-48 flex items-center justify-center mb-16">
              <DynamicText text={platform === 'merchant' ? (isRtl ? "منظومة النمو الذكي" : "The Growth Ecosystem") : (isRtl ? "كيف يعمل نبيه؟" : "How Nabih Works?")} isRtl={isRtl} typewriter={true} gradient={gradient} className="text-6xl md:text-9xl font-black tracking-tighter drop-shadow-lg font-display" showCursor={true} />
            </div>
            <div className={`w-40 h-1 ${platform === 'merchant' ? 'bg-nabih-merchant' : 'bg-nabih-purple'} mx-auto mb-16 opacity-20`} />
            <p className="max-w-3xl mx-auto text-nabih-slate/40 font-bold text-xl md:text-2xl leading-relaxed">
              {platform === 'merchant' ? (isRtl ? "بيئة رقمية متكاملة مصممة لربط منتجاتك بالعميل الذي يبحث عنها، في اللحظة المناسبة وبالتكلفة الأمثل." : "An integrated digital environment designed to connect your products with customers searching for them, at the right moment and optimal cost.") : (isRtl ? "نحن لا نبحث فقط، بل نحلل ونفاضل ونقدم لك النتيجة التي تستحقها." : "We don't just search; we analyze, evaluate, and deliver the verdict you deserve.")}
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {platform === 'consumer' ? (
              <>
                <StepCard isRtl={isRtl} stepNumber="01" icon={ScanSearch} delay={0.1} title={isRtl ? "مسح شامل" : "Global Scan"} desc={isRtl ? "يجوب نبيه آلاف المتاجر المحلية والعالمية في ثوانٍ ليجمع لك كل الخيارات المتاحة." : "Nabih scans thousands of local and global stores in seconds to aggregate every possible option."} />
                <StepCard isRtl={isRtl} stepNumber="02" icon={BrainCircuit} delay={0.3} title={isRtl ? "تحليل ذكي" : "AI Analysis"} desc={isRtl ? "يقوم الذكاء الاصطناعي بتقييم الجودة، الموثوقية، وتاريخ الأسعار لضمان الشفافية المطلقة." : "AI evaluates build quality, reliability ratings, and price history to ensure absolute transparency."} />
                <StepCard isRtl={isRtl} stepNumber="03" icon={Scale} delay={0.5} title={isRtl ? "مقارنة عادلة" : "Fair Comparison"} desc={isRtl ? "نفاضل بين العروض بناءً على معاييرك (السعر، الضمان، أو الجودة) لاستخلاص الأفضل." : "We weigh offers against your specific priorities—price, protection, or prestige—to find the match."} />
                <StepCard isRtl={isRtl} stepNumber="04" icon={Target} delay={0.7} title={isRtl ? "قرار نبيه" : "Smart Decision"} desc={isRtl ? "نقدم لك النتيجة النهائية والخيار الأمثل الذي يوفر عليك الجهد والمال والوقت." : "We deliver the final verdict and the pinpoint choice that saves you time, money, and stress."} />
              </>
            ) : (
              <>
                <StepCard isRtl={isRtl} stepNumber="01" icon={UserPlus} delay={0.1} title={isRtl ? "انضمام الشركاء" : "Onboarding"} desc={isRtl ? "عملية تسجيل سلسة للتحقق من هوية العلامة التجارية وضمان بيئة أعمال موثوقة." : "Seamless registration to verify brand identity and ensure a trusted business environment."} />
                <StepCard isRtl={isRtl} stepNumber="02" icon={Megaphone} delay={0.3} title={isRtl ? "إطلاق الحملات" : "Campaign Launch"} desc={isRtl ? "أدوات نشر متقدمة تمكنك من استعراض منتجاتك أمام الملايين بدقة عالية." : "Advanced publishing tools enabling you to showcase products to millions with high precision."} />
                <StepCard isRtl={isRtl} stepNumber="03" icon={Crosshair} delay={0.5} title={isRtl ? "الاستهداف السلوكي" : "Behavioral Targeting"} desc={isRtl ? "ظهور إعلاني ذكي يعتمد على نية الشراء الفورية للمستخدم وليس مجرد التصفح." : "Smart ad placement based on immediate purchase intent, not just browsing history."} />
                <StepCard isRtl={isRtl} stepNumber="04" icon={BarChart2} delay={0.7} title={isRtl ? "تحليلات النمو" : "Growth Analytics"} desc={isRtl ? "لوحة قيادة تفاعلية ترصد الأداء، العائد، وتكشف فرصاً جديدة للتوسع." : "Interactive dashboard tracking performance, ROI, and uncovering new expansion opportunities."} />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingView;
