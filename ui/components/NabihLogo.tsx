
import React from 'react';
import { motion as motionBase } from 'framer-motion';
import { Platform } from '../../config/types';

const motion = motionBase as any;

export const NabihLogo = ({ size = 24, className = "", platform = 'consumer' }: { size?: number, className?: string, platform?: Platform }) => (
  <motion.div whileHover={{ scale: 1.05 }} className={`relative flex items-center justify-center ${className}`}>
    <svg width={size * 2.5} height={size * 2.5} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" className="text-nabih-slate" />
      <motion.circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeDasharray="60 180" className="text-nabih-gold" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
      {platform === 'merchant' ? (
        <g transform="translate(28, 28) scale(0.45)">
           <path d="M10 80V30L50 5L90 30V80H10Z" fill="none" stroke="currentColor" strokeWidth="5" className="text-nabih-merchant" strokeLinecap="round" strokeLinejoin="round" />
           <path d="M30 70V50" stroke="currentColor" strokeWidth="6" className="text-nabih-merchant" strokeLinecap="round" />
           <path d="M50 70V40" stroke="currentColor" strokeWidth="6" className="text-nabih-merchant" strokeLinecap="round" />
           <path d="M70 70V25" stroke="currentColor" strokeWidth="6" className="text-nabih-merchant" strokeLinecap="round" />
           <circle cx="50" cy="20" r="4" fill="currentColor" className="text-nabih-gold" />
        </g>
      ) : (
        <path d="M50 15L80 30V60L50 85L20 60V30L50 15Z" fill="currentColor" className="text-nabih-purple" />
      )}
      <motion.path d="M35 50L45 60L65 40" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} style={{ opacity: platform === 'merchant' ? 0 : 1 }} />
    </svg>
  </motion.div>
);
