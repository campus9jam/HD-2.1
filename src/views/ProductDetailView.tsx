import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Heart, ChevronRight, Info, Globe, Scissors, Check, Sparkles, MessageCircle, Clock, ShieldCheck, Share2, Maximize2, Lock, ArrowRight, X, Play, Loader2, ShoppingBag, Gavel } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { CacheService } from '../services/CacheService';
import { VirtualAccountCard } from '../components/VirtualAccountCard';
import { Product } from '../types';

export default function ProductDetailView() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState('M');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [directToAtelier, setDirectToAtelier] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const cacheKey = `product_${id}`;
        const cached = await CacheService.get<Product>(cacheKey);
        if (cached) {
          setProduct(cached);
          setIsLoading(false);
          return;
        }

        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const finalProduct = {
            ...data,
            id: docSnap.id,
            media: data.media || [],
            sizes: data.sizes || ['M', 'L', 'XL'],
          } as Product;
          
          setProduct(finalProduct);
          await CacheService.set(cacheKey, finalProduct, 30);
        }
      } catch (error) {
        console.error("ProductDetail: Failed to fetch", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const handlePriceNegotiated = (e: any) => {
      if (e.detail?.productId === id) {
        setNegotiatedPrice(e.detail.newPrice);
        toast.success(`Leema has verified a new sovereign valuation: ₦${e.detail.newPrice.toLocaleString()}`);
      }
    };
    window.addEventListener('leema:price_negotiated', handlePriceNegotiated);
    return () => window.removeEventListener('leema:price_negotiated', handlePriceNegotiated);
  }, [id]);

  const isSaved = useMemo(() => id ? isInWishlist(id) : false, [id, isInWishlist]);
  const displayPrice = negotiatedPrice || product?.price || 0;
  
  const mediaItems = useMemo(() => {
    if (!product) return [];
    const regularMedia = product.media.map(url => ({ url, type: 'image' }));
    const vaultMedia = product.vaultMedia || [];
    return [...regularMedia, ...vaultMedia];
  }, [product]);

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Module 3: State Persistence (Instant Resume upon re-entry)
  useEffect(() => {
    const savedCheckout = localStorage.getItem(`checkout_${id}`);
    if (savedCheckout) {
      try {
        const data = JSON.parse(savedCheckout);
        // Only resume if not expired
        if (data.virtualAccount.expiry > Date.now()) {
          setCheckoutData(data);
          setShowCheckout(true);
        } else {
          localStorage.removeItem(`checkout_${id}`);
        }
      } catch (e) {
        console.error("Failed to restore checkout state", e);
      }
    }
  }, [id]);

  useEffect(() => {
    if (showCheckout && checkoutData) {
      localStorage.setItem(`checkout_${id}`, JSON.stringify(checkoutData));
    } else if (!showCheckout) {
      localStorage.removeItem(`checkout_${id}`);
    }
  }, [showCheckout, checkoutData, id]);

  const initiatePurchase = async () => {
    if (!user) {
      toast.error('Authentication Required', { description: 'Please connect your identity to proceed.' });
      return;
    }

    setIsProcessing(true);
    try {
      // Module 2: Secure Payment Orchestration
      // We call our internal API to fetch canonical pricing and generate a secure link
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          userId: user.uid
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
         // Create the order node in 'pending' status via client-side (ZTA will enforce rules in firestore.rules)
         // Module 3: State Persistence / Module 1: Zero-Trust
         const orderRef = doc(db, 'orders', result.data.reference);
         const { setDoc, serverTimestamp } = await import('firebase/firestore');
         
         await setDoc(orderRef, {
           productId: id,
           amount: result.data.amount,
           status: 'pending',
           customerId: user.uid,
           vendorId: product?.vendorId || 'daraja_hq',
           timestamp: serverTimestamp()
         });

         setCheckoutData(result.data);
         setShowCheckout(true);
         toast.success('Sovereign Link Established', { description: 'Secure payment node generated.' });
      }
    } catch (error) {
      console.error("Initiate Purchase Error:", error);
      toast.error('Connection Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
         <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-8 text-center space-y-6">
         <X className="w-16 h-16 text-text/10" />
         <h1 className="text-3xl font-serif text-text italic">Artifact Not Located.</h1>
         <Link to="/shop" className="luxury-button">Return to Archives</Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy overflow-y-auto pb-44 no-scrollbar"
    >
      {/* Utility Header */}
      <header className="fixed top-0 inset-x-0 p-8 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto">
          <Link to="/" className="p-4 bg-surface/40 backdrop-blur-xl rounded-full border border-text/10 text-text hover:bg-gold transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:text-navy transition-colors" />
          </Link>
          <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-surface/40 backdrop-blur-xl rounded-full border border-text/10">
             <Link to="/shop" className="text-[9px] font-black uppercase text-text/40 hover:text-gold tracking-widest transition-colors">Archive</Link>
             <ChevronRight className="w-3 h-3 text-text/10" />
             <span className="text-[9px] font-black uppercase text-gold tracking-widest">{product.category}</span>
          </div>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          <button 
             onClick={() => {
               if (navigator.share) {
                 navigator.share({
                   title: product?.title,
                   text: product?.description,
                   url: window.location.href
                 }).catch(() => {});
               } else {
                 navigator.clipboard.writeText(window.location.href);
                 toast.success('Sovereign Link Copied');
               }
             }}
             className="p-4 bg-surface/40 backdrop-blur-xl rounded-full border border-text/10 text-text hover:bg-gold transition-colors group"
          >
             <Share2 className="w-5 h-5 group-hover:text-navy transition-colors" />
          </button>
          <button 
             onClick={() => toggleWishlist(product as any)}
             className={`p-4 backdrop-blur-xl rounded-full border transition-all pointer-events-auto group ${isSaved ? 'bg-red-500 border-red-500 text-text' : 'bg-surface/40 border-text/10 text-text hover:text-red-500'}`}
          >
             <Heart className={`w-5 h-5 transition-all ${isSaved ? 'fill-current' : 'group-hover:fill-current'}`} />
          </button>
        </div>
      </header>

      {/* Product Image Focus - Carousel */}
      <section className="h-[75vh] relative overflow-hidden group/carousel">
         <AnimatePresence mode="wait">
            {mediaItems[currentMediaIndex]?.type?.includes('video') ? (
              <motion.div
                key={currentMediaIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-black flex items-center justify-center relative"
              >
                <video 
                  src={mediaItems[currentMediaIndex].url}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              </motion.div>
            ) : (
              <motion.img 
                key={currentMediaIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                src={mediaItems[currentMediaIndex]?.url} 
                alt={`${product.title} view ${currentMediaIndex + 1}`} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            )}
         </AnimatePresence>

         {/* Navigation Taps */}
         <div className="absolute inset-0 flex">
            <div className="flex-1 cursor-pointer" onClick={prevMedia}></div>
            <div className="flex-1 cursor-pointer" onClick={nextMedia}></div>
         </div>

         {/* Pagination Indicators */}
         <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-2 pointer-events-none">
            {mediaItems.map((_, i) => (
               <div 
                 key={i} 
                 className={`h-1 transition-all duration-500 rounded-full ${i === currentMediaIndex ? 'w-8 bg-gold' : 'w-2 bg-text/20'}`}
               />
            ))}
         </div>

         <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy via-navy/40 to-transparent pointer-events-none"></div>
      </section>

      {/* Product Information */}
      <main className="px-8 -mt-20 relative z-10 space-y-10">
         <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif text-text italic tracking-tight">{product.title}</h1>
            <div className="flex items-baseline gap-4">
               <p className="text-3xl font-serif text-gold italic">₦{displayPrice.toLocaleString()}</p>
               {negotiatedPrice && (
                  <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1 rounded-full animate-pulse border border-green-500/20">Leema Verified</span>
               )}
               <div className="flex items-center gap-2 group cursor-help">
                  <Sparkles className="w-3 h-3 text-gold animate-pulse" />
                  <span className="text-[9px] uppercase font-black text-gold/40 border border-gold/10 px-3 py-1 rounded-full group-hover:bg-gold/5 transition-all">
                     Pay up to 20% in LEE
                  </span>
               </div>
            </div>
            <p className="text-text/60 text-sm font-light leading-relaxed italic max-w-md">
               {product.description}
            </p>
         </div>

         {/* Bespoke Tailoring Option */}
         <div 
            onClick={() => setDirectToAtelier(!directToAtelier)}
            className={`luxury-card p-6 flex justify-between items-center cursor-pointer transition-all border-dashed ${directToAtelier ? 'bg-gold/5 border-gold/40' : 'bg-surface/50 border-text/5 hover:bg-text/5'}`}
         >
            <div className="flex items-center gap-6">
               <div className={`p-3 rounded-2xl transition-all ${directToAtelier ? 'bg-gold/20 text-gold' : 'bg-text/5 text-text/20'}`}>
                  <Scissors className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-base font-serif text-text/90 italic">Direct to Atelier</h4>
                  <p className="text-[8px] uppercase font-black text-text/20 tracking-widest mt-1">Send fabric to tailors for bespoke fabrication</p>
               </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${directToAtelier ? 'border-gold bg-gold' : 'border-text/10'}`}>
               {directToAtelier && <Check className="w-4 h-4 text-navy" />}
            </div>
         </div>

         {/* Action Buttons */}
         <div className="fixed bottom-12 inset-x-8 z-50 flex flex-col gap-4">
             {product.status === 'drop' ? (
                <Link 
                  to="/drops"
                  className="luxury-button w-full !rounded-2xl !py-8 text-xs font-black tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--gold-rgb),0.5)] bg-gold text-navy flex items-center justify-center gap-3"
                >
                  <Gavel className="w-5 h-5" />
                  PARTICIPATE IN AUCTION
                </Link>
             ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const event = new CustomEvent('leema:trigger', { 
                        detail: { text: `I would like to negotiate the price for the ${product.title}. It is currently ₦${product.price.toLocaleString()}. What is the absolute best price from the Kano archive?` } 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="luxury-button-outline flex-1 !rounded-2xl !py-8 text-[10px] font-black tracking-[0.3em]"
                  >
                    NEGOTIATE
                  </button>
                  <button 
                    onClick={initiatePurchase}
                    disabled={isProcessing}
                    className="luxury-button flex-[2] !rounded-2xl !py-8 text-xs font-black tracking-[0.4em] shadow-[0_20px_50px_rgba(var(--gold-rgb),0.4)] bg-gold text-navy disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ACQUIRE ARTIFACT'}
                  </button>
                </div>
             )}
             <p className="text-[9px] text-center text-text/20 uppercase font-bold tracking-tighter">
               Sovereign_Handshake Protocol Active
             </p>
         </div>

         {/* Payment Overlay */}
         <AnimatePresence>
           {showCheckout && checkoutData && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-2xl flex items-center justify-center p-6"
             >
                <div className="w-full max-w-lg space-y-8">
                   <div className="flex justify-between items-center mb-4">
                      <button 
                        onClick={() => setShowCheckout(false)}
                        className="p-3 bg-text/5 rounded-full text-text/40 hover:text-text transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                      <p className="text-[10px] uppercase font-black text-gold tracking-widest">Secure_Payment_Tunnel</p>
                   </div>

                   <VirtualAccountCard 
                     orderId={checkoutData.reference}
                     amount={checkoutData.amount}
                     accountNumber={checkoutData.virtualAccount.accountNumber}
                     bankName={checkoutData.virtualAccount.bank}
                     expiryTime={checkoutData.virtualAccount.expiry}
                     onPaymentSuccess={() => {
                       setShowCheckout(false);
                       navigate('/profile');
                     }}
                   />

                   <div className="flex flex-col items-center gap-2">
                      <p className="text-[9px] uppercase font-black text-text/20 tracking-tighter">
                         House_of_Daraja Protocol 102.4-A
                      </p>
                   </div>
                </div>
              </motion.div>
           )}
         </AnimatePresence>

         {/* Extra Details */}
         <div className="grid grid-cols-1 gap-6 pb-24">
            <div className="p-8 luxury-card bg-gold/5 border-gold/10 space-y-6">
               <div className="flex items-center gap-3 text-gold">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-widest">Archival Intelligence Report</span>
               </div>
               <p className="text-xs text-text/60 leading-relaxed italic">
                  This artifact represents the {product.category} lineage, characterized by {product.title.toLowerCase().includes('kaftan') ? 'royal Court aesthetics' : 'nomadic utilitarian luxury'}. 
                  Provenance verified via the House of Daraja sovereign chain. 
                  Maintenance requires specialized dry-cleaning or traditional preservation protocols.
               </p>
               <div className="flex gap-4">
                  <div className="flex-1 h-[1px] bg-gold/20"></div>
                  <div className="w-1 h-1 rounded-full bg-gold"></div>
                  <div className="flex-1 h-[1px] bg-gold/20"></div>
               </div>
            </div>

            {[
               { icon: Info, label: 'Heritage Authenticity', value: 'Verified Kano Archive Batch' },
               { icon: Globe, label: 'Carbon-Neutral', value: 'Sahel Express Logistics' }
            ].map((detail, i) => (
               <div key={i} className="flex items-center gap-4 p-4 border-b border-text/5">
                  <detail.icon className="w-4 h-4 text-gold/40" />
                  <div>
                     <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">{detail.label}</p>
                     <p className="text-xs font-serif italic text-text/60">{detail.value}</p>
                  </div>
               </div>
            ))}
         </div>
      </main>
    </motion.div>
  );
}
