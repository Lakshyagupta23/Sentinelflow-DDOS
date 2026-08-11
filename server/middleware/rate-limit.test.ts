import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RateLimiter, InMemoryRateLimitStore, createRateLimiters, getClientIp } from "./rate-limit";

describe("Rate Limiting", () => {
  describe("InMemoryRateLimitStore", () => {
    let store: InMemoryRateLimitStore;

    beforeEach(() => {
      store = new InMemoryRateLimitStore();
    });

    it("should initialize with zero count", async () => {
      const count = await store.get("test-key");
      expect(count).toBe(0);
    });

    it("should increment count", async () => {
      await store.set("test-key", 1, 60000);
      const count = await store.get("test-key");
      expect(count).toBe(1);
    });

    it("should reset count", async () => {
      await store.set("test-key", 5, 60000);
      await store.reset("test-key");
      const count = await store.get("test-key");
      expect(count).toBe(0);
    });

    it("should expire entries after window", async () => {
      await store.set("test-key", 5, 100); // 100ms window
      await new Promise((resolve) => setTimeout(resolve, 150));
      const count = await store.get("test-key");
      expect(count).toBe(0);
    });
  });

  describe("RateLimiter", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });
    });

    afterEach(() => {
      limiter.destroy();
    });

    it("should allow requests within limit", async () => {
      for (let i = 0; i < 5; i++) {
        const result = await limiter.isAllowed("192.0.2.1");
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it("should deny requests exceeding limit", async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.isAllowed("192.0.2.1");
      }

      const result = await limiter.isAllowed("192.0.2.1");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should track different IPs separately", async () => {
      await limiter.isAllowed("192.0.2.1");
      await limiter.isAllowed("192.0.2.1");

      const result = await limiter.isAllowed("203.0.113.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should track different paths separately", async () => {
      await limiter.isAllowed("192.0.2.1", "/api/attacks");
      await limiter.isAllowed("192.0.2.1", "/api/attacks");

      const result = await limiter.isAllowed("192.0.2.1", "/api/alerts");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should reset limit for a key", async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.isAllowed("192.0.2.1");
      }

      let result = await limiter.isAllowed("192.0.2.1");
      expect(result.allowed).toBe(false);

      await limiter.reset("192.0.2.1");

      result = await limiter.isAllowed("192.0.2.1");
      expect(result.allowed).toBe(true);
    });

    it("should provide reset time", async () => {
      const result = await limiter.isAllowed("192.0.2.1");
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000);
    });
  });

  describe("Rate Limiters Factory", () => {
    let limiters: ReturnType<typeof createRateLimiters>;

    beforeEach(() => {
      limiters = createRateLimiters();
    });

    afterEach(() => {
      Object.values(limiters).forEach((limiter) => limiter.destroy());
    });

    it("should create all rate limiters", () => {
      expect(limiters.api).toBeDefined();
      expect(limiters.webhooks).toBeDefined();
      expect(limiters.auth).toBeDefined();
      expect(limiters.attacks).toBeDefined();
      expect(limiters.alerts).toBeDefined();
    });

    it("should have different limits for different endpoints", async () => {
      // API limiter: 100 requests per 15 minutes
      let result = await limiters.api.isAllowed("192.0.2.1");
      expect(result.remaining).toBe(99);

      // Auth limiter: 10 attempts per 15 minutes
      result = await limiters.auth.isAllowed("192.0.2.1");
      expect(result.remaining).toBe(9);

      // Attacks limiter: 20 per minute
      result = await limiters.attacks.isAllowed("192.0.2.1");
      expect(result.remaining).toBe(19);
    });
  });

  describe("Client IP Extraction", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const ip = getClientIp({
        "x-forwarded-for": "192.0.2.1, 203.0.113.1",
      });
      expect(ip).toBe("192.0.2.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const ip = getClientIp({
        "x-real-ip": "192.0.2.1",
      });
      expect(ip).toBe("192.0.2.1");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const ip = getClientIp({
        "x-forwarded-for": "192.0.2.1",
        "x-real-ip": "203.0.113.1",
      });
      expect(ip).toBe("192.0.2.1");
    });

    it("should return unknown if no IP headers", () => {
      const ip = getClientIp({});
      expect(ip).toBe("unknown");
    });

    it("should handle array x-forwarded-for", () => {
      const ip = getClientIp({
        "x-forwarded-for": ["192.0.2.1", "203.0.113.1"],
      });
      expect(ip).toBe("192.0.2.1");
    });
  });
});
