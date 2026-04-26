import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Grid, Users, User, Scale } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function BottomNav() {
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  const links = [
    { to: '/', icon: Home, label: 'Origin' },
    { to: '/marketplace', icon: Grid, label: 'Market' },
    { to: '/community', icon: Users, label: 'Collective' },
    // { to: '/governance', icon: Scale, label: 'Consensus' },
    { to: '/shop', icon: ShoppingBag, label: 'Vault' },
    { to: '/profile', icon: User, label: 'Identity' },
  ];

  const handleNavClick = (to: string) => {
    setActivePath(to);
    navigate(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy/90 backdrop-blur-3xl border-t border-[var(--border)] z-50 safe-bottom">
      <div className="flex justify-around items-center px-4 py-3">
        {links.map((link) => {
          const isActive = activePath === link.to;
          return (
            <button
              key={link.to}
              onClick={() => handleNavClick(link.to)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 relative flex-1 py-1 ${
                isActive ? 'text-gold' : 'text-text/20 hover:text-text/40'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-gold rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative">
                <link.icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : 'scale-100'}`} />
                {(link.to === '/shop' || link.to === '/marketplace') && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-navy text-[7px] font-black rounded-full flex items-center justify-center border border-[var(--navy)] animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[7px] font-black uppercase tracking-[0.3em]">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
