import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { unlockAchievement } from '../lib/achievementUtils';

export default function DropView() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 12, s: 45 });
  const [isJoined, setIsJoined] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleJoin = () => {
    setIsJoined(true);
    toast.success('Protocol Sync Established', { description: 'Your identity is archived for the Sahel Release.' });
    if (profile) {
      unlockAchievement(profile.uid, 'DROP_HUNTER', profile).catch(console.error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen relative flex flex-col justify-between overflow-hidden overflow-y-auto no-scrollbar pb-40"
    >
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
         <img 
           src="https://picsum.photos/seed/majestic/1200/2000" 
           alt="Majestic Drop" 
           className="w-full h-full object-cover grayscale brightness-50 contrast-125"
           referrerPolicy="no-referrer"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent"></div>
         <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-navy to-transparent opacity-80"></div>
      </div>

      {/* Drop Header */}
      <header className="relative z-10 p-12 text-center space-y-12">
         <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
               <span className="text-gold">✦</span>
               <h2 className="text-sm font-serif italic text-white tracking-[0.4em] uppercase">Limited Drop</h2>
               <span className="text-gold">✦</span>
            </div>
            
            <div className="flex justify-center items-center gap-6">
               <div className="text-center">
                  <p className="text-5xl font-mono text-white tracking-widest leading-none">
                     {timeLeft.h.toString().padStart(2, '0')} : {timeLeft.m.toString().padStart(2, '0')} : {timeLeft.s.toString().padStart(2, '0')}
                  </p>
                  <p className="text-[7px] uppercase font-black text-gold tracking-[0.5em] mt-3">Remaining Time</p>
               </div>
            </div>
         </div>
      </header>

      {/* Drop Content */}
      <main className="relative z-10 px-8 flex flex-col items-center text-center space-y-16">
         <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-serif text-white italic tracking-tighter leading-tight drop-shadow-2xl">
               Heritage <br/>
               <span className="text-gold-light">Release</span>
            </h1>
            <div className="flex flex-col items-center gap-2">
               <p className="text-2xl font-serif text-white italic">₦250,000</p>
               <div className="w-12 h-[1px] bg-gold/30"></div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {[
               { icon: Zap, label: 'Allocations', value: '24' },
               { icon: Sparkles, label: 'Tier Status', value: 'Gold Key' }
            ].map((stat, i) => (
               <div key={i} className="luxury-card p-6 bg-navy/60 backdrop-blur-xl border-white/5 space-y-2">
                  <stat.icon className="w-4 h-4 text-gold mx-auto" />
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{stat.label}</p>
                  <p className="text-xs font-serif italic text-gold">{stat.value}</p>
               </div>
            ))}
         </div>
      </main>

      {/* Sticky Action Footer */}
      <footer className="fixed bottom-12 inset-x-8 z-50">
          <button 
            onClick={handleJoin}
            disabled={isJoined}
            className={`luxury-button w-full !rounded-2xl !py-9 text-xs font-black tracking-[0.4em] shadow-[0_20px_60px_rgba(197,160,89,0.4)] group overflow-hidden relative transition-all ${isJoined ? 'bg-green-500/20 text-green-500 border-green-500/40' : ''}`}
          >
             <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
             <span className="relative z-10 flex items-center justify-center gap-3">
                {isJoined ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    IDENTITY ARCHIVED
                  </>
                ) : (
                  'JOIN THE DROP'
                )}
             </span>
             {!isJoined && <ArrowRight className="absolute right-8 w-5 h-5 group-hover:translate-x-2 transition-transform" />}
          </button>
      </footer>
    </motion.div>
  );
}
