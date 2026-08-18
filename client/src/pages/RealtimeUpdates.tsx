import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap, Activity, TrendingUp, RefreshCw, Pause, Play, Clock } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const SAMPLE_LIVE_ATTACKS = [
  {
    id: 1,
    type: "volumetric",
    severity: "critical",
    sourceIp: "192.168.1.100",
    targetUrl: "api.example.com/auth",
    traffic: "2.5 Gbps",
    timestamp: "2026-06-02 15:42:33",
    status: "ongoing",
  },
  {
    id: 2,
    type: "protocol",
    severity: "high",
    sourceIp: "10.0.0.50",
    targetUrl: "example.com",
    traffic: "850 Mbps",
    timestamp: "2026-06-02 15:41:15",
    status: "ongoing",
  },
  {
    id: 3,
    type: "application_layer",
    severity: "medium",
    sourceIp: "172.16.0.25",
    targetUrl: "api.example.com/search",
    traffic: "120 Mbps",
    timestamp: "2026-06-02 15:40:02",
    status: "mitigated",
  },
];

const SAMPLE_LIVE_METRICS = [
  { timestamp: "15:35", traffic: 1200, requests: 45000, alerts: 3 },
  { timestamp: "15:36", traffic: 1450, requests: 52000, alerts: 2 },
  { timestamp: "15:37", traffic: 2100, requests: 78000, alerts: 5 },
  { timestamp: "15:38", traffic: 2800, requests: 95000, alerts: 8 },
  { timestamp: "15:39", traffic: 2500, requests: 88000, alerts: 6 },
  { timestamp: "15:40", traffic: 1800, requests: 65000, alerts: 4 },
  { timestamp: "15:41", traffic: 2200, requests: 81000, alerts: 7 },
  { timestamp: "15:42", traffic: 2600, requests: 92000, alerts: 9 },
];

const SAMPLE_LIVE_ALERTS = [
  {
    id: 1,
    type: "attack_detected",
    severity: "critical",
    message: "Volumetric DDoS attack detected on api.example.com",
    timestamp: "2026-06-02 15:42:45",
  },
  {
    id: 2,
    type: "traffic_spike",
    severity: "high",
    message: "Traffic spike detected: 2.5 Gbps (200% above baseline)",
    timestamp: "2026-06-02 15:42:33",
  },
  {
    id: 3,
    type: "anomaly",
    severity: "medium",
    message: "Unusual request pattern from 192.168.1.100",
    timestamp: "2026-06-02 15:41:50",
  },
  {
    id: 4,
    type: "threshold_exceeded",
    severity: "high",
    message: "Connection limit exceeded on port 443",
    timestamp: "2026-06-02 15:40:15",
  },
];

