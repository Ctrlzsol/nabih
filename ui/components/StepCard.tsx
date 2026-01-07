
import React from 'react';
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

const StepCard: React.FC<{ icon: any, stepNumber: string, title: string, desc: string, delay: number, isRtl: boolean }> = ({ icon: Icon, stepNumber, title, desc, delay, isRtl }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -20 }}
    className="relative bg-white/95 backdrop-blur-sm border border-nabih-border p-12 text-center group transition-all duration-700 hover:shadow-premium hover:border-nabih-purple overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-nabih-purple/[0.01] to-nabih-gold/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="absolute top-0 left-0 w-1 h-full bg-nabih-purple scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-top" />
    <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} text-8xl font-black text-nabih-slate/[0.02] group-hover:text-nabih-purple/[0.04] transition-colors select-none leading-none font-display`}>{stepNumber}</div>
    <div className="relative w-28 h-28 mb-12 mx-auto">
      <div className="absolute inset-3 bg-nabih-silver rounded-2xl flex items-center justify-center text-nabih-purple group-hover:bg-nabih-purple group-hover:text-white transition-all duration-500 shadow-sm overflow-hidden">
        <Icon size={40} className="group-hover:scale-125 transition-transform duration-500" />
      </div>
    </div>
    <h4 className="text-3xl font-black text-nabih-slate mb-6 tracking-tighter group-hover:text-nabih-purple transition-colors font-display">{title}</h4>
    <p className="text-nabih-slate/40 font-bold leading-relaxed text-sm md:text-base group-hover:text-nabih-slate/60 transition-colors">{desc}</p>
  </motion.div>
);

export default StepCard;
