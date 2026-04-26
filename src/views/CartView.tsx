import { motion } from 'motion/react';
import { useCart } from '../contexts/CartContext';
import { Package, Trash2, ArrowRight, ShieldCheck, CreditCard, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartView() {
  const { cart, removeFromCart, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen pt-40 px-8 text-center space-y-12 bg-navy"
      >
        <div className="p-12 bg-text/5 w-fit mx-auto rounded-full border border-text/10 shadow-2xl">
           <Package className="w-16 h-16 text-text/5" />
        </div>
        <div className="space-y-4">
           <h1 className="text-5xl font-serif italic text-text/20">Vault <br/> <span className="italic">Empty</span></h1>
           <p className="text-sm text-text/20 italic font-serif">Your acquisition ledger is currently silent. Securing artifacts initiates historical continuity.</p>
        </div>
        <Link to="/shop" className="luxury-button inline-flex !py-6 !px-12 tracking-[0.4em] text-xs font-black">EXPLORE ARCHIVES</Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pt-12 pb-44 px-8 max-w-4xl mx-auto space-y-16 overflow-y-auto no-scrollbar"
    >
      <header className="space-y-6">
        <Link to="/shop" className="inline-flex items-center gap-4 text-text/20 hover:text-gold transition-colors group">
           <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
           <span className="text-[10px] font-black uppercase tracking-[0.5em]">Inventory Nodes</span>
        </Link>
        <h1 className="text-5xl md:text-6xl font-serif text-text italic">Acquisition <span className="text-gold">Vault.</span></h1>
      </header>

      <div className="space-y-8">
        {cart.map((item) => (
          <div key={item.id} className="luxury-card p-6 flex gap-8 items-center bg-text/5 border-text/5 group relative !rounded-[2rem]">
            <div className="w-28 h-36 rounded-2xl overflow-hidden grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 flex-shrink-0 shadow-2xl">
               <img src={item.media[0]} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-grow space-y-4">
               <div>
                  <h3 className="text-xl font-serif text-text italic leading-tight">{item.title}</h3>
                  <p className="text-[9px] text-text/20 uppercase tracking-[0.3em] mt-2 font-black">{item.category} // Provenance Sync</p>
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-lg font-serif text-gold italic">₦{(item.price).toLocaleString()}</span>
                  <div className="w-[1px] h-4 bg-text/10"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-text/40">Allocated: {item.quantity}</span>
               </div>
            </div>
            <button 
              onClick={() => removeFromCart(item.id)}
              className="absolute top-4 right-4 p-3 text-text/5 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <section className="luxury-card p-12 bg-surface/30 border-gold/20 space-y-10 !rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
         <div className="flex justify-between items-end">
            <div className="space-y-4">
               <p className="text-[9px] uppercase font-black text-text/20 tracking-[0.4em]">Total Allocation</p>
               <p className="text-5xl font-serif text-text italic leading-none">₦{totalPrice.toLocaleString()}</p>
            </div>
            <div className="text-right space-y-2">
               <p className="text-[9px] uppercase font-black text-text/20 tracking-[0.4em]">Nodes</p>
               <p className="text-2xl font-serif text-gold italic leading-none">{totalItems}</p>
            </div>
         </div>

         <div className="p-8 bg-gold/5 rounded-3xl border border-gold/10 flex gap-6 items-center">
            <ShieldCheck className="w-8 h-8 text-gold flex-shrink-0" />
            <p className="text-[9px] leading-relaxed uppercase tracking-widest text-gold/60 font-black italic">
              Manifest secured via RSA_4096. All artifacts are verified heritage assets.
            </p>
         </div>

         <Link to="/checkout" className="luxury-button w-full shadow-[0_20px_60px_rgba(197,160,89,0.3)] !py-8 text-[11px] font-black tracking-[0.5em] !rounded-2xl">
            SECURE ACQUISITION <ArrowRight className="w-5 h-5 ml-4" />
         </Link>
      </section>
    </motion.div>
  );
}
