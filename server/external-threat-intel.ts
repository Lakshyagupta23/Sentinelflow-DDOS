import { cache } from "./cache";
import { getSampleMaliciousIps, getSampleThreatDataByIp } from "./sample-threat-data";

/**
 * External Threat Intelligence Service
 * Integrates with AlienVault OTX, Shodan, and other public threat feeds
 */

interface ThreatIntelResult {
  ip: string;
  reputation: "malicious" | "suspicious" | "clean";
  threatLevel: "critical" | "high" | "medium" | "low";
  threatType: string | null;
  threatActor: string | null;
  knownBotnets: string[];
  lastSeen: string;
  sources: string[];
}

// Cache threat intel results for 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Query AlienVault OTX for IP reputation
 * https://otx.alienvault.com/api
 */
export async function queryAlienVaultOTX(ip: string): Promise<Partial<ThreatIntelResult> | null> {
  try {
    // Check cache first
    const cacheKey = `otx:${ip}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // AlienVault OTX API endpoint
    const response = await fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`, {
      headers: {
        "X-OTX-API-KEY": process.env.ALIENVAULT_OTX_API_KEY || "default",
      },
    });

    if (!response.ok) {
      console.warn(`[OTX] Failed to query IP ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Parse OTX response
    const result: Partial<ThreatIntelResult> = {
      ip,
      reputation: data.reputation === 0 ? "clean" : data.reputation > 0 ? "malicious" : "suspicious",
      threatLevel:
        data.reputation > 3 ? "critical" : data.reputation > 1 ? "high" : data.reputation > 0 ? "medium" : "low",
      threatType: data.type || null,
      threatActor: data.threat_actor || null,
      knownBotnets: data.malware || [],
      lastSeen: new Date().toISOString(),
      sources: ["AlienVault OTX"],
    };

    // Cache the result
    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error("[OTX] Error querying AlienVault OTX:", error);
    return null;
  }
}

/**
 * Query Shodan for IP information
 * https://www.shodan.io/api
 */
export async function queryShodan(ip: string): Promise<Partial<ThreatIntelResult> | null> {
  try {
    const cacheKey = `shodan:${ip}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_API_KEY}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Shodan] Failed to query IP ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Parse Shodan response
    const result: Partial<ThreatIntelResult> = {
      ip,
      threatType: data.vulns ? `${data.vulns.length} vulnerabilities` : "Unknown",
      sources: ["Shodan"],
    };

    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error("[Shodan] Error querying Shodan:", error);
    return null;
  }
}

/**
 * Query AbuseIPDB for IP abuse reports
 * https://www.abuseipdb.com/api
 */
export async function queryAbuseIPDB(ip: string): Promise<Partial<ThreatIntelResult> | null> {
  try {
    const cacheKey = `abuseipdb:${ip}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await fetch("https://api.abuseipdb.com/api/v2/check", {
      method: "POST",
      headers: {
        Key: process.env.ABUSEIPDB_API_KEY || "default",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        ipAddress: ip,
        maxAgeInDays: "90",
      }).toString(),
    });

    if (!response.ok) {
      console.warn(`[AbuseIPDB] Failed to query IP ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const abuseData = data.data;

    // Parse AbuseIPDB response
    const abuseScore = abuseData.abuseConfidenceScore || 0;
    const result: Partial<ThreatIntelResult> = {
      ip,
      reputation: abuseScore > 75 ? "malicious" : abuseScore > 25 ? "suspicious" : "clean",
      threatLevel: abuseScore > 75 ? "critical" : abuseScore > 50 ? "high" : abuseScore > 25 ? "medium" : "low",
      threatType: abuseData.usageType || null,
      lastSeen: abuseData.lastReportedAt || new Date().toISOString(),
      sources: ["AbuseIPDB"],
    };

    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error("[AbuseIPDB] Error querying AbuseIPDB:", error);
    return null;
  }
}

/**
 * Aggregate threat intelligence from multiple sources
 */
export async function enrichThreatIntelligence(ip: string): Promise<ThreatIntelResult> {
  const results: Partial<ThreatIntelResult>[] = [];

  // Query all available sources in parallel
  const [otx, shodan, abuseipdb] = await Promise.all([
    queryAlienVaultOTX(ip),
    queryShodan(ip),
    queryAbuseIPDB(ip),
  ]);

  if (otx) results.push(otx);
  if (shodan) results.push(shodan);
  if (abuseipdb) results.push(abuseipdb);

  // If no results from external APIs, try sample data
  if (results.length === 0) {
    console.log(`[Enrichment] No external data for ${ip}, using sample data`);
    const sampleData = getSampleThreatDataByIp(ip);
    return sampleData as ThreatIntelResult;
  }

  // Aggregate results
  const aggregated: ThreatIntelResult = {
    ip,
    reputation: results.some((r) => r.reputation === "malicious")
      ? "malicious"
      : results.some((r) => r.reputation === "suspicious")
        ? "suspicious"
        : "clean",
    threatLevel: results.some((r) => r.threatLevel === "critical")
      ? "critical"
      : results.some((r) => r.threatLevel === "high")
        ? "high"
        : results.some((r) => r.threatLevel === "medium")
          ? "medium"
          : "low",
    threatType: results.find((r) => r.threatType)?.threatType || null,
    threatActor: results.find((r) => r.threatActor)?.threatActor || null,
    knownBotnets: Array.from(new Set(results.flatMap((r) => r.knownBotnets || []))),
    lastSeen: new Date().toISOString(),
    sources: Array.from(new Set(results.flatMap((r) => r.sources || []))),
  };

  return aggregated;
}

/**
 * Get malicious IPs from threat feeds
 */
export async function getMaliciousIpsFromFeeds(): Promise<string[]> {
  try {
    const cacheKey = "malicious_ips_feeds";
    const cached = cache.get<string[]>(cacheKey);
    if (cached) return cached;

    // Fetch from public threat feeds
    const feeds = [
      "https://rules.emergingthreats.net/blockrules/compromised-ips.txt",
      "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=50",
    ];

    const ips: Set<string> = new Set();

    for (const feed of feeds) {
      try {
        const response = await fetch(feed);
        if (response.ok) {
          const text = await response.text();
          const lines = text.split("\n");
          lines.forEach((line) => {
            const ip = line.trim();
            if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
              ips.add(ip);
            }
          });
        }
      } catch (error) {
        console.error(`[Feeds] Error fetching feed ${feed}:`, error);
      }
    }

    const result = Array.from(ips);

    // Use sample data if no IPs were fetched
    if (result.length === 0) {
      console.log("[Feeds] No IPs fetched from feeds, using sample data");
      const sampleIps = getSampleMaliciousIps().map((t) => t.ip);
      cache.set(cacheKey, sampleIps, 6 * 60 * 60 * 1000);
      return sampleIps;
    }

    cache.set(cacheKey, result, 6 * 60 * 60 * 1000); // 6 hour cache
    return result;
  } catch (error) {
    console.error("[Feeds] Error getting malicious IPs:", error);
    // Fallback to sample data
    const sampleIps = getSampleMaliciousIps().map((t) => t.ip);
    return sampleIps;
  }
}
