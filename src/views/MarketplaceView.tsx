import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Store, ShieldCheck, ArrowRight, UserCheck, Users, Search, Check, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDiscoveryNetwork, requestConnection } from '../services/DiscoveryService';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import PullToRefresh from '../components/PullToRefresh';
import { toast } from 'sonner';

export default function MarketplaceView() {
  const { profile } = useAuth();
  const [network, setNetwork] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'All' | 'Gold' | 'Platinum' | 'Master'>('All');
  const [connectingIds, setConnectingIds] = useState<string[]>([]);
  const [successfulIds, setSuccessfulIds] = useState<string[]>([]);

  const filteredNetwork = network.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.statusTier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'All' || u.statusTier === filterTier;
    return matchesSearch && matchesTier;
  });

  const handleRefresh = async () => {
    setLoading(true);
    const data = await fetchDiscoveryNetwork(profile?.uid);
    setNetwork(data);
    setLoading(false);
  };

  const handleConnect = async (uid: string) => {
    if (!profile?.uid) return;
    setConnectingIds(prev => [...prev, uid]);
    const success = await requestConnection(profile.uid, uid);
    if (success) {
      setSuccessfulIds(prev => [...prev, uid]);
    }
    setConnectingIds(prev => prev.filter(id => id !== uid));
  };

  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      toast.success('Frequency Synchronized', { 
        description: 'Communal broadcast established across all noble sectors.',
        icon: <Radio className="w-5 h-5 text-gold" />
      });
    }, 2000);
  };

  const vendors = [
    { id: 'v1', name: 'Kano Textile Archive', specialty: 'Hand-woven Brocade', img: 'https://picsum.photos/seed/kanotxt/800/600' },
    { id: 'v2', name: 'Abeokuta Indigo Guild', specialty: 'Archival Adire', img: 'https://picsum.photos/seed/indigo/800/600' }
  ];

  useEffect(() => {
    async function loadNetwork() {
      const peers = await fetchDiscoveryNetwork(profile?.uid);
      setNetwork(peers);
      setLoading(false);
    }
    loadNetwork();
  }, [profile?.uid]);

  const handleNegotiate = (vendorName: string) => {
    window.dispatchEvent(new CustomEvent('leema:trigger', { 
      detail: { text: `Greetings Leema, I wish to initiate a formal negotiation with the ${vendorName} regarding their archival artifacts.` }
    }));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen bg-navy pt-12 pb-40 px-8 max-w-7xl mx-auto space-y-24 overflow-y-auto no-scrollbar"
      >
      <header className="space-y-8">
         <div className="flex items-center gap-4 text-text/20">
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Node_Network.v4</span>
            <div className="flex-grow h-[1px] bg-text/5"></div>
         </div>
         <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-6">
               <h1 className="text-5xl md:text-8xl font-serif text-text italic tracking-tight leading-[0.9]">Producers of <br/> <span className="text-gold">Nobility.</span></h1>
               <div className="flex flex-wrap gap-4 pt-4">
                  {['All', 'Gold', 'Platinum', 'Master'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setFilterTier(tier as any)}
                      className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        filterTier === tier 
                          ? 'bg-gold text-navy' 
                          : 'bg-text/5 text-text/40 hover:text-text border border-text/5'
                      }`}
                    >
                      {tier} {tier !== 'All' ? 'Tier' : 'Sectors'}
                    </button>
                  ))}
               </div>
            </div>
            <div className="flex bg-text/5 p-4 rounded-3xl border border-text/5 backdrop-blur-3xl group focus-within:border-gold/30 transition-all border-dashed">
               <input 
                 type="text" 
                 placeholder="Search Node Registry..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none text-text font-mono text-[10px] px-4 w-48 placeholder:text-text/10"
               />
               <button className="p-3 bg-gold text-navy rounded-2xl hover:scale-105 transition-all">
                  <Search className="w-4 h-4" />
               </button>
            </div>
         </div>
      </header>

      {/* Featured Collective */}
      <section className="relative group h-[70vh] rounded-[3rem] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.6)] border border-[var(--border)]">
         <img 
           src="https://picsum.photos/seed/weaving/1200/1800" 
           alt="Featured Collective" 
           className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[2000ms]"
           referrerPolicy="no-referrer"
           loading="lazy"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent"></div>
         <div className="absolute bottom-16 left-12 right-12 space-y-8">
            <div className="flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-gold" />
               <span className="text-[10px] uppercase font-black text-text/60 tracking-[0.3em] bg-text/5 px-4 py-2 rounded-full backdrop-blur-md">Master Collective Node</span>
            </div>
            <div className="space-y-4">
               <h2 className="text-5xl md:text-7xl font-serif text-text italic leading-tight">Kano Textile Archive</h2>
               <p className="text-text/40 text-base italic font-serif max-w-xl leading-relaxed">
                  Specializing in the 500-year-old indigo dye pit traditions and hand-loomed royal regalia for the modern sovereign.
               </p>
            </div>
            <Link to="/shop" className="luxury-button inline-flex !py-6 !px-12 text-[11px] tracking-[0.2em] shadow-2xl shadow-gold/10">DISCOVER COLLECTIONS</Link>
         </div>
      </section>

      {/* Peer Discovery Social Layer */}
      <section className="space-y-12">
          <div className="flex items-center justify-between border-b border-text/5 pb-8">
            <div className="space-y-1">
               <h3 className="text-[11px] font-black uppercase text-gold tracking-[0.4em]">Noble Network</h3>
               <p className="text-[9px] text-text/20 uppercase font-black tracking-widest leading-none">Global Citizen Registry</p>
            </div>
            <div className="flex -space-x-4">
               {network.slice(0, 5).map((u, i) => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--navy)] overflow-hidden bg-navy ring-1 ring-text/10">
                   <img 
                     src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName}`} 
                     alt="" 
                     className="w-full h-full object-cover" 
                     loading="lazy"
                   />
                 </div>
               ))}
               <div className="w-10 h-10 rounded-full border-2 border-[var(--navy)] bg-text/5 flex items-center justify-center text-[8px] font-black text-text/40 ring-1 ring-text/10 backdrop-blur-xl">
                  +{network.length > 5 ? network.length - 5 : network.length}
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-64 bg-text/5 rounded-3xl animate-pulse border border-text/5"></div>)
            ) : filteredNetwork.length === 0 ? (
              <div className="col-span-full py-20 text-center luxury-card border-dashed">
                 <p className="text-text/20 font-serif italic">Silent frequencies detected in this sector. Recalibrate search parameters.</p>
              </div>
            ) : filteredNetwork.map((peer) => (
              <motion.div 
                key={peer.uid}
                whileHover={{ y: -8 }}
                className="luxury-card p-8 bg-surface/50 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="space-y-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gold/5 p-1 border border-gold/10 overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.displayName}`} 
                      alt="" 
                      className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-700" 
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-text italic group-hover:text-gold transition-colors truncate">{peer.displayName}</h4>
                    <span className="text-[8px] uppercase font-black tracking-widest text-text/20">{peer.statusTier} NODE</span>
                  </div>
                  <button 
                    onClick={() => handleConnect(peer.uid)}
                    disabled={connectingIds.includes(peer.uid) || successfulIds.includes(peer.uid)}
                    className={`w-full py-4 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      successfulIds.includes(peer.uid)
                        ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                        : connectingIds.includes(peer.uid)
                          ? 'bg-gold text-navy border-gold' 
                          : 'bg-text/5 border-[var(--border)] hover:bg-gold hover:text-navy hover:border-gold'
                    }`}
                  >
                    {connectingIds.includes(peer.uid) ? (
                      <div className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                    ) : successfulIds.includes(peer.uid) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <UserCheck className="w-3 h-3" />
                    )}
                    {successfulIds.includes(peer.uid) ? 'Handshake Sent' : connectingIds.includes(peer.uid) ? 'Syncing...' : 'Connect'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
      </section>

      {/* Vendor Nodes */}
      <section className="space-y-12">
         <div className="flex items-center justify-between border-b border-text/5 pb-8">
            <div className="space-y-1">
               <h3 className="text-[11px] font-black uppercase text-text/20 tracking-[0.4em]">Verified Producers</h3>
               <p className="text-[9px] text-text/20 uppercase font-black tracking-widest leading-none">Artisanal Guild Network</p>
            </div>
            <span className="text-[10px] uppercase font-black text-gold tracking-widest">12 active branches</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {vendors.map((vendor, i) => (
               <div key={i} className="luxury-card p-10 flex flex-col sm:flex-row items-center gap-10 bg-text/5 group !rounded-[2.5rem] hover:bg-gold/[0.03] transition-all border-text/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <Store className="w-4 h-4 text-text/10 group-hover:text-gold/20 transition-colors" />
                  </div>
                  <div className="w-32 h-32 rounded-[2rem] overflow-hidden grayscale brightness-50 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1500ms] flex-shrink-0 shadow-2xl ring-1 ring-text/10">
                     <img 
                       src={vendor.img} 
                       alt={vendor.name} 
                       className="w-full h-full object-cover" 
                       referrerPolicy="no-referrer" 
                       loading="lazy"
                     />
                  </div>
                  <div className="flex-grow space-y-4 text-center sm:text-left">
                     <div>
                        <h4 className="text-2xl font-serif text-text italic transition-colors group-hover:text-gold leading-tight">{vendor.name}</h4>
                        <p className="text-[9px] uppercase font-black text-text/20 tracking-[0.3em] mt-2">{vendor.specialty}</p>
                     </div>
                     <button 
                        onClick={() => handleNegotiate(vendor.name)}
                        className="flex items-center justify-center sm:justify-start gap-4 text-gold group-hover:translate-x-4 transition-transform pt-4 w-full"
                     >
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Negotiate Direct</span>
                        <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Global Broadcast Node */}
      <section className="pb-20">
         <div className="luxury-card p-16 bg-navy/50 border-gold/10 !rounded-[3rem] flex flex-col items-center text-center space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.05),transparent_70%)]"></div>
            
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 backdrop-blur-xl relative"
            >
               <Users className="w-8 h-8 text-gold" />
               <div className="absolute inset-0 rounded-full bg-gold/20 animate-ping opacity-20"></div>
            </motion.div>
            
            <div className="space-y-6 relative z-10">
               <h4 className="text-4xl md:text-5xl font-serif text-text italic leading-tight">Communal Councils</h4>
               <p className="text-base text-text/40 italic font-serif leading-relaxed max-w-xl mx-auto">
                  Initiate global broadcasts to coordinate high-tier acquisitions, peer-to-peer artifact trades, and local sovereign assemblies within the noble network.
               </p>
            </div>
            
            <button 
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className="px-12 py-6 bg-gold text-navy text-[11px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/20 flex items-center gap-4 disabled:opacity-50"
            >
               {isBroadcasting ? (
                 <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
               ) : null}
               {isBroadcasting ? 'RESONATING...' : 'INITIATE GLOBAL BROADCAST'}
            </button>
         </div>
      </section>
    </motion.div>
    </PullToRefresh>
  );
}
