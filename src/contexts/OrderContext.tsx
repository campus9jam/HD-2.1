import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserAcquisitions, createAcquisition } from '../services/LogisticsService';

export interface LogisticsEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface Order {
  id: string;
  items: any[];
  totalValue: number;
  status: 'secured' | 'inbound' | 'transit' | 'archived';
  timestamp: string;
  buyerId?: string;
  logistics?: LogisticsEvent[];
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status'>) => Promise<string | null>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const refreshOrders = useCallback(async () => {
    if (!user) return;
    const data = await fetchUserAcquisitions(user.uid);
    setOrders(data);
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshOrders();
    } else {
      setOrders([]);
    }
  }, [user, refreshOrders]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
    const orderId = await createAcquisition(orderData);
    if (orderId) {
      await refreshOrders();
    }
    return orderId;
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, refreshOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
