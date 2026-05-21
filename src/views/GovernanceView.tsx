import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Vote, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  TrendingUp, 
  Scale,
  Plus,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { fetchActiveProposals, castVote, Proposal } from '../services/GovernanceService';

export default function GovernanceView() {
  const { profile, user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
  const [isCasting, setIsCasting] = useState<string | null>(null);

  const loadProposals = async () => {
    setIsLoading(true);
    const data = await fetchActiveProposals();
    setProposals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const handleVote = async (id: string) => {
    if (!user) {
      toast.error("Identity verification required to participate in consensus.");
      return;
    }
    if (hasVoted[id]) return;
    
    setIsCasting(id);
    const success = await castVote(id, user.uid);
    
    if (success) {
      setProposals(prev => prev.map(p => 
        p.id === id ? { ...p, votes: p.votes + 1 } : p
      ));
      setHasVoted(prev => ({ ...prev, [id]: true }));
      toast.success("Citizen vote recorded in the sovereign ledger");
    } else {
      toast.error("Consensus reach failed. Identity may have already voted.");
    }
    setIsCasting(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pb-32 pt-12 px-6 max-w-5xl mx-auto space-y-16"
    >
      <header className="space-y-6">
         <div className="flex items-center gap-4 text-gold">
            <Scale className="w-5 h-5" />
            <span className="text-[10px] uppercase font-black tracking-[0.4em]">Governance_Node_Kernel</span>
         </div>
         <h1 className="text-4xl md:text-7xl font-serif text-text italic leading-tight">
            Sovereign <br/> <span className="text-gold">Consensus.</span>
         </h1>
         <p className="text-lg text-text/40 font-serif italic max-w-xl">
            The decentralized legislative archive of the House of Daraja. Your status tier determines your voting weight in the resonance network.
         </p>
      </header>

      {/* Citizen Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="luxury-card p-10 bg-gold/5 border-gold/20 flex flex-col items-center text-center gap-4">
            <Users className="w-6 h-6 text-gold" />
            <div>
               <p className="text-3xl font-serif text-text italic">{profile?.reputationScore || 0}</p>
               <p className="text-[9px] uppercase font-black text-text/20 tracking-widest mt-1">Reputation Weight</p>
            </div>
         </div>
         <div className="luxury-card p-10 bg-surface/50 border-text/5 flex flex-col items-center text-center gap-4">
            <TrendingUp className="w-6 h-6 text-text/20" />
            <div>
               <p className="text-3xl font-serif text-text italic">+{Math.floor((profile?.xp || 0) / 1000)}%</p>
               <p className="text-[9px] uppercase font-black text-text/20 tracking-widest mt-1">XP Resonance</p>
            </div>
         </div>
         <div className="luxury-card p-10 bg-surface/50 border-text/5 flex flex-col items-center text-center gap-4">
            <Sparkles className="w-6 h-6 text-text/20" />
            <div>
               <p className="text-3xl font-serif text-text italic">{profile?.tier || 'Explorer'}</p>
               <p className="text-[9px] uppercase font-black text-text/20 tracking-widest mt-1">Consensus Access</p>
            </div>
         </div>
      </section>

      {/* Active Proposals */}
      <section className="space-y-10">
         <div className="flex justify-between items-end border-b border-text/5 pb-6">
            <h3 className="text-xl font-serif text-text italic">Open Proposals</h3>
            <button className="flex items-center gap-3 text-[9px] font-black uppercase text-gold tracking-widest hover:text-text transition-colors">
               <Plus className="w-4 h-4" /> Propose Change
            </button>
         </div>

          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
               {isLoading ? (
                  <div className="py-20 text-center">
                     <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                     <p className="text-[10px] uppercase font-black text-text/20 tracking-widest mt-6">Synchronizing Governance Nodes</p>
                  </div>
               ) : proposals.length === 0 ? (
                  <div className="py-32 text-center luxury-card bg-surface/10 border-dashed border-text/5 space-y-6">
                     <Scale className="w-12 h-12 text-text/10 mx-auto" />
                     <div className="space-y-2">
                        <p className="text-xl font-serif text-text/40 italic">The legislative archive is currently pristine.</p>
                        <p className="text-[9px] uppercase font-black text-text/10 tracking-widest">Awaiting Sovereign Proposals from the Citizenry.</p>
                     </div>
                  </div>
               ) : proposals.map((proposal) => (
                  <motion.div 
                    key={proposal.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="luxury-card p-12 bg-surface/30 border-text/5 group hover:border-gold/20 transition-all !rounded-[3rem] space-y-10"
                  >
                     <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="space-y-4">
                           <div className="flex items-center gap-4">
                              <span className="px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-[8px] font-black uppercase text-gold tracking-widest">
                                 {proposal.category}
                              </span>
                              <span className="text-[8px] font-black text-text/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Clock className="w-3 h-3" /> Expires {new Date(proposal.expiresAt).toLocaleDateString()}
                              </span>
                           </div>
                           <h2 className="text-3xl font-serif text-text italic group-hover:text-gold transition-colors">{proposal.title}</h2>
                           <p className="text-text/40 italic font-serif leading-relaxed max-w-2xl">{proposal.description}</p>
                        </div>

                        <div className="luxury-card p-8 bg-navy border-text/5 text-center min-w-[200px] space-y-4">
                           <p className="text-4xl font-serif text-text italic">{proposal.votes.toLocaleString()}</p>
                           <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Consensus Reached</p>
                           <div className="h-1.5 w-full bg-text/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((proposal.votes / 2000) * 100, 100)}%` }}
                                className="h-full bg-gold"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-text/5 gap-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-text/5 border border-text/10 flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-text/20" />
                           </div>
                           <span className="text-[9px] uppercase font-black text-text/20 tracking-widest">Debates Active in Private Nodes</span>
                        </div>
                        
                        <button 
                          onClick={() => handleVote(proposal.id)}
                          disabled={hasVoted[proposal.id] || isCasting === proposal.id}
                          className={`luxury-button !py-5 !px-12 flex items-center gap-4 group transition-all ${hasVoted[proposal.id] ? '!bg-green-500/10 !text-green-500 !border-green-500/20' : ''}`}
                        >
                           {isCasting === proposal.id ? (
                             <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                           ) : hasVoted[proposal.id] ? (
                             <>
                               <ShieldCheck className="w-5 h-5" />
                               VOTE RECORDED
                             </>
                           ) : (
                             <>
                               <Vote className="w-5 h-5 text-navy group-hover:scale-110 transition-transform" />
                               CAST SOVEREIGN VOTE
                             </>
                           )}
                        </button>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>
      </section>

      <section className="bg-gold/[0.03] p-12 rounded-[3.5rem] border border-gold/10 text-center space-y-8">
         <p className="text-[10px] uppercase font-black text-gold tracking-[0.6em]">Consensus_Protocol_Status</p>
         <h3 className="text-2xl font-serif text-text italic">Neural Decentralization Level: 84%</h3>
         <p className="text-sm text-text/30 italic max-w-md mx-auto">
            The Daraja Network is transitioning to full on-chain governance. High-status citizens are encouraged to delegate their resonance to certified artisans.
         </p>
      </section>
    </motion.div>
  );
}
