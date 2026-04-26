import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider, useCart } from './contexts/CartContext';
import BottomNav from './components/BottomNav';
import OfflineNotice from './components/OfflineNotice';
import { WishlistProvider, useWishlist } from './contexts/WishlistContext';
import { OrderProvider } from './contexts/OrderContext';
import HomeView from './views/HomeView';
import MarketplaceView from './views/MarketplaceView';
import ShopView from './views/ShopView';
import ProfileView from './views/ProfileView';
import DropView from './views/DropView';
import HeritageView from './views/HeritageView';
import CommunityView from './views/CommunityView';
import CartView from './views/CartView';
import CheckoutView from './views/CheckoutView';
import SearchView from './views/SearchView';
import SavedItemsView from './views/SavedItemsView';
import OrdersView from './views/OrdersView';
import RewardsView from './views/RewardsView';
import ProductDetailView from './views/ProductDetailView';
import VendorDashboardView from './views/VendorDashboardView';
import AdminDashboardView from './views/AdminDashboardView';
import LoginView from './views/LoginView';
import AtelierPortalView from './views/AtelierPortalView';
import AtelierOrderWizardView from './views/AtelierOrderWizardView';
import AtelierAdminView from './views/AtelierAdminView';
import GovernanceView from './views/GovernanceView';
import LinguisticNodeView from './views/LinguisticNodeView';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, Search, ShieldAlert, Sparkles } from 'lucide-react';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';
import LeemaWidget from './components/LeemaWidget';
import { Toaster, toast } from 'sonner';
import { CacheService } from './services/CacheService';
import { SyncService } from './services/SyncService';

const BridgeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12c4-4 14-4 18 0" />
    <path d="M3 16c4-4 14-4 18 0" />
    <path d="M6 10v3" />
    <path d="M12 8v5" />
    <path d="M18 10v3" />
    <path d="M3 12h18" />
  </svg>
);

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.2, ease: "circOut" }}
      className="fixed inset-0 z-[1000] bg-navy flex items-center justify-center p-12 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_70%)]"></div>
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://picsum.photos/seed/heritage/1200/1200')] bg-cover mix-blend-overlay grayscale"></div>
      
      <div className="relative z-10 text-center space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-32 h-32 bg-gold/5 rounded-[2.5rem] flex items-center justify-center border border-gold/20 shadow-[0_40px_80px_rgba(212,175,55,0.1)] relative group">
            <Sparkles className="w-12 h-12 text-gold animate-pulse" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-[2.5rem] border border-dashed border-gold/10"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-serif text-text italic tracking-widest leading-none">House of <span className="text-gold">Daraja</span></h1>
            <p className="text-[10px] uppercase font-black tracking-[0.8em] text-gold/60 mt-4 h-4 overflow-hidden">
               <motion.span
                 animate={{ y: [20, 0, 0, -20] }}
                 transition={{ duration: 3, times: [0, 0.2, 0.8, 1], repeat: Infinity }}
                 className="block"
               >
                 Wear_Your_Worth
               </motion.span>
               <motion.span
                 animate={{ y: [20, 0, 0, -20] }}
                 transition={{ duration: 3, delay: 1, times: [0, 0.2, 0.8, 1], repeat: Infinity }}
                 className="block"
               >
                 Sovereign_Heritage
               </motion.span>
               <motion.span
                 animate={{ y: [20, 0, 0, -20] }}
                 transition={{ duration: 3, delay: 2, times: [0, 0.2, 0.8, 1], repeat: Infinity }}
                 className="block"
               >
                 Neural_Link_Active
               </motion.span>
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-4">
           <div className="w-48 h-0.5 bg-text/5 rounded-full relative overflow-hidden">
             <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 2.5, ease: "easeInOut" }}
               className="absolute inset-y-0 left-0 w-full bg-gold shadow-[0_0_20px_var(--color-gold)]"
             />
           </div>
           <p className="text-[7px] font-black uppercase text-text/20 tracking-[0.3em]">Protocol Ingestion Active</p>
        </div>
      </div>

      <div className="absolute bottom-12 text-[7px] font-black uppercase text-text/10 tracking-[1em]">
         Kano // Lagos // Zaria // London
      </div>
    </motion.div>
  );
}

