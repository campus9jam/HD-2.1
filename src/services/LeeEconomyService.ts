import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserTier, WalletTransaction, RewardCampaign } from '../types';
import { createNotification } from './NotificationService';

export const LEE_REDEMPTION_RATIO = 100; // 100 LEE = ₦1
export const BURN_PERCENTAGE = 0.2; // 20% burnt, 80% recycled

const TIER_REDEMPTION_CAPS: Record<UserTier, number> = {
    Explorer: 0.05,
    Insider: 0.10,
    Collector: 0.15,
    Elite: 0.20,
    Icon: 0.25
};

export const getRedemptionCap = (tier: UserTier | undefined): number => {
    return TIER_REDEMPTION_CAPS[tier || 'Explorer'];
};

export const calculateMaxLeeUsage = (fiatAmount: number, tier: UserTier | undefined) => {
    const capPercentage = getRedemptionCap(tier);
    const maxFiatSubsidized = fiatAmount * capPercentage;
    const maxLeeNeeded = maxFiatSubsidized * LEE_REDEMPTION_RATIO;
    return {
        maxLee: Math.floor(maxLeeNeeded),
        maxFiatReduction: maxFiatSubsidized
    };
};

export const rewardLee = async (userId: string, amount: number, type: WalletTransaction['type'], metadata?: any) => {
    try {
        const userRef = doc(db, 'users', userId);
        const walletRef = doc(db, 'wallets', userId);

        await updateDoc(userRef, {
            leeBalance: increment(amount),
            reputationScore: increment(Math.floor(amount / 10))
        });

        await updateDoc(walletRef, {
            leeBalance: increment(amount),
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, 'transactions'), {
            userId,
            leeAmount: amount,
            amount: 0,
            type,
            status: 'completed',
            metadata,
            timestamp: serverTimestamp()
        });

        // Trigger Notification
        await createNotification({
            userId,
            title: 'LEE Rewarded',
            message: `You earned ${amount} LEE for ${metadata?.reason || type.replace('_', ' ').toUpperCase()}.`,
            type: 'lee_reward',
            metadata
        });

        console.log(`[LEE Economy] Reward: ${amount} LEE issued to ${userId} for ${type}`);
    } catch (error) {
        console.error('[LEE Economy] Reward failure:', error);
    }
};

export const burnLee = async (userId: string, leeAmount: number, type: WalletTransaction['type'], referenceId?: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const walletRef = doc(db, 'wallets', userId);

        // Check balance first
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().leeBalance < leeAmount) {
            throw new Error('Insufficient LEE balance');
        }

        await updateDoc(userRef, {
            leeBalance: increment(-leeAmount)
        });

        await updateDoc(walletRef, {
            leeBalance: increment(-leeAmount),
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, 'transactions'), {
            userId,
            leeAmount: -leeAmount,
            amount: 0,
            type,
            status: 'completed',
            referenceId,
            timestamp: serverTimestamp()
        });

        console.log(`[LEE Economy] Burn: ${leeAmount} LEE removed from ${userId} for ${type}`);
    } catch (error) {
        console.error('[LEE Economy] Burn failure:', error);
        throw error;
    }
};

/**
 * Leema AI Reward Optimization logic
 * Analyzes user history to recommend reward multipliers
 */
export const getAIOptimizedMultiplier = async (userId: string): Promise<number> => {
    // In a real implementation, this would call a cloud function running the model
    // For now, we simulate AI intelligence based on user reputation
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return 1;
    
    const data = userSnap.data() as UserProfile;
    const reputation = data.reputationScore || 0;
    
    if (reputation > 5000) return 1.5;
    if (reputation > 2000) return 1.25;
    return 1;
};

export const simulateAIProfitabilityMultiplier = (tier: UserTier): number => {
    switch (tier) {
        case 'Icon': return 2.0;
        case 'Elite': return 1.5;
        case 'Collector': return 1.25;
        case 'Insider': return 1.1;
        default: return 1.0;
    }
};

/**
 * Grants small rewards for platform participation (e.g., voting, commenting)
 */
export const rewardParticipation = async (userId: string, type: 'participation' | 'vote' | 'comment') => {
    const amounts = {
        participation: 5,
        vote: 10,
        comment: 2
    };
    return rewardLee(userId, amounts[type], 'engagement_reward', { reason: `Participation: ${type}`, activity: type });
};

export const stakeLee = async (userId: string, amount: number) => {
    try {
        await burnLee(userId, amount, 'lee_burn', 'staking_deposit');
        await updateDoc(doc(db, 'users', userId), {
            stakedBalance: increment(amount),
            reputationScore: increment(Math.floor(amount / 10))
        });
        
        await createNotification({
            userId,
            title: 'Tokens Staked',
            message: `${amount} LEE committed to the sovereign liquidity pool.`,
            type: 'info',
            metadata: { type: 'staking' }
        });
    } catch (error) {
        console.error('[LEE Economy] Staking failure:', error);
        throw error;
    }
};

