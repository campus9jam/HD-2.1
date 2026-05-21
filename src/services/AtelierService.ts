import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { AtelierOrder, AtelierClient } from '../types';
import { CacheService } from './CacheService';
import { firestoreLimiter } from '../lib/rateLimit';
import { rewardLee } from './LeeEconomyService';

/**
 * Atelier Service - Manages bespoke fabrication nodes in the cloud ledger.
 */

export const registerAtelierClient = async (client: Omit<AtelierClient, 'id'>) => {
  await firestoreLimiter.acquire(2);
  try {
    const clientRef = doc(db, 'atelier_clients', client.username);
    await setDoc(clientRef, {
      ...client,
      createdAt: serverTimestamp()
    });
    await CacheService.delete('all_atelier_clients');
    return true;
  } catch (error) {
    return handleFirestoreError(error, 'write', `atelier_clients/${client.username}`);
  }
};

export const fetchAtelierClient = async (username: string): Promise<AtelierClient | null> => {
  try {
    const cacheKey = `atelier_client_${username}`;
    const cached = await CacheService.get<AtelierClient>(cacheKey);
    if (cached) return cached;

    const docRef = doc(db, 'atelier_clients', username);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const client = { ...docSnap.data(), id: docSnap.id } as any as AtelierClient;
      await CacheService.set(cacheKey, client, 60);
      return client;
    }
    return null;
  } catch (error) {
    return handleFirestoreError(error, 'get', `atelier_clients/${username}`);
  }
};

export const createAtelierOrder = async (order: Omit<AtelierOrder, 'id'>) => {
  await firestoreLimiter.acquire(2);
  try {
    const ordersRef = collection(db, 'atelier_orders');
    const docRef = await addDoc(ordersRef, {
      ...order,
      createdAt: serverTimestamp()
    });
    await CacheService.delete(`orders_${order.clientUsername}`);
    await CacheService.delete('all_atelier_orders');

    // Reward for commissioning a piece
    if (order.clientUsername) {
        await rewardLee(order.clientUsername, 250, 'lee_reward', { reason: 'Atelier Commission' }).catch(console.error);
    }

    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'create', 'atelier_orders');
  }
};

export const fetchClientOrders = async (username: string): Promise<AtelierOrder[]> => {
  const cacheKey = `orders_${username}`;
  try {
    const cached = await CacheService.get<AtelierOrder[]>(cacheKey);
    if (cached) return cached;

    await firestoreLimiter.acquire(1);
    const q = query(
      collection(db, 'atelier_orders'), 
      where('clientUsername', '==', username),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any as AtelierOrder));
    await CacheService.set(cacheKey, orders, 10);
    return orders;
  } catch (error) {
    return handleFirestoreError(error, 'list', 'atelier_orders');
  }
};

export const fetchAllAtelierOrders = async (): Promise<AtelierOrder[]> => {
  const cacheKey = 'all_atelier_orders';
  try {
    const cached = await CacheService.get<AtelierOrder[]>(cacheKey);
    if (cached) return cached;

    await firestoreLimiter.acquire(1);
    const q = query(collection(db, 'atelier_orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any as AtelierOrder));
    await CacheService.set(cacheKey, orders, 15);
    return orders;
  } catch (error) {
    return handleFirestoreError(error, 'list', 'atelier_orders');
  }
};

export const fetchAllAtelierClients = async (): Promise<AtelierClient[]> => {
  try {
    const cacheKey = 'all_atelier_clients';
    const cached = await CacheService.get<AtelierClient[]>(cacheKey);
    if (cached) return cached;

    const snapshot = await getDocs(collection(db, 'atelier_clients'));
    const clients = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any as AtelierClient));
    await CacheService.set(cacheKey, clients, 60);
    return clients;
  } catch (error) {
    return handleFirestoreError(error, 'list', 'atelier_clients');
  }
};

export const updateAtelierOrder = async (orderId: string, updates: Partial<AtelierOrder>) => {
  try {
    const docRef = doc(db, 'atelier_orders', orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    return handleFirestoreError(error, 'update', `atelier_orders/${orderId}`);
  }
};