function AppContent() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { toggleWishlist } = useWishlist();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('Sovereign Link Restored', { description: 'Reconciling local nodes with the ledger...' });
      
      await SyncService.processQueue({
        update_profile: async (payload) => {
          console.log('[Sync] Profile Sync:', payload);
        },
        wishlist_sync: async (payload) => {
          if (payload.item) {
             console.log('[Sync] Synchronizing item to wishlist:', payload.item.title);
             // Logic to manually reconcile if needed
          }
        },
        place_order: async (payload) => {
          console.log('[Sync] Order Sync:', payload);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection Severed', { description: 'Local archival mode engaged.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Purge expired neural cache nodes on session initialization
    CacheService.purgeExpired().catch(err => console.warn('[App] Cache purge failed:', err));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toggleWishlist]);

  return (
    <Router>
      <AnimatePresence>
        {!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}
      </AnimatePresence>

      <div className="flex flex-col h-full bg-navy text-text relative select-none">
        {/* Global Vignette */}
        <div className="fixed inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(0,0,0,0.1)_100%)] mix-blend-multiply opacity-50 dark:opacity-100 dark:bg-[radial-gradient(circle_at_50%_40%,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
        
        {/* Persistent Top Bar */}
        <header className="flex items-center justify-between px-6 py-8 z-40 bg-navy/80 backdrop-blur-xl border-b border-[var(--border)]">
           <button className="p-2 text-text/30 hover:text-gold transition-colors">
              <BridgeIcon className="w-6 h-6 text-gold" />
           </button>
           
           <Link to="/" className="flex flex-col items-center group">
              <span className="text-2xl font-serif text-text tracking-[0.2em] font-black leading-none mb-0.5">HD</span>
              <span className="text-[7px] uppercase tracking-[0.6em] text-gold font-black opacity-80">WEAR YOU WORTH</span>
           </Link>
           
           <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-text/5 border border-[var(--border)] mr-2">
                 <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                 <span className="text-[6px] font-black uppercase text-text/30 tracking-[0.1em]">
                   {isOnline ? 'Sovereign_Link_Active' : 'Offline_Cache_Node'}
                 </span>
              </div>
              <Link to="/search" className="p-2 text-text/40 hover:text-gold transition-colors">
                 <Search className="w-5 h-5" />
              </Link>
              <ThemeToggle />
           </div>
        </header>

        <OfflineNotice />
        
        <main className="flex-grow overflow-y-auto relative pb-32 no-scrollbar">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/marketplace" element={<MarketplaceView />} />
              <Route path="/shop" element={<ShopView />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileView />
                </ProtectedRoute>
              } />
              <Route path="/drops" element={<DropView />} />
              <Route path="/heritage" element={<HeritageView />} />
              <Route path="/community" element={<CommunityView />} />
              <Route path="/cart" element={<CartView />} />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <CheckoutView />
                </ProtectedRoute>
              } />
              <Route path="/search" element={<SearchView />} />
              <Route path="/saved" element={
                <ProtectedRoute>
                  <SavedItemsView />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrdersView />
                </ProtectedRoute>
              } />
              <Route path="/rewards" element={
                <ProtectedRoute>
                  <RewardsView />
                </ProtectedRoute>
              } />
              <Route path="/product/:id" element={<ProductDetailView />} />
              <Route path="/vendor/dashboard" element={
                <ProtectedRoute>
                  <VendorDashboardView />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboardView />
                </ProtectedRoute>
              } />
              <Route path="/atelier" element={<AtelierPortalView />} />
              <Route path="/atelier/order" element={
                <ProtectedRoute>
                  <AtelierOrderWizardView />
                </ProtectedRoute>
              } />
              <Route path="/atelier/admin" element={
                <ProtectedRoute requireAdmin>
                  <AtelierAdminView />
                </ProtectedRoute>
              } />
              <Route path="/governance" element={<GovernanceView />} />
              <Route path="/neural" element={<LinguisticNodeView />} />
            </Routes>
          </AnimatePresence>

          {/* Global Sovereign Footer */}
          <footer className="mt-20 p-12 bg-surface/30 border-t border-[var(--border)] space-y-12">
             <div className="flex flex-col md:flex-row justify-between gap-12">
                <div className="space-y-6 max-w-xs">
                   <div className="flex flex-col items-start gap-1">
                      <span className="text-xl font-serif text-text tracking-[0.2em] font-black italic">Daraja Archive</span>
                      <span className="text-[7px] uppercase tracking-[0.6em] text-gold font-black">Sovereign Media OS v.4.0</span>
                   </div>
                   <p className="text-[10px] text-text/30 leading-relaxed uppercase tracking-widest font-black">
                      The official digital custodian of the House of Daraja. Chronicling the cultural narratives and artisanal legacies of the Sahel.
                   </p>
                </div>
                
                <div className="grid grid-cols-2 gap-12 sm:gap-24">
                   <div className="space-y-4">
                      <h4 className="text-[9px] uppercase font-black text-gold tracking-[0.4em]">Nodes</h4>
                      <ul className="space-y-2 text-[10px] text-text/40 uppercase tracking-widest font-medium">
                         <li className="hover:text-gold transition-colors cursor-pointer">Heritage Archive</li>
                         <li className="hover:text-gold transition-colors cursor-pointer">Global Trade</li>
                        <li><Link to="/neural" className="hover:text-gold transition-colors cursor-pointer">Neural Link</Link></li>
                      </ul>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[9px] uppercase font-black text-gold tracking-[0.4em]">Protocol</h4>
                      <ul className="space-y-2 text-[10px] text-text/40 uppercase tracking-widest font-medium">
                         <li className="hover:text-gold transition-colors cursor-pointer">Privacy Handshake</li>
                         <li className="hover:text-gold transition-colors cursor-pointer">Artifact Terms</li>
                         <li className="hover:text-gold transition-colors cursor-pointer">Sovereign Ethics</li>
                      </ul>
                   </div>
                </div>
             </div>
             
             <div className="pt-12 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
                <p className="text-[8px] uppercase tracking-[0.4em] font-black text-text/30">
                  © 2026 House of Daraja // Secure Archival Management
                </p>
                <div className="flex gap-8 text-[8px] uppercase tracking-[0.4em] font-black text-text/30">
                   <span>Kano Kernel</span>
                   <span>Lagos Node</span>
                   <span>London Hub</span>
                </div>
             </div>
          </footer>
        </main>

        <LeemaWidget />
        <BottomNav />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WishlistProvider>
          <OrderProvider>
            <CartProvider>
              <Toaster 
                position="top-center" 
                toastOptions={{
                  className: 'luxury-card !bg-navy/80 !backdrop-blur-xl !border-gold/20 !text-text !font-serif !italic !rounded-2xl shadow-[0_20px_50px_rgba(var(--gold-rgb),0.2)]',
                }} 
              />
              <AppContent />
            </CartProvider>
          </OrderProvider>
        </WishlistProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
