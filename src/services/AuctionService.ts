import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  arrayUnion, 
  increment, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { AuctionDrop, Bid, AutoBidConfig } from '../types';

const COLLECTION_NAME = 'auctions';

export const fetchActiveAuctions = async (): Promise<AuctionDrop[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', 'in', ['active', 'upcoming']),
      orderBy('startTime', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: (doc.data().startTime as any)?.toDate() || new Date(),
      endTime: (doc.data().endTime as any)?.toDate() || new Date(),
      bids: (doc.data().bids || []).map((b: any) => ({
        ...b,
        timestamp: b.timestamp?.toDate() || new Date()
      }))
    })) as AuctionDrop[];
  } catch (error) {
    handleFirestoreError(error, 'list', COLLECTION_NAME);
    return [];
  }
};

export const subscribeToAuction = (auctionId: string, callback: (auction: AuctionDrop) => void) => {
  const docRef = doc(db, COLLECTION_NAME, auctionId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
        startTime: (data.startTime as any)?.toDate() || new Date(),
        endTime: (data.endTime as any)?.toDate() || new Date(),
        bids: (data.bids || []).map((b: any) => ({
          ...b,
          timestamp: (b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp) || new Date()
        }))
      } as AuctionDrop);
    }
  });
};

export const placeBid = async (
  auctionId: string, 
  userId: string, 
  username: string, 
  userPhoto: string, 
  amount: number
): Promise<void> => {
  const auctionRef = doc(db, COLLECTION_NAME, auctionId);

  try {
    await runTransaction(db, async (transaction) => {
      const auctionDoc = await transaction.get(auctionRef);
      if (!auctionDoc.exists()) {
        throw new Error("Auction does not exist!");
      }

      const auctionData = auctionDoc.data() as AuctionDrop;
      if (amount <= (auctionData.currentBid || 0)) {
        throw new Error("Bid must be higher than current bid");
      }

      const minIncrement = auctionData.minIncrement || 1000;
      if (amount < (auctionData.currentBid || auctionData.startingBid) + minIncrement) {
        throw new Error(`Minimum increment is ₦${minIncrement.toLocaleString()}`);
      }

      if (auctionData.status !== 'active') {
        throw new Error("Auction is not active");
      }

      const now = new Date().getTime();
      const endTime = (auctionData.endTime as any).toDate().getTime();
      const SNIPING_THRESHOLD = 2 * 60 * 1000; // 2 minutes
      
      let newEndTime = auctionData.endTime;
      if (endTime - now < SNIPING_THRESHOLD) {
        newEndTime = new Date(endTime + SNIPING_THRESHOLD);
      }

      // Initial human bid
      let finalBidAmount = amount;
      let finalWinnerId = userId;
      let finalWinnerName = username;
      let finalWinnerPhoto = userPhoto;
      const newBids: Bid[] = [{
        id: `b_${Date.now()}_${userId.slice(0, 4)}`,
        userId,
        username,
        userPhoto,
        amount,
        timestamp: serverTimestamp() as any
      }];

      // Process Auto-Bids
      if (auctionData.autoBids && auctionData.autoBids.length > 0) {
        // Find other auto-bidders
        const others = auctionData.autoBids.filter(ab => ab.userId !== userId);
        if (others.length > 0) {
           // Sort auto-bids by max amount
           const sortedAutoBids = others.sort((a,b) => b.maxBid - a.maxBid);
           const bestAutoBid = sortedAutoBids[0];

           if (bestAutoBid.maxBid > finalBidAmount) {
              // Auto-bidder wins over the human
              finalBidAmount = Math.min(bestAutoBid.maxBid, finalBidAmount + (bestAutoBid.increment || minIncrement));
              finalWinnerId = bestAutoBid.userId;
              finalWinnerName = "Auto-Collector Node"; // Generic for now, ideally fetch name
              finalWinnerPhoto = ""; 
              newBids.push({
                id: `ab_${Date.now()}_${finalWinnerId.slice(0, 4)}`,
                userId: finalWinnerId,
                username: finalWinnerName,
                userPhoto: finalWinnerPhoto,
                amount: finalBidAmount,
                timestamp: serverTimestamp() as any,
                isAutoBid: true
              });
           }
        }
      }

      transaction.update(auctionRef, {
        currentBid: finalBidAmount,
        bidCount: increment(newBids.length),
        endTime: newEndTime,
        bids: arrayUnion(...newBids),
        winnerId: finalWinnerId
      });
    });
  } catch (error) {
    handleFirestoreError(error, 'update', `${COLLECTION_NAME}/${auctionId}`);
    throw error;
  }
};

