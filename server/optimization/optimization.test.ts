import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Cache, createCaches, cacheKeys } from "./cache";

describe("Caching & Optimization", () => {
  describe("Cache", () => {
    let cache: Cache<string>;

    beforeEach(() => {
      cache = new Cache<string>(10);
    });

    afterEach(() => {
      cache.destroy();
    });

    it("should create cache instance", () => {
      expect(cache).toBeDefined();
    });

    it("should set and get value", () => {
      cache.set("key1", "value1");
      const value = cache.get("key1");
      expect(value).toBe("value1");
    });

    it("should return undefined for missing key", () => {
      const value = cache.get("missing");
      expect(value).toBeUndefined();
    });

    it("should delete value", () => {
      cache.set("key1", "value1");
      cache.delete("key1");
      const value = cache.get("key1");
      expect(value).toBeUndefined();
    });

    it("should clear all values", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();

      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
    });

    it("should track cache hits and misses", () => {
      cache.set("key1", "value1");

      cache.get("key1"); // Hit
      cache.get("key1"); // Hit
      cache.get("missing"); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it("should calculate hit rate", () => {
      cache.set("key1", "value1");

      cache.get("key1"); // Hit
      cache.get("key1"); // Hit
      cache.get("missing"); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it("should expire values after TTL", (done) => {
      cache.set("key1", "value1", 100); // 100ms TTL

      setTimeout(() => {
        const value = cache.get("key1");
        expect(value).toBeUndefined();
        done();
      }, 150);
    });

    it("should evict oldest entry when cache is full", () => {
      const smallCache = new Cache<string>(3);

      smallCache.set("key1", "value1");
      smallCache.set("key2", "value2");
      smallCache.set("key3", "value3");
      smallCache.set("key4", "value4"); // Should evict key1

      expect(smallCache.get("key1")).toBeUndefined();
      expect(smallCache.get("key4")).toBe("value4");

      smallCache.destroy();
    });

    it("should reset statistics", () => {
      cache.set("key1", "value1");
      cache.get("key1");

      let stats = cache.getStats();
      expect(stats.hits).toBe(1);

      cache.resetStats();
      stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it("should report cache size", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });
  });

  describe("Specialized Caches", () => {
    let caches: ReturnType<typeof createCaches>;

    beforeEach(() => {
      caches = createCaches();
    });

    afterEach(() => {
      Object.values(caches).forEach((cache) => cache.destroy());
    });

    it("should create all specialized caches", () => {
      expect(caches.attacks).toBeDefined();
      expect(caches.threatIntel).toBeDefined();
      expect(caches.alertRules).toBeDefined();
      expect(caches.mitigationRules).toBeDefined();
      expect(caches.userData).toBeDefined();
      expect(caches.apiResponses).toBeDefined();
    });

    it("should use different caches independently", () => {
      caches.attacks.set("attack1", { id: "attack1" });
      caches.threatIntel.set("ip1", { ip: "192.0.2.1" });

      expect(caches.attacks.get("attack1")).toBeDefined();
      expect(caches.threatIntel.get("ip1")).toBeDefined();
      expect(caches.attacks.get("ip1")).toBeUndefined();
    });
  });

  describe("Cache Key Generators", () => {
    it("should generate attack cache key", () => {
      const key = cacheKeys.attack("attack-123");
      expect(key).toBe("attack:attack-123");
    });

    it("should generate threat intel cache key", () => {
      const key = cacheKeys.threatIntel("192.0.2.1");
      expect(key).toBe("threat:192.0.2.1");
    });

    it("should generate alert rule cache key", () => {
      const key = cacheKeys.alertRule("rule-1");
      expect(key).toBe("rule:rule-1");
    });

    it("should generate mitigation rule cache key", () => {
      const key = cacheKeys.mitigationRule("mitigation-1");
      expect(key).toBe("mitigation:mitigation-1");
    });

    it("should generate user cache key", () => {
      const key = cacheKeys.user("user-1");
      expect(key).toBe("user:user-1");
    });

    it("should generate API response cache key", () => {
      const key = cacheKeys.apiResponse("/api/attacks", "limit=10");
      expect(key).toBe("api:/api/attacks:limit=10");
    });
  });
});
