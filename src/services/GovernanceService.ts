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
  increment,
  getDoc,
  setDoc,
  writeBatch,
  limit,
  getCountFromServer
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types';
import { rewardParticipation } from './LeeEconomyService';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  votes: number;
  author: string;
  expiresAt: string;
  category: 'Protocol' | 'Artisan' | 'Economic';
  status: 'active' | 'passed' | 'defeated';
}

export const fetchActiveProposals = async (): Promise<Proposal[]> => {
  try {
    const q = query(
      collection(db, 'governance_proposals'),
      where('status', '==', 'active'),
      orderBy('votes', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any as Proposal));
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', 'governance_proposals');
    return [];
  }
};

export const castVote = async (proposalId: string, userId: string, weight: number = 1) => {
  try {
    // 1. Record individual vote to prevent double voting
    const voteRef = doc(db, 'governance_votes', `${proposalId}_${userId}`);
    const voteSnap = await getDoc(voteRef);
    
    if (voteSnap.exists()) {
      throw new Error("Sovereign identity has already recorded a vote for this proposal.");
    }

    const batch = writeBatch(db);

    batch.set(voteRef, {
      proposalId,
      userId,
      weight,
      timestamp: serverTimestamp()
    });

    // 2. Increment proposal vote count
    const proposalRef = doc(db, 'governance_proposals', proposalId);
    batch.update(proposalRef, {
      votes: increment(1)
    });

    await batch.commit();

    // Reward civic participation
    await rewardParticipation(userId, 'vote').catch(console.error);

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'write', 'governance_votes');
    return false;
  }
};

export const createProposal = async (proposal: Omit<Proposal, 'id' | 'votes' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'governance_proposals'), {
      ...proposal,
      votes: 0,
      status: 'active',
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'create', 'governance_proposals');
    return null;
  }
};

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as any as UserProfile));
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', 'users');
    return [];
  }
};

export const updateUserRole = async (uid: string, role: string, statusTier?: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { 
      role,
      ...(statusTier ? { statusTier } : {})
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'update', `users/${uid}`);
    return false;
  }
};

export const fetchPlatformAnalytics = async () => {
  try {
    const usersColl = collection(db, 'users');
    const videosColl = collection(db, 'community_videos');
    const proposalsColl = collection(db, 'governance_proposals');

    const [userCount, videoCount, proposalCount] = await Promise.all([
      getCountFromServer(usersColl),
      getCountFromServer(videosColl),
      getCountFromServer(proposalsColl)
    ]);

    return {
      totalCitizens: userCount.data().count,
      totalArchivedMedia: videoCount.data().count,
      pendingModeration: proposalCount.data().count // Just as an example metric
    };
  } catch (error) {
    console.error("Analytics failure:", error);
    return {
      totalCitizens: 0,
      totalArchivedMedia: 0,
      pendingModeration: 0
    };
  }
};

export const fetchConnectionLogs = async () => {
  try {
    const q = query(
      collection(db, 'connection_handshakes'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', 'connection_handshakes');
    return [];
  }
};

export const fetchSystemLogs = async () => {
  try {
    const q = query(
      collection(db, 'system_logs'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'list', 'system_logs');
    return [];
  }
};

let cachedEconomyMetrics: any = null;
let lastEcoFetchTime = 0;

export const fetchEconomyMetrics = async () => {
  try {
    const now = Date.now();
    if (cachedEconomyMetrics && now - lastEcoFetchTime < 60000) { // 60 seconds cache
      return cachedEconomyMetrics;
    }

    const transactionsColl = collection(db, 'service_transactions');
    
    // Recent activity
    const q = query(
      transactionsColl,
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(d => d.data());

    // Basic aggregations
    const burned = transactions
      .filter((t: any) => t.type === 'lee_burn' || t.type === 'delivery_subsidy')
      .reduce((sum, t) => sum + (t.leeAmount || 0), 0);
    
    const rewarded = transactions
      .filter((t: any) => t.type === 'lee_reward' || t.type === 'attendance_reward' || t.type === 'engagement_reward')
      .reduce((sum, t) => sum + (t.leeAmount || 0), 0);

    const usersColl = collection(db, 'users');
    const usersSnapshot = await getDocs(usersColl);
    const totalStaked = usersSnapshot.docs.reduce((sum, d) => sum + (d.data().stakedBalance || 0), 0);

    const result = {
      totalBurned: burned,
      totalRewarded: rewarded,
      totalStaked: totalStaked,
      netCirculationChange: rewarded - burned,
      recentTransactions: snapshot.docs.map(d => ({ ...d.data(), id: d.id }))
    };
    
    cachedEconomyMetrics = result;
    lastEcoFetchTime = now;
    return result;
  } catch (error) {
    console.error("Economy metrics failure:", error);
    return {
      totalBurned: 0,
      totalRewarded: 0,
      netCirculationChange: 0,
      recentTransactions: []
    };
  }
};
