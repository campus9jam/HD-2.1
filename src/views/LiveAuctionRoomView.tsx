import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Gavel, 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Maximize2, 
  X,
  Send,
  Loader2,
  TrendingUp,
  Award,
  Lock,
  Languages,
  Sparkles,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { subscribeToAuction, placeBid } from '../services/AuctionService';
import { subscribeToComments, postComment, reactToComment } from '../services/SocialService';
import { translateText } from '../services/TranslationService';
import { LinguisticAnalysisModal } from '../components/LinguisticAnalysisModal';
import { startBotBidding } from '../services/SimulationService';
import { rewardLee, tipCreator, recommendCitizen } from '../services/LeeEconomyService';
import { AuctionDrop, AuctionComment, Bid } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const LiveAuctionRoomView: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { user, profile } = useAuth();
  const [auction, setAuction] = useState<AuctionDrop | null>(null);
  const [comments, setComments] = useState<AuctionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bids' | 'chat'>('chat');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [showBidOverlay, setShowBidOverlay] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [participantCount, setParticipantCount] = useState(1248);
  const [timeLeftStr, setTimeLeftStr] = useState("00:00:00");
  const [isTipping, setIsTipping] = useState(false);
  const [tipMagnitude, setTipMagnitude] = useState(50);
  const lastHighBidderRef = useRef<string | null>(null);
  const botIntervalRef = useRef<(() => void) | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Attendance Reward Pulse
  useEffect(() => {
    if (!user || !auctionId) return;
    
    const attendanceInterval = setInterval(() => {
       rewardLee(user.uid, 10, 'attendance_reward', { auctionId });
       toast.info("LEE Crystal Received", { 
         description: "Participation reward authorized by Leema AI.",
         icon: <Sparkles className="w-4 h-4 text-gold" />
       });
    }, 120000); // 2 minutes

    return () => clearInterval(attendanceInterval);
  }, [user, auctionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!auction?.endTime) return;
      const now = new Date().getTime();
      const end = auction.endTime instanceof Date ? auction.endTime.getTime() : (auction.endTime as any).seconds * 1000;
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeftStr("ARCHIVE_SEALED");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeftStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  useEffect(() => {
    const timer = setInterval(() => {
      setParticipantCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!auctionId) return;

    const unsubAuction = subscribeToAuction(auctionId, (a) => {
      setAuction(a);
      setBidAmount(a.currentBid + (a.minIncrement || 10000));
      setLoading(false);

      // Real-time Outbid Notification
      if (a.bids.length > 0) {
        const currentHighBidder = a.bids[a.bids.length - 1];
        if (lastHighBidderRef.current && 
            lastHighBidderRef.current === user?.uid && 
            currentHighBidder.userId !== user?.uid) {
          toast.error("DOMINANCE COMPROMISED", {
            description: `${currentHighBidder.username} has seized control with ₦${currentHighBidder.amount.toLocaleString()}.`,
            icon: <Activity className="w-4 h-4" />,
            duration: 5000
          });
        }
        lastHighBidderRef.current = currentHighBidder.userId;
      }
    });

    const unsubComments = subscribeToComments(auctionId, (c) => {
      setComments(c);
      scrollToBottom();
    });

    return () => {
      unsubAuction();
      unsubComments();
      if (botIntervalRef.current) botIntervalRef.current();
    };
  }, [auctionId, user?.uid]);

  const toggleSimulation = () => {
    if (!auction) return;
    if (isSimulating) {
      if (botIntervalRef.current) botIntervalRef.current();
      botIntervalRef.current = null;
      setIsSimulating(false);
      toast.info("Simulation Terminated", { description: "Bot behavior nodes offline." });
    } else {
      botIntervalRef.current = startBotBidding(auction.id);
      setIsSimulating(true);
      toast.success("Simulation Engaged", { description: "Archetype collectors are joining the grid." });
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlaceBid = async () => {
    if (!user || !profile || !auction) {
      toast.error("Authentication required");
      return;
    }

    try {
      await placeBid(
        auction.id,
        user.uid,
        profile.displayName || 'Noble Candidate',
        user.photoURL || '',
        bidAmount
      );
      
      // Reward Bidding Effort
      await rewardLee(user.uid, 50, 'lee_reward', { reason: 'Active Bidding', auctionId: auction.id });

      toast.success("Golden Bid Authorized", { 
        description: `₦${bidAmount.toLocaleString()} deployed. +50 LEE rewarded.` 
      });
      setShowBidOverlay(false);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTranslate = async (comment: AuctionComment) => {
    if (translatedComments[comment.id]) {
      // Toggle back to original if needed? Or just leave it. 
      // For simplicity, we just keep the translation.
      return;
    }
    setTranslatingId(comment.id);
    try {
      const translated = await translateText(comment.message, 'en');
      setTranslatedComments(prev => ({ ...prev, [comment.id]: translated }));
    } catch (err) {
      toast.error("Neural Node Desync");
    } finally {
      setTranslatingId(null);
    }
  };

  const handleShare = () => {
    if (!auction) return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Golden Link Secured", { description: "Link copied to collection protocol." });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !user || !auction) return;

    try {
      await postComment(
        auction.id,
        user.uid,
        profile?.displayName || 'Archive_Seeker',
        user.photoURL || '',
        commentInput.trim()
      );
      setCommentInput('');
      
      // Small participation reward for social engagement
      if (Math.random() > 0.7) {
        rewardLee(user.uid, 5, 'engagement_reward', { auctionId: auction.id });
      }
    } catch (error) {
      toast.error("Bridge signal failed");
    }
  };

  const handleTip = async () => {
    if (!user || !auction || !auction.sellerId) return;
    if ((profile?.leeBalance || 0) < tipMagnitude) {
      toast.error("Insufficient tokens for tipping");
      return;
    }

    setIsTipping(true);
    try {
      await tipCreator(user.uid, auction.sellerId, tipMagnitude, auction.id);
      
      // Social announcement via comment
      await postComment(
         auction.id,
         'system',
         'LEEMA_REWARDS',
         '',
         `${profile?.displayName} has authorized a ${tipMagnitude} LEE tip to the Artisan.`
      );

      toast.success("Tip Distributed", { 
        description: `Your sovereign gift of ${tipMagnitude} LEE has been shared.` 
      });
    } catch (error) {
      toast.error("Tip authorization failure");
    } finally {
      setIsTipping(false);
    }
  };

  const handleRecommend = async (targetId: string, targetName: string) => {
    if (!user) return;
    if (user.uid === targetId) {
       toast.error("Self-recommendation prohibited");
       return;
    }
    if ((profile?.leeBalance || 0) < 250) {
       toast.error("Insufficient tokens (250 LEE required)");
       return;
    }

    try {
       await recommendCitizen(user.uid, targetId);
       toast.success("Reputation Authorized", {
         description: `You verified ${targetName}'s cultural standing.`
       });
       
       // System message for the room
       await postComment(
         auctionId || 'global',
         'system',
         'LEEMA_REWARDS',
         '',
         `${profile?.displayName} has authorized a Reputation Boost for ${targetName}.`
       );
    } catch (err) {
       toast.error("Verification protocol failure");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!auction) return <div>Archive node not found.</div>;

  return (
    <div className="fixed inset-0 bg-navy text-text overflow-hidden flex flex-col md:flex-row">
      {/* Cinematic Main Player / Product View Area */}
      <div className="relative flex-1 bg-black overflow-hidden group">
         {/* Simulated Video Stream / High-fidelity Image */}
         <div className="absolute inset-0">
            <img 
              src={auction.img} 
              alt="" 
              className="w-full h-full object-cover opacity-60 backdrop-blur-3xl scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center p-12">
               <motion.img 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={auction.img} 
                  className="w-full max-h-full object-contain shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-3xl"
               />
            </div>
            {/* Ambient Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/40 via-transparent to-transparent" />
         </div>

         {/* Room UI - Top Bar */}
         <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-start z-30">
            <div className="flex items-center gap-4">
               <Link to="/drops" className="p-4 bg-navy/40 backdrop-blur-3xl rounded-full border border-text/10 text-white hover:bg-gold hover:text-navy transition-all">
                  <ChevronLeft className="w-5 h-5" />
               </Link>
               <div className="bg-navy/40 backdrop-blur-3xl border border-text/10 px-6 py-3 rounded-full flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">LIVE_ARCHIVE_NODE</span>
               </div>
               <div className="bg-navy/40 backdrop-blur-3xl border border-text/10 px-6 py-3 rounded-full flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white font-mono">{timeLeftStr}</span>
               </div>
               <div className="bg-navy/40 backdrop-blur-3xl border border-text/10 px-6 py-3 rounded-full flex items-center gap-3 hidden lg:flex">
                  <Users className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{participantCount.toLocaleString()} COLLECTORS</span>
               </div>
               {user?.uid === auction.sellerId && (
                  <button 
                     onClick={toggleSimulation}
                     className={`px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${isSimulating ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' : 'bg-navy/40 border-text/10 text-text/40 hover:text-gold'}`}
                  >
                     <Activity className={`w-4 h-4 ${isSimulating ? 'text-white' : 'text-gold'}`} />
                     {isSimulating ? 'SIMULATION_ACTIVE' : 'INIT_SIMULATION'}
                  </button>
               )}
            </div>
            <div className="flex gap-4">
               <button 
                  onClick={handleShare}
                  className="p-4 bg-navy/40 backdrop-blur-3xl rounded-full border border-text/10 text-white hover:text-gold transition-all"
               >
                  <Share2 className="w-5 h-5" />
               </button>
               <button 
                  onClick={handleTip}
                  disabled={isTipping}
                  className="p-4 bg-navy/40 backdrop-blur-3xl rounded-full border border-gold/20 text-gold hover:bg-gold hover:text-navy transition-all group relative"
               >
                  {isTipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5 group-hover:fill-current" />}
                  <div className="absolute -top-1 -right-1 bg-gold text-navy text-[7px] font-black px-1.5 py-0.5 rounded-full">TIP</div>
               </button>
               <button 
                  onClick={() => setShowAnalysis(true)}
                  className="p-4 bg-navy/40 backdrop-blur-3xl rounded-full border border-text/10 text-white hover:text-gold transition-all"
               >
                  <BrainCircuit className="w-5 h-5" />
               </button>
               <button className="p-4 bg-navy/40 backdrop-blur-3xl rounded-full border border-text/10 text-white hover:text-gold transition-all">
                  <Maximize2 className="w-5 h-5" />
               </button>
            </div>
         </div>

         {/* Quick Bid Ticker */}
         <div className="absolute top-28 inset-x-0 z-20 flex justify-center pointer-events-none overflow-hidden h-12">
            <div className="flex items-center gap-24 animate-marquee whitespace-nowrap">
               {auction.bids.slice(-5).map((bid) => (
                  <div key={bid.id} className="flex items-center gap-4 bg-navy/20 backdrop-blur-md px-6 py-2 rounded-full border border-gold/10">
                     <span className="text-[8px] font-black uppercase tracking-widest text-gold/60">{bid.username}</span>
                     <span className="text-xs font-serif italic text-white">₦{bid.amount.toLocaleString()}</span>
                     <div className="w-1 h-1 bg-gold/40 rounded-full" />
                  </div>
               ))}
               {/* Duplicate for seamless loop if enough bids */}
               {auction.bids.length > 3 && auction.bids.slice(-5).map((bid) => (
                  <div key={`${bid.id}-dup`} className="flex items-center gap-4 bg-navy/20 backdrop-blur-md px-6 py-2 rounded-full border border-gold/10">
                     <span className="text-[8px] font-black uppercase tracking-widest text-gold/60">{bid.username}</span>
                     <span className="text-xs font-serif italic text-white">₦{bid.amount.toLocaleString()}</span>
                     <div className="w-1 h-1 bg-gold/40 rounded-full" />
                  </div>
               ))}
            </div>
         </div>

         {/* Room UI - Floating Status */}
         <div className="absolute bottom-12 left-12 z-30 max-w-md hidden lg:block">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-navy/40 backdrop-blur-3xl border border-text/5 p-8 rounded-[2rem] space-y-6"
            >
               {auction.bids.length > 0 && auction.bids[auction.bids.length - 1].userId === user?.uid && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-4 w-fit">
                     <Zap className="w-3 h-3 text-gold animate-pulse" />
                     <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gold">Dominance Authorized</span>
                  </div>
               )}
               <div>
                  <h1 className="text-4xl font-serif italic tracking-tighter mb-2">{auction.title}</h1>
                  <p className="text-[10px] text-text/40 font-mono tracking-widest uppercase">Archive Code: DG_{auction.id.slice(0, 8)}</p>
               </div>
               <div className="flex items-center gap-4 py-4 border-y border-text/5">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                     <Award className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-text/40">Provenance Master</p>
                     <p className="text-sm font-serif italic">Artisan Archive_01</p>
                  </div>
               </div>
               <p className="text-xs text-text/40 font-serif leading-relaxed italic line-clamp-2">
                 {auction.description}
               </p>
            </motion.div>
         </div>

         {/* Mobile Auction Summary Card (Floating Bottom Overlay) */}
         <div className="absolute bottom-0 inset-x-0 p-6 md:hidden z-30">
            <div className="bg-navy/80 backdrop-blur-3xl border border-gold/20 rounded-[2.5rem] p-6 space-y-4">
               <div className="flex justify-between items-end">
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-gold mb-1">Current Golden Bid</p>
                     <p className="text-3xl font-serif italic tracking-tighter">₦{auction.currentBid.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase tracking-widest text-text/40 mb-1">Ends in</p>
                     <p className="text-xl font-mono text-gold tracking-widest">12:24:02</p>
                  </div>
               </div>
               <button 
                  onClick={() => setShowBidOverlay(true)}
                  className="w-full py-5 bg-gold text-navy rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(var(--gold-rgb),0.4)]"
               >
                  AUTHORIZE BID
               </button>
            </div>
         </div>
      </div>

      {/* Interaction Side Panel */}
      <div className="w-full md:w-[450px] lg:w-[500px] h-1/2 md:h-full bg-navy border-l border-text/10 flex flex-col z-40 relative">
         {/* Tabs */}
         <div className="flex border-b border-text/10">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'chat' ? 'text-gold' : 'text-text/20 hover:text-text/40'}`}
            >
               Social Command
               {activeTab === 'chat' && <motion.div layoutId="tab-active" className="absolute bottom-0 inset-x-12 h-0.5 bg-gold" />}
            </button>
            <button 
              onClick={() => setActiveTab('bids')}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'bids' ? 'text-gold' : 'text-text/20 hover:text-text/40'}`}
            >
               Bid Ledger
               {activeTab === 'bids' && <motion.div layoutId="tab-active" className="absolute bottom-0 inset-x-12 h-0.5 bg-gold" />}
            </button>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
               {activeTab === 'chat' ? (
                 <motion.div 
                   key="chat"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="space-y-6"
                 >
                    {comments.map((comment) => (
                      <motion.div 
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 group"
                      >
                         <div className="w-10 h-10 rounded-full overflow-hidden bg-text/10 border border-text/5 flex-shrink-0">
                            <img src={comment.userPhoto || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${comment.userId}`} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div className="space-y-1 group">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black uppercase tracking-widest text-gold">{comment.username}</span>
                               <span className="text-[8px] font-mono text-text/20">{comment.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="bg-surface/40 backdrop-blur-xl border border-text/5 p-4 rounded-2xl rounded-tl-none inline-block group/msg">
                               <p className="text-sm font-serif italic leading-relaxed text-text/80">
                                  {translatedComments[comment.id] || comment.message}
                               </p>
                               <button 
                                 onClick={() => handleTranslate(comment)}
                                 disabled={translatingId === comment.id}
                                 className="mt-2 text-[7px] font-black uppercase tracking-[0.2em] text-text/20 hover:text-gold transition-all flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 disabled:opacity-50"
                               >
                                  {translatingId === comment.id ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Languages className="w-2.5 h-2.5" />
                                  )}
                                  {translatedComments[comment.id] ? 'Translated' : 'Neural Translate'}
                               </button>
                               {comment.userId !== user?.uid && comment.userId !== 'system' && (
                                  <button 
                                    onClick={() => handleRecommend(comment.userId, comment.username)}
                                    className="mt-2 text-[7px] font-black uppercase tracking-[0.2em] text-gold/40 hover:text-gold transition-all flex items-center gap-1 opacity-0 group-hover/msg:opacity-100"
                                  >
                                     <ShieldCheck className="w-2.5 h-2.5" />
                                     Recommend Citizen
                                  </button>
                               )}
                            </div>
                            <div className="flex gap-2">
                               {comment.reactions && Object.entries(comment.reactions).map(([reaction, count]) => (
                                 <button 
                                   key={reaction}
                                   onClick={() => reactToComment(comment.id, reaction)}
                                   className="px-2 py-1 bg-text/5 rounded-full text-[8px] font-mono flex items-center gap-1 hover:bg-gold/10 hover:text-gold transition-colors"
                                 >
                                    <span>{reaction === 'heart' ? '❤️' : '🔥'}</span>
                                    <span>{count}</span>
                                 </button>
                               ))}
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    <div ref={commentsEndRef} />
                 </motion.div>
               ) : (
                 <motion.div 
                   key="bids"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="space-y-4"
                 >
                    {auction.bids.length === 0 ? (
                      <div className="text-center py-20 bg-surface/10 rounded-3xl border border-dashed border-text/5 space-y-4">
                         <Gavel className="w-10 h-10 text-text/10 mx-auto" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-text/20">The Archive awaits the first signal</p>
                      </div>
                    ) : auction.bids.slice().reverse().map((bid, index) => (
                      <div key={bid.id} className={`flex items-center justify-between p-6 rounded-3xl border ${index === 0 ? 'bg-gold/10 border-gold shadow-[0_0_40px_rgba(var(--gold-rgb),0.1)]' : 'bg-surface/20 border-text/5'}`}>
                         <div className="flex items-center gap-4">
                            <div className="relative">
                               <img src={bid.userPhoto || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${bid.userId}`} alt="" className="w-12 h-12 rounded-full border border-text/5" />
                               {index === 0 && (
                                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center text-navy shadow-lg">
                                    <TrendingUp className="w-3 h-3" />
                                 </div>
                               )}
                            </div>
                            <div>
                               <p className="text-[11px] font-black uppercase tracking-widest">{bid.username}</p>
                               <p className="text-[9px] font-mono text-text/40">{bid.timestamp instanceof Date ? bid.timestamp.toLocaleString() : 'Syncing...'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={`text-xl font-serif italic ${index === 0 ? 'text-gold' : 'text-text'}`}>₦{bid.amount.toLocaleString()}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">AUTHORIZED</p>
                         </div>
                      </div>
                    ))}
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Interaction Footer */}
         <div className="p-8 border-t border-text/10 bg-navy/80 backdrop-blur-3xl">
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                   {[10, 50, 100, 500].map(val => (
                     <button 
                       key={val}
                       onClick={() => setTipMagnitude(val)}
                       className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest whitespace-nowrap transition-all border ${tipMagnitude === val ? 'bg-gold text-navy border-gold' : 'bg-text/5 border-text/10 text-text/40'}`}
                     >
                        {val} LEE
                     </button>
                   ))}
                </div>
                <form onSubmit={handleSendComment} className="flex gap-4">
                   <button 
                     type="button"
                     onClick={handleTip}
                     disabled={isTipping}
                     className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                   >
                      <Heart className="w-5 h-5 fill-current" />
                   </button>
                   <input 
                     type="text" 
                     value={commentInput}
                     onChange={(e) => setCommentInput(e.target.value)}
                     className="flex-1 bg-surface/40 border border-text/5 rounded-2xl px-6 py-4 text-sm font-serif outline-none focus:border-gold transition-all"
                     placeholder="Send command signal..."
                   />
                   <button type="submit" className="p-4 bg-gold text-navy rounded-2xl hover:scale-105 transition-all shadow-xl">
                      <Send className="w-5 h-5" />
                   </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setBidAmount(prev => prev + 5000)}
                      className="py-3 bg-text/5 border border-text/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-gold/50 transition-all"
                    >
                       +5,000 Signal
                    </button>
                    <button 
                      onClick={() => setBidAmount(prev => prev + 25000)}
                      className="py-3 bg-text/5 border border-text/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-gold/50 transition-all"
                    >
                       +25,000 Signal
                    </button>
                 </div>
                 <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text/40">Next Minimum Bid</span>
                    <span className="text-xl font-serif italic text-gold">₦{bidAmount.toLocaleString()}</span>
                 </div>
                 <button 
                   onClick={handlePlaceBid}
                   className="w-full py-5 bg-gold text-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(var(--gold-rgb),0.3)] hover:scale-[1.02] transition-all"
                 >
                    AUTHORIZE ATOMIC BID
                 </button>
              </div>
            )}
         </div>

         {/* Mobile View Switcher Overlay */}
         <AnimatePresence>
            {showBidOverlay && (
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 z-[100] md:hidden"
              >
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowBidOverlay(false)} />
                 <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 inset-x-0 bg-navy rounded-t-[3rem] p-10 border-t border-gold/30 space-y-10"
                 >
                    <div className="flex justify-between items-start">
                       <h2 className="text-4xl font-serif italic tracking-tighter">Authorize <span className="text-gold">Bid.</span></h2>
                       <button onClick={() => setShowBidOverlay(false)} className="p-4 bg-text/5 rounded-full text-text/40">
                          <X className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-surface/40 border border-text/5 p-10 rounded-[2rem] text-center space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text/20">Authorization Amount</p>
                          <div className="flex items-center justify-center gap-4">
                             <button onClick={() => setBidAmount(prev => Math.max(auction.currentBid + 1000, prev - 10000))} className="w-12 h-12 bg-text/5 rounded-full flex items-center justify-center text-text/40">-</button>
                             <p className="text-6xl font-serif italic tracking-tighter">₦{bidAmount.toLocaleString()}</p>
                             <button onClick={() => setBidAmount(prev => prev + 10000)} className="w-12 h-12 bg-text/5 rounded-full flex items-center justify-center text-text/40">+</button>
                          </div>
                       </div>

                       <div className="flex items-center gap-4 p-5 bg-gold/5 rounded-2xl border border-gold/10">
                          <Lock className="w-5 h-5 text-gold" />
                          <p className="text-[9px] font-serif italic text-text/60 leading-relaxed uppercase tracking-widest">
                            Atomic synchronization protocols active. Bid is legally binding.
                          </p>
                       </div>

                       <button 
                        onClick={handlePlaceBid}
                        className="w-full py-8 bg-gold text-navy rounded-3xl text-sm font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(var(--gold-rgb),0.5)]"
                       >
                         DEPLOY SIGNAL
                       </button>
                    </div>
                 </motion.div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      <LinguisticAnalysisModal 
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        artifactName={auction.title}
      />

      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center"
          >
             <div className="relative">
                <Sparkles className="w-64 h-64 text-gold/20 animate-pulse" />
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-gold/30 rounded-full"
                />
                <div className="absolute inset-x-0 bottom-[-40px] text-center">
                   <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gold animate-bounce">DOMINANCE_AUTHORIZED</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveAuctionRoomView;
