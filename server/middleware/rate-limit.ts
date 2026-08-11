/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (ip: string, path: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitStore {
  get(key: string): Promise<number>;
  set(key: string, value: number, windowMs: number): Promise<void>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit store
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;

    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return 0;
    }

    return entry.count;
  }

  async set(key: string, value: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count: value,
      resetTime: Date.now() + windowMs,
    });
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate Limiter
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    this.store = store || new InMemoryRateLimitStore();

    // Cleanup expired entries every minute
    if (this.store instanceof InMemoryRateLimitStore) {
      this.cleanupInterval = setInterval(() => {
        (this.store as InMemoryRateLimitStore).cleanup();
      }, 60000);
    }
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(ip: string, path: string = "/"): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(ip, path) : `${ip}:${path}`;

    const current = await this.store.get(key);
    const resetTime = Date.now() + this.config.windowMs;

    if (current >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    await this.store.set(key, current + 1, this.config.windowMs);

    return {
      allowed: true,
      remaining: this.config.maxRequests - (current + 1),
      resetTime,
    };
  }

  /**
   * Reset limit for a key
   */
  async reset(ip: string, path: string = "/"): Promise<void> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(ip, path) : `${ip}:${path}`;
    await this.store.reset(key);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Create rate limiters for different endpoints
 */
export function createRateLimiters() {
  return {
    // General API rate limit: 100 requests per 15 minutes
    api: new RateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    }),

    // Webhook endpoints: 50 requests per 15 minutes
    webhooks: new RateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 50,
    }),

    // Authentication endpoints: 10 attempts per 15 minutes
    auth: new RateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    }),

    // Attack reporting: 20 reports per minute
    attacks: new RateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 20,
    }),

    // Alert creation: 30 per 5 minutes
    alerts: new RateLimiter({
      windowMs: 5 * 60 * 1000,
      maxRequests: 30,
    }),
  };
}

/**
 * Get client IP address from request
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }

  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }
  if (Array.isArray(realIp) && realIp.length > 0) {
    return realIp[0];
  }

  return "unknown";
}
