
import React from 'react';
import { motion as motionBase } from 'framer-motion';
import { Clock } from 'lucide-react';

const motion = motionBase as any;

interface PendingApprovalProps {
  isRtl: boolean;
  onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ isRtl, onLogout }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center p-8 text-center bg-transparent relative z-50">
        <div className="max-w-2xl bg-white/95 backdrop-blur-2xl p-16 rounded-[4rem] border border-nabih-border shadow-premium">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mb-10 mx-auto animate-pulse">
                <Clock size={48} />
            </div>
            <h2 className="text-4xl font-black text-nabih-slate mb-6">
                {isRtl ? 'حسابك قيد المراجعة حالياً' : 'Your Account is Under Review'}
            </h2>
            <p className="text-nabih-slate/40 font-bold text-xl leading-relaxed mb-12">
                {isRtl 
                  ? 'شكرًا لانضمامك لشبكة أعمال نبيه. نقوم الآن بالتحقق من بيانات متجرك وسجلك التجاري لضمان موثوقية المنصة. سنقوم بإشعارك فور تفعيل الحساب.' 
                  : 'Thank you for joining Nabih Business. We are verifying your store details and CR to ensure platform trust. You will be notified once approved.'}
            </p>
            <button onClick={onLogout} className="px-12 py-5 bg-nabih-slate text-white rounded-2xl font-black uppercase tracking-widest hover:bg-nabih-purple transition-all">
                {isRtl ? 'تسجيل الخروج' : 'Log Out'}
            </button>
        </div>
    </motion.div>
  );
};

export default PendingApproval;
