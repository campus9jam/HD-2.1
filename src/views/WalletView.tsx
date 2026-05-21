import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  CreditCard,
  Lock,
  RefreshCw,
  Sparkles,
  Zap,
  Gift,
  Search,
  Users,
  Trophy,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToWallet, getTransactions, depositFunds } from '../services/WalletService';
import { Wallet, WalletTransaction, UserTier } from '../types';
import { toast } from 'sonner';
import { getRedemptionCap, stakeLee, claimYield } from '../services/LeeEconomyService';
import { SocialGiftModal } from '../components/SocialGiftModal';
import { analyzeEconomyPerformance } from '../services/EconomyAIAnalytics';

const WalletView: React.FC = () => {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10000');
  const [activeTab, setActiveTab] = useState<'balance' | 'lee'>('balance');
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isClaimingYield, setIsClaimingYield] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [pendingYield, setPendingYield] = useState(0);

  useEffect(() => {
     if (profile?.stakedBalance && profile.stakedBalance > 0 && profile.lastYieldClaim) {
        const lastClaim = profile.lastYieldClaim.toDate();
        const now = new Date();
        const hoursElapsed = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        const hourlyRate = 0.0000127;
        const potential = Math.floor(profile.stakedBalance * hourlyRate * hoursElapsed);
        setPendingYield(potential);
     }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const unsubWallet = subscribeToWallet(user.uid, (w) => {
      setWallet(w);
      setLoading(false);
    });

    const unsubTxs = getTransactions(user.uid, (txs) => {
      setTransactions(txs);
    });

    return () => {
      unsubWallet();
      unsubTxs();
    };
  }, [user]);

  const handleDeposit = async () => {
    if (!user) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setIsDepositing(true);
    try {
      await depositFunds(user.uid, amount);
      toast.success("Golden Buffer Increased", {
        description: `₦${amount.toLocaleString()} has been successfully authorized.`
      });
      setDepositAmount('10000');
    } catch (error) {
      toast.error("Authorization failed");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleStake = async () => {
    if (!user || Number(stakeAmount) <= 0) return;
    if ((wallet?.leeBalance || 0) < Number(stakeAmount)) {
       toast.error("Insufficient tokens for staking");
       return;
    }

    setIsStaking(true);
    try {
       await stakeLee(user.uid, Number(stakeAmount));
       toast.success("Sovereign Deposit Confirmed", {
         description: `${stakeAmount} LEE committed to liquidity vault.`
       });
       setStakeAmount('1000');
    } catch (error) {
       toast.error("Staking failure");
    } finally {
       setIsStaking(false);
    }
  };

  const handleClaimYield = async () => {
     if (!user || pendingYield <= 0) return;
     setIsClaimingYield(true);
     try {
        const claimed = await claimYield(user.uid);
        if (claimed && claimed > 0) {
           toast.success("Yield Harvested", { description: `${claimed} LEE added to your balance.` });
           setPendingYield(0);
        }
     } catch (err) {
        toast.error("Harvesting failed");
     } finally {
        setIsClaimingYield(false);
     }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const userTier: UserTier = profile?.tier || 'Explorer';
  const redemptionCap = getRedemptionCap(userTier) * 100;

  const ecoAnalysis = profile ? analyzeEconomyPerformance(transactions, profile) : null;

  return (
    <div className="min-h-screen bg-navy text-text pb-24">
      {/* Cinematic Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Cinematic Header with Tabs */}
      <section className="relative pt-32 pb-12 px-8 flex flex-col items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-8 w-full max-w-lg"
        >
          {/* Identity Badge */}
          <div className="flex items-center justify-center gap-3 mb-8">
             <div className="px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full flex items-center gap-2">
                <Trophy className="w-3 h-3 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">{userTier} Node</span>
             </div>
             <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">{profile?.reputationScore || 0} REPUTATION</span>
             </div>
          </div>

          <div className="flex bg-surface/20 backdrop-blur-3xl p-1 rounded-3xl border border-text/5 w-full">
             <button 
               onClick={() => setActiveTab('balance')}
               className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'balance' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-text/40 hover:text-text'}`}
             >
                Global Buffer
             </button>
             <button 
               onClick={() => setActiveTab('lee')}
               className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lee' ? 'bg-white text-navy shadow-lg shadow-white/10' : 'text-text/40 hover:text-text'}`}
             >
                LEE Economy
             </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'balance' ? (
              <motion.div 
                key="balance"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-1"
              >
                 <motion.p className="text-6xl md:text-8xl font-serif italic tracking-tighter">
                   ₦{wallet?.balance.toLocaleString() || '0'}
                 </motion.p>
                 <p className="text-[10px] text-text/40 font-mono tracking-widest uppercase">
                   Authorized Sovereign Credit
                 </p>
              </motion.div>
            ) : (
              <motion.div 
                key="lee"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-1"
              >
                 <div className="flex items-center justify-center gap-4">
                    <Sparkles className="w-8 h-8 text-gold animate-pulse" />
                    <motion.p className="text-6xl md:text-8xl font-serif italic tracking-tighter text-white">
                      {(wallet?.leeBalance || 0).toLocaleString()}
                    </motion.p>
                 </div>
                 <p className="text-[10px] text-text/40 font-mono tracking-widest uppercase">
                   LEE Coin Utility Tokens
                 </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <div className="max-w-xl mx-auto px-8 space-y-8 relative z-20">
        {/* Economy Intelligence Panel (Visible on LEE tab) */}
        {activeTab === 'lee' && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="bg-navy/40 backdrop-blur-3xl border border-gold/10 p-8 rounded-[2.5rem] space-y-6"
           >
              <div className="flex items-center gap-3 mb-2">
                 <Sparkles className="w-4 h-4 text-gold" />
                 <h2 className="text-xs font-black uppercase tracking-widest text-gold">Economy Intelligence</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text/40">Redemption Cap</p>
                    <p className="text-2xl font-serif italic text-white">{redemptionCap}% <span className="text-[10px] align-middle">Max Utility</span></p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text/40">Market Value</p>
                    <p className="text-2xl font-serif italic text-white">100 : 1 <span className="text-[10px] align-middle">LEE/Fiat</span></p>
                 </div>
              </div>

              <div className="pt-4 border-t border-text/5 space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black opacity-60">
                    <span className="uppercase tracking-widest">Active Multiplier</span>
                    <span className="text-gold">Leema_AI_Optimized</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-text/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${ecoAnalysis?.healthScore || 68}%` }}
                         className="h-full bg-gradient-to-r from-gold to-white"
                       />
                    </div>
                    <span className="text-[10px] font-black font-mono">1.25x</span>
                 </div>
              </div>
           </motion.div>
        )}

        {/* Staking Section (Visible on LEE tab) */}
        {activeTab === 'lee' && ecoAnalysis && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="p-6 bg-gold/5 rounded-3xl border border-gold/10"
           >
              <p className="text-[10px] text-gold font-serif italic italic leading-relaxed">
                Leema: {ecoAnalysis.insight}
              </p>
           </motion.div>
        )}
        {activeTab === 'lee' && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="luxury-card p-10 bg-gold/5 border-gold/10 space-y-8"
           >
              <div className="flex justify-between items-center">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold text-blue-400">Vault_Staking</h4>
                    <p className="text-2xl font-serif italic text-white mt-1">{(profile?.stakedBalance || 0).toLocaleString()} <span className="text-xs opacity-40">LEE STAKED</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Harvestable Yield</p>
                    <div className="flex items-center gap-3 justify-end">
                       <p className="text-lg font-mono text-green-500">+{pendingYield} LEE</p>
                       <button 
                         onClick={handleClaimYield}
                         disabled={isClaimingYield || pendingYield <= 0}
                         className="p-2 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 hover:bg-green-500 hover:text-navy transition-all disabled:opacity-20"
                       >
                          {isClaimingYield ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                       </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="relative">
                    <input 
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full bg-navy/60 border border-gold/20 rounded-2xl py-4 pl-6 pr-24 text-sm font-mono focus:border-gold outline-none"
                      placeholder="STAKE_AMOUNT"
                    />
                    <button 
                      onClick={handleStake}
                      disabled={isStaking}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-gold text-navy rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-colors"
                    >
                       {isStaking ? <Loader2 className="w-3 h-3 animate-spin" /> : 'DEPLOY'}
                    </button>
                 </div>
                 <p className="text-[8px] uppercase font-black text-text/20 tracking-widest text-center px-4">
                    Staked tokens generate autonomous yield and increase reputation depth by 10% of staked value.
                 </p>
              </div>
           </motion.div>
        )}

        {/* Action Panel: Manage Buffers */}
        <div className="bg-surface/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-text/5 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gold">
                 <Zap className="w-5 h-5" />
                 <h2 className="text-xs font-black uppercase tracking-widest">
                    {activeTab === 'balance' ? 'Authorize Funds' : 'Aquire LEE'}
                 </h2>
              </div>
              <p className="text-[10px] font-mono text-text/20 uppercase tracking-tighter">Protocol v4.2 Secured</p>
           </div>

           <div className="space-y-6">
              <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-serif italic text-gold">
                    {activeTab === 'balance' ? '₦' : '✨'}
                 </span>
                 <input 
                   type="number" 
                   value={depositAmount}
                   onChange={(e) => setDepositAmount(e.target.value)}
                   className="w-full bg-navy/40 border border-text/10 rounded-3xl py-6 pl-14 pr-8 text-3xl font-serif focus:border-gold outline-none transition-all tracking-tighter"
                   placeholder="0"
                 />
              </div>

              {activeTab === 'balance' && (
                <div className="flex flex-wrap gap-2">
                   {[10000, 50000, 250000, 1000000].map((amt) => (
                     <button
                       key={amt}
                       onClick={() => setDepositAmount(amt.toString())}
                       className="px-4 py-2 bg-text/5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-gold hover:text-navy transition-all border border-text/5"
                     >
                       +₦{amt.toLocaleString()}
                     </button>
                   ))}
                </div>
              )}

              <button 
                onClick={handleDeposit}
                disabled={isDepositing || activeTab === 'lee'}
                className="w-full py-6 bg-gold text-navy rounded-2xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 hover:shadow-[0_20px_50px_rgba(var(--gold-rgb),0.4)] transition-all"
              >
                {isDepositing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    {activeTab === 'balance' ? 'CONFIRM AUTHORIZATION' : 'ACQUISITION_DISABLED'}
                  </>
                )}
              </button>
              {activeTab === 'lee' && (
                <p className="text-[9px] text-center text-text/30 font-black uppercase tracking-widest">
                  LEE Coins are earned through ecosystem participation, not direct fiat purchase.
                </p>
              )}
           </div>
        </div>

        {/* Dynamic Social Actions */}
        <div className="grid grid-cols-3 gap-4">
           <button 
             onClick={() => setIsGiftModalOpen(true)}
             className="flex flex-col items-center gap-3 p-6 bg-surface/20 backdrop-blur-xl rounded-3xl border border-text/5 hover:border-gold/30 transition-all group"
           >
              <Gift className="w-5 h-5 text-text/40 group-hover:text-gold transition-colors" />
              <span className="text-[8px] font-black uppercase tracking-widest">Gift LEE</span>
           </button>
           <button className="flex flex-col items-center gap-3 p-6 bg-surface/20 backdrop-blur-xl rounded-3xl border border-text/5 hover:border-gold/30 transition-all group">
              <Users className="w-5 h-5 text-text/40 group-hover:text-gold transition-colors" />
              <span className="text-[8px] font-black uppercase tracking-widest">Tip Hub</span>
           </button>
           <button className="flex flex-col items-center gap-3 p-6 bg-surface/20 backdrop-blur-xl rounded-3xl border border-text/5 hover:border-gold/30 transition-all group">
              <Search className="w-5 h-5 text-text/40 group-hover:text-gold transition-colors" />
              <span className="text-[8px] font-black uppercase tracking-widest">Directory</span>
           </button>
        </div>

        {/* Transaction History */}
        <div className="space-y-6 pt-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <History className="w-5 h-5 text-gold" />
                 <h2 className="text-xs font-black uppercase tracking-widest">Provenance Ledger</h2>
              </div>
           </div>

           <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="p-20 text-center space-y-4 bg-surface/10 rounded-[2.5rem] border border-dashed border-text/10">
                   <RefreshCw className="w-8 h-8 text-text/10 mx-auto" />
                   <p className="text-[10px] uppercase font-black tracking-widest text-text/20">No entries in the ledger</p>
                </div>
              ) : transactions.filter(tx => activeTab === 'balance' ? tx.amount > 0 : tx.leeAmount !== 0).map((tx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between p-6 bg-surface/20 rounded-3xl border border-text/5"
                >
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        tx.type === 'lee_reward' ? 'bg-gold/10 text-gold' : 
                        tx.type === 'lee_burn' ? 'bg-red-500/10 text-red-500' :
                        tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-text/5 text-text'
                      }`}>
                         {tx.leeAmount ? <Sparkles className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase tracking-widest">{tx.type.replace('_', ' ')}</p>
                         <p className="text-[9px] text-text/40 font-mono italic">{tx.metadata?.reason || 'Protocol Transaction'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-lg font-serif italic ${
                        (tx.amount > 0 || (tx.leeAmount || 0) > 0) ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {activeTab === 'balance' ? (
                          <>₦{tx.amount.toLocaleString()}</>
                        ) : (
                          <>{(tx.leeAmount || 0) > 0 ? '+' : ''}{(tx.leeAmount || 0).toLocaleString()} LEE</>
                        )}
                      </p>
                      <p className="text-[9px] text-text/20 font-mono">{tx.timestamp?.toDate().toLocaleDateString()}</p>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
      {/* Floating Trust Badge */}
      <div className="fixed bottom-32 right-8 z-50">
         <div className="bg-navy/80 backdrop-blur-xl border border-gold/20 p-4 rounded-full flex items-center gap-3 shadow-2xl">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-navy">
               <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold pr-2">Vault_Secured</span>
         </div>
      </div>
      
      <SocialGiftModal 
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        senderLeeBalance={wallet?.leeBalance || 0}
      />
    </div>
  );
};

export default WalletView;
