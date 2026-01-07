
import React, { useState } from 'react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { X, Trash2, Clock, AlertTriangle, Check, RotateCcw } from 'lucide-react';
import { HistoryItem, Language } from '../../config/types';
import { STRINGS, COUNTRIES } from '../../config/constants';

const motion = motionBase as any;

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  lang: Language;
  onDelete: (id: string) => void;
  onClear: () => void;
  onSelect: (query: string, country: string) => void;
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, onClose, history, lang, onDelete, onClear, onSelect 
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const t = STRINGS[lang];
  const isRtl = lang === 'ar';

  const handleClearHistory = () => {
    if (isConfirmingClear) {
      onClear();
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { onClose(); setIsConfirmingClear(false); }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]"
          />
          <motion.div 
            initial={{ x: isRtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '-100%' : '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} w-full max-w-md bg-white z-[210] shadow-2xl flex flex-col`}
          >
            <div className="p-8 border-b border-[#f5f5f7] flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#1d1d1f]">{t.historyTitle}</h3>
                <p className="text-sm font-medium text-[#86868b]">{t.historySubtitle}</p>
              </div>
              <button onClick={() => { onClose(); setIsConfirmingClear(false); }} className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10">
                  <div className="w-20 h-20 bg-[#f5f5f7] rounded-3xl flex items-center justify-center text-[#d2d2d7] mb-6">
                    <Clock size={40} />
                  </div>
                  <p className="text-lg font-bold text-[#86868b]">{t.noHistory}</p>
                </div>
              ) : (
                history.map((item) => {
                  const countryName = COUNTRIES.find(c => c.id === item.country)?.[lang] || item.country;
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-[#fbfbfd] p-6 rounded-3xl border border-transparent hover:border-[#d2d2d7] hover:bg-white transition-all cursor-pointer relative"
                      onClick={() => onSelect(item.query, item.country)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                          <p className="text-lg font-bold text-[#1d1d1f] group-hover:text-nabih-purple transition-colors">
                            {item.query}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[#86868b] uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-nabih-silver/50 rounded-full text-nabih-slate">
                              <span className="text-base leading-none">{getFlagEmoji(item.country)}</span> 
                              {countryName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} /> 
                              {new Date(item.timestamp).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            {history.length > 0 && (
              <div className="p-8 bg-[#f5f5f7] border-t border-[#d2d2d7]">
                <AnimatePresence mode="wait">
                  {isConfirmingClear ? (
                    <motion.div 
                      key="confirm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle size={18} className="shrink-0" />
                        {isRtl ? 'هل أنت متأكد من مسح جميع الاستشارات؟' : 'Are you sure you want to clear everything?'}
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleClearHistory}
                          className="flex-grow py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
                        >
                          <Check size={16} /> {isRtl ? 'نعم، امسح الكل' : 'Yes, Clear All'}
                        </button>
                        <button 
                          onClick={() => setIsConfirmingClear(false)}
                          className="px-6 py-4 bg-white border border-[#d2d2d7] text-[#1d1d1f] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#f5f5f7] transition-all"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button 
                      key="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={handleClearHistory}
                      className="w-full py-4 bg-white border border-[#d2d2d7] text-[#1d1d1f] rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all text-xs uppercase tracking-widest"
                    >
                      <Trash2 size={20} />
                      {t.clearHistory}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryDrawer;