export const setupAutoBid = async (auctionId: string, userId: string, maxBid: number, increment: number): Promise<void> => {
  const auctionRef = doc(db, COLLECTION_NAME, auctionId);
  try {
    await updateDoc(auctionRef, {
      autoBids: arrayUnion({ userId, maxBid, increment })
    });
  } catch (error) {
    handleFirestoreError(error, 'update', `${COLLECTION_NAME}/${auctionId}`);
    throw error;
  }
};

export const buyNow = async (auctionId: string, userId: string): Promise<void> => {
  const auctionRef = doc(db, COLLECTION_NAME, auctionId);
  try {
    await runTransaction(db, async (transaction) => {
      const auctionDoc = await transaction.get(auctionRef);
      if (!auctionDoc.exists()) throw new Error("Auction not found");
      
      const data = auctionDoc.data() as AuctionDrop;
      if (!data.buyNowPrice) throw new Error("Buy Now not available");
      if (data.status !== 'active') throw new Error("Auction is not active");
      
      transaction.update(auctionRef, {
        status: 'ended',
        winnerId: userId,
        currentBid: data.buyNowPrice,
        endTime: serverTimestamp()
      });
    });
  } catch (error) {
    handleFirestoreError(error, 'update', `${COLLECTION_NAME}/${auctionId}`);
    throw error;
  }
};

export const createAuction = async (auctionData: Partial<AuctionDrop>): Promise<string> => {
  const colRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(colRef, {
    ...auctionData,
    status: 'upcoming',
    currentBid: auctionData.startingBid || 0,
    bidCount: 0,
    bids: [],
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const seedSimulationData = async (userId: string): Promise<void> => {
  const simulationAuctions = [
    {
      title: "Royal Nupe Beaded Throne",
      description: "A high-fidelity restoration of a traditional Nupe beaded chair. Origin: Northern Nigeria, Early 20th Century.",
      img: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800",
      startPrice: 250000,
      currentBid: 320000,
      minIncrement: 10000,
      endTime: new Date(Date.now() + 3600000 * 2), // 2 hours
      sellerId: userId,
      type: 'live',
      status: 'active',
      bids: [
        { id: 'b1', userId: 'bot1', username: 'Kano_Collector', userPhoto: '', amount: 280000, timestamp: new Date() },
        { id: 'b2', userId: 'bot2', username: 'Lagos_Archive', userPhoto: '', amount: 320000, timestamp: new Date() }
      ],
      streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" // Rickrolled or placeholder
    },
    {
       title: "Bini Bronze Prototype Node",
       description: "A ceremonial head cast with recursive neural engravings. Limited archival edition.",
       img: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&q=80&w=800",
       startPrice: 1200000,
       currentBid: 1200000,
       minIncrement: 50000,
       endTime: new Date(Date.now() + 3600000 * 24), // 24 hours
       sellerId: userId,
       type: 'silent',
       status: 'active',
       bids: []
    }
  ];

  for (const auction of simulationAuctions) {
    await createAuction(auction as any);
  }
};

export const finalizeAuction = async (auctionId: string): Promise<void> => {
  const auctionRef = doc(db, COLLECTION_NAME, auctionId);
  try {
    await runTransaction(db, async (transaction) => {
      const auctionDoc = await transaction.get(auctionRef);
      if (!auctionDoc.exists()) throw new Error("Auction not found");
      
      const data = auctionDoc.data() as AuctionDrop;
      if (data.status === 'ended') return; // Already finalized

      const bids = data.bids || [];
      const winner = bids.length > 0 ? bids.sort((a,b) => b.amount - a.amount)[0] : null;

      transaction.update(auctionRef, {
        status: 'ended',
        winnerId: winner?.userId || null,
        endTime: serverTimestamp(),
        escrowStatus: winner ? 'held' : 'none'
      });

      if (winner) {
          // Typically we would create an acquisition here, but in this distributed environment, 
          // we'll trigger the acquisition creation separately or through a shared service.
          // For now, updating the status is the trigger.
      }
    });
  } catch (error) {
    handleFirestoreError(error, 'update', `${COLLECTION_NAME}/${auctionId}`);
    throw error;
  }
};