export const upgradeTier = async (userId: string, nextTier: UserTier, cost: number) => {
    try {
        await burnLee(userId, cost, 'lee_burn', `tier_upgrade_${nextTier}`);
        await updateDoc(doc(db, 'users', userId), {
            tier: nextTier
        });

        await createNotification({
            userId,
            title: 'Tier Ascended',
            message: `You have achieved the status of ${nextTier}. New protocols unlocked.`,
            type: 'success',
            metadata: { nextTier }
        });
    } catch (error) {
        console.error('[LEE Economy] Tier upgrade failure:', error);
        throw error;
    }
};

export const claimYield = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        
        const data = userSnap.data() as UserProfile;
        const staked = data.stakedBalance || 0;
        if (staked <= 0) return;

        const lastClaim = data.lastYieldClaim?.toDate() || new Date();
        const now = new Date();
        const hoursElapsed = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        
        // 12% APY is roughly 0.00127% per hour
        const hourlyRate = 0.0000127;
        const yieldAmount = Math.floor(staked * hourlyRate * hoursElapsed);

        if (yieldAmount > 0) {
            await rewardLee(userId, yieldAmount, 'lee_reward', { reason: 'Staking Yield', hours: hoursElapsed });
            await updateDoc(userRef, {
                lastYieldClaim: serverTimestamp()
            });

            await createNotification({
                userId,
                title: 'Yield Harvested',
                message: `You harvested ${yieldAmount} LEE from your staked assets.`,
                type: 'lee_reward',
                metadata: { yieldAmount }
            });

            return yieldAmount;
        }
        return 0;
    } catch (error) {
        console.error('[LEE Economy] Yield claim failure:', error);
        throw error;
    }
};

export const boosterCost = 500;

export const boostArtifactVisibility = async (vendorId: string, artifactId: string) => {
    try {
        await burnLee(vendorId, boosterCost, 'lee_burn', `boost_${artifactId}`);
        await updateDoc(doc(db, 'products', artifactId), {
            isBoosted: true,
            boostExpires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 1 week
        });
        
        await createNotification({
            userId: vendorId,
            title: 'Artifact Boosted',
            message: `Archival visibility for your artifact has been enhanced for 7 cycles.`,
            type: 'success',
            metadata: { artifactId }
        });
    } catch (error) {
        console.error('[LEE Economy] Boost failure:', error);
        throw error;
    }
};

export const giftLee = async (senderId: string, receiverId: string, amount: number, message?: string) => {
    try {
        await burnLee(senderId, amount, 'social_gift', receiverId);
        await rewardLee(receiverId, amount, 'social_gift', { senderId, message, reason: 'Social Gift' });

        await addDoc(collection(db, 'social_gifts'), {
            senderId,
            receiverId,
            leeAmount: amount,
            message,
            type: 'gift',
            timestamp: serverTimestamp()
        });

        // Specific Social Gift Notification
        await createNotification({
            userId: receiverId,
            title: 'Social Gift Received',
            message: `You received a gift of ${amount} LEE from another citizen.`,
            type: 'social_gift',
            metadata: { senderId, message }
        });
    } catch (error) {
        console.error('[LEE Economy] Gift failure:', error);
        throw error;
    }
};

export const recommendCitizen = async (recommenderId: string, targetId: string) => {
    try {
        const cost = 250; // Cost to recommend
        await burnLee(recommenderId, cost, 'lee_burn', `recommend_${targetId}`);
        
        await updateDoc(doc(db, 'users', targetId), {
            reputationScore: increment(50)
        });

        await createNotification({
            userId: targetId,
            title: 'Reputation Boosted',
            message: `A fellow citizen has verified your cultural standing. +50 Reputation.`,
            type: 'success',
            metadata: { recommenderId }
        });
    } catch (error) {
        console.error('[LEE Economy] Recommendation failure:', error);
        throw error;
    }
};

export const tipCreator = async (senderId: string, creatorId: string, amount: number, auctionId: string) => {
    try {
        await burnLee(senderId, amount, 'creator_tip', auctionId);
        const creatorReward = Math.floor(amount * 0.9);
        await rewardLee(creatorId, creatorReward, 'creator_tip', { senderId, auctionId, reason: 'Creator Tip' });

        await addDoc(collection(db, 'social_gifts'), {
            senderId,
            receiverId: creatorId,
            leeAmount: amount,
            type: 'tip',
            metadata: { auctionId },
            timestamp: serverTimestamp()
        });

        await createNotification({
            userId: creatorId,
            title: 'Creator Tip Received',
            message: `An admirer tipped you ${creatorReward} LEE for your curation.`,
            type: 'social_gift',
            metadata: { senderId, auctionId }
        });
    } catch (error) {
        console.error('[LEE Economy] Tip failure:', error);
        throw error;
    }
};
