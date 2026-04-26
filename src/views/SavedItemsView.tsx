import { motion } from 'motion/react';
import { useWishlist } from '../contexts/WishlistContext';
import { Heart, ChevronLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedItemsView() {
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pt-12 pb-40 px-8 max-w-4xl mx-auto space-y-16"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-10 pb-12 border-b border-text/5">
        <div className="space-y-4">
           <span className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Archival_Favorites.v1</span>
           <h1 className="text-4xl md:text-6xl font-serif text-text italic">Saved <span className="text-gold">Artifacts.</span></h1>
        </div>
        <Link to="/profile" className="p-4 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </header>

      {wishlist.length === 0 ? (
        <section className="py-40 text-center space-y-10">
           <div className="p-12 bg-text/5 inline-block rounded-full border border-text/10 opacity-20">
              <Heart className="w-20 h-20" />
           </div>
           <div className="space-y-4">
              <h3 className="text-2xl font-serif text-text/40 italic">Your archive is currently empty.</h3>
              <p className="text-[10px] uppercase font-black text-text/10 tracking-widest">Identify artifacts in the gallery to preserve them here.</p>
           </div>
           <Link to="/shop" className="luxury-button inline-flex !px-16">EXPLORE THE ARCHIVE</Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {wishlist.map((item) => (
             <div key={item.id} className="luxury-card group bg-surface/30 border-text/5 overflow-hidden">
                <div className="aspect-[4/5] relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                   <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                      <div className="flex gap-4 w-full">
                         <Link to={`/product/${item.id}`} className="luxury-button flex-1 !py-4 text-[10px]">VIEW ARCHIVE</Link>
                         <button 
                           onClick={() => removeFromWishlist(item.id)}
                           className="p-4 bg-red-500/20 backdrop-blur-md rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
                <div className="p-8 space-y-2">
                   <div className="flex justify-between items-start">
                      <h4 className="text-xl font-serif text-text italic">{item.title}</h4>
                      <span className="text-gold font-serif italic">{item.price.toLocaleString()}</span>
                   </div>
                   <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">{item.category}</p>
                </div>
             </div>
           ))}
        </section>
      )}
    </motion.div>
  );
}
