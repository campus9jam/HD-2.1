import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Order, LogisticsEvent } from '../contexts/OrderContext';

export const fetchUserAcquisitions = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'acquisitions'),
      where('buyerId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
      } as any as Order;
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', 'acquisitions');
    return [];
  }
};

export const updateLogisticsStatus = async (orderId: string, event: LogisticsEvent) => {
  try {
    const orderRef = doc(db, 'acquisitions', orderId);
    await updateDoc(orderRef, {
      logistics: arrayUnion({
        ...event,
        timestamp: new Date().toISOString()
      }),
      status: event.status.toLowerCase().includes('transit') ? 'transit' : 
              event.status.toLowerCase().includes('secured') ? 'secured' : 'inbound'
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'update', `acquisitions/${orderId}`);
    return false;
  }
};

export const createAcquisition = async (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'acquisitions'), {
      ...orderData,
      status: 'secured',
      timestamp: serverTimestamp(),
      logistics: [
        {
          status: 'Secured',
          location: 'Daraja Central Hub',
          timestamp: new Date().toISOString(), // Logistics events are serial historical strings in this app
          description: 'Acquisition finalized. Provenance ledger updated.'
        }
      ]
    });
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'create', 'acquisitions');
    return null;
  }
};
