import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuctionDrop, Bid } from '../types';

const COLLECTION_NAME = 'auctions';

const BOT_NAMES = [
  'Kano_Collector',
  'Lagos_Archive',
  'Zaria_Elite',
  'Noble_Seeker',
  'Heritage_Bot',
  'Sahel_Sovereign',
  'Archival_Probe_01',
  'Nupe_Prince'
];

export const startBotBidding = (auctionId: string) => {
  const interval = setInterval(async () => {
    // 20% chance of a bot bidding every 12 seconds
    if (Math.random() > 0.8) {
      try {
        const auctionRef = doc(db, COLLECTION_NAME, auctionId);
        const auctionSnap = await getDoc(auctionRef);
        
        if (!auctionSnap.exists()) return;
        
        const auctionData = auctionSnap.data() as AuctionDrop;
        const minIncrement = auctionData.minIncrement || 10000;
        const currentBid = auctionData.currentBid;
        
        const amount = currentBid + minIncrement + (Math.floor(Math.random() * 3) * 5000);
        const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const botId = `bot_${botName.toLowerCase()}`;
        
        const bid: Bid = {
          id: `bid_${Date.now()}`,
          userId: botId,
          username: botName,
          userPhoto: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${botName}`,
          amount,
          timestamp: new Date()
        };

        await updateDoc(auctionRef, {
          currentBid: amount,
          bids: arrayUnion(bid),
          bidCount: increment(1)
        });
        console.log(`[Bot] ${botName} placed a bid of ₦${amount.toLocaleString()}`);
      } catch (error) {
        console.error('[Bot] Protocol failure:', error);
      }
    }
  }, 12000);

  return () => clearInterval(interval);
};
