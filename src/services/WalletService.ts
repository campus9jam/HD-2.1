import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Wallet, WalletTransaction } from '../types';

export const getWallet = async (userId: string): Promise<Wallet | null> => {
  const docRef = doc(db, 'wallets', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as Wallet;
  }
  
  // Create wallet if it doesn't exist
  const newWallet: Wallet = {
    userId,
    balance: 0,
    leeBalance: 0,
    escrowBalance: 0,
    currency: '₦',
    tier: 'Explorer',
    updatedAt: serverTimestamp()
  };
  
  await setDoc(docRef, newWallet);
  return newWallet;
};

export const subscribeToWallet = (userId: string, callback: (wallet: Wallet) => void) => {
  return onSnapshot(doc(db, 'wallets', userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Wallet);
    }
  });
};

export const getTransactions = (userId: string, callback: (txs: WalletTransaction[]) => void) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
    callback(txs);
  });
};

// Simulation of deposit for demo purposes
// In production, this would be handled by a secure backend after Paystack/Flutterwave callback
export const depositFunds = async (userId: string, amount: number) => {
  const walletRef = doc(db, 'wallets', userId);
  const txRef = doc(collection(db, 'transactions'));
  
  await runTransaction(db, async (transaction) => {
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists()) {
      transaction.set(walletRef, {
        userId,
        balance: amount,
        escrowBalance: 0,
        currency: '₦',
        updatedAt: serverTimestamp()
      });
    } else {
      const currentBalance = walletDoc.data().balance;
      transaction.update(walletRef, { 
        balance: currentBalance + amount,
        updatedAt: serverTimestamp()
      });
    }
    
    transaction.set(txRef, {
      userId,
      amount,
      type: 'deposit',
      status: 'completed',
      timestamp: serverTimestamp()
    });
  });
};

export const holdEscrow = async (userId: string, amount: number, auctionId: string) => {
  const walletRef = doc(db, 'wallets', userId);
  const txRef = doc(collection(db, 'transactions'));
  
  await runTransaction(db, async (transaction) => {
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists()) throw new Error("Wallet not found");
    
    const data = walletDoc.data();
    if (data.balance < amount) throw new Error("Insufficient authorized buffer");
    
    transaction.update(walletRef, {
      balance: data.balance - amount,
      escrowBalance: data.escrowBalance + amount,
      updatedAt: serverTimestamp()
    });
    
    transaction.set(txRef, {
      userId,
      amount,
      type: 'escrow_hold',
      status: 'completed',
      auctionId,
      timestamp: serverTimestamp()
    });
  });
};

export const releaseEscrow = async (sellerId: string, buyerId: string, amount: number, auctionId: string) => {
  const buyerWalletRef = doc(db, 'wallets', buyerId);
  const sellerWalletRef = doc(db, 'wallets', sellerId);
  const txRefBuyer = doc(collection(db, 'transactions'));
  const txRefSeller = doc(collection(db, 'transactions'));

  await runTransaction(db, async (transaction) => {
    const buyerDoc = await transaction.get(buyerWalletRef);
    const sellerDoc = await transaction.get(sellerWalletRef);
    
    if (!buyerDoc.exists() || !sellerDoc.exists()) throw new Error("Wallets not found");
    
    const buyerData = buyerDoc.data();
    const sellerData = sellerDoc.data();
    
    if (buyerData.escrowBalance < amount) throw new Error("Insufficient escrow funds");
    
    transaction.update(buyerWalletRef, {
      escrowBalance: buyerData.escrowBalance - amount,
      updatedAt: serverTimestamp()
    });
    
    transaction.update(sellerWalletRef, {
      balance: sellerData.balance + amount,
      updatedAt: serverTimestamp()
    });
    
    transaction.set(txRefBuyer, {
      userId: buyerId,
      amount,
      type: 'escrow_release',
      status: 'completed',
      auctionId,
      timestamp: serverTimestamp()
    });

    transaction.set(txRefSeller, {
      userId: sellerId,
      amount,
      type: 'payout',
      status: 'completed',
      auctionId,
      timestamp: serverTimestamp()
    });
  });
};