export default function RealtimeUpdates() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(5000); // 5 seconds
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [attacks, setAttacks] = useState(SAMPLE_LIVE_ATTACKS);
  const [metrics, setMetrics] = useState(SAMPLE_LIVE_METRICS);
  const [alerts, setAlerts] = useState(SAMPLE_LIVE_ALERTS);

  // Use WebSocket for real-time updates
  const { isConnected, connectionStatus } = useRealtimeUpdates({
    channels: ["attacks", "metrics", "alerts"],
    onMessage: (message) => {
      if (message.type === "attack_update" && message.data) {
        setAttacks((prev) => [message.data, ...prev.slice(0, 9)]);
        setLastUpdate(new Date());
      } else if (message.type === "metrics_update" && message.data) {
        setMetrics((prev) => [...prev.slice(1), message.data]);
        setLastUpdate(new Date());
      } else if (message.type === "alert" && message.data) {
        setAlerts((prev) => [message.data, ...prev.slice(0, 9)]);
        setLastUpdate(new Date());
      }
    },
    autoConnect: true,
  });

  // Fallback to polling if WebSocket is not connected
  useEffect(() => {
    if (!isLive || isConnected) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      toast.info("Using polling mode", { duration: 1000 });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, updateInterval, isConnected]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5";
      case "high":
        return "border-[#e6955a]/30 text-[#e6955a] bg-[#e6955a]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5";
      case "medium":
        return "border-[#d9c06c]/30 text-[#d9c06c] bg-[#d9c06c]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5";
      case "low":
        return "border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5";
      default:
        return "border-[#64748b]/30 text-[#64748b] bg-[#64748b]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attack_detected":
        return <AlertCircle className="w-3.5 h-3.5" />;
      case "traffic_spike":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "anomaly":
        return <Zap className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Real-Time Telemetry</h1>
              <p className="text-xs text-muted-foreground">Live threat intelligence parser and active network metrics</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">WebSocket Status</p>
                <div className="flex items-center gap-2 justify-end mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  <p className="text-xs font-mono text-[#c5a880] uppercase">{connectionStatus}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Last Packet Sync</p>
                <p className="text-xs font-mono text-[#c5a880] mt-0.5">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase px-4 h-8"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? (
                  <>
                    <Pause className="w-3 h-3 mr-1.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1.5" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground border-b border-[#c5a880]/10 pb-4">
          <div className={`w-2 h-2 rounded-none ${isLive ? "bg-green-500 animate-pulse" : "bg-slate-500"}`} />
          <span>
            {isLive ? "Live Stream Active" : "Telemetry Paused"} • Poll sync interval: {updateInterval / 1000}s
          </span>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Attacks */}
          <Card className="lg:col-span-2 glass-card rounded-none">
            <CardHeader className="border-b border-[#c5a880]/10 pb-4">
              <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#e05a5a]" />
                Ingress Threat Vector Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {attacks.map((attack) => (
                  <div
                    key={attack.id}
                    className="p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{attack.targetUrl}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{attack.sourceIp}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getSeverityColor(attack.severity)}>{attack.severity}</Badge>
                        <p className="text-[9px] font-mono text-muted-foreground mt-1.5 flex items-center gap-1 justify-end">
                          <Clock className="w-2.5 h-2.5" />
                          {attack.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#1b1e24] text-muted-foreground border border-border rounded-none font-mono text-[8px] uppercase">{attack.type}</Badge>
                        <span className="text-xs font-mono text-[#c5a880]">{attack.traffic}</span>
                      </div>
                      <Badge
                        className={
                          attack.status === "ongoing"
                            ? "border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5 animate-pulse"
                            : "border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5"
                        }
                      >
                        {attack.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metrics Summary */}
          <Card className="glass-card rounded-none">
            <CardHeader className="border-b border-[#c5a880]/10 pb-4">
              <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Live Core Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Ingress Peak Traffic</p>
                  <p className="text-xl font-bold font-serif text-[#c5a880] mt-0.5">2.8 Gbps</p>
                </div>
                <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Request Ingress Rate</p>
                  <p className="text-xl font-bold font-serif text-[#c5a880] mt-0.5">95K req/s</p>
                </div>
                <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Ongoing Incident Queue</p>
                  <p className="text-xl font-bold font-serif text-[#e05a5a] mt-0.5">9 Active</p>
                </div>
                <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Automatic Scrub Rate</p>
                  <p className="text-xl font-bold font-serif text-[#8a9a86] mt-0.5">94.00%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Alerts Feed */}
        <Card className="glass-card rounded-none">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#d9c06c]" />
              Threat Anomaly Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-all duration-300"
                >
                  <div className={`mt-0.5 ${getSeverityColor(alert.severity)}`}>
                    {getTypeIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[#e2e8f0]">{alert.message}</p>
                    <p className="text-[9px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {alert.timestamp}
                    </p>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Timeline */}
        <Card className="glass-card rounded-none">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Scrub Volume Timeline (Last 8 Minutes)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-end justify-between gap-3 h-40 pt-4 border-b border-[#c5a880]/10 pb-1">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-[#c5a880]/20 border-t-2 border-[#c5a880] transition-all hover:bg-[#c5a880]/35"
                    style={{ height: `${(metric.traffic / 3000) * 100}%` }}
                    title={`${metric.traffic} Mbps`}
                  />
                  <p className="text-[9px] font-mono text-muted-foreground">{metric.timestamp}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
