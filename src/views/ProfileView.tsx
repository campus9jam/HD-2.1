import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  LogOut, 
  ChevronRight, 
  Package, 
  Gift, 
  Heart, 
  User, 
  Shield, 
  Award, 
  Zap, 
  Users, 
  Star,
  Crown,
  Scissors,
  Globe,
  Settings,
  Languages,
  AtSign,
  MapPin,
  Save,
  Plus,
  Database,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useOrders } from '../contexts/OrderContext';
import { SUPPORTED_LANGUAGES } from '../services/TranslationService';
import { CacheService, db_local } from '../services/CacheService';
import { SyncService } from '../services/SyncService';
import { toast } from 'sonner';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ProfileView() {
  const { user, profile, loading, isAdmin, signInWithGoogle, signOut, updateProfile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { wishlist } = useWishlist();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editIdentity, setEditIdentity] = useState({
    title: profile?.identityMarkers?.title || '',
    tribe: profile?.identityMarkers?.tribe || '',
    lineage: profile?.identityMarkers?.lineage || ''
  });
  const [channels, setChannels] = useState<string[]>(profile?.communicationChannels || []);
  const [addresses, setAddresses] = useState(profile?.savedAddresses || [{ label: 'Primary Node', address: '' }]);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    const fetchCacheStats = async () => {
      const count = await db_local.cache.count();
      setCacheSize(count);
    };
    fetchCacheStats();
  }, []);

  const clearNeuralCache = async () => {
    try {
      await db_local.cache.clear();
      setCacheSize(0);
      toast.success('Neural Cache Purged', { description: 'All local archetypes have been dematerialized.' });
    } catch (err) {
      toast.error('Purge Failed');
    }
  };

  const addAddress = () => setAddresses([...addresses, { label: '', address: '' }]);
  const updateAddress = (idx: number, field: string, val: string) => {
    const next = [...addresses];
    (next[idx] as any)[field] = val;
    setAddresses(next);
  };
  const removeAddress = (idx: number) => setAddresses(addresses.filter((_, i) => i !== idx));

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown': return <Crown className="w-6 h-6" />;
      case 'Scissors': return <Scissors className="w-6 h-6" />;
      case 'Shield': return <Shield className="w-6 h-6" />;
      case 'Zap': return <Zap className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const currentAchievements = profile?.achievements || [];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // ProtectedRoute handles the !user case, but we keep a fail-safe
  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pb-32 overflow-y-auto"
    >
      {/* Utility Header */}
      <header className="p-8 flex justify-between items-center">
        <Link to="/" className="p-3 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <button onClick={signOut} className="p-3 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-red-500 transition-all">
           <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Profile Header */}
      <section className="flex flex-col items-center gap-6 px-8 text-center">
         <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-gold to-gold/20 shadow-2xl shadow-gold/20">
               <img 
                 src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                 alt="Profile" 
                 className="w-full h-full rounded-full object-cover grayscale brightness-110" 
               />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-gold text-navy rounded-full border-2 border-[var(--navy)]">
               <Shield className="w-4 h-4" />
            </div>
         </div>
         <div className="space-y-4">
            <h1 className="text-4xl font-serif text-text italic">{profile?.displayName || user?.displayName?.split(' ')[0] || 'Noble'} .A</h1>
            <div className="inline-block px-6 py-1.5 bg-gradient-to-r from-gold/30 via-gold/50 to-gold/30 rounded-full border border-gold/20 backdrop-blur-md">
               <span className="text-[9px] uppercase font-black text-text tracking-[0.3em]">{profile?.statusTier || 'GOLD'} MEMBER</span>
            </div>
         </div>
      </section>

      {/* Stats Board */}
      <section className="px-8 mt-12">
         <div className="flex border-t border-b border-text/5 py-8">
            <div className="flex-1 text-center border-r border-text/5">
               <p className="text-xl font-serif text-text">{profile?.xp || 0}</p>
               <p className="text-[8px] uppercase font-black text-text/20 tracking-wider">Points</p>
            </div>
            <div className="flex-1 text-center border-r border-text/5">
               <p className="text-xl font-serif text-text">{orders.length}</p>
               <p className="text-[8px] uppercase font-black text-text/20 tracking-wider">Orders</p>
            </div>
            <div className="flex-1 text-center font-serif text-text italic">
               <p className="text-xl">{currentAchievements.length}</p>
               <p className="text-[8px] uppercase font-black text-text/20 tracking-wider">Honor_Badges</p>
            </div>
         </div>
      </section>

      {/* Achievement Gallery */}
      {currentAchievements.length > 0 && (
        <section className="px-8 mt-12 space-y-6">
           <h3 className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Honor_Chronicle</h3>
           <div className="grid grid-cols-2 gap-4">
              {currentAchievements.map((badge, idx) => (
                 <motion.div 
                   key={badge.id}
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: idx * 0.1 }}
                   className="luxury-card p-4 bg-surface/30 border-text/5 flex flex-col items-center gap-3 group hover:border-gold/30 transition-all cursor-default"
                 >
                    <div className="p-4 rounded-2xl bg-text/5 group-hover:scale-110 transition-transform text-gold">
                       {getIcon(badge.icon)}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-text/40 group-hover:text-gold transition-colors">{badge.title}</span>
                    {badge.unlockedAt && (
                      <span className="text-[6px] text-text/10 uppercase tracking-tighter">{new Date(badge.unlockedAt).toLocaleDateString()}</span>
                    )}
                 </motion.div>
              ))}
           </div>
        </section>
      )}

      {/* Achievements and Profile Logic... */}

      {/* Categorized Actions */}
      <section className="px-8 mt-12 space-y-6">
         {[
            { label: 'My Purchases', icon: Package, count: orders.length, link: '/orders' },
            { label: 'Bespoke Protocols', icon: Scissors, count: 0, link: '/atelier' },
            { label: 'My Rewards', icon: Gift, count: profile?.xp ? 1 : 0, highlight: true, link: '/rewards' },
            { label: 'Saved Items', icon: Heart, count: wishlist.length, link: '/saved' }
         ].map((item, i) => (
            <Link 
              key={i} 
              to={item.link || '#'}
              className={`luxury-card p-6 flex items-center justify-between group cursor-pointer transition-all ${item.highlight ? 'bg-gold/5 border-gold/20' : 'bg-surface/50 hover:bg-text/5'}`}
            >
               <div className="flex items-center gap-6">
                  <div className={`p-3 rounded-2xl ${item.highlight ? 'bg-gold/10' : 'bg-text/5'}`}>
                     <item.icon className={`w-5 h-5 ${item.highlight ? 'text-gold' : 'text-text/40'}`} />
                  </div>
                  <div>
                    <h4 className="text-base font-serif text-text/90 italic">{item.label}</h4>
                    {item.highlight && <p className="text-[8px] uppercase font-black text-text/20 tracking-widest mt-1">Status: Operational</p>}
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  {item.count !== undefined && item.count > 0 && <span className="text-[9px] font-black text-text/20 tracking-widest">{item.count}</span>}
                  <ChevronRight className="w-5 h-5 text-text/10 group-hover:text-gold transition-colors" />
               </div>
            </Link>
         ))}

         {/* Sovereign Configuration Action */}
         <div 
           onClick={() => setShowConfig(!showConfig)}
           className="luxury-card p-6 bg-text/5 flex items-center justify-between group cursor-pointer hover:bg-text/10 transition-all border border-text/5"
         >
            <div className="flex items-center gap-6">
               <div className="p-3 rounded-2xl bg-text/5 group-hover:bg-gold/10 transition-colors">
                  <Settings className="w-5 h-5 text-text/40 group-hover:text-gold transition-colors" />
               </div>
               <div>
                 <h4 className="text-base font-serif text-text italic">Sovereign Configuration</h4>
                 <p className="text-[8px] uppercase font-black text-text/20 tracking-widest mt-1">Identity Markers & Preferences</p>
               </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-text/10 group-hover:text-gold transition-transform duration-300 ${showConfig ? 'rotate-90' : ''}`} />
         </div>

         {/* Config Dropdown */}
         <AnimatePresence>
            {showConfig && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="luxury-card p-8 bg-surface/50 border border-text/5 mt-2 space-y-10">
                   <div className="space-y-6">
                      <h5 className="text-[9px] uppercase font-black text-gold tracking-widest flex items-center gap-2">
                         <Users className="w-3 h-3" /> Identity Markers
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <label className="text-[7px] uppercase font-black text-text/20">Title</label>
                            <input 
                              value={editIdentity.title}
                              onChange={(e) => setEditIdentity({...editIdentity, title: e.target.value})}
                              className="w-full bg-navy/40 border-b border-text/10 p-2 text-xs text-text focus:border-gold outline-none italic font-serif" 
                              placeholder="Noble" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[7px] uppercase font-black text-text/20">Tribe</label>
                            <input 
                              value={editIdentity.tribe}
                              onChange={(e) => setEditIdentity({...editIdentity, tribe: e.target.value})}
                              className="w-full bg-navy/40 border-b border-text/10 p-2 text-xs text-text focus:border-gold outline-none italic font-serif" 
                              placeholder="Hausa" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[7px] uppercase font-black text-text/20">Lineage</label>
                            <input 
                              value={editIdentity.lineage}
                              onChange={(e) => setEditIdentity({...editIdentity, lineage: e.target.value})}
                              className="w-full bg-navy/40 border-b border-text/10 p-2 text-xs text-text focus:border-gold outline-none italic font-serif" 
                              placeholder="Kano Artisans" 
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h5 className="text-[9px] uppercase font-black text-gold tracking-widest flex items-center gap-2">
                         <AtSign className="w-3 h-3" /> Communication Protocols
                      </h5>
                      <div className="flex flex-wrap gap-4">
                         {['Email', 'WhatsApp', 'Discord', 'Neural_Native'].map(c => (
                           <button 
                             key={c}
                             onClick={() => {
                               if (channels.includes(c)) setChannels(channels.filter(x => x !== c));
                               else setChannels([...channels, c]);
                             }}
                             className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                               channels.includes(c) ? 'bg-gold text-navy font-black' : 'bg-text/5 text-text/40 border border-text/5 hover:border-gold/30'
                             }`}
                           >
                              {c}
                           </button>
                         ))}
                      </div>
                   </div>

                    <div className="space-y-6">
                       <h5 className="text-[9px] uppercase font-black text-gold tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Logistics Endpoints</span>
                          <button onClick={addAddress} className="p-2 bg-gold/10 rounded-lg"><Plus className="w-3 h-3 text-gold" /></button>
                       </h5>
                       <div className="space-y-4">
                           {addresses.map((addr, i) => (
                             <div key={i} className="space-y-4 p-4 bg-navy/20 rounded-2xl border border-text/5 group">
                                <div className="flex gap-4">
                                   <input 
                                     placeholder="Label (e.g. Kano Hub)"
                                     value={addr.label}
                                     onChange={(e) => updateAddress(i, 'label', e.target.value)}
                                     className="flex-1 bg-transparent border-b border-text/10 text-xs text-gold outline-none italic font-serif"
                                   />
                                   <button onClick={() => removeAddress(i)} className="text-red-500/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                      <LogOut className="w-3 h-3 rotate-180" />
                                   </button>
                                </div>
                                <textarea 
                                  placeholder="Full Logistics Address"
                                  value={addr.address}
                                  onChange={(e) => updateAddress(i, 'address', e.target.value)}
                                  className="w-full bg-transparent border-b border-text/10 text-[10px] text-text/60 outline-none h-12 resize-none italic font-serif"
                                />
                             </div>
                          ))}
                       </div>
                    </div>





                   <button 
                     onClick={async () => {
                       const profileUpdates = {
                         identityMarkers: editIdentity,
                         communicationChannels: channels as any,
                         savedAddresses: addresses
                       };

                       if (!navigator.onLine) {
                         // Queue for sync
                         await SyncService.queueAction('update_profile', profileUpdates);
                         toast.info('Observation Logged', { description: 'Profile changes queued for synchronization.' });
                       } else {
                         await updateProfile(profileUpdates);
                       }
                       setShowConfig(false);
                     }}
                     className="w-full py-4 bg-gold text-navy rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-text transition-all shadow-[0_10px_30px_rgba(197,160,89,0.3)]"
                   >
                      <Save className="w-4 h-4" /> Save Configuration
                   </button>
                </div>
              </motion.div>
            )}
         </AnimatePresence>

         {/* Neural Cache Management */}
          <div className="luxury-card p-6 bg-gold/5 flex items-center justify-between group border border-gold/10">
            <div className="flex items-center gap-6">
               <div className="p-3 rounded-2xl bg-gold/10">
                  <Database className="w-5 h-5 text-gold" />
               </div>
               <div>
                 <h4 className="text-base font-serif text-text italic">Neural Cache</h4>
                 <p className="text-[8px] uppercase font-black text-text/40 tracking-widest mt-1">
                   {cacheSize} Persistent Data Nodes
                 </p>
               </div>
            </div>
            <button 
              onClick={clearNeuralCache}
              className="p-3 bg-text/5 rounded-xl text-text/20 hover:text-red-500 hover:bg-red-500/10 transition-all border border-text/5"
              title="Purge Cache"
            >
               <RefreshCw className="w-4 h-4" />
            </button>
         </div>

         {/* Archival Status */}
         <div className="luxury-card p-6 bg-navy border border-text/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="p-3 rounded-2xl bg-text/5">
                  <HardDrive className="w-5 h-5 text-text/40" />
               </div>
               <div>
                  <h4 className="text-base font-serif text-text italic">Archive Health</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                     <p className="text-[8px] uppercase font-black text-green-500/60 tracking-widest">G-DRIVE_CORE ONLINE</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Admin Gateway */}
         {isAdmin && (
           <Link 
             to="/admin/dashboard" 
             className="luxury-card p-6 bg-red-500/5 border-red-500/20 flex items-center justify-between group hover:bg-red-500/10 transition-all"
           >
              <div className="flex items-center gap-6">
                 <div className="p-3 rounded-2xl bg-red-500/10">
                    <Shield className="w-5 h-5 text-red-500" />
                 </div>
                 <div>
                   <h4 className="text-base font-serif text-text italic">Sovereign Governance</h4>
                   <p className="text-[8px] uppercase font-black text-red-500/60 tracking-widest mt-1">Platform Kernel Access</p>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500/20 group-hover:text-red-500 transition-colors" />
           </Link>
         )}

         {/* Language Selector Action */}
         <div 
           onClick={() => setShowLangSelector(!showLangSelector)}
           className="luxury-card p-6 bg-text/5 flex items-center justify-between group cursor-pointer hover:bg-text/10 transition-all"
         >
            <div className="flex items-center gap-6">
               <div className="p-3 rounded-2xl bg-text/5">
                  <Languages className="w-5 h-5 text-text/40 group-hover:text-gold transition-colors" />
               </div>
               <div>
                 <h4 className="text-base font-serif text-text italic">Linguistic Protocol</h4>
                 <p className="text-[8px] uppercase font-black text-text/20 tracking-widest mt-1">Current: {SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex gap-1">
                  {SUPPORTED_LANGUAGES.slice(0, 3).map(l => (
                     <div key={l.code} className={`w-1 h-1 rounded-full ${l.code === language ? 'bg-gold' : 'bg-text/10'}`}></div>
                  ))}
               </div>
               <ChevronRight className={`w-5 h-5 text-text/10 group-hover:text-gold transition-transform duration-300 ${showLangSelector ? 'rotate-90' : ''}`} />
            </div>
         </div>

         {/* Language Dropdown */}
         <AnimatePresence>
            {showLangSelector && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-text/2 space-y-2 rounded-3xl"
              >
                <div className="grid grid-cols-2 gap-2 p-2">
                   {SUPPORTED_LANGUAGES.map(l => (
                      <button 
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setShowLangSelector(false); }}
                        className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          language === l.code 
                            ? 'bg-gold text-navy border-gold' 
                            : 'bg-text/5 text-text/40 border-text/5 hover:border-gold/30 hover:text-gold'
                        }`}
                      >
                         {l.name}
                      </button>
                   ))}
                </div>
              </motion.div>
            )}
         </AnimatePresence>
      </section>

      {/* Global Ledger Info */}
      <section className="px-8 mt-20 text-center opacity-30">
         <p className="text-[7px] uppercase font-black tracking-[0.5em] text-text">Protocol_v4.2 // Citizen_Link_Active</p>
      </section>
    </motion.div>
  );
}
