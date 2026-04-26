import { collection, query, where, getDocs, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types';
import { CacheService } from './CacheService';
import { firestoreLimiter } from '../lib/rateLimit';

/**
 * Initiates a diplomatic connection handshake between two high-status identities.
 */
export const requestConnection = async (fromId: string, toId: string) => {
  await firestoreLimiter.acquire(2);
  try {
    await addDoc(collection(db, 'connection_handshakes'), {
      fromId,
      toId,
      status: 'pending',
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'create', 'connection_handshakes');
    return false;
  }
};

/**
 * Service for discovering fellow citizens and nobility within the House of Daraja.
 */
export const fetchDiscoveryNetwork = async (excludeId?: string): Promise<UserProfile[]> => {
  const cacheKey = 'discovery_network';
  try {
    const cached = await CacheService.get<UserProfile[]>(cacheKey);
    if (cached) return cached;

    await firestoreLimiter.acquire(1);
    const uRef = collection(db, 'users');
    // Fetch recently active or high-tier citizens
    const q = query(
      uRef, 
      where('statusTier', 'in', ['Citizen', 'Diamond', 'Platinum', 'Artisan', 'Elder']),
      orderBy('updatedAt', 'desc'),
      limit(12)
    );
    
    const snapshot = await getDocs(q);
    const results = snapshot.docs
      .map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile))
      .filter(u => u.uid !== excludeId);

    await CacheService.set(cacheKey, results, 30); // Cache discovery for 30 min
    return results;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', 'users');
    return [];
  }
};
