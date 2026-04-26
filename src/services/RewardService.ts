import { 
  doc, 
  increment,
  serverTimestamp,
  collection,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
}

export const activateRewardProtocol = async (userId: string, reward: Reward): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    // Use a deterministic ID for atomic rule verification
    const activationId = `act_${userId}_${Date.now()}`;
    const activationRef = doc(db, 'reward_activations', activationId);
    
    batch.update(userRef, {
      xp: increment(-reward.cost),
      updatedAt: serverTimestamp()
    });

    batch.set(activationRef, {
      userId,
      rewardId: reward.id,
      rewardTitle: reward.title,
      cost: reward.cost,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('{')) throw error;
    handleFirestoreError(error, 'write', `users/${userId}/rewards`);
    return false;
  }
};
