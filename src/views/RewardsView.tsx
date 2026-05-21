import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, 
  ChevronLeft, 
  Sparkles, 
  Trophy, 
  Star, 
  Shield, 
  Loader2, 
  Zap, 
  Target, 
  Heart,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { burnLee, simulateAIProfitabilityMultiplier, upgradeTier } from '../services/LeeEconomyService';
import { toast } from 'sonner';
import { UserTier } from '../types';

export default function RewardsView() {
  const { profile, user } = useAuth();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'campaigns'>('rewards');
  
  const userTier: UserTier = profile?.tier || 'Explorer';
  const aiMultiplier = simulateAIProfitabilityMultiplier(userTier);

  const tierHierarchy: UserTier[] = ['Explorer', 'Insider', 'Collector', 'Elite', 'Icon'];
  const currentTierIndex = tierHierarchy.indexOf(userTier);
  const nextTier = currentTierIndex < tierHierarchy.length - 1 ? tierHierarchy[currentTierIndex + 1] : null;
  const upgradeCostLookup: Record<string, number> = {
    'Insider': 1000,
    'Collector': 2500,
    'Elite': 10000,
    'Icon': 25000
  };
  const upgradeCost = upgradeCostLookup[nextTier || ''] || 0;

  const handleUpgrade = async () => {
    if (!user || !nextTier) return;
    if ((profile?.leeBalance || 0) < upgradeCost) {
      toast.error("Insufficient tokens for ascension");
      return;
    }

    try {
      await upgradeTier(user.uid, nextTier, upgradeCost);
      toast.success("Identity Reconstructed", {
        description: `You have ascended to ${nextTier} status.`
      });
    } catch (error) {
       toast.error("Ascension failure");
    }
  };

  const rewards = [
    { id: 'discount_15', title: 'Archival Discount', desc: 'Secure 15% reduction on your next Heritage acquisition.', cost: 500, utility: 'Purchase Subsidies' },
    { id: 'drop_priority', title: 'Drop Priority', desc: 'Early access window for limited Sovereign archival drops.', cost: 1000, utility: 'Market Access' },
    { id: 'global_sync', title: 'Logistics Shield', desc: 'Complimentary international logistics for your next 3 artifacts.', cost: 2500, utility: 'Delivery Subsidy' },
    { id: 'artisan_grant', title: 'Artisan Vote', desc: 'Cast 10x votes for the House of Daraja artisan funding round.', cost: 250, utility: 'Governance' }
  ];

  const campaigns = [
    { title: 'The Maker Influence', desc: 'Engaging with 5 artist profiles to boost Maker Reputation.', reward: '50 LEE', progress: 60 },
    { title: 'Market Catalyst', desc: 'Add 3 artisanal artifacts to your Curated Collection.', reward: '120 LEE', progress: 33 },
    { title: 'Social Diffusion', desc: 'Send a Social Gift to a fellow Peer node.', reward: '25 LEE', progress: 0 }
  ];

  const handleActivate = async (reward: any) => {
    if (!user || !profile) return;
    if ((profile.leeBalance || 0) < reward.cost) {
       toast.error("Insufficient tokens for this protocol");
       return;
    }

    setActivatingId(reward.id);
    try {
      await burnLee(user.uid, reward.cost, 'lee_burn', `Reward: ${reward.title}`);
      toast.success(`${reward.title} protocol activated`, {
        description: "Your sovereign vault has been updated."
      });
    } catch (error) {
      toast.error("Protocol activation terminal failure");
    } finally {
      setActivatingId(null);
    }
  };

  const tierConfig: Record<UserTier, any> = {
    'Explorer': { icon: Target, color: 'text-text/40', bg: 'bg-text/5', shadow: 'shadow-text/5', label: 'E_LEVEL_1' },
    'Insider': { icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-400/10', shadow: 'shadow-indigo-400/20', label: 'I_LEVEL_2' },
    'Collector': { icon: Star, color: 'text-green-400', bg: 'bg-green-400/10', shadow: 'shadow-green-400/20', label: 'C_LEVEL_3' },
    'Elite': { icon: Shield, color: 'text-gold', bg: 'bg-gold/10', shadow: 'shadow-gold/20', label: 'E_LEVEL_4' },
    'Icon': { icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10', shadow: 'shadow-purple-400/20', label: 'I_LEVEL_MAX' }
  };

  const config = tierConfig[userTier];

  return (
    <div className="min-h-screen bg-navy pb-32">
       {/* Cinematic Dynamic Background */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-gold/5 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
       </div>

       <div className="max-w-4xl mx-auto px-8 space-y-16 pt-32 relative z-10">
          <header className="flex justify-between items-end border-b border-text/5 pb-10">
             <div className="space-y-4">
                <span className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Sovereign_Protocol.v4</span>
                <h1 className="text-4xl md:text-6xl font-serif text-text italic">LEE <span className="text-gold">Economy.</span></h1>
             </div>
             <Link to="/wallet" className="luxury-button !py-4 !px-8 text-[9px] font-black tracking-widest flex items-center gap-3">
                VAULT_CONTROL <ChevronRight className="w-4 h-4" />
             </Link>
          </header>

          {/* Tier Architecture Card */}
          <section className={`p-1 bg-gradient-to-br from-gold/20 via-text/5 to-transparent rounded-[3rem] shadow-2xl`}>
             <div className="bg-navy/80 h-full backdrop-blur-3xl rounded-[2.9rem] p-12 space-y-12">
                <div className="flex justify-between items-start">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <config.icon className={`w-4 h-4 ${config.color}`} />
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{config.label}</p>
                      </div>
                      <h2 className={`text-6xl md:text-7xl font-serif italic ${config.color}`}>{userTier}</h2>
                   </div>
                   <div className="text-right space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">AI Multiplier</p>
                       <p className="text-3xl font-serif italic text-white">{aiMultiplier}x <span className="text-xs align-middle">Bonus</span></p>
                       
                       {nextTier && (
                          <button 
                            onClick={handleUpgrade}
                            className={`mt-4 px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border border-gold/40 hover:bg-gold hover:text-navy transition-all flex items-center gap-2 ml-auto shadow-[0_0_20px_rgba(var(--gold-rgb),0.2)]`}
                          >
                             Ascend to {nextTier} <span className="opacity-40">{upgradeCost} LEE</span>
                          </button>
                       )}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-text/5">
                   <div className="space-y-6">
                      <div className="flex justify-between items-end text-[10px] uppercase font-black tracking-widest opacity-40">
                         <span>Utility Balance</span>
                         <span className="text-gold">{(profile?.leeBalance || 0).toLocaleString()} LEE</span>
                      </div>
                      <div className="h-4 bg-text/5 rounded-full overflow-hidden border border-text/5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min(((profile?.leeBalance || 0) / 10000) * 100, 100)}%` }}
                           className={`h-full bg-gold shadow-[0_0_20px_rgba(var(--gold-rgb),0.4)]`}
                         />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="flex justify-between items-end text-[10px] uppercase font-black tracking-widest opacity-40">
                         <span>Reputation Score</span>
                         <span className="text-blue-400">{profile?.reputationScore || 0} REPU</span>
                      </div>
                      <div className="h-4 bg-text/5 rounded-full overflow-hidden border border-text/5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min(((profile?.reputationScore || 0) / 1000) * 100, 100)}%` }}
                           className={`h-full bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]`}
                         />
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Navigation Tabs */}
          <div className="flex bg-surface/20 backdrop-blur-3xl p-1 rounded-full border border-text/5 w-fit">
             <button 
               onClick={() => setActiveTab('rewards')}
               className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rewards' ? 'bg-gold text-navy' : 'text-text/40 hover:text-text'}`}
             >
                Protocol Utility
             </button>
             <button 
               onClick={() => setActiveTab('campaigns')}
               className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'campaigns' ? 'bg-gold text-navy' : 'text-text/40 hover:text-text'}`}
             >
                Active Campaigns
             </button>
          </div>

          <AnimatePresence mode="wait">
             {activeTab === 'rewards' ? (
                <motion.div 
                   key="rewards"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                   {rewards.map((reward) => (
                      <div key={reward.id} className="bg-surface/30 backdrop-blur-xl p-10 rounded-[2.5rem] border border-text/5 space-y-10 group hover:border-gold/20 hover:bg-surface/40 transition-all">
                         <div className="flex justify-between items-start">
                            <div className="space-y-2">
                               <p className="text-[9px] font-black uppercase tracking-widest text-gold opacity-60">{reward.utility}</p>
                               <h3 className="text-2xl font-serif italic text-white group-hover:text-gold transition-colors">{reward.title}</h3>
                            </div>
                            <div className="px-4 py-2 bg-navy/60 rounded-xl border border-text/5 text-sm font-mono text-gold">
                               {reward.cost} <span className="text-[9px] align-middle">LEE</span>
                            </div>
                         </div>
                         <p className="text-sm text-text/40 italic font-serif leading-relaxed line-clamp-2">{reward.desc}</p>
                         <button 
                            onClick={() => handleActivate(reward)}
                            disabled={activatingId === reward.id}
                            className="w-full py-5 bg-text/5 border border-text/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-gold hover:text-gold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                         >
                            {activatingId === reward.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                               <>
                                  <Sparkles className="w-4 h-4" />
                                  AUTHORIZE_PROTOCOL
                               </>
                            )}
                         </button>
                      </div>
                   ))}
                </motion.div>
             ) : (
                <motion.div 
                   key="campaigns"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-8"
                >
                   {campaigns.map((camp, i) => (
                      <div key={i} className="bg-surface/20 p-10 rounded-3xl border border-text/5 space-y-10 group hover:bg-surface/30 transition-all">
                         <div className="flex justify-between items-center">
                            <div className="space-y-3">
                               <h3 className="text-2xl font-serif italic text-white">{camp.title}</h3>
                               <p className="text-[10px] uppercase font-black tracking-widest text-text/30">{camp.desc}</p>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-gold/10 rounded-full border border-gold/20">
                               <Sparkles className="w-4 h-4 text-gold" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-gold leading-none">{camp.reward}</span>
                            </div>
                         </div>
                         
                         <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-20">
                               <span>Progression Status</span>
                               <span>{camp.progress}%</span>
                            </div>
                            <div className="h-2 bg-text/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${camp.progress}%` }}
                                 className="h-full bg-gradient-to-r from-gold to-white"
                               />
                            </div>
                         </div>
                      </div>
                   ))}
                </motion.div>
             )}
          </AnimatePresence>
       </div>
    </div>
  );
}
