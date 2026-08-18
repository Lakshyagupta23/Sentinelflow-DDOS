import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Globe, Shield, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Spinner } from "@/components/ui/spinner";

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
    switch (reputation.toLowerCase()) {
      case "malicious":
        return "border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      case "suspicious":
        return "border-[#e6955a]/30 text-[#e6955a] bg-[#e6955a]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      case "clean":
        return "border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      default:
        return "border-[#64748b]/30 text-[#64748b] bg-[#64748b]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return "text-[#e05a5a]";
      case "high":
        return "text-[#e6955a]";
      case "medium":
        return "text-[#d9c06c]";
      case "low":
        return "text-[#8a9a86]";
      default:
        return "text-[#64748b]";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Threat Intelligence Feed</h1>
          <p className="text-xs text-muted-foreground font-mono">Enrich IP telemetry metrics with global threat feeds (AlienVault, Shodan)</p>
        </div>

        {/* IP Lookup */}
        <Card className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/20">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase flex items-center gap-2">
              <Search className="w-4 h-4" />
              IP Reputation Query Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter IP address to enrich..."
                value={searchIp}
                onChange={(e) => setSearchIp(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchIp()}
                className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
              />
              <Button 
                onClick={handleSearchIp} 
                disabled={lookupQuery.isFetching || isSearching}
                className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-6"
              >
                {lookupQuery.isFetching ? "Syncing..." : "Lookup IP"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
          <Card className="glass-card rounded-none border-[#c5a880]/15 p-4 bg-[#13151a]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Malicious IPs Log</p>
                <p className="text-xl font-bold font-serif text-[#e05a5a] mt-0.5">{threats.filter(t => t.reputation === "malicious").length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-[#e05a5a] opacity-30" />
            </div>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15 p-4 bg-[#13151a]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Monitored Actors</p>
                <p className="text-xl font-bold font-serif text-[#c5a880] mt-0.5">{THREAT_ACTORS.length}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-[#c5a880] opacity-30" />
            </div>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15 p-4 bg-[#13151a]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Known Botnet Signatures</p>
                <p className="text-xl font-bold font-serif text-[#c5a880] mt-0.5">18</p>
              </div>
              <Globe className="w-6 h-6 text-[#c5a880] opacity-30" />
            </div>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15 p-4 bg-[#13151a]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase">CVE Vulnerabilities</p>
                <p className="text-xl font-bold font-serif text-[#c5a880] mt-0.5">156</p>
              </div>
              <Shield className="w-6 h-6 text-[#c5a880] opacity-30" />
            </div>
          </Card>
        </div>

        {/* Threats List */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Active Threat Log List</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isThreatLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-3">
                {(threats as any[]).map((threat: any) => (
                  <div
                    key={threat.id}
                    className="p-4 border border-[#c5a880]/10 bg-[#13151a]/30 rounded-none hover:border-[#c5a880]/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedThreat(threat)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-xs font-mono text-[#c5a880]">
                            {threat.sourceIp}
                          </code>
                          <Badge className={getReputationColor(threat.reputation || "clean")}>
                            {threat.reputation || "clean"}
                          </Badge>
                          <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${getThreatLevelColor(threat.threatLevel || "low")}`}>
                            {(threat.threatLevel || "low").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {threat.threatType} • Threat actor group: {threat.threatActor}
                        </p>
                        {threat.knownBotnets && threat.knownBotnets.length > 0 && (
                          <div className="mt-2.5 flex gap-1.5 flex-wrap">
                            {threat.knownBotnets.map((botnet: any) => (
                              <Badge key={botnet} className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[7px] uppercase">
                                {botnet}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-mono text-muted-foreground">Last observed</p>
                        <p className="text-xs font-mono text-[#e2e8f0] mt-1">{threat.lastSeen}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Threat Actors */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Active Threat Actors & Campaign Tracking</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THREAT_ACTORS.map((actor) => (
                <div key={actor.name} className="p-4 border border-[#c5a880]/10 bg-[#13151a]/30 rounded-none hover:border-[#c5a880]/30 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{actor.name}</h3>
                    <Badge className="border-[#e05a5a]/35 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[8px] uppercase">{actor.attacks} attacks</Badge>
                  </div>
                  <div className="space-y-2 text-[10px] font-mono">
                    <p className="text-muted-foreground">
                      Last observed online: <span className="text-[#e2e8f0]">{actor.lastSeen}</span>
                    </p>
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {actor.countries.map((country) => (
                        <Badge key={country} className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none text-[8px] uppercase">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        {selectedThreat && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <Card className="max-w-2xl w-full p-6 bg-[#0d0e12] border-[#c5a880]/30 rounded-none animate-fade-in">
              <div className="flex items-start justify-between mb-4 border-b border-[#c5a880]/10 pb-4">
                <h2 className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Threat Enrichment Details</h2>
                <button onClick={() => setSelectedThreat(null)} className="text-[#c5a880] hover:text-[#e2e8f0] text-sm">
                  ✕
                </button>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">IP Address</p>
                    <p className="font-mono text-xs text-[#e2e8f0] mt-0.5">{selectedThreat.sourceIp}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Reputation Profile</p>
                    <div className="mt-0.5">
                      <Badge className={getReputationColor(selectedThreat.reputation)}>
                        {selectedThreat.reputation}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Threat Severity Level</p>
                    <span className={`font-mono text-xs font-semibold uppercase ${getThreatLevelColor(selectedThreat.threatLevel)}`}>
                      {selectedThreat.threatLevel.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Threat Type</p>
                    <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0] mt-0.5">{selectedThreat.threatType}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Threat Actor Group</p>
                  <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{selectedThreat.threatActor}</p>
                </div>

                {selectedThreat.knownBotnets && selectedThreat.knownBotnets.length > 0 && (
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Known Botnet Networks</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedThreat.knownBotnets.map((botnet: string) => (
                        <Badge key={botnet} className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                          {botnet}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-[#c5a880]/10">
                  <Button 
                    className="flex-1 bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none h-10"
                    onClick={() => {
                      handleBlockIp(selectedThreat.sourceIp);
                      setSelectedThreat(null);
                    }}
                    disabled={blockIpMutation.isPending}
                  >
                    {blockIpMutation.isPending ? "Syncing..." : "Block Threat IP"}
                  </Button>
                  <Button variant="outline" className="flex-1 border-[#c5a880]/30 bg-transparent hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-10">
                    Add to Watchlist
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
