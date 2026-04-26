import { motion } from 'motion/react';
import { useCart } from '../contexts/CartContext';
import { ShieldCheck, Lock, CreditCard, ChevronRight, Globe, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { unlockAchievement } from '../lib/achievementUtils';
import { toast } from 'sonner';

export default function CheckoutView() {
  const { cart, totalPrice, clearCart } = useCart();
  const { profile } = useAuth();
  const { addOrder } = useOrders();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNum: '',
    expiry: '',
    cvc: '',
    phone: ''
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate real network delay 
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Basic Validation simulation
    if (paymentMethod === 'card') {
      if (formData.cardNum.length < 16) {
        toast.error("Auth Fail: Vault ID (Card) format invalid.");
        setIsProcessing(false);
        return;
      }
    } else {
      if (formData.phone.length < 10) {
        toast.error(`Auth Fail: ${paymentMethod.toUpperCase()} identity node missing.`);
        setIsProcessing(false);
        return;
      }
    }

    try {
      // Record Order in Provance Ledger (Firestore)
      await addOrder({
        items: cart,
        totalValue: totalPrice,
        buyerId: profile?.uid
      });

      // Mock successful payment
      setStep(3);
      
      // Award Patron achievement
      if (profile) {
        unlockAchievement(profile.uid, 'PATRON', profile).catch(console.error);
      }

      setTimeout(() => {
        clearCart();
      }, 2000);
    } catch (err) {
      toast.error("Settlement Node Error: Consensus failed during transaction.");
    } finally {
      setIsProcessing(false);
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
           <span className="text-[10px] uppercase font-black text-gold tracking-[0.4em]">Secure_Settlement.v4</span>
           <h1 className="text-4xl md:text-6xl font-serif text-text italic">Finalize <span className="text-gold">Acquisition.</span></h1>
        </div>
        <div className="flex gap-4">
           {[1, 2, 3].map(i => (
             <div key={i} className={`w-14 h-1 rounded-full transition-all duration-1000 ${step >= i ? 'bg-gold shadow-[0_0_20px_rgba(197,160,89,0.3)]' : 'bg-text/5'}`}></div>
           ))}
        </div>
      </header>

      {step === 1 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
           <div className="space-y-12">
              <h3 className="text-xs uppercase font-black text-text/20 tracking-[0.2em]">Identity Selection</h3>
              <div className="space-y-10">
                  <div className="space-y-4">
                     <label className="text-[9px] font-black uppercase text-text/40 tracking-widest px-2">Full Name</label>
                     <input className="w-full bg-navy/40 border-b border-text/10 p-4 text-text focus:border-gold outline-none italic font-serif transition-all" placeholder="e.g. Aminu Lagos-Kano" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[9px] font-black uppercase text-text/40 tracking-widest px-2">Identity Endpoint</label>
                     <input className="w-full bg-navy/40 border-b border-text/10 p-4 text-text focus:border-gold outline-none transition-all" placeholder="noble@identity.hd" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[9px] font-black uppercase text-text/40 tracking-widest px-2">Delivery Coordinates</label>
                     <textarea className="w-full bg-navy/40 border-b border-text/10 p-4 text-text focus:border-gold outline-none italic font-serif min-h-[120px] transition-all" placeholder="Royal Court Archives..."></textarea>
                  </div>
              </div>
              <button 
                 onClick={() => setStep(2)}
                 className="luxury-button w-full !rounded-2xl !py-8 text-xs font-black tracking-[0.4em]"
              >
                PROCEED TO SETTLEMENT <ChevronRight className="w-5 h-5 ml-4" />
              </button>
           </div>

           <div className="space-y-8">
              <div className="luxury-card p-12 bg-surface/30 border-text/5 space-y-10">
                 <h4 className="text-xs font-black uppercase text-text/20 tracking-widest">Acquisition Summary</h4>
                 <div className="space-y-8 border-b border-text/5 pb-10">
                    <div className="flex justify-between items-center">
                       <span className="text-base font-serif italic text-text/60">Subtotal Allocation</span>
                       <span className="text-xl font-serif text-text">₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-base font-serif italic text-text/60">Secure Logistics</span>
                       <span className="text-gold font-serif text-lg italic">Included (Elite)</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase font-black text-text/20">Total Value</span>
                    <span className="text-5xl font-serif text-text italic drop-shadow-[0_10px_30px_rgba(var(--gold-rgb),0.2)]">₦{totalPrice.toLocaleString()}</span>
                 </div>
              </div>

              <div className="p-8 bg-navy/60 border border-text/5 rounded-3xl flex gap-6 items-center italic">
                 <Lock className="w-8 h-8 text-gold/40 flex-shrink-0" />
                 <p className="text-[9px] uppercase tracking-widest font-black leading-relaxed text-text/30">
                   Vault Secure. RSA_4096 Encryption Active. Sovereign Privacy is guaranteed by the Daraja Kernel.
                 </p>
              </div>
           </div>
        </section>
      )}

      {step === 2 && (
        <section className="max-w-2xl mx-auto space-y-16 py-12">
           <div className="text-center space-y-8">
              <div className="p-10 bg-gold/10 inline-block rounded-full border border-gold/40 shadow-[0_0_60px_rgba(197,160,89,0.2)]">
                 <CreditCard className="w-14 h-14 text-gold" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-serif text-text italic tracking-tight">Sovereign Settlement.</h2>
                 <p className="text-text/40 italic font-serif">Authorize the asset transfer via supported Nigerian gateways.</p>
              </div>
           </div>

           {/* Payment Method Selector */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'card', label: 'Credit Card', icon: CreditCard },
                { id: 'moniepoint', label: 'Moniepoint', icon: ShieldCheck, color: 'text-blue-500' },
                { id: 'opay', label: 'OPay', icon: Globe, color: 'text-green-500' }
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-6 rounded-2xl border flex flex-col items-center gap-4 transition-all ${
                    paymentMethod === method.id ? 'bg-gold/10 border-gold shadow-[0_0_30px_rgba(197,160,89,0.2)]' : 'bg-text/5 border-text/5 grayscale opacity-40'
                  }`}
                >
                   <method.icon className={`w-8 h-8 ${method.color || 'text-gold'}`} />
                   <span className="text-[9px] uppercase font-black text-text tracking-widest">{method.label}</span>
                </button>
              ))}
           </div>

           <div className="luxury-card p-12 bg-surface/30 space-y-10">
              {paymentMethod === 'card' ? (
                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[9px] uppercase font-black text-text/40 tracking-widest">Vault Key (Card Number)</label>
                      <input 
                        required
                        value={formData.cardNum}
                        onChange={(e) => setFormData({...formData, cardNum: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                        className="w-full bg-navy border border-text/10 rounded-2xl px-8 py-6 text-text text-xl tracking-[0.3em] font-mono focus:border-gold outline-none transition-all" 
                        placeholder="XXXX XXXX XXXX XXXX" 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[9px] uppercase font-black text-text/40 tracking-widest">Exp Sync</label>
                         <input 
                           required 
                           value={formData.expiry}
                           onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                           className="w-full bg-navy border border-text/10 rounded-2xl px-8 py-6 text-text focus:border-gold outline-none" 
                           placeholder="MM/YY" 
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[9px] uppercase font-black text-text/40 tracking-widest">Auth Code</label>
                         <input 
                           required 
                           value={formData.cvc}
                           onChange={(e) => setFormData({...formData, cvc: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                           className="w-full bg-navy border border-text/10 rounded-2xl px-8 py-6 text-text focus:border-gold outline-none" 
                           placeholder="CVC" 
                         />
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-8 text-center">
                   <div className="p-12 bg-gold/5 rounded-3xl border border-dashed border-gold/20 animate-pulse">
                      <p className="text-sm font-serif text-text/60 italic">Redirecting to {paymentMethod?.toUpperCase()} Sovereign Node...</p>
                      <p className="text-[8px] uppercase font-black text-text/10 tracking-[0.4em] mt-6">Awaiting Biometric Confirmation</p>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[9px] uppercase font-black text-text/40 tracking-widest">Account / Phone Number</label>
                      <input 
                        required 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11)})}
                        className="w-full bg-navy border border-text/10 rounded-2xl px-8 py-6 text-text text-center text-xl tracking-[0.2em] focus:border-gold outline-none transition-all" 
                        placeholder="080 XXXX XXXX" 
                      />
                   </div>
                </div>
              )}
           </div>

           <button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="luxury-button w-full !py-8 text-xs font-black tracking-[0.4em] !rounded-2xl"
           >
              {isProcessing ? (
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                  SYNCHRONIZING LEDGER...
                </div>
              ) : (
                <>AUTHORIZE TRANSACTION (₦{totalPrice.toLocaleString()}) <ShieldCheck className="w-5 h-5 ml-4" /></>
              )}
           </button>
           <button onClick={() => setStep(1)} className="text-[9px] uppercase font-black text-text/20 hover:text-gold transition-colors w-full tracking-[0.5em]">
              MODIFY IDENTITY PROTOCOLS
           </button>
        </section>
      )}

      {step === 3 && (
        <section className="py-24 text-center space-y-16">
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="p-16 bg-gold/10 inline-block rounded-full border-4 border-gold shadow-[0_0_100px_rgba(var(--gold-rgb),0.3)]"
            >
               <CheckCircle className="w-32 h-32 text-gold animate-pulse" />
            </motion.div>
            <div className="space-y-8">
               <h2 className="text-7xl font-serif text-text italic">Acquisition <br/> <span className="text-gold">Sovereign.</span></h2>
               <p className="text-2xl font-serif text-text/60 italic">Your artifacts are secured in the vault.</p>
               <p className="text-xs font-black uppercase text-text/20 max-w-sm mx-auto tracking-widest leading-loose">
                  THE PROVENANCE LEDGER HAS BEEN UPDATED. DARAJA KERNEL IS PREPARING LOGISTICS NODES.
               </p>
            </div>
            <div className="pt-20">
               <Link to="/" className="luxury-button inline-flex !px-24 !py-8 tracking-[0.5em] text-xs">RETURN TO ORIGIN</Link>
            </div>
        </section>
      )}
    </motion.div>
  );
}
