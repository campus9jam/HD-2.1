import { WalletTransaction, UserProfile } from '../types';

export const analyzeEconomyPerformance = (transactions: WalletTransaction[], profile: UserProfile) => {
  const last30Days = transactions.filter(t => {
    const txDate = t.timestamp?.toDate() || new Date();
    const diff = new Date().getTime() - txDate.getTime();
    return diff < (1000 * 60 * 60 * 24 * 30);
  });

  const rewards = last30Days
    .filter(t => t.type.includes('reward') || t.type === 'payment') // assuming payment might be a credit in some contexts, but specifically lee_reward
    .reduce((sum, t) => sum + (t.leeAmount || 0), 0);
  
  const burns = last30Days
    .filter(t => t.type.includes('burn') || t.type === 'creator_tip' || t.type === 'social_gift')
    .reduce((sum, t) => sum + Math.abs(t.leeAmount || 0), 0);

  const net = rewards - burns;
  const healthScore = Math.min(100, Math.max(0, 50 + (net / 100)));

  let insight = "Your economic link is stable.";
  if (net > 5000) insight = "You are currently a primary liquidity provider in the ecosystem.";
  else if (net < -2000) insight = "You are investing heavily in social and creative capital.";
  
  if ((profile.stakedBalance || 0) > (profile.leeBalance || 0) * 2) {
    insight += " Your commitment to the vault shows high archival trust.";
  }

  return {
    rewards,
    burns,
    net,
    healthScore,
    insight
  };
};
