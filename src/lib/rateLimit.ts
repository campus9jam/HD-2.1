/**
 * Sovereign Rate Limiter
 * Ensures that the platform maintains stability during high-frequency neural links.
 * Uses a Token Bucket algorithm to manage request density.
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // Tokens per second

  constructor(maxTokens = 50, refillRate = 10) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire(cost = 1): Promise<boolean> {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    
    // Wait for refill if we have some tokens but not enough
    const waitTime = ((cost - this.tokens) / this.refillRate) * 1000;
    if (waitTime > 5000) {
      console.warn(`[Limiter] High latency detected: waiting ${Math.round(waitTime)}ms for network slot.`);
    }
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.acquire(cost);
  }
}

// Specialized limiters for different network tiers
export const firestoreLimiter = new RateLimiter(60, 5);  // Strict for DB writes
export const driveLimiter = new RateLimiter(15, 2);      // Archival limits
export const aiLimiter = new RateLimiter(10, 1);         // Intelligence limits
