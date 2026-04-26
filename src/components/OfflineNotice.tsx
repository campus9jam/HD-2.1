import { WifiOff, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CacheService } from '../services/CacheService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { profile } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = async () => {
      setIsOffline(true);
      
      // Module 3: Robust Offline Experience
      // Cache critical user profile to ensure persistence during disconnection
      if (profile) {
        await CacheService.set('cached_profile', profile, 1000 * 60 * 60 * 24); // 24h cache
      }
      
      console.log('[Offline] Critical data snapshotted to local node.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [profile]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] bg-gold p-2 flex items-center justify-center gap-4 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
               <WifiOff className="w-4 h-4 text-navy" />
               <span className="text-[10px] font-black uppercase tracking-widest text-navy">
                 Sovereign Protocol: Offline Operations Enabled
               </span>
            </div>
            <div className="h-4 w-px bg-navy/20" />
            <div className="flex items-center gap-1.5 opacity-60">
              <Database className="w-3 h-3 text-navy" />
              <span className="text-[8px] font-bold text-navy uppercase">Local_Ledger_Active</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
