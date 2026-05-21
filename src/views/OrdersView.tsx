import { motion, AnimatePresence } from 'motion/react';
import { useOrders } from '../contexts/OrderContext';
import { 
  Package, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Hash, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  PlayCircle,
  ShieldCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateLogisticsStatus } from '../services/LogisticsService';
import { releaseEscrow } from '../services/WalletService';
import { useAuth } from '../contexts/AuthContext';

export default function OrdersView() {
  const { user } = useAuth();
  const { orders, refreshOrders } = useOrders();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isReleasing, setIsReleasing] = useState<string | null>(null);

  const simulateTransit = async (orderId: string) => {
     setIsUpdating(orderId);
     const event = {
        status: 'In Transit',
        location: 'Northern Logistics Node',
        description: 'Artifact transit initiated via Sahel Express. Synchronization complete.',
        timestamp: new Date().toISOString()
     };

     const success = await updateLogisticsStatus(orderId, event);
     if (success) {
        await refreshOrders();
        toast.success("Logistics Node Synchronized: Artifact in Transit");
     } else {
        toast.error("Logistics synchronization failed.");
     }
     setIsUpdating(null);
  };

  const handleReleaseFunds = async (order: any) => {
    if (!user) return;
    setIsReleasing(order.id);
    try {
      // Assuming order.auctionId and order.sellerId exist for auction wins
      // For standard purchases, escrow might not be needed, but we simulate it
      const sellerId = order.vendorId || order.sellerId || "V_ARCHIVE_01";
      await releaseEscrow(sellerId, user.uid, order.totalValue, order.auctionId || order.id);
      
      toast.success("Sovereign Settlement Finalized", {
        description: "Funds have been released from the vault to the artisan."
      });
      
      await refreshOrders();
    } catch (error: any) {
      toast.error("Settlement error", { description: error.message });
    } finally {
      setIsReleasing(null);
    }
  };
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-navy pt-12 pb-40 px-8 max-w-4xl mx-auto space-y-16"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-10 pb-12 border-b border-text/5">
        <div className="space-y-4">
           <span className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Provenance_Ledger.v4</span>
           <h1 className="text-4xl md:text-6xl font-serif text-text italic">My <span className="text-gold">Acquisitions.</span></h1>
        </div>
        <Link to="/profile" className="p-4 bg-text/5 rounded-full border border-text/10 text-text/40 hover:text-text transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </header>

      {orders.length === 0 ? (
        <section className="py-40 text-center space-y-10">
           <div className="p-12 bg-text/5 inline-block rounded-full border border-text/10 opacity-20">
              <Package className="w-20 h-20" />
           </div>
           <div className="space-y-4">
              <h3 className="text-2xl font-serif text-text/40 italic">No acquisitions found in the ledger.</h3>
              <p className="text-[10px] uppercase font-black text-text/10 tracking-widest">Connect with local nodes and finalize your first settlement.</p>
           </div>
           <Link to="/marketplace" className="luxury-button inline-flex !px-16">BROWSE MARKETPLACE</Link>
        </section>
      ) : (
        <section className="space-y-10">
           {orders.map((order) => (
             <div key={order.id} className="luxury-card p-10 bg-surface/30 border-text/5 space-y-8 group hover:border-gold/20 transition-all">
                <div className="flex flex-wrap justify-between items-start gap-6">
                   <div className="flex gap-6 items-center">
                      <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
                         <Hash className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                         <h4 className="text-lg font-mono text-text tracking-widest group-hover:text-gold transition-colors">{order.id}</h4>
                         <span className={`text-[8px] uppercase font-black px-3 py-1 rounded-full tracking-[0.2em] mt-2 block w-fit ${
                           order.status === 'secured' ? 'bg-green-500/10 text-green-500' : 'bg-gold/10 text-gold'
                         }`}>
                           {order.status}
                         </span>
                      </div>
                   </div>
                   <div className="flex gap-12 text-right">
                      <div className="space-y-1">
                         <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Total Value</p>
                         <p className="text-xl font-serif text-text italic">₦{order.totalValue.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] uppercase font-black text-text/20 tracking-widest">Nodes Engaged</p>
                         <p className="text-xl font-serif text-text italic">{order.items.length}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-text/5 pt-8">
                   <div className="flex items-center gap-4 text-text/40">
                      <Calendar className="w-4 h-4 text-gold/40" />
                      <span className="text-[10px] uppercase font-black tracking-widest">{new Date(order.timestamp).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                   </div>
                   <div className="flex items-center gap-4 text-text/40">
                      <MapPin className="w-4 h-4 text-gold/40" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Royal Logistics Endpoint</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[8px] uppercase font-black text-text/10 tracking-widest">Artifact Manifest</p>
                   <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex-shrink-0 w-20 h-24 rounded-xl border border-text/5 overflow-hidden grayscale hover:grayscale-0 transition-all cursor-crosshair">
                           <img src={item.img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                   </div>
                </div>

                {order.status !== 'finalized' && (
                  <div className="p-6 bg-gold/5 border border-gold/10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-gold/10 rounded-full">
                          <ShieldCheck className="w-5 h-5 text-gold" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gold/60 mb-1">Escrow Security Active</p>
                          <p className="text-[11px] text-text/60 italic">Release funds only after inspecting the artifact's high-fidelity physical state.</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleReleaseFunds(order)}
                      disabled={isReleasing === order.id}
                      className="whitespace-nowrap px-8 py-4 bg-gold text-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:shadow-[0_0_30px_rgba(var(--gold-rgb),0.3)] disabled:opacity-50 transition-all"
                    >
                       {isReleasing === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'RELEASE SETTLEMENT'}
                    </button>
                  </div>
                )}

                {/* Logistics Timeline Toggle */}
                <div className="pt-8 border-t border-text/5">
                   <button 
                     onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                     className="w-full flex justify-between items-center group/btn"
                   >
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-gold/5 rounded-lg border border-gold/10">
                            <Truck className="w-4 h-4 text-gold/60" />
                         </div>
                         <span className="text-[9px] uppercase font-black text-text/40 tracking-[0.2em] group-hover/btn:text-gold transition-colors">Logistics_Timeline.v4</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-text/10 transition-transform duration-500 ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                   </button>

                   <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                           <div className="pt-8 space-y-8 pl-4">
                              {(order.logistics || []).map((event, idx) => (
                                <div key={idx} className="relative pl-10 border-l border-text/5">
                                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-navy border-2 border-gold flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></div>
                                   </div>
                                   <div className="space-y-2">
                                      <div className="flex justify-between items-start">
                                         <h5 className="text-sm font-serif text-text italic">{event.status}</h5>
                                         <span className="text-[8px] font-mono text-text/20">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-text/40">
                                         <MapPin className="w-3 h-3 text-gold/40" />
                                         <p className="text-[9px] uppercase font-black tracking-widest">{event.location}</p>
                                      </div>
                                      <p className="text-[10px] text-text/30 italic leading-relaxed">{event.description}</p>
                                   </div>
                                </div>
                              ))}
                              
                              <div className="pt-4 border-t border-text/5">
                                 <button 
                                   onClick={() => simulateTransit(order.id)}
                                   disabled={isUpdating === order.id}
                                   className="flex items-center gap-3 text-[8px] font-black uppercase text-gold/40 hover:text-gold transition-colors disabled:opacity-30"
                                 >
                                    {isUpdating === order.id ? (
                                      <div className="w-4 h-4 border-2 border-gold/40 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <PlayCircle className="w-4 h-4" />
                                    )}
                                    Trigger Logistics Simulation
                                 </button>
                              </div>
                              {(!order.logistics || order.logistics.length === 0) && (
                                <div className="p-8 text-center bg-text/2 rounded-2xl border border-dashed border-text/5">
                                   <p className="text-[9px] uppercase font-black text-text/20 tracking-widest">Awaiting Logistics Node Initialization</p>
                                </div>
                              )}
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
           ))}
        </section>
      )}
    </motion.div>
  );
}
