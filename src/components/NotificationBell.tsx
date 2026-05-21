import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles, Coins, Gift, TrendingUp, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserNotifications, markAsRead, DarajaNotification } from '../services/NotificationService';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DarajaNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (user) {
      const loadNotifs = async () => {
        setLoading(true);
        const data = await fetchUserNotifications(user.uid);
        setNotifications(data);
        setLoading(false);
      };
      loadNotifs();
      
      // Setting up a basic interval for refresh since we don't have real-time listeners for notifications yet
      // In a production app, this would be a Firestore listener
      const interval = setInterval(loadNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lee_reward': return <Coins className="w-4 h-4 text-gold" />;
      case 'social_gift': return <Gift className="w-4 h-4 text-indigo-400" />;
      case 'auction_update': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default: return <Sparkles className="w-4 h-4 text-text/40" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text/40 hover:text-gold transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full border border-navy animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsOpen(false)}
               className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-4 w-80 z-50 luxury-card bg-surface/90 backdrop-blur-2xl border-gold/20 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-text/5 flex justify-between items-center bg-navy/20">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gold text-text">Identity_Signals</h3>
                <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-text/20 hover:text-text" /></button>
              </div>

              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center opacity-20">
                    <Bell className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Digital Silence</p>
                  </div>
                ) : (
                  <div className="divide-y divide-text/5">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-5 group transition-colors hover:bg-gold/5 cursor-pointer ${!notif.isRead ? 'bg-gold/5' : ''}`}
                        onClick={() => handleMarkRead(notif.id!)}
                      >
                         <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-text/5 flex-shrink-0 ${!notif.isRead ? 'bg-navy border-gold/20' : 'bg-navy/50'}`}>
                               {getIcon(notif.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                               <div className="flex justify-between items-start">
                                  <p className="text-[10px] font-bold text-text uppercase tracking-tight">{notif.title}</p>
                                  {!notif.isRead && <div className="w-1.5 h-1.5 bg-gold rounded-full" />}
                               </div>
                               <p className="text-[10px] text-text/60 leading-relaxed font-serif italic">{notif.message}</p>
                               <p className="text-[7px] text-text/20 uppercase font-black tracking-tighter">
                                  {new Date(notif.createdAt?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link 
                to="/wallet" 
                onClick={() => setIsOpen(false)}
                className="p-4 bg-navy/40 block text-center border-t border-text/5 group hover:bg-gold transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text/40 group-hover:text-navy transition-colors">Audit Full History</span>
                   <ChevronRight className="w-3 h-3 text-text/20 group-hover:text-navy" />
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
