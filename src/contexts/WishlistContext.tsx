import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MarketItem } from '../constants/marketData';

interface WishlistContextType {
  wishlist: MarketItem[];
  addToWishlist: (item: MarketItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: MarketItem) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<MarketItem[]>(() => {
    const saved = localStorage.getItem('daraja_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('daraja_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (item: MarketItem) => {
    if (!wishlist.find((i) => i.id === item.id)) {
      setWishlist([...wishlist, item]);
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlist(wishlist.filter((i) => i.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((i) => i.id === id);
  };

  const toggleWishlist = (item: MarketItem) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
