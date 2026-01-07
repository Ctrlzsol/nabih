
import React from 'react';
import { motion as motionBase } from 'framer-motion';

const motion = motionBase as any;

const DynamicText: React.FC<{ 
  text: string; 
  className?: string; 
  isRtl?: boolean; 
  typewriter?: boolean; 
  infinitePulse?: boolean; 
  gradient?: string; 
  showCursor?: boolean; 
}> = ({ text, className, isRtl = false, typewriter = false, infinitePulse = false, gradient, showCursor = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className} leading-none font-display`}>
      <motion.div
        initial={typewriter ? { width: 0 } : { opacity: 0 }}
        animate={typewriter ? { width: ["0%", "100%", "100%", "0%"] } : infinitePulse ? { opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] } : { opacity: 1 }}
        transition={typewriter ? { duration: 6, repeat: Infinity, times: [0, 0.4, 0.8, 1], ease: "easeInOut" } : infinitePulse ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { duration: 1 }}
        className={`overflow-hidden whitespace-nowrap inline-block ${gradient ? `bg-gradient-to-b ${gradient} bg-clip-text text-transparent` : ''}`}
        style={{ direction: isRtl ? "rtl" : "ltr", paddingBottom: '0.1em' }}
      >
        {text}
      </motion.div>
      {showCursor && (
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className={`w-1 md:w-2 bg-nabih-gold/40 h-[0.7em] ${isRtl ? 'mr-6' : 'ml-6'}`}
        />
      )}
    </div>
  );
};

export default DynamicText;
