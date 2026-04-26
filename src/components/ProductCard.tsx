import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="luxury-card group flex flex-col h-full bg-navy/40 hover:bg-surface transition-all border-white/10 hover:border-gold/30"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[3/4] overflow-hidden rounded-[1.2rem] m-3">
        <motion.img 
          src={product.media[0]} 
          alt={product.title} 
          className="w-full h-full object-cover grayscale brightness-90 transition-all duration-1000 group-hover:grayscale-0"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 p-2 bg-navy/80 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
           <ShieldCheck className="w-4 h-4 text-gold" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 pt-16 bg-gradient-to-t from-navy/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
           <motion.button 
             onClick={(e) => {
               e.preventDefault();
               addToCart(product);
             }}
             whileTap={{ scale: 0.95 }}
             className="w-full luxury-button !py-4 text-[8px] font-black"
           >
             ADD TO ARCHIVE
           </motion.button>
        </div>
      </Link>

      <div className="p-6 pt-2 space-y-4 text-center">
        <h3 className="text-lg font-serif text-white group-hover:text-gold transition-colors italic leading-tight">{t(product, 'title')}</h3>
        <p className="text-xs text-gold font-black uppercase tracking-[0.2em]">₦{product.price.toLocaleString()}</p>
      </div>
    </motion.div>
  );
}
