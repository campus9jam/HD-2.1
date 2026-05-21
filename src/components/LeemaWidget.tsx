import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Send, 
  User, 
  MessageCircle, 
  Globe, 
  History, 
  Shield, 
  Tag, 
  BookOpen, 
  Search as SearchIcon,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { LeemaAI } from '../services/LeemaAI';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { rewardLee } from '../services/LeeEconomyService';

const MOCK_PRODUCTS = [
  { id: 'p1', title: 'Kano Royal Agronun', description: 'Hand-woven silk-blend with royal embroidery.', category: 'Heritage', price: 4500 },
  { id: 'p2', title: 'Urban Desert Hoodie', description: 'Gold-embroidered luxury streetwear.', category: 'Streetwear', price: 280 },
  { id: 'p3', title: 'Indigo Dye Tunic', description: 'Traditional Kofar Mata pit dye.', category: 'Artisan', price: 150 }
];

const QUICK_ACTIONS = [
  { label: 'Bargain', icon: Tag, text: "Can you help me get a better price on an item?" },
  { label: 'Heritage', icon: BookOpen, text: "Tell me the story behind Hausa textiles." },
  { label: 'Market Trends', icon: Sparkles, text: "What's trending in the Kano markets right now?" },
  { label: 'Find Artisans', icon: SearchIcon, text: "Where can I find hand-dyed fabrics?" }
];

