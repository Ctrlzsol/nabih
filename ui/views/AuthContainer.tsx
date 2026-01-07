
import React from 'react';
import { motion as motionBase } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Auth from './Auth';
import { Language, Platform } from '../../config/types';

const motion = motionBase as any;

interface AuthContainerProps {
  lang: Language;
  platform: Platform;
  authMode: 'login' | 'signup' | 'update_password';
  isRtl: boolean;
  onBack: () => void;
  onLoginSuccess: (userData: any, platform: Platform) => Promise<void>;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ 
  lang, 
  platform, 
  authMode, 
  isRtl, 
  onBack, 
  onLoginSuccess 
}) => {
  return (
    <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex items-center justify-center p-8 bg-transparent relative z-10">
      <button 
        onClick={onBack}
        className={`fixed top-24 ${isRtl ? 'right-12' : 'left-12'} p-6 bg-white border border-nabih-border rounded-full hover:border-nabih-purple transition-all z-50 shadow-premium`}
      >
        <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
      </button>
      <Auth lang={lang} onLogin={onLoginSuccess} initialMode={authMode} platform={platform} />
    </motion.div>
  );
};

export default AuthContainer;
