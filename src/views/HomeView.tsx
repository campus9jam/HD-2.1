import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, RefreshCw, Scissors, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PullToRefresh from '../components/PullToRefresh';

export default function HomeView() {
  const { ui } = useLanguage();

  const handleRefresh = async () => {
    // Protocol re-synchronization heartbeat
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col min-h-screen pb-32 overflow-hidden overflow-y-auto"
      >
      {/* Hero Section */}
      <section className="relative h-[65vh] flex flex-col justify-end p-8 overflow-hidden group">
         <img 
           src="https://picsum.photos/seed/heritage_hero/1200/1600" 
           alt="Heritage Collection" 
           className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
           referrerPolicy="no-referrer"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
         <div className="absolute inset-0 bg-navy/20"></div>
         
         <div className="relative z-10 space-y-4 max-w-2xl">
            <p className="text-[10px] uppercase font-black text-gold tracking-[0.8em] animate-pulse">{ui('motto')}</p>
            <h1 className="text-6xl md:text-9xl font-serif text-text tracking-tighter leading-[0.85] drop-shadow-2xl">
              HD Heritage<br/>
              <span className="italic text-gold translate-x-4 inline-block tracking-normal">Collection</span>
            </h1>
            <p className="text-text/60 text-sm md:text-base font-light max-w-md italic">
               {ui('heritage_desc')}
            </p>
         </div>
      </section>

      {/* Brand Mission & Vision Section */}
      <section className="p-8 py-16 bg-text/[0.02] border-y border-text/5 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">The_Mission</h3>
                <p className="text-lg font-serif text-text/80 italic leading-relaxed">
                   {ui('mission')}
                </p>
             </div>
             <div className="space-y-4">
                <h3 className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">The_Vision</h3>
                <p className="text-[11px] font-light text-text/50 leading-relaxed uppercase tracking-[0.2em] leading-loose">
                   {ui('vision')}
                </p>
             </div>
          </div>
      </section>

      {/* Latest Arrivals Section */}
      <section className="p-8 space-y-8">
         <div className="flex justify-between items-end border-b border-text/5 pb-6">
            <div>
               <p className="text-[10px] uppercase font-black text-gold tracking-[0.4em] mb-2">New_Archives</p>
               <h2 className="text-3xl font-serif text-text italic">{ui('latest_arrivals') || 'Latest Arrivals'}</h2>
            </div>
            <Link to="/marketplace" className="text-gold flex items-center gap-2 group">
               <span className="text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Explore All</span>
               <ChevronRight className="w-6 h-6" />
            </Link>
         </div>

         <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 -mx-8 px-8">
            {[
               { id: 'p1', title: 'Emeka Jacket', price: '₦75,000', img: 'https://picsum.photos/seed/jacket_eme/600/900' },
               { id: 'p2', title: 'Adah Dress', price: '₦95,000', img: 'https://picsum.photos/seed/dress_ada/600/900' },
               { id: 'p3', title: 'Savannah Kaftan', price: '₦110,000', img: 'https://picsum.photos/seed/kaftan_sav/600/900' },
               { id: 'p4', title: 'Nile Tunic', price: '₦85,000', img: 'https://picsum.photos/seed/tunic_nile/600/900' }
            ].map((product, i) => (
               <motion.div
                 key={product.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="flex-shrink-0 w-64 group"
               >
                  <Link to={`/product/${product.id}`}>
                     <div className="aspect-[2/3] rounded-3xl overflow-hidden mb-4 relative luxury-card">
                        <img 
                          src={product.img} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                           <span className="text-[10px] uppercase font-black text-text tracking-widest border border-text/20 px-4 py-2 rounded-full backdrop-blur-md">View Artifact</span>
                        </div>
                     </div>
                     <div className="px-2">
                        <h4 className="text-base font-serif text-text/90 italic">{product.title}</h4>
                        <p className="text-xs text-gold font-black mt-2 uppercase tracking-[0.2em]">{product.price}</p>
                     </div>
                  </Link>
               </motion.div>
            ))}
         </div>
      </section>

      {/* Style Stories Section */}
      <section className="p-8 space-y-8">
         <div className="flex justify-between items-center">
            <h2 className="text-3xl font-serif text-text italic">Style Stories</h2>
            <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-text/5 via-text/5 to-transparent"></div>
            <ArrowRight className="w-5 h-5 text-gold" />
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative h-80 rounded-3xl overflow-hidden group luxury-card">
               <img 
                 src="https://picsum.photos/seed/story1/800/800" 
                 alt="Style Story" 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-8 left-8">
                  <p className="text-[10px] uppercase font-black text-gold tracking-[0.4em] mb-2">Heritage_Log</p>
                  <h3 className="text-2xl font-serif text-text italic max-w-xs leading-tight">Indigo Pit Secrets of Kofar Mata</h3>
               </div>
            </div>
            
            <div className="relative h-80 rounded-3xl overflow-hidden group luxury-card">
               <img 
                 src="https://picsum.photos/seed/story2/800/800" 
                 alt="Style Story" 
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-8 left-8">
                  <p className="text-[10px] uppercase font-black text-gold tracking-[0.4em] mb-2">Market_Intel</p>
                  <h3 className="text-2xl font-serif text-text italic max-w-xs leading-tight">The Rise of Sahelian Streetwear</h3>
               </div>
            </div>
         </div>
      </section>

      {/* Atelier Mastery Section */}
      <section className="p-8 space-y-8">
         <div className="flex justify-between items-center">
            <h2 className="text-3xl font-serif text-text italic">Atelier Mastery</h2>
            <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-text/5 via-text/5 to-transparent"></div>
            <Link to="/atelier" className="text-gold flex items-center gap-2">
               <span className="text-[10px] uppercase font-black tracking-widest">Access Pipeline</span>
               <ArrowRight className="w-4 h-4" />
            </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link to="/atelier" className="luxury-card p-10 bg-surface/50 space-y-6 group hover:border-gold/30 transition-all">
               <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                  <Scissors className="w-6 h-6 text-gold" />
               </div>
               <div>
                  <h4 className="text-xl font-serif text-text italic">Bespoke Fabrication</h4>
                  <p className="text-[10px] text-text/30 uppercase font-black tracking-widest mt-2 leading-relaxed">
                    Track measurements, archival progress, and identity-linked orders in the global registry.
                  </p>
               </div>
            </Link>

            <Link to="/atelier/admin" className="luxury-card p-10 bg-navy/50 space-y-6 group hover:border-gold/30 transition-all border-dashed">
               <div className="w-12 h-12 bg-text/5 rounded-2xl flex items-center justify-center border border-text/10">
                  <ShieldCheck className="w-6 h-6 text-text/40 group-hover:text-gold transition-colors" />
               </div>
               <div>
                  <h4 className="text-xl font-serif text-text italic">Governance Node</h4>
                  <p className="text-[10px] text-text/30 uppercase font-black tracking-widest mt-2 leading-relaxed">
                    Administrative architecture for atelier owners. Secure data management and client synchronization.
                  </p>
               </div>
            </Link>
         </div>
      </section>

      {/* Marketplace Entry */}
      <section className="p-8 pb-12">
         <Link to="/marketplace" className="luxury-card p-12 flex flex-col md:flex-row items-center justify-between gap-8 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 space-y-4">
               <h3 className="text-4xl font-serif italic text-text">Marketplace <span className="text-gold">Sovereignty</span></h3>
               <p className="text-sm text-text/40 italic max-w-md">Connect directly with vetted artisanal nodes across the Kano-Lagos corridor.</p>
            </div>
            <div className="relative z-10 luxury-button !px-12 !py-6 group-hover:translate-x-2 transition-transform">Enter The Archives</div>
         </Link>
      </section>
    </motion.div>
    </PullToRefresh>
  );
}
