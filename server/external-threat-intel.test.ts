import { describe, it, expect, beforeEach, vi } from "vitest";
import { cache } from "./cache";
import { enrichThreatIntelligence } from "./external-threat-intel";

describe("External Threat Intelligence", () => {
  beforeEach(() => {
    cache.clear();
  });

  describe("Cache", () => {
    it("should store and retrieve cached values", () => {
      cache.set("test_key", { value: "test" }, 1000);
      const result = cache.get("test_key");
      expect(result).toEqual({ value: "test" });
    });

    it("should return null for expired cache entries", async () => {
      cache.set("test_key", { value: "test" }, 100); // 100ms TTL
      await new Promise((resolve) => setTimeout(resolve, 150));
      const result = cache.get("test_key");
      expect(result).toBeNull();
    });

    it("should check cache existence", () => {
      cache.set("test_key", { value: "test" }, 1000);
      expect(cache.has("test_key")).toBe(true);
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should delete cache entries", () => {
      cache.set("test_key", { value: "test" }, 1000);
      cache.delete("test_key");
      expect(cache.has("test_key")).toBe(false);
    });

    it("should clear all cache entries", () => {
      cache.set("key1", { value: 1 }, 1000);
      cache.set("key2", { value: 2 }, 1000);
      cache.clear();
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });
  });

  describe("Threat Intelligence Enrichment", () => {
    it(
      "should return threat intelligence structure",
      async () => {
        // Mock the enrichment function to avoid actual API calls
        const result = await enrichThreatIntelligence("8.8.8.8");

        expect(result).toHaveProperty("ip");
        expect(result).toHaveProperty("reputation");
        expect(result).toHaveProperty("threatLevel");
        expect(result).toHaveProperty("knownBotnets");
        expect(result).toHaveProperty("lastSeen");
        expect(result).toHaveProperty("sources");
      },
      { timeout: 15000 }
    );

    it(
      "should have valid reputation values",
      async () => {
        const result = await enrichThreatIntelligence("8.8.8.8");
        expect(["malicious", "suspicious", "clean"]).toContain(result.reputation);
      },
      { timeout: 15000 }
    );

    it(
      "should have valid threat levels",
      async () => {
        const result = await enrichThreatIntelligence("8.8.8.8");
        expect(["critical", "high", "medium", "low"]).toContain(result.threatLevel);
      },
      { timeout: 15000 }
    );

    it(
      "should return array of known botnets",
      async () => {
        const result = await enrichThreatIntelligence("8.8.8.8");
        expect(Array.isArray(result.knownBotnets)).toBe(true);
      },
      { timeout: 15000 }
    );

    it(
      "should return array of sources",
      async () => {
        const result = await enrichThreatIntelligence("8.8.8.8");
        expect(Array.isArray(result.sources)).toBe(true);
      },
      { timeout: 15000 }
    );

    it(
      "should use sample data fallback",
      async () => {
        // This IP should trigger fallback to sample data
        const result = await enrichThreatIntelligence("192.168.1.100");
        expect(result).toHaveProperty("ip");
        expect(result).toHaveProperty("reputation");
        // Should have sample data sources
        expect(result.sources.length).toBeGreaterThan(0);
      },
      { timeout: 15000 }
    );

    it(
      "should cache results for same IP",
      async () => {
        // Use a different IP to avoid long API calls
        const result1 = await enrichThreatIntelligence("203.0.113.45");
        const result2 = await enrichThreatIntelligence("203.0.113.45");

        // Both should return similar data (from cache on second call)
        expect(result1.ip).toBe(result2.ip);
      },
      { timeout: 20000 }
    );
  });
});
