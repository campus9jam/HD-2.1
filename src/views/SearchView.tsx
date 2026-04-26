import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X, ChevronRight, History, Sparkles, Heart, Filter, SlidersHorizontal, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MARKET_ITEMS } from '../constants/marketData';
import { useWishlist } from '../contexts/WishlistContext';

export default function SearchView() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedArtisan, setSelectedArtisan] = useState<string | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const suggestions = [
     'Kano Royal Regalia',
     'Indigo Dye Archives',
     'Sahel Silk Protocol',
     'Urban Nomadic 01'
  ];

  const categories = useMemo(() => Array.from(new Set(MARKET_ITEMS.map(item => item.category))), []);
  const artisans = useMemo(() => Array.from(new Set(MARKET_ITEMS.map(item => item.artisan))), []);

  const results = useMemo(() => {
    return MARKET_ITEMS.filter(item => {
      const matchesQuery = !query || 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      const matchesArtisan = !selectedArtisan || item.artisan === selectedArtisan;

      return matchesQuery && matchesCategory && matchesPrice && matchesArtisan;
    });
  }, [query, selectedCategory, priceRange, selectedArtisan]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange([0, 1000000]);
    setSelectedArtisan(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pt-12 pb-40 px-8 max-w-4xl mx-auto space-y-16 overflow-y-auto no-scrollbar"
    >
      <header className="space-y-10">
        <div className="flex justify-between items-center">
           <span className="text-[10px] font-black uppercase text-text/20 tracking-[0.6em]">Archival_Inference</span>
           <Link to="/shop" className="p-3 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all">
              <X className="w-5 h-5" />
           </Link>
        </div>
        
        <div className="relative group">
           <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-text/10 group-focus-within:text-gold transition-colors duration-500" />
           <input 
             autoFocus
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             className="w-full bg-surface/30 border-b border-text/5 rounded-none px-20 py-12 text-4xl md:text-5xl font-serif text-text focus:border-gold outline-none placeholder:text-text/5 italic transition-all duration-700"
             placeholder="Search the archives..."
           />
           <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
              {query && (
                <button onClick={() => setQuery('')} className="p-2 text-text/20 hover:text-text">
                   <X className="w-6 h-6" />
                </button>
              )}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-gold text-navy border-gold' : 'bg-text/5 text-text/40 border-text/10'}`}
              >
                 <Filter className="w-5 h-5" />
              </button>
           </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-text/5 rounded-[2rem] border border-text/10 p-8 space-y-8"
            >
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* Category Filter */}
                  <div className="space-y-4">
                     <h4 className="text-[9px] uppercase font-black text-gold/60 tracking-widest">Sector</h4>
                     <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedCategory === cat ? 'bg-gold text-navy' : 'bg-text/5 text-text/40 hover:bg-text/10'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-4">
                     <h4 className="text-[9px] uppercase font-black text-gold/60 tracking-widest">Valuation</h4>
                     <div className="px-2">
                        <input 
                          type="range" 
                          min="0" 
                          max="1000000" 
                          step="10000"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                          className="w-full accent-gold bg-text/10 h-1 rounded-full outline-none"
                        />
                        <div className="flex justify-between mt-2">
                           <span className="text-[8px] font-mono text-text/20">₦0</span>
                           <span className="text-[10px] font-mono text-gold font-bold">₦{priceRange[1].toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  {/* Artisan Filter */}
                  <div className="space-y-4">
                     <h4 className="text-[9px] uppercase font-black text-gold/60 tracking-widest">Guild Nodes</h4>
                     <div className="flex flex-wrap gap-2">
                        {artisans.map(artisan => (
                          <button
                            key={artisan}
                            onClick={() => setSelectedArtisan(selectedArtisan === artisan ? null : artisan)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedArtisan === artisan ? 'bg-gold text-navy' : 'bg-text/5 text-text/40 hover:bg-text/10'
                            }`}
                          >
                            {artisan.replace('_', ' ')}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="pt-6 border-t border-text/5 flex justify-between items-center">
                  <button onClick={clearFilters} className="text-[9px] uppercase font-black text-red-500/60 hover:text-red-500 transition-colors tracking-widest">Clear Inferrence Filters</button>
                  <p className="text-[9px] italic font-serif text-text/20">{results.length} Nodes Found</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
         {(query || selectedCategory || selectedArtisan || priceRange[1] < 1000000) ? (
           <section className="col-span-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between border-b border-gold/20 pb-6">
                 <h3 className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Inference Results</h3>
                 <span className="text-[9px] text-text/20 uppercase font-black tracking-widest">Global Sync Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {results.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30 italic">
                       <p className="text-xl font-serif">No artifacts matched your query within this sector.</p>
                    </div>
                  ) : results.map((res) => (
                     <Link to={`/product/${res.id}`} key={res.id} className="luxury-card p-10 bg-surface/30 border-text/5 space-y-6 group hover:border-gold/30 transition-all">
                        <div className="flex justify-between items-start">
                           <div className="flex gap-6 items-start">
                              <div className="w-16 h-20 rounded-xl overflow-hidden border border-text/5 grayscale group-hover:grayscale-0 transition-all">
                                 <img src={res.img} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                 <h4 className="text-2xl font-serif text-text italic group-hover:text-gold transition-colors">{res.title}</h4>
                                 <p className="text-[10px] text-gold/60 uppercase font-black tracking-widest mt-2">{res.category}</p>
                              </div>
                           </div>
                           <span className="text-gold font-serif text-lg italic">{res.price.toLocaleString()}</span>
                        </div>
                        <div className="pt-6 border-t border-text/5 flex items-center justify-between">
                           <div className="flex gap-4">
                              <span className="text-[8px] uppercase font-black text-text/20 tracking-widest">Connect with Nodes</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleWishlist(res);
                                }}
                                className={`p-2 rounded-full transition-all ${
                                  isInWishlist(res.id) ? 'text-red-500' : 'text-text/20 hover:text-red-500'
                                }`}
                              >
                                 <Heart className={`w-4 h-4 ${isInWishlist(res.id) ? 'fill-current' : ''}`} />
                              </button>
                              <ChevronRight className="w-4 h-4 text-gold/20 group-hover:text-gold group-hover:translate-x-2 transition-all" />
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
           </section>
         ) : (
           <>
             {/* History & Suggestions */}
             <section className="space-y-10">
            <div className="flex items-center gap-4 text-text/20">
               <History className="w-4 h-4" />
               <h3 className="text-[9px] uppercase font-black tracking-[0.4em]">Historical Queries</h3>
            </div>
            <div className="space-y-4">
               {suggestions.map((item, i) => (
                 <div 
                   key={i} 
                   onClick={() => setQuery(item)}
                   className="flex items-center justify-between p-6 luxury-card bg-text/5 cursor-pointer hover:bg-gold/5 border-text/5 hover:border-gold/20 transition-all group !rounded-[2rem]"
                 >
                    <span className="text-lg font-serif italic text-text/40 group-hover:text-text transition-colors">{item}</span>
                    <ChevronRight className="w-5 h-5 text-text/5 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                 </div>
               ))}
            </div>
         </section>

         {/* AI Predictive Search */}
         <section className="space-y-10">
            <div className="p-12 luxury-card bg-gold/[0.03] border-gold/10 space-y-10 relative overflow-hidden !rounded-[2.5rem]">
               <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 blur-[80px]"></div>
               <div className="flex items-center gap-4 text-gold">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-[9px] uppercase font-black tracking-[0.4em]">Node Intelligence</h3>
               </div>
               <div className="space-y-6">
                  <h4 className="text-2xl font-serif text-text italic leading-tight">Navigating the <br/>Sovereignty?</h4>
                  <p className="text-sm italic font-serif text-text/40 leading-relaxed">
                     Our archivist AI orchestrates results based on historical context and cultural significance. 
                     Try searching for "14th Century Indigo" or "Palace Silk Protocol".
                  </p>
                  <div className="h-[1px] w-full bg-gold/10"></div>
                  <div className="flex flex-wrap gap-4">
                     {['#Status', '#Heritage', '#Sahel'].map(tag => (
                        <span key={tag} className="text-[8px] font-black uppercase text-gold/40 tracking-widest">{tag}</span>
                     ))}
                  </div>
               </div>
            </div>
         </section>
         </>
        )}
      </div>
    </motion.div>
  );
}
