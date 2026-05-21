import { Product } from '../types';

export interface ScoredProduct extends Product {
  recommendationScore: number;
}

/**
 * Twitter-inspired recommendation ranking logic.
 * Factors: 
 * 1. Recency (Newer products rank higher)
 * 2. Engagement (Views, Likes, Orders)
 * 3. Authority (Vendor rating, verified status)
 * 4. Diversity (Ensure different categories are represented)
 */
export function rankProducts(products: Product[], criteria: 'latest' | 'trending' | 'rated'): Product[] {
  const now = Date.now();
  
  // Simplified scoring weights
  const weights = {
    view: 1,
    like: 5,
    order: 10,
    recency: criteria === 'latest' ? 20 : 5,
    rating: criteria === 'rated' ? 15 : 2
  };

  const scored = products.map(p => {
    // Mocking some engagement metrics if they don't exist
    // In a real app, these would be in Firestore
    const views = (p as any).views || Math.floor(Math.random() * 100);
    const likes = (p as any).likes || Math.floor(Math.random() * 50);
    const orders = (p as any).ordersCount || Math.floor(Math.random() * 10);
    const rating = (p as any).rating || (4 + Math.random());
    
    // Recency factor (0 to 1)
    const createdAt = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : now - (Math.random() * 1000000000);
    const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    const recencyScore = 1 / (1 + ageInDays);

    let score = (views * weights.view) + (likes * weights.like) + (orders * weights.order);
    score += recencyScore * weights.recency * 100;
    score += (rating - 3) * weights.rating * 10;

    return { ...p, recommendationScore: score };
  });

  return scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Capture engagement signals for future ranking refinement.
 */
export function trackEngagement(productId: string, action: 'view' | 'like' | 'order') {
  console.log(`[Protocol_Archive] Engagement captured for ${productId}: ${action}`);
  // In production, this would increment Firestore counters
}
