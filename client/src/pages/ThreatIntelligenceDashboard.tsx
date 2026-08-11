import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Globe, Shield, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const SAMPLE_THREATS = [
  {
    id: 1,
    sourceIp: "192.168.1.100",
    reputation: "malicious" as const,
    threatLevel: "critical" as const,
    threatType: "Botnet C&C",
    threatActor: "APT28",
    knownBotnets: ["Mirai", "Emotet"],
    lastSeen: "2 hours ago",
  },
  {
    id: 2,
    sourceIp: "10.0.0.50",
    reputation: "suspicious" as const,
    threatLevel: "high" as const,
    threatType: "Proxy",
    threatActor: "Unknown",
    knownBotnets: ["Shadowsocks"],
    lastSeen: "30 minutes ago",
  },
  {
    id: 3,
    sourceIp: "172.16.0.1",
    reputation: "clean" as const,
    threatLevel: "low" as const,
    threatType: "ISP",
    threatActor: "None",
    knownBotnets: [],
    lastSeen: "Just now",
  },
];

const THREAT_ACTORS = [
  { name: "APT28", attacks: 1250, lastSeen: "2 hours ago", countries: ["Russia", "China"] },
  { name: "Lazarus", attacks: 890, lastSeen: "6 hours ago", countries: ["North Korea"] },
  { name: "APT29", attacks: 650, lastSeen: "12 hours ago", countries: ["Russia"] },
  { name: "FIN7", attacks: 520, lastSeen: "1 day ago", countries: ["Unknown"] },
];

export default function ThreatIntelligenceDashboard() {
  const [searchIp, setSearchIp] = useState("");
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [threats, setThreats] = useState(SAMPLE_THREATS);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch threat intelligence data
  const { data: threatIntelData, isLoading: isThreatLoading } = trpc.threatIntel.getMaliciousIps.useQuery({
    limit: 50,
  });

  // Lookup IP query
  const lookupQuery = trpc.threatIntel.getByIp.useQuery(
    { sourceIp: searchIp },
    { enabled: false }
  );

  const handleLookupIp = async () => {
    const result = await lookupQuery.refetch();
    if (result.data) {
      setThreats([result.data as any, ...threats]);
      toast.success(`IP ${searchIp} enriched successfully`);
      setSearchIp("");
    }
  };

  // Block IP mutation
  const blockIpMutation = trpc.mitigation.createRule.useMutation({
    onSuccess: () => {
      toast.success("IP blocked successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to block IP: " + error.message);
    },
  });

  // Load threat intelligence data on mount
  useEffect(() => {
    if (threatIntelData && Array.isArray(threatIntelData)) {
      setThreats(threatIntelData as any);
    }
  }, [threatIntelData]);

  const handleSearchIp = () => {
    if (!searchIp.trim()) {
      toast.error("Please enter an IP address");
      return;
    }

    handleLookupIp();
  };

  const handleBlockIp = (ip: string) => {
    blockIpMutation.mutate({
      type: "ip_block" as const,
      target: ip,
    });
  };

  const getReputationColor = (reputation: string) => {
    switch (reputation) {
      case "malicious":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "suspicious":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "clean":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "high":
        return "text-orange-600 dark:text-orange-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Threat Intelligence Feed
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time threat intelligence from AlienVault OTX, Shodan, and internal sources
        </p>
      </div>

      {/* IP Lookup */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-900">
        <h2 className="text-lg font-semibold mb-4">IP Reputation Lookup</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Enter IP address to enrich..."
            value={searchIp}
            onChange={(e) => setSearchIp(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearchIp()}
          />
          <Button 
            onClick={handleSearchIp} 
            disabled={lookupQuery.isFetching || isSearching}
            className="bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {lookupQuery.isFetching ? "Searching..." : "Lookup"}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Malicious IPs</p>
              <p className="text-2xl font-bold text-red-600">{threats.filter(t => t.reputation === "malicious").length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Threat Actors</p>
              <p className="text-2xl font-bold text-orange-600">{THREAT_ACTORS.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Known Botnets</p>
              <p className="text-2xl font-bold text-purple-600">18</p>
            </div>
            <Globe className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vulnerabilities</p>
              <p className="text-2xl font-bold text-cyan-600">156</p>
            </div>
            <Shield className="w-8 h-8 text-cyan-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Threats */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Known Threats</h2>
        {isThreatLoading ? (
          <div className="text-center py-8 text-gray-500">Loading threats...</div>
        ) : (
          <div className="space-y-3">
            {(threats as any[]).map((threat: any) => (
              <div
                key={threat.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                onClick={() => setSelectedThreat(threat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {threat.sourceIp}
                      </code>
                      <Badge className={getReputationColor(threat.reputation || "clean")}>
                        {threat.reputation || "clean"}
                      </Badge>
                      <span className={`text-sm font-semibold ${getThreatLevelColor(threat.threatLevel || "low")}`}>
                        {(threat.threatLevel || "low").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {threat.threatType} • {threat.threatActor}
                    </p>
                    {threat.knownBotnets && threat.knownBotnets.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {threat.knownBotnets.map((botnet: any) => (
                          <Badge key={botnet} variant="secondary" className="text-xs">
                            {botnet}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Last seen</p>
                    <p className="text-sm font-medium">{threat.lastSeen}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Threat Actors */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Top Threat Actors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THREAT_ACTORS.map((actor) => (
            <div key={actor.name} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{actor.name}</h3>
                <Badge variant="destructive">{actor.attacks} attacks</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Last seen: <span className="font-medium">{actor.lastSeen}</span>
                </p>
                <div className="flex gap-1 flex-wrap">
                  {actor.countries.map((country) => (
                    <Badge key={country} variant="outline" className="text-xs">
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">Threat Details</h2>
              <button onClick={() => setSelectedThreat(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IP Address</p>
                  <p className="font-mono font-semibold">{selectedThreat.sourceIp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reputation</p>
                  <Badge className={getReputationColor(selectedThreat.reputation)}>
                    {selectedThreat.reputation}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Threat Level</p>
                  <span className={`font-semibold ${getThreatLevelColor(selectedThreat.threatLevel)}`}>
                    {selectedThreat.threatLevel.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Threat Type</p>
                  <p className="font-semibold">{selectedThreat.threatType}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Threat Actor</p>
                <p className="font-semibold">{selectedThreat.threatActor}</p>
              </div>

              {selectedThreat.knownBotnets && selectedThreat.knownBotnets.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Known Botnets</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedThreat.knownBotnets.map((botnet: string) => (
                      <Badge key={botnet} variant="secondary">
                        {botnet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
                  onClick={() => {
                    handleBlockIp(selectedThreat.sourceIp);
                    setSelectedThreat(null);
                  }}
                  disabled={blockIpMutation.isPending}
                >
                  {blockIpMutation.isPending ? "Blocking..." : "Block IP"}
                </Button>
                <Button variant="outline" className="flex-1">
                  Add to Watchlist
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
