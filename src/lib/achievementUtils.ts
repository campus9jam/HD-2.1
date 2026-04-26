import { UserProfile } from '../types';
import { db as firestoreDb } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface Achievement {
  id: string;
  title: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  PATRON: { id: 'patron', title: 'Patron of the Sahel', icon: 'Crown' },
  ARCHITECT: { id: 'architect', title: 'Architect of Style', icon: 'Scissors' },
  GOVERNOR: { id: 'governor', title: 'Grand Architect', icon: 'Shield' },
  PIONEER: { id: 'pioneer', title: 'Sovereign Pioneer', icon: 'Zap' }
};

export async function unlockAchievement(userId: string, achievementId: string, currentProfile: UserProfile) {
  if (currentProfile.achievements?.some(a => a.id === achievementId)) return;

  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return;

  const userRef = doc(firestoreDb, 'users', userId);
  await updateDoc(userRef, {
    achievements: arrayUnion({
      ...achievement,
      unlockedAt: Date.now()
    }),
    xp: (currentProfile.xp || 0) + 100
  });
}
