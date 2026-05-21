import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronRight, Scissors, ShieldCheck, ChevronLeft, TrendingUp, Sparkles, Star, Gavel, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PullToRefresh from '../components/PullToRefresh';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { rankProducts } from '../services/recommendationService';
import { fetchEconomyMetrics } from '../services/GovernanceService';

const DEFAULT_HERO_IMAGES = [
  "https://i.imgur.com/7QFYTZJ.png", // Daraja Ancestral Heritage
  "https://i.imgur.com/MA123T4.png", // Sahelian Conceptual Curation
  "https://i.imgur.com/S4l7lKP.png", // Textile Archive Macro
  "https://i.imgur.com/jNv9WE7.png", // Ancestral Loom Sequences
  "https://i.imgur.com/2Xkwv9Y.png"  // Modern Nomadic Silhouettes
];

// Simple in-memory cache for HomeView
let cachedProducts: Product[] | null = null;
let lastProductsFetch = 0;

let cachedActiveAuction: any = undefined;
let lastAuctionFetch = 0;

export default function HomeView() {
  const { ui } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>(DEFAULT_HERO_IMAGES);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [topRatedProducts, setTopRatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAuction, setActiveAuction] = useState<any>(null);
  const [ecoMetrics, setEcoMetrics] = useState<any>(null);
  const [emailSubscription, setEmailSubscription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHeritageArchive = async () => {
      try {
        const response = await fetch('/api/heritage/images');
        const data = await response.json();
        if (data.images && Array.isArray(data.images)) {
          setHeroImages(data.images);
        }
      } catch (err) {
        console.error('Heritage Archive Sync Failed:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const now = Date.now();
        let products: Product[] = [];
        if (cachedProducts && now - lastProductsFetch < 120000) { // 2m cache
          products = cachedProducts;
        } else {
          const q = query(collection(db, 'products'), where('status', '==', 'active'), limit(20));
          const snapshot = await getDocs(q);
          products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          cachedProducts = products;
          lastProductsFetch = now;
        }
        
        setLatestProducts(rankProducts(products, 'latest').slice(0, 6));
        setTrendingProducts(rankProducts(products, 'trending').slice(0, 6));
        setTopRatedProducts(rankProducts(products, 'rated').slice(0, 6));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAuction = async () => {
      const now = Date.now();
      if (cachedActiveAuction !== undefined && now - lastAuctionFetch < 60000) {
        setActiveAuction(cachedActiveAuction);
        return;
      }
      const q = query(collection(db, 'auctions'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const auctionData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setActiveAuction(auctionData);
        cachedActiveAuction = auctionData;
      } else {
        setActiveAuction(null);
        cachedActiveAuction = null;
      }
      lastAuctionFetch = now;
    };

    const fetchEco = async () => {
      const metrics = await fetchEconomyMetrics();
      setEcoMetrics(metrics);
    };

    fetchHeritageArchive();
    fetchProducts();
    fetchAuction();
    fetchEco();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PRECACHE_IMAGES',
        urls: heroImages
      });
    }
  }, [heroImages]);

  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const productImages = [
        ...latestProducts,
        ...trendingProducts,
        ...topRatedProducts
      ].map(p => p.img).filter(Boolean);
      
      if (productImages.length > 0) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PRECACHE_IMAGES',
          urls: Array.from(new Set(productImages))
        });
      }
    }
  }, [latestProducts, trendingProducts, topRatedProducts]);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.location.reload();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubscription.trim()) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Identity Locked", { 
      description: "You have been registered in the archive distribution ledger." 
    });
    setEmailSubscription('');
    setSubmitting(false);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col min-h-screen pb-32 overflow-hidden overflow-y-auto bg-navy"
      >
      {/* Hero Section */}
      <section className="relative h-[85vh] flex flex-col justify-end p-6 md:p-8 overflow-hidden group">
         <AnimatePresence>
           <motion.div
             key={currentSlide}
             initial={{ opacity: 0, scale: 1.05 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.1 }}
             transition={{ duration: 1.5, ease: "easeInOut" }}
             className="absolute inset-0 cursor-grab active:cursor-grabbing"
             drag="x"
             dragConstraints={{ left: 0, right: 0 }}
             onDragEnd={(_, info) => {
               if (info.offset.x < -100) nextSlide();
               if (info.offset.x > 100) prevSlide();
             }}
           >
             <img 
               src={heroImages[currentSlide]} 
               alt={`Heritage Slide ${currentSlide + 1}`} 
               className="w-full h-full object-cover object-center pointer-events-none"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent"></div>
             <div className="absolute inset-0 bg-navy/20 backdrop-grayscale-[0.1]"></div>
           </motion.div>
         </AnimatePresence>
         
         <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <button onClick={prevSlide} className="p-4 rounded-full bg-navy/80 border border-gold/30 text-gold backdrop-blur-xl hover:bg-gold hover:text-navy transition-all pointer-events-auto transform hover:scale-110">
               <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlide} className="p-4 rounded-full bg-navy/80 border border-gold/30 text-gold backdrop-blur-xl hover:bg-gold hover:text-navy transition-all pointer-events-auto transform hover:scale-110">
               <ChevronRight className="w-6 h-6" />
            </button>
         </div>

         <div className="relative z-10 max-w-4xl space-y-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-4">
               <span className="w-12 h-[1px] bg-gold"></span>
               <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold">{ui('motto')}</span>
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-6xl sm:text-7xl md:text-[9rem] font-serif italic text-text leading-[0.85] tracking-tighter">
               House of Daraja
            </motion.h1>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-8 w-full sm:w-auto">
               <Link to="/marketplace" className="luxury-button flex items-center justify-center gap-4 group w-full sm:w-auto">
                  EXPLORE ARCHIVE <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
               </Link>
               <Link to="/heritage" className="text-center px-10 py-6 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-text/60 hover:text-white hover:border-white transition-all backdrop-blur-md w-full sm:w-auto">
                  PROVENANCE_INDEX
               </Link>
            </motion.div>
         </div>

         <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 flex gap-3 md:gap-4 z-20">
            {heroImages.map((_, i) => (
               <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all duration-700 rounded-full ${currentSlide === i ? 'w-12 bg-gold' : 'w-4 bg-white/20'}`} />
            ))}
         </div>
      </section>

      {/* Sovereign Market Pulse */}
      <div className="bg-gold py-4 overflow-hidden flex whitespace-nowrap border-y border-navy group relative">
         <motion.div 
           animate={{ x: [0, -1000] }}
           transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
           className="flex gap-20 items-center justify-center min-w-full"
         >
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-20 items-center">
                 <span className="flex items-center gap-3 text-navy font-black uppercase text-[10px] tracking-[0.4em]">
                    <TrendingUp className="w-3.5 h-3.5" /> LEE_CIRCULATION: {ecoMetrics?.totalRewarded || '1.2M'}
                 </span>
                 <span className="flex items-center gap-3 text-navy font-black uppercase text-[10px] tracking-[0.4em]">
                    <Sparkles className="w-3.5 h-3.5" /> REPUTATION_NODES: 8.4k
                 </span>
                 <span className="flex items-center gap-3 text-navy font-black uppercase text-[10px] tracking-[0.4em]">
                    <Clock className="w-3.5 h-3.5" /> BURN_RATE: {ecoMetrics?.totalBurned || '420k'}
                 </span>
                 <span className="text-navy/20 font-black">•</span>
              </div>
            ))}
         </motion.div>
      </div>

      {/* Auction Pulse Tie-in */}
      {activeAuction && (
        <section className="px-4 md:px-8 mt-8 md:mt-12 mb-12 md:mb-16">
           <Link to={`/live-auction/${activeAuction.id}`} className="luxury-card p-1 bg-gradient-to-r from-gold/40 via-gold/10 to-transparent block group hover:scale-[1.01] transition-all">
              <div className="bg-navy p-6 md:p-10 rounded-[2.3rem] flex flex-col md:flex-row justify-between items-center gap-8 border border-white/5">
                 <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gold/10 rounded-[2rem] border border-gold/20 flex items-center justify-center relative shrink-0">
                       <Gavel className="w-8 h-8 text-gold group-hover:text-navy transition-colors z-10" />
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center justify-center md:justify-start gap-3">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Atomic_Auction_Live</span>
                       </div>
                       <h3 className="text-3xl md:text-4xl font-serif italic text-text group-hover:text-gold transition-colors">{activeAuction.title}</h3>
                       <p className="text-[10px] uppercase font-black tracking-widest text-text/20">Current Dominance Authorization: ₦{activeAuction.currentBid?.toLocaleString() || '0'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center md:items-end gap-2">
                       <div className="flex items-center gap-3 text-gold">
                          <Clock className="w-5 h-5 animate-pulse" />
                          <span className="text-2xl font-mono tracking-widest">LIVE</span>
                       </div>
                    </div>
                    <div className="p-4 bg-gold/5 rounded-full border border-gold/10 group-hover:bg-gold group-hover:text-navy transition-all">
                       <ChevronRight className="w-8 h-8" />
                    </div>
                 </div>
              </div>
           </Link>
        </section>
      )}

      {/* Recommendations */}
      <RecommendationSection title="New_Archives" subtitle="Latest Arrivals" products={latestProducts} icon={<Sparkles className="w-5 h-5 text-gold" />} loading={loading} />
      <RecommendationSection title="Trending_Now" subtitle="High Engagement" products={trendingProducts} icon={<TrendingUp className="w-5 h-5 text-gold" />} loading={loading} />
      <RecommendationSection title="Top_Rated" subtitle="Master Crafts" products={topRatedProducts} icon={<Star className="w-5 h-5 text-gold" />} loading={loading} />

      {/* Brand Ethos */}
      <section className="p-6 md:p-8 py-12 md:py-16 bg-text/[0.02] border-y border-text/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-7xl mx-auto">
             <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">The_Mission</h3>
                <p className="text-lg font-serif text-text/80 italic leading-relaxed">
                   Honoring the lineage of Sahelian craftsmanship through contemporary artifact curation and identity-linked textile nodes.
                </p>
             </div>
             <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">The_Vision</h3>
                <p className="text-[11px] font-light text-text/50 leading-relaxed uppercase tracking-[0.2em]">
                   A decentralized archive of African luxury, where provenance is absolute and every artifact carries the spirit of its maker.
                </p>
             </div>
          </div>
      </section>

      {/* Style Stories */}
      <section className="p-6 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
         <h2 className="text-3xl font-serif text-text italic">Style Stories</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative h-80 rounded-3xl overflow-hidden luxury-card group">
               <img src="https://picsum.photos/seed/story1/800/800" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
               <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent" />
               <div className="absolute bottom-8 left-8">
                  <p className="text-[10px] uppercase font-black text-gold tracking-widest mb-2">Heritage_Log</p>
                  <h3 className="text-2xl font-serif text-text italic">Indigo Pit Secrets of Kofar Mata</h3>
               </div>
            </div>
            <div className="relative h-80 rounded-3xl overflow-hidden luxury-card group">
               <img src="https://picsum.photos/seed/story2/800/800" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
               <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent" />
               <div className="absolute bottom-8 left-8">
                  <p className="text-[10px] uppercase font-black text-gold tracking-widest mb-2">Market_Intel</p>
                  <h3 className="text-2xl font-serif text-text italic">The Rise of Sahelian Streetwear</h3>
               </div>
            </div>
         </div>
      </section>

      {/* Footer Subscription */}
      <section className="px-6 md:px-8 py-16 md:py-24 bg-navy border-t border-text/5 relative">
         <div className="max-w-4xl mx-auto text-center space-y-8 md:space-y-12">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif text-text italic tracking-tighter">Join the <span className="text-gold">Lineage.</span></h2>
            <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
               <input 
                 type="email" 
                 value={emailSubscription}
                 onChange={(e) => setEmailSubscription(e.target.value)}
                 placeholder="Enter archival email address"
                 className="flex-1 bg-surface/40 border border-text/10 rounded-2xl px-8 py-6 text-sm font-serif outline-none"
               />
               <button className="px-12 py-6 bg-gold text-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">LOCK IDENTITY</button>
            </form>
         </div>
      </section>
      </motion.div>
    </PullToRefresh>
  );
}

function RecommendationSection({ title, subtitle, products, icon, loading }: any) {
  return (
    <section className="p-6 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 border-b border-text/5 pb-4 md:pb-6">
        <div className="p-2 bg-gold/10 rounded-xl border border-gold/20">{icon}</div>
        <div>
          <p className="text-[10px] uppercase font-black text-gold tracking-[0.4em] mb-1">{title}</p>
          <h2 className="text-3xl font-serif text-text italic leading-none">{subtitle}</h2>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 aspect-[2/3] rounded-3xl bg-surface animate-pulse" />
        )) : products.map((product: any) => (
          <Link key={product.id} to={`/product/${product.id}`} className="flex-shrink-0 w-64 group">
             <div className="aspect-[2/3] rounded-3xl overflow-hidden mb-4 luxury-card">
               <img src={product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
             </div>
             <h4 className="text-base font-serif text-text italic truncate">{product.title}</h4>
             <p className="text-xs text-gold font-black mt-2 tracking-widest uppercase">₦{product.price.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
