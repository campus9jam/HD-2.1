import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutDashboard, 
  Gavel, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  Clock, 
  Zap, 
  Video, 
  Camera, 
  FileText, 
  Tag, 
  DollarSign, 
  Loader2,
  ChevronLeft,
  Search,
  Sparkles,
  ShieldCheck,
  Package,
  Eye,
  MessageSquare,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createAuction, fetchActiveAuctions, seedSimulationData } from '../services/AuctionService';
import { fetchVendorProducts, updateArtifact } from '../services/ProductService';
import { boostArtifactVisibility, boosterCost } from '../services/LeeEconomyService';
import { AuctionDrop, Product } from '../types';
import { toast } from 'sonner';
import { useCallback } from 'react';

const SellerStudioView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'inventory' | 'streaming'>('dashboard');
  const [myAuctions, setMyAuctions] = useState<AuctionDrop[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Auction Form State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [auctionType, setAuctionType] = useState<'timed' | 'flash' | 'live'>('timed');
  const [startingBid, setStartingBid] = useState('100000');
  const [reservePrice, setReservePrice] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [duration, setDuration] = useState('24'); // hours
  const [isCreating, setIsCreating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isBoosting, setIsBoosting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const products = await fetchVendorProducts(user.uid);
      setMyProducts(products);
      
      const auctions = await fetchActiveAuctions();
      setMyAuctions(auctions.filter(a => a.sellerId === user.uid));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAuction = async () => {
    if (!selectedProduct) return;
    setIsCreating(true);
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + parseInt(duration) * 60 * 60 * 1000);

    try {
      await createAuction({
        productId: selectedProduct.id,
        sellerId: user?.uid,
        title: selectedProduct.title,
        description: selectedProduct.description,
        img: selectedProduct.media[0],
        type: auctionType,
        startTime,
        endTime,
        startingBid: parseFloat(startingBid),
        reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : undefined,
        minIncrement: 10000,
        status: 'active'
      });
      
      toast.success("Auction Node Initiated", { 
        description: `${selectedProduct.title} is now live in the Sahelian Archives.` 
      });
      setShowWizard(false);
      setActiveTab('dashboard');
      loadData();
    } catch (error) {
      toast.error("Protocol initialization failed");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSeedSimulation = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await seedSimulationData(user.uid);
      toast.success("Simulation Protocols Engaged", { 
        description: "Archetype live auctions have been deployed to your studio." 
      });
      loadData();
    } catch (error) {
      toast.error("Simulation failure", { description: "Neural node rejected the seed." });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleBoost = async (id: string) => {
     if (!user) return;
     setIsBoosting(id);
     try {
        await boostArtifactVisibility(user.uid, id);
        toast.success("Visibility Authorized", { description: "Artifact visibility boosted in the cultural index." });
        loadData();
     } catch (err) {
        toast.error("Boost protocol denied");
     } finally {
        setIsBoosting(null);
     }
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-text">
      {/* Sidebar Navigation - Fixed for Desktop, Bottom for Mobile */}
      <nav className="fixed bottom-0 inset-x-0 bg-navy/80 backdrop-blur-3xl border-t border-text/10 p-6 flex justify-around items-center z-50 lg:top-0 lg:left-0 lg:w-24 lg:h-full lg:flex-col lg:border-t-0 lg:border-r">
         <div className="hidden lg:flex mb-12">
            <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center">
               <Sparkles className="w-6 h-6 text-gold" />
            </div>
         </div>
         
         {[
           { id: 'dashboard', icon: LayoutDashboard },
           { id: 'create', icon: Gavel },
           { id: 'inventory', icon: Package },
           { id: 'streaming', icon: Video },
           { id: 'settings', icon: Settings }
         ].map((tab) => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-gold text-navy shadow-[0_0_30px_rgba(var(--gold-rgb),0.3)]' : 'text-text/40 hover:text-gold hover:bg-text/5'}`}
           >
              <tab.icon className="w-6 h-6" />
           </button>
         ))}
      </nav>

      {/* Main Content Area */}
      <main className="lg:ml-24 p-8 pb-32 lg:p-16">
         {activeTab === 'dashboard' && (
           <div className="space-y-12">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                 <div className="space-y-4">
                    <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none">Artisan <span className="text-gold">Studio.</span></h1>
                    <p className="text-sm text-text/40 max-w-md font-serif italic">Command center for sovereign archive drops and artifact monetization.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="bg-surface/40 backdrop-blur-xl border border-text/5 p-4 rounded-3xl min-w-[160px]">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text/20 mb-2">Studio Sales</p>
                       <p className="text-3xl font-serif italic">₦3.4M</p>
                    </div>
                    <div className="bg-surface/40 backdrop-blur-xl border border-text/5 p-4 rounded-3xl min-w-[160px]">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text/20 mb-2">Live Nodes</p>
                       <p className="text-3xl font-serif italic">{myAuctions.length}</p>
                    </div>
                 </div>
              </header>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button 
                   onClick={() => setActiveTab('create')}
                   className="group relative overflow-hidden bg-gold text-navy p-10 rounded-[2.5rem] flex flex-col justify-between h-80 transition-all hover:scale-[1.02]"
                 >
                    <Plus className="w-12 h-12" />
                    <div className="space-y-2">
                       <h3 className="text-2xl font-serif italic">Initiate Drop</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Deploy an artifact to the market</p>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Gavel className="w-32 h-32" />
                    </div>
                 </button>

                 <button 
                   onClick={() => setActiveTab('streaming')}
                   className="group relative overflow-hidden bg-surface/40 backdrop-blur-xl border border-text/5 p-10 rounded-[2.5rem] flex flex-col justify-between h-80 transition-all hover:border-gold/30"
                 >
                    <Video className="w-12 h-12 text-gold" />
                    <div className="space-y-2 text-left">
                       <h3 className="text-2xl font-serif italic">Live Command</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-text/40">Start a cinematic reveal</p>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity text-gold">
                       <Zap className="w-32 h-32" />
                    </div>
                 </button>

                 <div className="bg-indigo-600 p-10 rounded-[2.5rem] flex flex-col justify-between h-80 relative overflow-hidden group">
                    <BarChart3 className="w-12 h-12 text-white" />
                    <div className="space-y-2">
                       <h3 className="text-2xl font-serif italic text-white">Collector Data</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Archive analytics enabled</p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
                    
                    <button 
                      onClick={handleSeedSimulation}
                      disabled={isSeeding}
                      className="absolute bottom-10 right-10 p-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 z-10"
                    >
                       {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                       <span className="text-[8px] font-black uppercase">Seed Simulation</span>
                    </button>
                 </div>
              </div>

              {/* Active Nodes List */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Gavel className="w-6 h-6 text-gold" />
                       <h2 className="text-xs font-black uppercase tracking-widest">Active Operations</h2>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {myAuctions.map((auction) => (
                      <div key={auction.id} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-surface/40 backdrop-blur-xl border border-text/5 rounded-3xl gap-8 group hover:bg-surface/60 transition-all">
                         <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-text/5">
                               <img src={auction.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div>
                               <h4 className="text-xl font-serif italic mb-1">{auction.title}</h4>
                               <div className="flex items-center gap-4">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                    auction.type === 'flash' ? 'bg-red-500/10 text-red-500' :
                                    auction.type === 'live' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-gold/10 text-gold'
                                  }`}>
                                    {auction.type} drop
                                  </span>
                                  <span className="text-[9px] font-mono text-text/40">{auction.bidCount} Bids</span>
                               </div>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 text-right">
                            <div className="hidden lg:block text-left">
                               <p className="text-[10px] font-black uppercase tracking-widest text-text/20 mb-1">Time Remaining</p>
                               <div className="flex items-center gap-2 text-text/60">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-[10px] font-mono">14h 22m</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black uppercase tracking-widest text-text/20 mb-1">Top Bid</p>
                               <p className="text-2xl font-serif italic text-gold tracking-tighter">₦{auction.currentBid.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4 justify-end">
                               <button className="p-4 bg-text/5 rounded-2xl text-text/40 hover:text-gold hover:bg-text/10 transition-all">
                                  <Eye className="w-5 h-5" />
                               </button>
                               <button className="p-4 bg-gold text-navy rounded-2xl shadow-xl hover:scale-105 transition-all">
                                  <ArrowUpRight className="w-5 h-5" />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'create' && (
           <div className="max-w-4xl mx-auto space-y-12">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-3 text-text/40 hover:text-gold transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                 <ChevronLeft className="w-4 h-4" />
                 Back to Command
              </button>

              <div className="space-y-4">
                 <h2 className="text-6xl font-serif italic tracking-tighter">Initiate <span className="text-gold">Sovereign Drop.</span></h2>
                 <p className="text-sm text-text/40 font-serif italic max-w-xl">
                   Deploying an artifact to the market requires high-fidelity metadata. 
                   Initiate the Daraja Quality Protocol below.
                 </p>
              </div>

              {/* Wizard Steps */}
              <div className="flex gap-4 mb-12">
                 {[1, 2, 3].map((step) => (
                   <div key={step} className={`h-1 flex-1 rounded-full transition-all duration-700 ${wizardStep >= step ? 'bg-gold' : 'bg-text/5'}`} />
                 ))}
              </div>

              {wizardStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                   <div className="flex items-center gap-3 mb-8">
                      <Package className="w-6 h-6 text-gold" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em]">Step 1: Select Artifact</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myProducts.map((p) => (
                        <button 
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setWizardStep(2);
                          }}
                          className={`p-6 rounded-3xl border transition-all flex gap-6 text-left ${selectedProduct?.id === p.id ? 'bg-gold/10 border-gold shadow-2xl' : 'bg-surface/40 border-text/5 hover:border-text/20'}`}
                        >
                           <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                              <img src={p.media[0]} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex flex-col justify-center">
                              <h4 className="text-xl font-serif italic mb-1">{p.title}</h4>
                              <div className="flex items-center gap-3">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-text/40">ID: {p.id.slice(0, 8)}</p>
                                 {(p as any).isBoosted && (
                                    <span className="flex items-center gap-1 text-[8px] font-black text-gold uppercase tracking-tighter">
                                       <Sparkles className="w-2.5 h-2.5" /> Boosted
                                    </span>
                                 )}
                              </div>
                              <p className="text-lg font-serif italic text-gold mt-2">₦{p.price.toLocaleString()}</p>
                              
                              {!(p as any).isBoosted && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleBoost(p.id);
                                   }}
                                   disabled={isBoosting === p.id}
                                   className="mt-4 px-4 py-2 border border-gold/40 text-[8px] font-black uppercase tracking-widest text-gold rounded-lg hover:bg-gold hover:text-navy transition-all"
                                 >
                                    {isBoosting === p.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `Boost Visibility (${boosterCost} LEE)`}
                                 </button>
                              )}
                           </div>
                        </button>
                      ))}
                   </div>

                   <button className="w-full py-8 border border-dashed border-text/10 rounded-3xl flex items-center justify-center gap-3 text-text/20 hover:text-gold hover:border-gold/30 transition-all">
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Digitize New Artifact</span>
                   </button>
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                   <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-gold" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em]">Step 2: Auction Mechanics</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'timed', title: 'Timed Archive', icon: Clock, desc: 'Standard countdown bidding' },
                        { id: 'flash', title: 'Flash Drop', icon: Zap, desc: 'Ultra-fast premium drops' },
                        { id: 'live', title: 'Cinematic Live', icon: Video, desc: 'Interactive social reveal' }
                      ].map((t) => (
                        <button 
                          key={t.id}
                          onClick={() => setAuctionType(t.id as any)}
                          className={`p-10 rounded-[2.5rem] border transition-all text-center space-y-6 ${auctionType === t.id ? 'bg-gold text-navy border-gold shadow-2xl' : 'bg-surface/40 border-text/5 hover:border-gold/20'}`}
                        >
                           <t.icon className={`w-10 h-10 mx-auto ${auctionType === t.id ? 'text-navy' : 'text-gold'}`} />
                           <div>
                              <h4 className="text-xl font-serif italic mb-1">{t.title}</h4>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${auctionType === t.id ? 'text-navy/60' : 'text-text/40'}`}>{t.desc}</p>
                           </div>
                        </button>
                      ))}
                   </div>

                   <div className="bg-surface/40 backdrop-blur-xl border border-text/5 rounded-[2.5rem] p-12 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40">Starting Bid (₦)</label>
                            <input 
                              type="number"
                              value={startingBid}
                              onChange={(e) => setStartingBid(e.target.value)}
                              className="w-full bg-navy/40 border border-text/10 rounded-2xl py-6 px-8 text-2xl font-serif focus:border-gold outline-none transition-all"
                            />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40">Duration (Hours)</label>
                            <select 
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              className="w-full bg-navy/40 border border-text/10 rounded-2xl py-6 px-8 text-2xl font-serif focus:border-gold outline-none aria-selected:text-gold appearance-none cursor-pointer"
                            >
                               <option value="1">1 Hour (Flash)</option>
                               <option value="6">6 Hours</option>
                               <option value="12">12 Hours</option>
                               <option value="24">24 Hours (Standard)</option>
                               <option value="48">48 Hours</option>
                            </select>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-text/5 pt-10">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40">Reserve Price (Optional)</label>
                            <input 
                              type="number"
                              value={reservePrice}
                              onChange={(e) => setReservePrice(e.target.value)}
                              placeholder="Hidden minimum"
                              className="w-full bg-navy/40 border border-text/10 rounded-2xl py-6 px-8 text-2xl font-serif focus:border-gold outline-none"
                            />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40">Buy Now Price (Optional)</label>
                            <input 
                              type="number"
                              value={buyNowPrice}
                              onChange={(e) => setBuyNowPrice(e.target.value)}
                              placeholder="Instant acquisition"
                              className="w-full bg-navy/40 border border-text/10 rounded-2xl py-6 px-8 text-2xl font-serif focus:border-gold outline-none"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <button 
                        onClick={() => setWizardStep(1)}
                        className="px-12 py-8 bg-text/5 rounded-3xl text-xs font-black uppercase tracking-widest text-text/40 hover:text-text transition-all"
                      >
                         Back
                      </button>
                      <button 
                        onClick={() => setWizardStep(3)}
                        className="flex-1 py-8 bg-gold text-navy rounded-3xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all"
                      >
                         Configure Assets
                      </button>
                   </div>
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                   <div className="flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-gold" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em]">Step 3: Protocol Verification</h3>
                   </div>

                   <div className="bg-surface/40 backdrop-blur-xl border border-text/5 rounded-[2.5rem] p-12 space-y-12">
                      <div className="flex gap-8">
                         <div className="w-48 h-64 rounded-3xl overflow-hidden flex-shrink-0">
                            <img src={selectedProduct?.media[0]} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div className="space-y-6 py-4">
                            <div>
                               <h2 className="text-4xl font-serif italic mb-2">{selectedProduct?.title}</h2>
                               <p className="text-[11px] font-black uppercase tracking-widest text-gold">{auctionType} Archive Drop</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-text/20 mb-1">Starting Bid</p>
                                  <p className="text-2xl font-serif italic tracking-tighter">₦{parseFloat(startingBid).toLocaleString()}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-text/20 mb-1">Duration</p>
                                  <p className="text-2xl font-serif italic tracking-tighter">{duration} Hours</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="flex items-center gap-4 p-6 bg-navy/40 rounded-3xl border border-gold/20">
                            <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                               <Sparkles className="w-5 h-5" />
                            </div>
                            <p className="text-[11px] font-serif leading-relaxed italic text-text/60">
                               Daraja Quality Protocol: This artifact will be cross-referenced with the Sahelian Archive ledger upon deployment.
                            </p>
                         </div>

                         <div className="flex items-center gap-4 p-6 bg-navy/40 rounded-3xl border border-text/5">
                            <div className="w-10 h-10 bg-text/5 rounded-full flex items-center justify-center text-text/40">
                               <DollarSign className="w-5 h-5" />
                            </div>
                            <p className="text-[11px] font-serif leading-relaxed italic text-text/60">
                               Commission: A 1.5% archive maintenance fee will be deducted upon successful settlement in Escrow.
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <button 
                        onClick={() => setWizardStep(2)}
                        className="px-12 py-8 bg-text/5 rounded-3xl text-xs font-black uppercase tracking-widest text-text/40 hover:text-text transition-all"
                      >
                         Revision
                      </button>
                      <button 
                        onClick={handleCreateAuction}
                        disabled={isCreating}
                        className="flex-1 py-8 bg-gold text-navy rounded-3xl text-xs font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--gold-rgb),0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                         {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                           <>
                             <Gavel className="w-6 h-6" />
                             DEPLOY AUCTION NODE
                           </>
                         )}
                      </button>
                   </div>
                </motion.div>
              )}
           </div>
         )}

         {activeTab === 'streaming' && (
           <div className="max-w-4xl mx-auto space-y-12">
              <header className="space-y-4">
                 <h1 className="text-6xl font-serif italic tracking-tighter">Live <span className="text-gold">Command Room.</span></h1>
                 <p className="text-sm text-text/40 max-w-xl italic font-serif leading-relaxed">
                   Real-time artifact reveal and social bidding engine. Command the attention of the continent's most elite collectors.
                 </p>
              </header>

              <div className="aspect-video bg-surface/40 backdrop-blur-xl rounded-[3rem] border border-dashed border-text/10 flex flex-col items-center justify-center space-y-8 group hover:border-gold/30 transition-all cursor-pointer">
                 <div className="w-32 h-32 bg-gold/10 rounded-full flex items-center justify-center text-gold group-hover:scale-110 transition-transform duration-700 relative">
                    <Video className="w-12 h-12" />
                    <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full animate-pulse" />
                 </div>
                 <div className="text-center space-y-2">
                    <h3 className="text-2xl font-serif italic">Initialize Stream</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text/20">Check Camera & Microphone permissions</p>
                 </div>
                 <button className="px-12 py-5 bg-gold text-navy rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">
                    BOOT COMMAND INTERFACE
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-surface/20 backdrop-blur-xl border border-text/5 p-10 rounded-[2.5rem] space-y-6">
                    <MessageSquare className="w-10 h-10 text-gold" />
                    <h4 className="text-xl font-serif italic">Audience Signals</h4>
                    <p className="text-[10px] text-text/40 leading-relaxed uppercase tracking-widest font-black">Social comments and thermal reactions will appear in the cockpit overlay.</p>
                 </div>
                 <div className="bg-surface/20 backdrop-blur-xl border border-text/5 p-10 rounded-[2.5rem] space-y-6">
                    <Zap className="w-10 h-10 text-gold" />
                    <h4 className="text-xl font-serif italic">Bidding Cockpit</h4>
                    <p className="text-[10px] text-text/40 leading-relaxed uppercase tracking-widest font-black">Atomic bid sync with sub-50ms latency across the Sahelian network nodes.</p>
                 </div>
              </div>
           </div>
         )}
      </main>
    </div>
  );
};

export default SellerStudioView;
