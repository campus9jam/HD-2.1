import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Search, ChevronRight, X, Heart, Database, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CacheService } from '../services/CacheService';

export default function ShopView() {
  const { profile, user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [leeOnly, setLeeOnly] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  
  const categories = ['All', 'Heritage', 'Textiles', 'Bags', 'Accessories'];

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const cacheKey = `products_${activeCategory}`;
      
      try {
        // Try Cache First
        const cached = await CacheService.get<any[]>(cacheKey);
        if (cached) {
          setItems(cached);
          setIsOfflineData(true);
          setIsLoading(false);
        }

        // Fetch Fresh if Online
        if (navigator.onLine) {
          const q = activeCategory === 'All' 
            ? collection(db, 'products') 
            : query(collection(db, 'products'), where('category', '==', activeCategory));
          
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          
          setItems(data);
          setIsOfflineData(false);
          await CacheService.set(cacheKey, data, 120); // 2 hours TTL
        }
      } catch (error) {
        console.error("ShopView: Failed to load products", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategory]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLee = !leeOnly || item.price > 10000;
    return matchesSearch && matchesLee;
  }).sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return 0;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pb-32 overflow-y-auto no-scrollbar"
    >
      {/* Marketplace Header */}
      <header className="p-8 flex flex-col items-center gap-10">
         <div className="flex items-center justify-between w-full h-10">
            {user && (
              <div className="hidden lg:flex items-center gap-4 px-4 py-1 bg-gold/10 rounded-full border border-gold/10">
                 <Wallet className="w-3 h-3 text-gold" />
                 <span className="text-[10px] font-black uppercase text-gold">{(profile?.leeBalance || 0).toLocaleString()} LEE</span>
              </div>
            )}
            {!isSearchVisible ? (
              <>
                <div className="w-10"></div> {/* Spacer */}
                <h1 className="text-xl font-serif text-text italic tracking-widest uppercase">The Archives</h1>
                <div className="flex items-center gap-2">
                  {isOfflineData && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-text/5 rounded-full border border-text/5">
                       <Database className="w-3 h-3 text-gold/60" />
                       <span className="text-[6px] font-black uppercase text-text/30 tracking-widest text-nowrap">Local_Node</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setIsSearchVisible(true)}
                    className="text-text/40 hover:text-gold transition-colors p-2"
                  >
                     <Search className="w-6 h-6" />
                  </button>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center bg-text/5 rounded-2xl px-4 py-2 w-full border border-gold/20"
              >
                <Search className="w-4 h-4 text-gold/40 mr-3" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search the archives..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-text text-xs font-mono w-full placeholder:text-text/10"
                />
                <button onClick={() => { setIsSearchVisible(false); setSearchTerm(''); }} className="text-text/20 hover:text-text transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
         </div>
         
         {/* Category Banner Card */}
         <Link to="/marketplace" className="w-full relative h-48 rounded-[2rem] overflow-hidden group shadow-2xl">
            <img 
               src="https://picsum.photos/seed/textiles_ex/1200/600" 
               alt="Textiles Exclusive" 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale brightness-75"
               referrerPolicy="no-referrer"
               loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/20 to-transparent"></div>
            <div className="absolute inset-y-0 left-10 flex flex-col justify-center">
               <h2 className="text-3xl font-serif text-text italic leading-tight">
                  Kano Textiles <br/>
                  <span className="text-gold-light">Exclusive</span>
               </h2>
            </div>
         </Link>
      </header>

      {/* Grid Content */}
      <main className="px-8 space-y-12">
         {/* Filter Sub-Header */}
         <div className="flex gap-8 overflow-x-auto no-scrollbar border-b border-text/5 pb-4 items-center">
            {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 className={`text-[9px] uppercase font-black tracking-[0.2em] transition-all flex-shrink-0 ${activeCategory === cat ? 'text-gold' : 'text-text/20'}`}
               >
                  {cat}
               </button>
            ))}
            <div className="ml-auto pl-4 border-l border-text/5 flex items-center gap-3">
               <button 
                 onClick={() => setLeeOnly(!leeOnly)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${leeOnly ? 'bg-gold/20 border-gold text-gold' : 'bg-text/5 border-text/10 text-text/30'}`}
               >
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">LEE_Protocols</span>
               </button>
            </div>
         </div>

         {/* Product Grid */}
         <div className="grid grid-cols-2 gap-6 min-h-[400px]">
            {filteredItems.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-20 italic">
                  <p className="text-sm font-serif">No artifacts found in this sector.</p>
               </div>
            ) : filteredItems.map((item, i) => (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="flex flex-col gap-4 group cursor-pointer"
               >
                  <Link to={`/product/${item.id}`}>
                     <div className="aspect-[3/4] rounded-3xl overflow-hidden relative luxury-card">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        {item.price > 40000 && (
                           <div className="absolute top-4 left-4 p-2 bg-gold/80 backdrop-blur-md rounded-lg shadow-xl animate-pulse">
                              <span className="text-[7px] font-black uppercase text-navy tracking-[0.2em]">Negotiable</span>
                           </div>
                        )}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                           <div className="p-2 bg-navy/60 backdrop-blur-md border border-gold/20 rounded-full">
                              <Sparkles className="w-3 h-3 text-gold" />
                           </div>
                        </div>
                        <button 
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             toggleWishlist(item);
                           }}
                           className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-xl border transition-all ${
                             isInWishlist(item.id) 
                               ? 'bg-red-500 border-red-500 text-text' 
                               : 'bg-navy/40 border-text/10 text-text/40 hover:text-red-500'
                           }`}
                        >
                           <Heart className={`w-4 h-4 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                        </button>
                     </div>
                     <div className="mt-4 flex flex-col items-center text-center">
                        <h4 className="text-base font-serif text-text italic leading-tight">{item.title}</h4>
                        <p className="text-[10px] font-black uppercase text-gold tracking-widest mt-2">₦{item.price.toLocaleString()}</p>
                     </div>
                  </Link>
               </motion.div>
            ))}
         </div>
      </main>
    </motion.div>
  );
}
