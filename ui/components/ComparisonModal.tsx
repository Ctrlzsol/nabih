
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Star, DollarSign, Award, ThumbsUp } from 'lucide-react';
import { ProductOption, Language } from '../../config/types';
import { STRINGS } from '../../config/constants';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ProductOption[];
  lang: Language;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, items, lang }) => {
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';

  if (items.length < 2) return null;

  const item1 = items[0];
  const item2 = items[1];

  const compareRow = (label: string, val1: any, val2: any, icon?: any) => (
    <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100 last:border-0 items-center">
      <div className={`col-span-1 text-xs font-black uppercase tracking-wider text-nabih-slate/50 flex items-center gap-2 ${isRtl ? 'flex-row' : ''}`}>
        {icon} {label}
      </div>
      <div className="col-span-1 text-center font-bold text-sm text-nabih-slate">{val1}</div>
      <div className="col-span-1 text-center font-bold text-sm text-nabih-slate">{val2}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] shadow-2xl z-[70] border border-nabih-border"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-nabih-slate">{t.compareProducts}</h3>
                <button onClick={onClose} className="p-2 bg-nabih-silver rounded-full hover:bg-nabih-slate hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Header Images */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="col-span-1" />
                <div className="col-span-1 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white border border-gray-100 rounded-2xl p-2 mb-3 shadow-sm">
                    <img src={item1.imageUrl} alt="" className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-sm font-black text-center line-clamp-2 leading-tight">{item1.name}</h4>
                  <span className="text-[10px] text-nabih-slate/50 font-bold mt-1">{item1.store}</span>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white border border-gray-100 rounded-2xl p-2 mb-3 shadow-sm">
                    <img src={item2.imageUrl} alt="" className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-sm font-black text-center line-clamp-2 leading-tight">{item2.name}</h4>
                  <span className="text-[10px] text-nabih-slate/50 font-bold mt-1">{item2.store}</span>
                </div>
              </div>

              {/* Data Rows */}
              <div className="bg-nabih-canvas/30 rounded-3xl p-6">
                {compareRow(isRtl ? 'السعر' : 'Price', 
                  <span className="text-emerald-600">{item1.price} {item1.currency}</span>, 
                  <span className="text-emerald-600">{item2.price} {item2.currency}</span>, 
                  <DollarSign size={14} />
                )}
                {compareRow(isRtl ? 'التقييم' : 'Rating', 
                  <div className="flex items-center justify-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {item1.rating}</div>, 
                  <div className="flex items-center justify-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {item2.rating}</div>,
                  <Award size={14} />
                )}
                {compareRow(isRtl ? 'حالة التوفر' : 'Stock', 
                  <span className={item1.stockStatus?.includes('Stock') ? 'text-green-600' : 'text-red-500'}>{item1.stockStatus}</span>, 
                  <span className={item2.stockStatus?.includes('Stock') ? 'text-green-600' : 'text-red-500'}>{item2.stockStatus}</span>,
                  <Check size={14} />
                )}
                {compareRow(t.shipping, item1.shippingInfo, item2.shippingInfo)}
                {compareRow(t.warranty, item1.warrantyInfo, item2.warrantyInfo)}
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8">
                 <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <h5 className="text-emerald-700 font-black text-xs uppercase mb-3 flex items-center gap-2">
                        <ThumbsUp size={14} /> {isRtl ? 'يتفوق المنتج الأول بـ' : 'Item 1 Wins In'}
                    </h5>
                    <ul className="space-y-2">
                        {item1.pros.slice(0,3).map((p,i) => (
                            <li key={i} className="text-[10px] font-bold text-nabih-slate flex items-start gap-2">
                                <Check size={12} className="text-emerald-500 mt-0.5" /> {p}
                            </li>
                        ))}
                    </ul>
                 </div>
                 <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <h5 className="text-emerald-700 font-black text-xs uppercase mb-3 flex items-center gap-2">
                        <ThumbsUp size={14} /> {isRtl ? 'يتفوق المنتج الثاني بـ' : 'Item 2 Wins In'}
                    </h5>
                    <ul className="space-y-2">
                        {item2.pros.slice(0,3).map((p,i) => (
                            <li key={i} className="text-[10px] font-bold text-nabih-slate flex items-start gap-2">
                                <Check size={12} className="text-emerald-500 mt-0.5" /> {p}
                            </li>
                        ))}
                    </ul>
                 </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ComparisonModal;
