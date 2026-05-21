import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuctionComment } from '../types';

export const postComment = async (auctionId: string, userId: string, username: string, userPhoto: string, message: string) => {
  const commentData = {
    auctionId,
    userId,
    username,
    userPhoto,
    message,
    reactions: {},
    timestamp: serverTimestamp()
  };
  
  return addDoc(collection(db, 'auction_comments'), commentData);
};

export const subscribeToComments = (auctionId: string, callback: (comments: AuctionComment[]) => void) => {
  const q = query(
    collection(db, 'auction_comments'),
    where('auctionId', '==', auctionId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuctionComment));
    callback(comments);
  });
};

export const reactToComment = async (commentId: string, reaction: string) => {
  const docRef = doc(db, 'auction_comments', commentId);
  return updateDoc(docRef, {
    [`reactions.${reaction}`]: increment(1)
  });
};
