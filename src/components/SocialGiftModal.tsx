import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, X, Sparkles, Loader2, Search, User } from 'lucide-react';
import { giftLee } from '../services/LeeEconomyService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface SocialGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderLeeBalance: number;
}

export const SocialGiftModal: React.FC<SocialGiftModalProps> = ({ isOpen, onClose, senderLeeBalance }) => {
  const { user } = useAuth();
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!user) return;
    if (!recipientId) {
      toast.error("Enter a recipient identity");
      return;
    }
    if (amount > senderLeeBalance) {
      toast.error("Insufficient LEE balance");
      return;
    }

    setIsSending(true);
    try {
      await giftLee(user.uid, recipientId, amount, message);
      toast.success("Legacy Shared", {
        description: `${amount} LEE has been transferred to the recipient's vault.`
      });
      onClose();
    } catch (error) {
      toast.error("Transfer failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-navy/90 backdrop-blur-3xl flex items-center justify-center p-8"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-surface/40 border border-gold/20 rounded-[3rem] p-12 space-y-10 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-8">
               <button onClick={onClose} className="p-3 bg-text/5 rounded-full hover:bg-gold transition-all">
                  <X className="w-6 h-6 text-text" />
               </button>
             </div>

             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20 mx-auto">
                   <Gift className="w-10 h-10 text-gold" />
                </div>
                <h2 className="text-4xl font-serif text-text italic">Wealth <span className="text-gold text-3xl font-sans font-black tracking-widest uppercase">Diffusion</span></h2>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-text/40">Sovereign Social Gifting Protocol</p>
             </div>

             <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[9px] uppercase font-black tracking-widest text-text/40 px-4">Recipient Node Identity</label>
                   <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text/20" />
                      <input 
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        className="w-full bg-navy/60 border border-text/10 rounded-2xl py-5 pl-14 pr-8 text-sm focus:border-gold outline-none transition-all font-mono"
                        placeholder="UUID_HEX / EMAIL_ENDPOINT"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between px-4">
                      <label className="text-[9px] uppercase font-black tracking-widest text-text/40">Token Magnitude</label>
                      <span className="text-[9px] font-mono text-gold">{senderLeeBalance.toLocaleString()} LEE AVAILABLE</span>
                   </div>
                   <div className="relative">
                      <Sparkles className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-navy/60 border border-text/10 rounded-2xl py-6 pl-16 pr-8 text-3xl font-serif focus:border-gold outline-none transition-all text-gold italic"
                        placeholder="0"
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] uppercase font-black tracking-widest text-text/40 px-4">Archival Inscription (Message)</label>
                   <textarea 
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     className="w-full bg-navy/60 border border-text/10 rounded-2xl p-6 text-sm focus:border-gold outline-none transition-all italic font-serif min-h-[100px]"
                     placeholder="A token of mutual prestige..."
                   />
                </div>

                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full py-6 bg-gold text-navy rounded-2xl text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 disabled:opacity-50 hover:shadow-[0_20px_50px_rgba(var(--gold-rgb),0.3)] transition-all"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      AUTHORIZE DIFFUSION
                    </>
                  )}
                </button>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
