import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Gavel, 
  Users, 
  Timer, 
  Info, 
  History, 
  ChevronLeft, 
  Award, 
  TrendingUp,
  Video,
  ExternalLink,
  ChevronRight,
  Loader2,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { unlockAchievement } from '../lib/achievementUtils';
import { AuctionDrop, Bid } from '../types';
import { 
  fetchActiveAuctions, 
  subscribeToAuction, 
  placeBid as placeBidService, 
  buyNow,
  setupAutoBid as setupAutoBidService,
  finalizeAuction
} from '../services/AuctionService';
import { rewardLee } from '../services/LeeEconomyService';
import { LinguisticAnalysisModal } from '../components/LinguisticAnalysisModal';

export default function DropView() {
  const { profile, user } = useAuth();
  const [auctions, setAuctions] = useState<AuctionDrop[]>([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auction, setAuction] = useState<AuctionDrop | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isBidding, setIsBidding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [showAutoBid, setShowAutoBid] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState<number>(0);
  const [isSettingAutoBid, setIsSettingAutoBid] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, ended: false });
  const [showHistory, setShowHistory] = useState(false);
  const [viewerCount, setViewerCount] = useState(284);
  const lastHighBidderRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Load initial auctions
  useEffect(() => {
    const loadAuctions = async () => {
      setIsLoading(true);
      try {
        const data = await fetchActiveAuctions();
        setAuctions(data);
        if (data.length > 0) {
          setSelectedAuctionId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load auctions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuctions();
  }, []);

  // Subscribe to selected auction
  useEffect(() => {
    if (!selectedAuctionId) {
      setAuction(null);
      return;
    }

    const unsub = subscribeToAuction(selectedAuctionId, (updatedAuction) => {
      // Sort bids by timestamp desc
      const sortedBids = [...(updatedAuction.bids || [])].sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 
                     (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0);
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 
                     (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0);
        return timeB - timeA;
      });

      const processedAuction = {
        ...updatedAuction,
        bids: sortedBids
      };

      setAuction(processedAuction);
      // Auto-update bid amount to next increment
      const increment = updatedAuction.minIncrement || 10000;
      setBidAmount(prev => (prev <= updatedAuction.currentBid ? updatedAuction.currentBid + increment : prev));
      
      // Notify about new bid
      if (sortedBids.length > 0) {
        const topBid = sortedBids[0];
        
        // Outbid Detection
        if (lastHighBidderRef.current && 
            lastHighBidderRef.current === user?.uid && 
            topBid.userId !== user?.uid) {
          toast.error("POSITION LOST", { 
            description: `${topBid.username} has outbid you at ₦${topBid.amount.toLocaleString()}`,
            duration: 6000
          });
        } else if (topBid.userId !== user?.uid) {
          toast.info("New Highest Bid", { 
            description: `${topBid.username} placed a bid of ₦${topBid.amount.toLocaleString()}` 
          });
        }
        
        lastHighBidderRef.current = topBid.userId;
      }
    });

    return () => unsub();
  }, [selectedAuctionId, user?.uid]);

  // Countdown timer
  useEffect(() => {
    if (!auction) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0, ended: true });
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
        ended: false
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [auction?.endTime, auction]);

  const handlePlaceBid = async () => {
    if (!user || !profile) {
      toast.error('Identity Required', { description: 'Please synchronize your profile to participate.' });
      return;
    }

    if (!auction) return;

    setIsBidding(true);
    try {
      await placeBidService(
        auction.id,
        user.uid,
        profile.displayName || 'Anonymous Collector',
        user.photoURL || '',
        bidAmount
      );

      // reward bidding
      await rewardLee(user.uid, 50, 'lee_reward', { reason: 'Active Bidding', auctionId: auction.id });

      toast.success('Bid Archived', { description: `You are now leading at ₦${bidAmount.toLocaleString()}. +50 LEE rewarded.` });
      unlockAchievement(user.uid, 'HIGH_BIDDER', profile).catch(console.error);
    } catch (error: any) {
       toast.error("Gavel Interrupted", { description: error.message });
    } finally {
      setIsBidding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user || !auction?.buyNowPrice) return;
    setIsBuying(true);
    try {
      await buyNow(auction.id, user.uid);
      toast.success("Artifact Secured", { 
        description: `Instant acquisition completed at ₦${auction.buyNowPrice.toLocaleString()}.` 
      });
    } catch (error: any) {
      toast.error("Protocol failed", { description: error.message });
    } finally {
      setIsBuying(false);
    }
  };

  const handleSetAutoBid = async () => {
    if (!user || !auction || autoBidMax <= auction.currentBid) {
      toast.error("Invalid Auto-Bid", { description: "Maximum must be higher than current bid." });
      return;
    }
    setIsSettingAutoBid(true);
    try {
      await setupAutoBidService(auction.id, user.uid, autoBidMax, auction.minIncrement || 10000);
      toast.success("Collector Node Active", { description: `Auto-bid set to ₦${autoBidMax.toLocaleString()}.` });
      setShowAutoBid(false);
    } catch (error: any) {
      toast.error("Protocol failure", { description: error.message });
    } finally {
      setIsSettingAutoBid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Sparkles className="w-12 h-12 text-gold animate-pulse" />
          <p className="text-micro animate-pulse">Synchronizing Auction Ledger...</p>
        </div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-12 text-center space-y-8">
        <div className="w-32 h-32 rounded-full bg-gold/5 flex items-center justify-center border border-gold/10">
          <Gavel className="w-12 h-12 text-gold opacity-20" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif text-text italic">Auction House Resting</h1>
          <p className="text-body text-text/40 max-w-md mx-auto">
            The gavel is currently silent. Our curators are preparing the next cycle of Sahelian acquisitions.
          </p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="luxury-button"
        >
          Return to Archive
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen relative flex flex-col overflow-hidden bg-navy"
    >
      {/* Background with Ambient Glow */}
      {auction && (
        <div className="fixed inset-0 z-0">
          <img 
            src={auction.img} 
            alt={auction.title} 
            className="w-full h-full object-cover grayscale-50 opacity-10 mix-blend-luminosity scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/90 to-[#0A0F1E]"></div>
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-gold/5 to-transparent"></div>
        </div>
      )}

      {/* Header Navigation */}
      <nav className="relative z-20 flex justify-between items-center p-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 bg-navy/40 backdrop-blur-xl border border-white/5 py-2 px-4 rounded-full">
            <div className={`w-2 h-2 rounded-full ${auction?.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gold'}`}></div>
            <span className="text-[10px] font-black tracking-[0.2em] text-text/80 uppercase">
              {auction?.status === 'active' ? 'Live Auction' : 'Upcoming Drop'}
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/5 py-2 px-4 rounded-full">
            <Users className="w-3 h-3 text-gold/60" />
            <span className="text-[9px] font-black tracking-widest text-text/40 lowercase">
              {viewerCount} node observers
            </span>
          </div>
          
          {auctions.length > 1 && (
            <div className="hidden lg:flex gap-4">
              {auctions.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAuctionId(a.id)}
                  className={`px-4 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all ${
                    selectedAuctionId === a.id 
                      ? 'bg-gold/10 border-gold/40 text-gold' 
                      : 'bg-white/5 border-white/5 text-text/40 hover:text-text'
                  }`}
                >
                  {a.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-gold group"
        >
          <History className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
          <span className="hidden md:block text-[10px] font-black uppercase tracking-widest leading-none">Activity Log</span>
        </button>
      </nav>

      {auction ? (
        <div className="relative z-10 flex flex-col lg:flex-row flex-grow px-8 pb-32 gap-12 overflow-y-auto no-scrollbar pt-4">
          
          {/* Left Aspect: Artifact Preview */}
          <div className="lg:w-1/2 space-y-8">
            <motion.div 
              layoutId="drop-image"
              className="aspect-[3/4] md:aspect-video lg:aspect-square rounded-[2rem] overflow-hidden luxury-card border-white/10 group relative"
            >
              <img 
                src={auction.img} 
                alt={auction.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent flex flex-col justify-end p-12">
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-4"
                 >
                   {auction.bids.length > 0 && auction.bids[0].userId === user?.uid && (
                     <div className="flex items-center gap-2 px-3 py-1 bg-gold text-navy rounded-full w-fit mb-4">
                       <Zap className="w-3 h-3" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Dominance Authorized</span>
                     </div>
                   )}
                   <p className="text-[10px] font-black text-gold tracking-[0.5em] uppercase">Artifact Node ID: {auction.id}</p>
                   <h1 className="text-5xl md:text-7xl font-serif text-text italic tracking-tighter leading-[0.9] drop-shadow-2xl">
                     {auction.title}
                   </h1>
                 </motion.div>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-4">
               {[
                 { 
                   icon: Timer, 
                   label: timeLeft.ended ? 'Status' : 'Ends In', 
                   value: timeLeft.ended ? 'Auction Ended' : `${timeLeft.h}h ${timeLeft.m}m ${timeLeft.s}s` 
                 },
                 { icon: Gavel, label: 'Bids Placed', value: auction.bidCount },
                 { icon: Users, label: 'Ledger Nodes', value: new Set(auction.bids.map(b => b.userId)).size }
               ].map((stat, i) => (
                 <div key={i} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-md flex flex-col items-center text-center space-y-2">
                   <stat.icon className={`w-4 h-4 ${timeLeft.ended && i === 0 ? 'text-red-400' : 'text-gold/60'}`} />
                   <p className="text-[8px] font-black uppercase text-text/40 tracking-[0.2em]">{stat.label}</p>
                   <p className="text-sm font-serif italic text-text">{stat.value}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Right Aspect: Bidding & Info */}
          <div className="lg:w-1/2 flex flex-col space-y-12">
             <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-4">
                    <p className="text-6xl md:text-8xl font-serif text-gold tracking-tighter leading-none italic">
                      ₦{auction.currentBid.toLocaleString()}
                    </p>
                    <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em]">Top Allocation</span>
                  </div>
                  {auction.bids.length > 0 && (
                    <div className="flex items-center gap-2 text-gold/60">
                      <Award className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">
                        Leader: {auction.bids[0].username}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-text/60 leading-relaxed max-w-xl text-lg font-light italic">
                   {auction.description}
                </p>
             </div>

             {/* Bidding Control Panel */}
             {auction.status === 'active' && !timeLeft.ended ? (
               <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                     {[10000, 25000, 50000, 100000].map((incrementAmount) => (
                       <button
                         key={incrementAmount}
                         onClick={() => setBidAmount(auction.currentBid + incrementAmount)}
                         className={`px-6 py-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                           bidAmount === auction.currentBid + incrementAmount 
                             ? 'bg-gold text-navy border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                             : 'bg-white/5 border-white/10 text-text/60 hover:border-gold/40'
                         }`}
                       >
                         +₦{incrementAmount.toLocaleString()}
                       </button>
                     ))}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="luxury-card flex-1 p-2 bg-white/[0.03] border-white/10 flex items-center gap-4 rounded-full group hover:border-gold/30 transition-all">
                       <div className="flex items-center gap-2 pl-6 text-gold">
                         <TrendingUp className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase">₦</span>
                       </div>
                       <input 
                         type="number"
                         value={bidAmount}
                         onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                         className="bg-transparent flex-grow px-4 text-2xl font-serif text-text focus:outline-none"
                         placeholder="Enter Bid"
                       />
                       <button 
                         onClick={handlePlaceBid}
                         disabled={isBidding || bidAmount <= auction.currentBid}
                         className="luxury-button !rounded-full !py-6 !px-12 text-[10px] font-black tracking-widest group relative overflow-hidden disabled:opacity-50 disabled:grayscale"
                       >
                          {isBidding ? (
                            <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'TRANSMIT BID'
                          )}
                       </button>
                    </div>

                    {auction.buyNowPrice && (
                      <button
                        onClick={handleBuyNow}
                        disabled={isBuying}
                        className="px-10 py-6 bg-white/5 border border-gold/20 rounded-full text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold hover:text-navy transition-all flex items-center justify-center gap-3"
                      >
                         {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                         Buy Now: ₦{auction.buyNowPrice.toLocaleString()}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                     <button 
                       onClick={() => setShowAutoBid(!showAutoBid)}
                       className="text-[9px] font-black uppercase tracking-[0.3em] text-gold/60 hover:text-gold transition-colors flex items-center gap-2 ml-4"
                     >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {showAutoBid ? 'CANCEL AUTO-PROTOCOL' : 'CONVERT TO COLLECTOR NODE (AUTO-BID)'}
                     </button>

                     <AnimatePresence>
                        {showAutoBid && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gold/5 border border-gold/10 rounded-3xl p-8 space-y-6 overflow-hidden"
                          >
                             <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/80">Maximum Authorization (₦)</label>
                                <span className="text-[9px] font-mono text-gold/40">Atomic increments: ₦{auction.minIncrement?.toLocaleString() || '10,000'}</span>
                             </div>
                             <div className="flex gap-4">
                                <input 
                                  type="number"
                                  value={autoBidMax}
                                  onChange={(e) => setAutoBidMax(parseInt(e.target.value) || 0)}
                                  className="flex-1 bg-navy/40 border border-gold/20 rounded-2xl px-6 py-4 text-xl font-serif focus:border-gold outline-none transition-all"
                                  placeholder="Enter Max Bid"
                                />
                                <button 
                                  onClick={handleSetAutoBid}
                                  disabled={isSettingAutoBid || autoBidMax <= auction.currentBid}
                                  className="px-10 bg-gold text-navy rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                >
                                   {isSettingAutoBid ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'INITIALIZE'}
                                </button>
                             </div>
                             <p className="text-[9px] italic text-gold/40 leading-relaxed">
                               The Collector Node will only bid the minimum necessary to keep you in the lead, up to your maximum authorization.
                             </p>
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
                  
                  {bidAmount > auction.currentBid && (
                    <p className="text-[8px] uppercase font-black text-gold/40 tracking-[0.2em] ml-8">
                       Confirming ₦{bidAmount.toLocaleString()} acquisition protocol
                    </p>
                  )}

                  <div className="flex flex-col md:flex-row gap-6">
                    {auction.type === 'live' && (
                      <Link 
                        to={`/live-auction/${auction.id}`}
                        className="flex-1 p-8 bg-indigo-600 rounded-[2rem] flex items-center justify-between group overflow-hidden relative shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all"
                      >
                         <div className="relative z-10">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">Interactive Command</p>
                            <h3 className="text-xl font-serif italic text-white">Enter Cinematic Room</h3>
                         </div>
                         <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all relative z-10">
                            <Video className="w-6 h-6 text-white" />
                         </div>
                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-32 h-32 text-white" />
                         </div>
                      </Link>
                    )}
                    
                    <button 
                       onClick={() => setShowAnalysis(true)}
                       className="flex-1 p-8 bg-surface/40 rounded-[2rem] border border-text/5 flex items-center justify-between group hover:border-gold/20"
                    >
                       <div className="flex items-center gap-6">
                          <div className="p-4 bg-gold/10 rounded-2xl group-hover:scale-110 transition-all border border-gold/20">
                             <BrainCircuit className="w-6 h-6 text-gold" />
                          </div>
                          <div className="text-left">
                             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text/20 mb-1">Cultural Intelligence</p>
                             <h3 className="text-xl font-serif italic">Archive Heritage Intel</h3>
                          </div>
                       </div>
                       <div className="p-4 bg-text/5 rounded-2xl text-text/20 group-hover:text-gold transition-all">
                          <ChevronRight className="w-6 h-6" />
                       </div>
                    </button>
                    
                    <div 
                      onClick={() => setShowHistory(true)}
                      className="flex-1 p-8 bg-surface/40 rounded-[2rem] border border-text/5 flex items-center justify-between group hover:border-gold/20 cursor-pointer"
                    >
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text/20 mb-1">Provenance Data</p>
                          <h3 className="text-xl font-serif italic">View Archive Ledger</h3>
                       </div>
                       <div className="p-4 bg-text/5 rounded-2xl text-text/20 group-hover:text-gold transition-all">
                          <ChevronRight className="w-6 h-6" />
                       </div>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="p-12 luxury-card bg-red-500/5 border-red-500/20 text-center space-y-6">
                 <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <Timer className="w-8 h-8 text-red-400" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-serif text-text italic">Allocation Closed</h3>
                   <p className="text-micro text-red-400/60 font-black tracking-widest uppercase">
                     Consensus Period has Expired
                   </p>
                 </div>
                 {auction.winnerId && (
                    <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                       <span className="text-[10px] font-black uppercase text-gold tracking-widest">Sovereign Owner Determined</span>
                       <div className="flex items-center gap-4 px-8 py-4 rounded-full bg-gold/10 border border-gold/20">
                          <Award className="w-5 h-5 text-gold" />
                          <span className="text-lg font-serif italic text-text">{auction.bids[0]?.username || 'N/A'}</span>
                       </div>
                    </div>
                 )}
               </div>
             )}

             {/* Live Feed Toggle / Recent Bids */}
             <div className="space-y-6 flex-grow">
                <h3 className="text-[10px] font-black text-gold tracking-[0.4em] uppercase flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                   Transmission Stream
                </h3>
                <div className="space-y-4">
                   {auction.bids.slice(0, 3).map((bid, i) => (
                      <motion.div 
                        key={bid.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${
                          i === 0 
                            ? 'bg-gold/5 border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.05)]' 
                            : 'bg-white/[0.02] border-white/5 opacity-60'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <div className="relative">
                               <img 
                                 src={bid.userPhoto} 
                                 className={`w-10 h-10 rounded-full ${i === 0 ? '' : 'grayscale'}`} 
                               />
                               {i === 0 && (
                                 <div className="absolute -top-1 -right-1 bg-gold rounded-full p-0.5">
                                    <Award className="w-2 h-2 text-navy" />
                                 </div>
                               )}
                            </div>
                            <div>
                               <p className={`text-sm font-serif italic ${i === 0 ? 'text-gold' : 'text-text'}`}>{bid.username}</p>
                               <p className="text-[8px] font-black text-text/30 uppercase tracking-widest">
                                 {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                               </p>
                            </div>
                         </div>
                         <p className={`text-lg font-serif italic ${i === 0 ? 'text-gold' : 'text-text/60'}`}>₦{bid.amount.toLocaleString()}</p>
                      </motion.div>
                   ))}
                   {auction.bids.length === 0 && (
                     <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-micro text-text/20 uppercase font-black tracking-widest">Awaiting Initial Transmission...</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
           <p className="text-micro animate-pulse">Initializing Data Stream...</p>
        </div>
      )}

      {/* History Slide-over */}
      <AnimatePresence>
        {showHistory && auction && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-navy-light border-l border-white/5 z-[101] p-12 overflow-y-auto no-scrollbar"
            >
               <div className="flex justify-between items-center mb-12">
                  <h2 className="text-3xl font-serif text-text italic">Ledger Log</h2>
                  <button onClick={() => setShowHistory(false)} className="text-gold/60 text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-gold/5 rounded-full transition-all">Close</button>
               </div>
               <div className="space-y-8">
                  {auction.bids.map((bid, i) => (
                    <motion.div 
                      key={bid.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative pl-8 border-l border-white/5 pb-8 last:pb-0"
                    >
                       <div className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full border ${i === 0 ? 'bg-gold border-gold animate-ping' : 'bg-gold/40 border-gold'}`} />
                       <div className="space-y-2">
                          <div className="flex items-center gap-3">
                             <img src={bid.userPhoto} className="w-6 h-6 rounded-full" />
                             <p className={`text-sm font-serif italic ${i === 0 ? 'text-gold' : 'text-text/60'}`}>{bid.username}</p>
                          </div>
                          <p className={`text-xl font-serif ${i === 0 ? 'text-gold' : 'text-text'}`}>₦{bid.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-black text-text/20 uppercase tracking-[0.2em]">{new Date(bid.timestamp).toLocaleString()}</p>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Sticky Bottom Info */}
      <footer className="fixed bottom-0 inset-x-0 z-[60] p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-center">
           <div className="bg-navy/80 backdrop-blur-2xl border border-white/5 px-12 py-6 rounded-full pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex items-center gap-12">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-gold/60 uppercase tracking-[0.3em]">Identity</span>
                 <span className="text-xs font-serif italic text-text">{user ? profile?.username || 'Verified' : 'Guest Node'}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/5"></div>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-gold/60 uppercase tracking-[0.3em]">Connection</span>
                 <span className="text-xs font-serif italic text-text">Sovereign_Link_v4.2</span>
              </div>
              <div className="w-[1px] h-8 bg-white/5"></div>
              <div className="flex flex-col items-center">
                 <span className="text-[8px] font-black text-gold/60 uppercase tracking-[0.3em]">Latency</span>
                 <span className="text-xs font-serif italic text-text">14ms</span>
              </div>
           </div>
        </div>
      </footer>

      {auction && (
        <LinguisticAnalysisModal 
          isOpen={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          artifactName={auction.title}
        />
      )}
    </motion.div>
  );
}
