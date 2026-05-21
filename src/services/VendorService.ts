import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Vendor } from '../types';

export const fetchVendorProfile = async (vendorId: string): Promise<Vendor | null> => {
  try {
    const docRef = doc(db, 'vendors', vendorId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Vendor;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'get', `vendors/${vendorId}`);
    return null;
  }
};

export const updateVendorProfile = async (vendorId: string, data: Partial<Vendor>): Promise<void> => {
  try {
    const docRef = doc(db, 'vendors', vendorId);
    await setDoc(docRef, { 
      ...data, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'update', `vendors/${vendorId}`);
  }
};

export const createVendorProfile = async (vendorId: string, data: Omit<Vendor, 'id'>): Promise<void> => {
  try {
    const docRef = doc(db, 'vendors', vendorId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, 'create', `vendors/${vendorId}`);
  }
};
