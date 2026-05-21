import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DarajaNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'lee_reward' | 'social_gift' | 'auction_update';
  metadata?: any;
  isRead: boolean;
  createdAt: any;
}

export const createNotification = async (notif: Omit<DarajaNotification, 'id' | 'isRead' | 'createdAt'>) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notif,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Notification Creation Failure:", error);
  }
};

export const fetchUserNotifications = async (userId: string): Promise<DarajaNotification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DarajaNotification));
  } catch (error) {
    console.error("Notification Fetch Failure:", error);
    return [];
  }
};

export const markAsRead = async (notifId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      isRead: true
    });
  } catch (error) {
    console.error("Mark as Read Failure:", error);
  }
};