export default function LeemaWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const leemaRef = useRef<LeemaAI | null>(null);

  const handleSend = useCallback(async (overrideText?: string) => {
    const userMsg = overrideText || input;
    if (!userMsg.trim() || isLoading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await leemaRef.current?.sendMessage(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response || "Protocol sync complete." }]);
      
      // Reward meaningful engagement
      if (user && userMsg.length > 10) {
        rewardLee(user.uid, 5, 'lee_reward', { reason: 'Engaging with Leema', interaction: 'chat' }).catch(console.error);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Linguistic reach interrupted. Please re-engage." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, user]);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      if (e.detail?.text) {
        setIsOpen(true);
        handleSend(e.detail.text);
      } else {
        setIsOpen(true);
      }
    };
    window.addEventListener('leema:trigger', handleTrigger);
    return () => window.removeEventListener('leema:trigger', handleTrigger);
  }, [handleSend]);

  useEffect(() => {
    const initLeema = async () => {
      const instance = new LeemaAI(MOCK_PRODUCTS as any, user?.uid || null);
      if (user) {
        await instance.loadHistoryFromFirestore();
      }
      leemaRef.current = instance;
    };
    initLeema();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div 
      className={`fixed z-[100] transition-all duration-300 flex flex-col items-end pointer-events-none 
        ${isOpen && isMaximized ? 'inset-0 p-0' : 'bottom-20 right-4 sm:bottom-24 sm:right-6'}`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag={!isMaximized}
            dragMomentum={false}
            dragConstraints={{ top: -window.innerHeight + 100, left: -window.innerWidth + 100, right: 0, bottom: 0 }}
            initial={{ opacity: 0, scale: 0.9, y: 50, borderRadius: '2.5rem' }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isMaximized ? '100%' : 'min(92vw, 420px)',
              height: isMaximized ? '100dvh' : 'min(75vh, 680px)',
              borderRadius: isMaximized ? '0rem' : '2.5rem',
            }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="flex flex-col luxury-card bg-surface/95 backdrop-blur-3xl border-gold/30 shadow-[0_50px_100px_rgba(0,0,0,0.6)] pointer-events-auto mb-4 overflow-hidden relative"
          >
            {/* Drag Handle for Adjustability */}
            {!isMaximized && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-text/10 rounded-full mt-2 z-50 cursor-grab active:cursor-grabbing"></div>
            )}
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gold/[0.02] pointer-events-none"></div>
            
            {/* Header */}
            <header className="p-5 sm:p-7 border-b border-text/5 bg-navy flex justify-between items-center relative z-10">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
               <div className="flex items-center gap-4">
                  <div className="relative group">
                     <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30 ring-1 ring-gold/10 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="w-6 h-6 text-gold" />
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-navy ring-1 ring-green-500/50 animate-pulse"></div>
                  </div>
                  <div>
                     <h3 className="text-base font-serif italic text-text leading-tight">Leema_Consultant</h3>
                     <p className="text-[9px] uppercase font-black text-gold/60 tracking-widest flex items-center gap-1.5 pt-1">
                       <Shield className="w-2.5 h-2.5" /> High-Status Neural Link
                     </p>
                  </div>
               </div>
               
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => {
                        if (window.confirm("Purge archival dialogue from high-status session?")) {
                           setMessages([]);
                        }
                     }}
                     className="text-text/20 hover:text-red-500 transition-all p-3 hover:bg-red-500/10 rounded-xl"
                     title="Purge Dialogue"
                   >
                      <History className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => setIsMaximized(!isMaximized)} 
                    className="hidden sm:flex text-text/20 hover:text-text transition-all p-3 hover:bg-gold/10 rounded-xl border border-transparent hover:border-gold/20"
                    title={isMaximized ? "Minimize Arhive" : "Expand Interface"}
                  >
                     {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="text-text/20 hover:text-text transition-all p-3 hover:bg-red-500/10 rounded-xl"
                  >
                     <ChevronDown className="w-6 h-6 block sm:hidden" />
                     <X className="w-5 h-5 hidden sm:block" />
                  </button>
               </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 no-scrollbar bg-gradient-to-b from-navy to-surface relative z-10"
            >
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://picsum.photos/seed/cultural/800/800')] bg-repeat mix-blend-overlay"></div>
              
               {messages.length === 0 && (
                <div className="text-center py-16 space-y-8 max-w-sm mx-auto">
                   <div className="w-24 h-24 bg-gold/5 rounded-full flex items-center justify-center mx-auto border border-gold/10 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                      <History className="w-10 h-10 text-gold/30" />
                   </div>
                   <div className="space-y-4">
                      <p className="text-sm text-text/50 italic font-serif leading-relaxed px-6">
                        "I am Leema, archival AI for the House of Daraja. I facilitate high-fidelity negotiations and heritage insights. How shall we proceed with your acquisition today?"
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 pt-10">
                     {QUICK_ACTIONS.map((action, i) => (
                       <button
                         key={i}
                         onClick={() => handleSend(action.text)}
                         className="flex flex-col items-center gap-3 p-5 bg-text/[0.03] hover:bg-gold/[0.07] border border-text/5 hover:border-gold/30 rounded-[2rem] transition-all group"
                       >
                         <action.icon className="w-5 h-5 text-gold/40 group-hover:text-gold group-hover:scale-110 transition-all duration-500" />
                         <span className="text-[10px] uppercase font-black tracking-[0.2em] text-text/40 group-hover:text-text transition-colors">{action.label}</span>
                       </button>
                     ))}
                   </div>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`mt-1 p-2.5 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center border shadow-lg ${msg.role === 'user' ? 'bg-text/5 border-text/10' : 'bg-gold/10 border-gold/20'}`}>
                       {msg.role === 'user' ? <User className="w-5 h-5 text-text/40" /> : <Sparkles className="w-5 h-5 text-gold" />}
                    </div>
                    <div className={`p-5 sm:p-6 rounded-[1.8rem] text-sm leading-relaxed font-sans shadow-2xl ${
                      msg.role === 'user' 
                        ? 'bg-gold/20 text-text italic border border-gold/40 rounded-tr-none' 
                        : 'bg-navy/90 text-text/90 border border-text/5 backdrop-blur-md rounded-tl-none'
                    }`}>
                       {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}

              {messages.length > 3 && (
                <div className="sticky bottom-0 flex justify-center pb-4 pointer-events-none">
                   <button 
                     onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                     className="p-3 bg-gold text-navy rounded-full shadow-2xl border border-navy/20 pointer-events-auto hover:scale-110 active:scale-95 transition-all"
                   >
                      <ChevronDown className="w-4 h-4" /> 
                   </button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                   <div className="flex gap-4">
                      <div className="p-2.5 rounded-full h-10 w-10 bg-gold/10 border border-gold/20 flex items-center justify-center animate-pulse">
                         <Globe className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex items-center gap-2 px-8 py-5 bg-text/5 rounded-full border border-text/10 shadow-xl">
                         <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-duration:0.8s]"></div>
                         <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                         <div className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 sm:p-10 border-t border-text/5 bg-navy/80 relative z-10">
               <div className="relative flex items-center group">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Negotiate, query archives, ask about heritage..."
                    className="w-full bg-surface/50 border border-text/10 rounded-[2rem] pl-8 pr-16 py-5 text-sm text-text placeholder:text-text/20 focus:border-gold/50 focus:bg-surface outline-none transition-all shadow-inner group-hover:border-text/20"
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 p-4 bg-gold text-navy rounded-[1.5rem] hover:bg-text disabled:opacity-30 transition-all shadow-xl shadow-gold/20 group-active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
               </div>
               <div className="mt-6 flex justify-between items-center px-4">
                  <div className="flex gap-6">
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-text/5 rounded-lg border border-text/5">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                        <span className="text-[8px] font-black uppercase text-text/40 tracking-widest leading-none">
                          {user ? 'Identity_Verified' : 'Guest_Secure'}
                        </span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <BookOpen className="w-3 h-3 text-text/20" />
                     <span className="text-[8px] font-black uppercase text-text/20 tracking-[0.3em] leading-none">
                       {language.toUpperCase()} ENGINE ACTIVE
                     </span>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        layoutId="widget-toggle"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gold text-navy shadow-[0_20px_50px_rgba(212,175,55,0.3)] flex items-center justify-center border-4 border-navy pointer-events-auto relative group overflow-hidden ${isOpen && isMaximized ? 'hidden sm:flex' : 'flex'}`}
      >
        <div className="absolute inset-0 bg-text/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div 
               key="close" 
               initial={{ rotate: -90, opacity: 0 }}
               animate={{ rotate: 0, opacity: 1 }}
               exit={{ rotate: 90, opacity: 0 }}
            >
               <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div 
               key="open"
               initial={{ rotate: 90, opacity: 0 }}
               animate={{ rotate: 0, opacity: 1 }}
               exit={{ rotate: -90, opacity: 0 }}
               className="relative"
            >
               <MessageCircle className="w-7 h-7" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-text rounded-full flex items-center justify-center border-2 border-navy">
                  <div className="w-2 h-2 bg-gold rounded-full animate-ping"></div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
