import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap, Activity, TrendingUp, RefreshCw, Pause, Play } from "lucide-react";
import { toast } from "sonner";

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
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "attack_detected":
        return <AlertCircle className="w-4 h-4" />;
      case "traffic_spike":
        return <TrendingUp className="w-4 h-4" />;
      case "anomaly":
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                Real-Time Monitoring
              </h1>
              <p className="text-slate-400">Live threat intelligence and system metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Connection Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  <p className="text-sm font-mono text-cyan-400">{connectionStatus}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Last Update</p>
                <p className="text-sm font-mono text-cyan-400">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="mb-8 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
          <span className="text-sm text-slate-300">
            {isLive ? "Live Updates Active" : "Updates Paused"} • Refresh every {updateInterval / 1000}s
          </span>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Attacks */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Active Attacks
              </h2>
              <div className="space-y-3">
                {attacks.map((attack) => (
                  <div
                    key={attack.id}
                    className="p-4 bg-slate-700/50 rounded border border-slate-600 hover:border-red-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">{attack.targetUrl}</p>
                        <p className="text-xs text-slate-400">{attack.sourceIp}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getSeverityColor(attack.severity)}>{attack.severity}</Badge>
                        <p className="text-xs text-slate-400 mt-1">{attack.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-600 text-slate-200">{attack.type}</Badge>
                        <span className="text-sm font-mono text-cyan-400">{attack.traffic}</span>
                      </div>
                      <Badge
                        className={
                          attack.status === "ongoing"
                            ? "bg-red-500/20 text-red-300 border-red-500/50 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        }
                      >
                        {attack.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Metrics Summary */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Current Metrics
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-xs text-slate-400">Peak Traffic</p>
                  <p className="text-2xl font-bold text-cyan-400">2.8 Gbps</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-xs text-slate-400">Requests/sec</p>
                  <p className="text-2xl font-bold text-cyan-400">95K</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-xs text-slate-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-red-400">9</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-xs text-slate-400">Mitigation Rate</p>
                  <p className="text-2xl font-bold text-emerald-400">94%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Real-Time Alerts Feed */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Alert Stream
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-slate-700/50 rounded border border-slate-600 hover:border-slate-500 transition-colors"
                >
                  <div className={`mt-1 ${getSeverityColor(alert.severity)}`}>
                    {getTypeIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{alert.timestamp}</p>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Traffic Timeline */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Traffic Timeline (Last 8 Minutes)</h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-blue-600 rounded-t transition-all hover:from-cyan-400 hover:to-blue-500"
                    style={{ height: `${(metric.traffic / 3000) * 100}%` }}
                    title={`${metric.traffic} Mbps`}
                  />
                  <p className="text-xs text-slate-400">{metric.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
