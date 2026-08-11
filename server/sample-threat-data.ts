/**
 * Sample threat intelligence data for demo/fallback scenarios
 */

export const SAMPLE_THREAT_DATA = {
  malicious_ips: [
    {
      ip: "192.168.1.100",
      reputation: "malicious" as const,
      threatLevel: "critical" as const,
      threatType: "Botnet C&C",
      threatActor: "Mirai Botnet",
      knownBotnets: ["Mirai", "Dridex"],
      lastSeen: new Date(Date.now() - 60000).toISOString(),
      sources: ["AlienVault OTX", "AbuseIPDB"],
    },
    {
      ip: "203.0.113.45",
      reputation: "malicious" as const,
      threatLevel: "high" as const,
      threatType: "Ransomware",
      threatActor: "LockBit",
      knownBotnets: ["LockBit", "Conti"],
      lastSeen: new Date(Date.now() - 120000).toISOString(),
      sources: ["Shodan", "AbuseIPDB"],
    },
    {
      ip: "198.51.100.89",
      reputation: "suspicious" as const,
      threatLevel: "medium" as const,
      threatType: "Phishing Infrastructure",
      threatActor: "Unknown",
      knownBotnets: [],
      lastSeen: new Date(Date.now() - 180000).toISOString(),
      sources: ["AlienVault OTX"],
    },
    {
      ip: "192.0.2.50",
      reputation: "malicious" as const,
      threatLevel: "high" as const,
      threatType: "DDoS Proxy",
      threatActor: "Fancy Bear",
      knownBotnets: ["Fancy Bear", "APT28"],
      lastSeen: new Date(Date.now() - 240000).toISOString(),
      sources: ["AbuseIPDB", "Shodan"],
    },
    {
      ip: "203.0.113.200",
      reputation: "malicious" as const,
      threatLevel: "critical" as const,
      threatType: "Malware Distribution",
      threatActor: "Lazarus Group",
      knownBotnets: ["Lazarus", "Kimsuky"],
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      sources: ["AlienVault OTX", "Shodan"],
    },
  ],

  threat_actors: [
    {
      name: "Mirai Botnet",
      description: "Large-scale IoT botnet responsible for massive DDoS attacks",
      sophistication: "high",
      targetSectors: ["Telecommunications", "Financial Services", "Government"],
      knownTools: ["Mirai", "Dridex", "Emotet"],
    },
    {
      name: "LockBit",
      description: "Ransomware-as-a-Service (RaaS) operation targeting enterprises",
      sophistication: "critical",
      targetSectors: ["Healthcare", "Manufacturing", "Finance"],
      knownTools: ["LockBit", "Conti", "BlackMatter"],
    },
    {
      name: "Fancy Bear (APT28)",
      description: "Russian state-sponsored APT group conducting espionage",
      sophistication: "critical",
      targetSectors: ["Government", "Defense", "Media"],
      knownTools: ["Fancy Bear", "X-Agent", "Komplex"],
    },
    {
      name: "Lazarus Group",
      description: "North Korean state-sponsored group known for financial theft",
      sophistication: "critical",
      targetSectors: ["Financial", "Cryptocurrency", "Defense"],
      knownTools: ["Lazarus", "Kimsuky", "BlueNoroff"],
    },
  ],

  vulnerabilities: [
    {
      id: "CVE-2024-1234",
      title: "Critical RCE in OpenSSL",
      severity: "critical",
      cvssScore: 9.8,
      description: "Remote code execution vulnerability in OpenSSL cryptographic library",
      affectedProducts: ["OpenSSL 3.0.x", "OpenSSL 3.1.x"],
      exploitAvailable: true,
      inTheWild: true,
    },
    {
      id: "CVE-2024-5678",
      title: "SQL Injection in WordPress Plugin",
      severity: "high",
      cvssScore: 8.9,
      description: "SQL injection vulnerability in popular WordPress plugin",
      affectedProducts: ["WordPress Plugin XYZ < 2.0"],
      exploitAvailable: true,
      inTheWild: true,
    },
    {
      id: "CVE-2024-9012",
      title: "Privilege Escalation in Linux Kernel",
      severity: "high",
      cvssScore: 8.4,
      description: "Local privilege escalation in Linux kernel scheduler",
      affectedProducts: ["Linux Kernel 5.10.x", "Linux Kernel 6.0.x"],
      exploitAvailable: true,
      inTheWild: false,
    },
  ],

  botnets: [
    {
      name: "Mirai",
      type: "IoT Botnet",
      size: 600000,
      capabilities: ["DDoS", "Scanning", "Exploitation"],
      originCountry: "Unknown",
      active: true,
    },
    {
      name: "Emotet",
      type: "Malware",
      size: 1000000,
      capabilities: ["Banking Trojan", "Botnet", "Worm"],
      originCountry: "Ukraine",
      active: true,
    },
    {
      name: "Conti",
      type: "Ransomware",
      size: 500000,
      capabilities: ["Ransomware", "Data Exfiltration", "Lateral Movement"],
      originCountry: "Russia",
      active: true,
    },
    {
      name: "Dridex",
      type: "Banking Trojan",
      size: 300000,
      capabilities: ["Banking Fraud", "Credential Theft", "Botnet"],
      originCountry: "Russia",
      active: true,
    },
  ],
};

/**
 * Get random sample threat data
 */
export function getRandomThreatData() {
  const ips = SAMPLE_THREAT_DATA.malicious_ips;
  return ips[Math.floor(Math.random() * ips.length)];
}

/**
 * Get sample threat data by IP
 */
export function getSampleThreatDataByIp(ip: string) {
  const found = SAMPLE_THREAT_DATA.malicious_ips.find((t) => t.ip === ip);
  if (found) return found;

  // Return a clean entry for unknown IPs
  return {
    ip,
    reputation: "clean" as const,
    threatLevel: "low" as const,
    threatType: null,
    threatActor: null,
    knownBotnets: [],
    lastSeen: new Date().toISOString(),
    sources: ["Sample Data"],
  };
}

/**
 * Get sample malicious IPs
 */
export function getSampleMaliciousIps(limit: number = 50) {
  return SAMPLE_THREAT_DATA.malicious_ips.slice(0, limit);
}
