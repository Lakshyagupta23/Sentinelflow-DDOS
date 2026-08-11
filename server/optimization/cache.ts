/**
 * Response Caching System
 * Caches frequently accessed data to improve performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Simple in-memory cache with TTL support
 */
export class Cache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private stats = { hits: 0, misses: 0 };
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private maxSize: number = 1000) {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.store.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl: number = 60 * 1000): void {
    // Evict oldest entry if cache is full
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value as string | undefined;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }

    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.store.delete(key);
    }

    if (toDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${toDelete.length} expired entries`);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Create specialized caches for different data types
 */
export function createCaches() {
  return {
    // Attack data cache: 5 minute TTL
    attacks: new Cache<unknown>(1000),

    // Threat intelligence cache: 1 hour TTL
    threatIntel: new Cache<unknown>(500),

    // Alert rules cache: 30 minute TTL
    alertRules: new Cache<unknown>(200),

    // Mitigation rules cache: 1 hour TTL
    mitigationRules: new Cache<unknown>(300),

    // User data cache: 15 minute TTL
    userData: new Cache<unknown>(100),

    // API responses cache: 5 minute TTL
    apiResponses: new Cache<unknown>(500),
  };
}

/**
 * Cache key generators for consistent key naming
 */
export const cacheKeys = {
  attack: (id: string) => `attack:${id}`,
  threatIntel: (ip: string) => `threat:${ip}`,
  alertRule: (id: string) => `rule:${id}`,
  mitigationRule: (id: string) => `mitigation:${id}`,
  user: (id: string) => `user:${id}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
};
