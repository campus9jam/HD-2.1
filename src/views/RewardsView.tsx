import { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, ChevronLeft, Sparkles, Trophy, Star, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { activateRewardProtocol } from '../services/RewardService';
import { toast } from 'sonner';

export default function RewardsView() {
  const { profile, user } = useAuth();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  
  const rewards = [
    { id: 'discount_15', title: 'Archival Discount', desc: 'Secure 15% reduction on your next Heritage acquisition.', cost: 2500 },
    { id: 'beta_access', title: 'Beta Access', desc: 'Join the focus group for the next Drop Alpha series.', cost: 1000 },
    { id: 'global_sync', title: 'Global Sync', desc: 'Enable priority international logistics for 30 cycles.', cost: 1500 },
    { id: 'artisan_grant', title: 'Artisan Grant', desc: 'Vote on the next master artisan to receive House funding.', cost: 500 }
  ];

  const handleActivate = async (reward: any) => {
    if (!user || !profile) return;
    if (profile.xp < reward.cost) {
       toast.error("Insufficient XP for this protocol");
       return;
    }

    setActivatingId(reward.id);
    try {
      const success = await activateRewardProtocol(user.uid, reward);
      if (success) {
        toast.success(`${reward.title} protocol activated`);
      }
    } catch (error) {
      toast.error("Protocol activation terminal failure");
    } finally {
      setActivatingId(null);
    }
  };
  
  const statusConfig = {
    'Citizen': { color: 'text-text/40', bg: 'bg-text/5', border: 'border-text/10', next: 'Gold' },
    'Gold': { color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/40', next: 'Platinum' },
    'Platinum': { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/40', next: 'Diamond Elite' },
    'Diamond Elite': { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/40', next: 'Maximized' },
  };

  const config = (profile?.statusTier as keyof typeof statusConfig) ? statusConfig[profile?.statusTier as keyof typeof statusConfig] : statusConfig['Citizen'];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pt-12 pb-40 px-8 max-w-4xl mx-auto space-y-16"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-10 pb-12 border-b border-text/5">
        <div className="space-y-4">
           <span className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Noble_Rewards.v1</span>
           <h1 className="text-4xl md:text-6xl font-serif text-text italic">Elite <span className="text-gold">Status.</span></h1>
        </div>
        <Link to="/profile" className="p-4 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </header>

      {/* Tier Overview Card */}
      <section className={`luxury-card p-12 ${config.bg} ${config.border} space-y-12 relative overflow-hidden !rounded-[3rem]`}>
         <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px]"></div>
         
         <div className="flex justify-between items-start relative z-10">
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase text-text/20 tracking-widest">Active Tier</h3>
               <h2 className={`text-5xl font-serif italic ${config.color}`}>{profile?.statusTier || 'Citizen'}</h2>
            </div>
            <div className={`p-6 rounded-3xl ${config.bg} border ${config.border}`}>
               <Shield className={`w-12 h-12 ${config.color}`} />
            </div>
         </div>

         <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-end">
               <span className="text-[10px] uppercase font-black text-text/20">Progression to {config.next}</span>
               <span className="text-text font-mono">{profile?.xp || 0} / 5000 XP</span>
            </div>
            <div className="h-4 bg-text/5 rounded-full overflow-hidden border border-text/5">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min(((profile?.xp || 0) / 5000) * 100, 100)}%` }}
                 className={`h-full ${config.bg} relative`}
               >
                  <div className="absolute inset-0 bg-gold/30 animate-pulse"></div>
               </motion.div>
            </div>
         </div>

         <div className="grid grid-cols-3 gap-8 pt-8 border-t border-text/5 relative z-10">
            {[
               { label: 'Artifact Discount', val: '12%', icon: Star },
               { label: 'Drop Priority', val: 'Elite', icon: Sparkles },
               { label: 'Logistics Cost', val: '₦0', icon: Trophy }
            ].map((stat, i) => (
               <div key={i} className="text-center space-y-3">
                  <div className={`mx-auto w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
                     <stat.icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <p className="text-[8px] uppercase font-black text-text/20 tracking-widest leading-tight">{stat.label}</p>
                  <p className="text-base font-serif text-text italic">{stat.val}</p>
               </div>
            ))}
         </div>
      </section>

      {/* Rewards Grid */}
      <section className="space-y-12">
         <div className="flex items-center gap-4 text-text/20">
            <Gift className="w-5 h-5" />
            <h3 className="text-[10px] uppercase font-black tracking-[0.4em]">Available Protocols</h3>
         </div>
         
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rewards.map((reward, i) => (
               <div key={i} className="luxury-card p-10 bg-surface/30 border-text/5 space-y-6 group hover:border-gold/20 transition-all">
                  <div className="flex justify-between items-start">
                     <h4 className="text-xl font-serif text-text italic group-hover:text-gold transition-colors">{reward.title}</h4>
                     <span className="text-[9px] font-black uppercase text-gold/40 border border-gold/20 px-3 py-1 rounded-full">{reward.cost}</span>
                  </div>
                  <p className="text-sm text-text/40 italic leading-relaxed">{reward.desc}</p>
                  <button 
                    onClick={() => handleActivate(reward)}
                    disabled={activatingId === reward.id}
                    className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-text/20 border border-text/5 rounded-xl group-hover:border-gold/20 group-hover:text-gold transition-all flex items-center justify-center gap-2"
                  >
                     {activatingId === reward.id ? (
                       <Loader2 className="w-4 h-4 animate-spin text-gold" />
                     ) : (
                       'ACTIVATE PROTOCOL'
                     )}
                  </button>
               </div>
            ))}
         </div>
      </section>
    </motion.div>
  );
}
