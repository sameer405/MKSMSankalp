import { RateLimitError } from './errors';

// In-memory rate limiter using Map
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private limit: number;
  private windowMs: number;

  constructor() {
    // Get rate limit from env or default to 200 per hour
    this.limit = parseInt(process.env.RATE_LIMIT_PER_HOUR || '200', 10);
    this.windowMs = 60 * 60 * 1000; // 1 hour in milliseconds
    this.store = new Map();

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  checkRateLimit(identifier: string): void {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetAt < now) {
      // No existing entry or expired - create new window
      this.store.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return;
    }

    // Entry exists and still valid
    if (entry.count >= this.limit) {
      const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
      );
    }

    // Increment count
    entry.count += 1;
    this.store.set(identifier, entry);
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetAt < now) {
      return this.limit;
    }

    return Math.max(0, this.limit - entry.count);
  }

  getResetTime(identifier: string): number | null {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetAt < now) {
      return null;
    }

    return entry.resetAt;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

