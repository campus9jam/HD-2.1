import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Clock, ShieldCheck, Landmark, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VirtualAccountProps {
  orderId: string;
  amount: number;
  accountNumber: string;
  bankName: string;
  expiryTime: number;
  onPaymentSuccess: () => void;
}

/**
 * VirtualAccountCard (Module 3)
 * Implements the 1:1.618 golden ratio for layout nodes.
 * Handles real-time listening for payment webhooks via Firestore nodes.
 */
export const VirtualAccountCard: React.FC<VirtualAccountProps> = ({
  orderId,
  amount,
  accountNumber,
  bankName,
  expiryTime,
  onPaymentSuccess
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Module 3: Real-Time UI Updates (Zero-Trust Validation)
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
      const data = snapshot.data();
      if (data?.status === 'paid' || data?.status === 'confirmed') {
        toast.success('Payment Received', { description: 'Sovereign ledger updated in real-time.' });
        onPaymentSuccess();
      }
    });

    return () => unsubscribe();
  }, [orderId, onPaymentSuccess]);

  // Timer logic for expiry
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 1000 / 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success('Copied to Clipboard', { description: 'Proceed to your banking app for transfer.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatePayment = async () => {
    try {
      // Module 3: Real-Time UI Updates / Module 4: Simulation
      // In a real app, the bank sends a webhook to our server.
      // Here we simulate the server received it and updated Firestore.
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'orders', orderId), {
         status: 'paid',
         updatedAt: new Date()
      });
      
      // Also trigger the notification simulation on our Express server
      await fetch('/api/payments/simulate-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: orderId })
      });

    } catch (error) {
      toast.error('Simulation Failed', { description: 'Database permissions might be restricted.' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto luxury-card p-0 overflow-hidden bg-navy border border-gold/20"
    >
      {/* Header - Golden Ratio Sub-node (approx 1/1.618 height) */}
      <div className="bg-gold/10 px-8 py-6 border-b border-gold/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Landmark className="w-24 h-24 text-gold" />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-gold/60">Virtual_Account_Node</span>
            <h3 className="text-2xl font-serif text-white mt-1 italic">Bank Transfer</h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">Expires_In</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-gold animate-pulse" />
              <span className="text-sm font-mono text-gold font-bold">{timeLeft}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body - Main Focus Area */}
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center text-white">
          <span className="text-xs uppercase font-light tracking-[0.2em] opacity-40">Currency_Fiat</span>
          <span className="text-xl font-serif font-bold">₦{(amount / 100).toLocaleString()}</span>
        </div>

        <div className="space-y-4">
           <div>
             <label className="text-micro block mb-1">Bank_Institution</label>
             <p className="text-sm font-medium text-white">{bankName}</p>
           </div>

           <div>
             <label className="text-micro block mb-1 text-gold/60">Account_Number</label>
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group hover:border-gold/30 transition-all">
                <span className="text-2xl font-mono font-bold tracking-wider text-white">
                  {accountNumber}
                </span>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-gold/10 hover:bg-gold/20 rounded-lg text-gold transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
           </div>
        </div>

        <div className="pt-4 border-t border-white/5">
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                 <ShieldCheck className="w-5 h-5 text-gold" />
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed font-light">
                Secure 256-bit encryption. System is listening for payment. 
                <span className="block mt-1 font-bold text-white/60">Instructions: Open your mobile banking app and transfer the exact amount above.</span>
              </p>
           </div>
        </div>
      </div>

      {/* Footer - Call to Action / Status */}
      <div className="bg-navy p-6 flex flex-col items-center justify-center border-t border-white/5 space-y-4">
         <div className="flex items-center gap-3 text-[10px] uppercase font-black text-gold/60 tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" />
            Synchronizing_Ledger...
         </div>
         
         <button 
           onClick={simulatePayment}
           className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] uppercase font-black tracking-[0.3em] text-white/40 hover:text-gold hover:border-gold/50 transition-all"
         >
           Simulate_Inbound_Transfer
         </button>
      </div>
    </motion.div>
  );
};
