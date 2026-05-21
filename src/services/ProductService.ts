import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Product } from '../types';
import { CacheService } from './CacheService';
import { firestoreLimiter } from '../lib/rateLimit';
import { rewardLee } from './LeeEconomyService';

export const registerArtifact = async (productData: Partial<Product>): Promise<string | null> => {
  await firestoreLimiter.acquire(2); // Higher cost for writes
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...productData,
      img: productData.media?.[0] || '',
      status: productData.status || 'active',
      stock: productData.stock || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Reward vendor for platform contribution
    if (productData.vendorId) {
      await rewardLee(productData.vendorId, 100, 'lee_reward', { 
        reason: 'Archival Contribution', 
        productId: docRef.id 
      });
    }

    // Invalidate caches
    await CacheService.delete('all_products');
    if (productData.vendorId) await CacheService.delete(`products_${productData.vendorId}`);
    
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'create', 'products');
  }
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    const cached = await CacheService.get<Product[]>('all_products');
    if (cached) return cached;

    await firestoreLimiter.acquire(1);
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    
    await CacheService.set('all_products', products, 30); // Cache for 30 mins
    return products;
  } catch (error) {
    return handleFirestoreError(error, 'list', 'products');
  }
};

export const fetchVendorProducts = async (vendorId: string): Promise<Product[]> => {
  try {
    const cacheKey = `products_${vendorId}`;
    const cached = await CacheService.get<Product[]>(cacheKey);
    if (cached) return cached;

    await firestoreLimiter.acquire(1);
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    
    await CacheService.set(cacheKey, products, 15); // Cache for 15 mins
    return products;
  } catch (error) {
    return handleFirestoreError(error, 'list', 'products');
  }
};

export const updateArtifact = async (productId: string, productData: Partial<Product>): Promise<boolean> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
    
    // Invalidate caches
    await CacheService.delete('all_products');
    if (productData.vendorId) await CacheService.delete(`products_${productData.vendorId}`);
    
    return true;
  } catch (error) {
    return handleFirestoreError(error, 'update', `products/${productId}`);
  }
};

export const deleteArtifact = async (productId: string, vendorId?: string): Promise<boolean> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
    
    // Invalidate caches
    await CacheService.delete('all_products');
    if (vendorId) await CacheService.delete(`products_${vendorId}`);
    
    return true;
  } catch (error) {
    return handleFirestoreError(error, 'delete', `products/${productId}`);
  }
};

export const updateArtifactStock = async (productId: string, newStock: number): Promise<boolean> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    return handleFirestoreError(error, 'update', `products/${productId}`);
  }
};
