import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Search, 
  UserPlus, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Scissors
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AtelierOrder, AtelierClient } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { unlockAchievement } from '../lib/achievementUtils';
import { registerAtelierClient, fetchAtelierClient, fetchClientOrders } from '../services/AtelierService';

export default function AtelierPortalView() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [clientProfile, setClientProfile] = useState<AtelierClient | null>(null);
  const [orders, setOrders] = useState<AtelierOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync with Firestore
  useEffect(() => {
    async function checkRegistration() {
      if (user?.email) {
        // Try to find client by searching? Actually, our service uses username as ID.
        // For prototype, we might need a way to link email to username if we don't have it.
        // We'll use a naming convention: noble_{email_prefix} or similar if they don't have one.
        // But the user enters it. We should ideally store the link in UserProfile.
        
        if (profile?.uid) {
           // For now, we attempt to fetch based on what's in profile if we had it there.
           // Since we don't have 'atelierUsername' in UserProfile yet, we'll try to find by email if we had that query.
           // Let's assume they might already have a username.
           // For simplicity in this turn, we'll fetch orders if they are registered.
        }
      }
      setLoading(false);
    }
    checkRegistration();
  }, [user, profile]);

  const loadData = async (uname: string) => {
    const client = await fetchAtelierClient(uname);
    if (client) {
      setClientProfile(client);
      setIsRegistered(true);
      const clientOrders = await fetchClientOrders(uname);
      setOrders(clientOrders);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !user) return;
    
    // Check if username already exists
    const existing = await fetchAtelierClient(username.trim());
    if (existing) {
      alert("This username node is already reserved. Please choose another.");
      return;
    }

    const newClient: Omit<AtelierClient, 'id'> = {
      clientName: user.displayName || 'Noble Guest',
      username: username.trim(),
      email: user.email || '',
      phone: '',
      address: '',
      clientType: 'Regular',
      notes: '',
    };

    const success = await registerAtelierClient(newClient);
    
    if (success) {
      // Award Pioneer achievement
      if (profile) {
        unlockAchievement(profile.uid, 'PIONEER', profile).catch(console.error);
      }
      await loadData(username.trim());
    }
  };

  // Effect to load data if we have a known username (e.g. from local storage as a hint)
  useEffect(() => {
    const savedUsername = localStorage.getItem('daraja_atelier_username');
    if (savedUsername) {
      loadData(savedUsername);
    }
  }, []);

  const onRegisterSuccess = (uname: string) => {
    localStorage.setItem('daraja_atelier_username', uname);
  };

  if (!isRegistered) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-navy p-8 pt-24 space-y-12"
      >
        <Link to="/" className="p-3 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all inline-block">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        
        <div className="luxury-card p-12 space-y-8 bg-surface/50 border-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.05)]">
           <div className="p-6 bg-gold/10 rounded-[2rem] inline-block border border-gold/20">
              <ShieldCheck className="w-12 h-12 text-gold" />
           </div>
           
           <div className="space-y-4">
              <h1 className="text-4xl font-serif text-text italic leading-tight">Secure Your <br/> <span className="text-gold">Atelier Link</span></h1>
              <p className="text-sm text-text/30 italic max-w-sm">
                Each bespoke creation requires a sovereign identity node. Establish your username to track measurements and archival progress.
              </p>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-[0.3em] text-text/20 ml-2">Unique_Node_ID</label>
                 <input 
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                   placeholder="e.g. noble_patron_01"
                   className="luxury-input w-full !rounded-2xl font-mono text-sm tracking-wider"
                 />
              </div>
              <button 
                onClick={handleRegister}
                disabled={!username}
                className="luxury-button w-full !py-6 group disabled:opacity-50"
              >
                Sync Identity Node
                <ArrowRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-navy pb-32"
    >
      {/* Header */}
      <header className="p-8 pt-12 flex justify-between items-center bg-navy/80 backdrop-blur-xl sticky top-0 z-40 border-b border-text/5">
         <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-gold tracking-[0.4em] mb-1">Citizen_Atelier</span>
            <h1 className="text-2xl font-serif text-text italic">{clientProfile?.username}</h1>
         </div>
         <Link to="/atelier/order" className="p-4 bg-gold rounded-2xl shadow-lg shadow-gold/20 group hover:scale-105 active:scale-95 transition-all">
            <Scissors className="w-5 h-5 text-navy group-hover:rotate-12 transition-transform" />
         </Link>
      </header>

      <main className="p-8 space-y-12">
         {/* Action Card */}
         <section className="luxury-card p-10 bg-gold/5 border-gold/20 flex flex-col items-center text-center gap-6 group hover:bg-gold/10 transition-all cursor-pointer overflow-hidden relative" onClick={() => navigate('/atelier/order')}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gold/10 rounded-[1.5rem] flex items-center justify-center border border-gold/20">
               <Plus className="w-8 h-8 text-gold" />
            </div>
            <div className="space-y-2 z-10">
               <h3 className="text-2xl font-serif text-text italic">Place New Order</h3>
               <p className="text-[10px] text-text/40 uppercase font-black tracking-widest">Initiate Bespoke Fabrication Pipeline</p>
            </div>
         </section>

         {/* Order History */}
         <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-text/5 pb-4">
               <h3 className="text-[11px] uppercase font-black text-text/20 tracking-[0.4em]">Archival_Record</h3>
               <span className="text-[10px] font-serif text-gold italic">{orders?.length || 0} Orders</span>
            </div>

            <div className="space-y-4">
               {orders?.length === 0 ? (
                 <div className="p-12 text-center space-y-4 opacity-40 italic">
                    <Clock className="w-8 h-8 mx-auto" />
                    <p className="text-xs">No active fabrication nodes found.</p>
                 </div>
               ) : (
                 orders?.map((order) => (
                    <div key={order.id} className="luxury-card p-6 bg-surface/30 border-text/5 flex flex-col gap-4 group hover:border-text/10 transition-all">
                       <div className="flex justify-between items-start">
                          <div className="space-y-1">
                             <h4 className="text-lg font-serif text-text italic">{order.outfitName}</h4>
                             <p className="text-[10px] text-text/30 uppercase font-black tracking-widest leading-none">{order.outfitType} // {order.fabric}</p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-text/10 ${
                            order.status === 'Ready' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            order.status === 'Sewing' ? 'bg-gold/10 text-gold border-gold/20 animate-pulse' : 
                            'bg-text/5 text-text/40'
                          }`}>
                            {order.status}
                          </div>
                       </div>
                       
                       <div className="flex justify-between items-center pt-4 border-t border-text/5">
                          <span className="text-[10px] font-mono text-text/20">Ref: #{order.id}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-serif text-text italic">₦{order.price.toLocaleString()}</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-gold/50"></div>
                             <span className="text-[9px] text-text/40">
                                {order.createdAt?.seconds 
                                  ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() 
                                  : new Date(order.createdAt).toLocaleDateString()}
                             </span>
                          </div>
                       </div>
                    </div>
                 ))
               )}
            </div>
         </section>
      </main>
    </motion.div>
  );
}
