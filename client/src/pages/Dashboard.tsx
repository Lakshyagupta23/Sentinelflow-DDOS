import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Activity, Shield, TrendingUp, Zap, Clock, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#c5a880", "#64748b", "#8a9a86", "#475569", "#a3a3a3"];

export default function Dashboard() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  const attacksQuery = trpc.attacks.ongoing.useQuery();
  const trafficQuery = trpc.traffic.recent.useQuery({ limit: 60 });
  const alertsQuery = trpc.alerts.unread.useQuery();

  const trafficData = trafficQuery.data?.map((m: any) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    volume: parseFloat(String(m.trafficVolume || 0)),
    rate: parseFloat(String(m.requestRate || 0)),
  })) || [];

  const protocolData = trafficQuery.data?.[0]?.protocolBreakdown
    ? Object.entries(JSON.parse(trafficQuery.data[0].protocolBreakdown as string)).map(([name, value]: [string, any]) => ({
        name: name.toUpperCase(),
        value,
      }))
    : [];

  const severityStats = attacksQuery.data?.reduce((acc: any, attack: any) => {
    const key = attack.severity;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) || {};

  const severityData = Object.entries(severityStats).map(([severity, count]) => ({
    name: severity,
    value: count,
  }));

  const metrics = [
    {
      title: "Active Attacks",
      value: attacksQuery.data?.filter((a: any) => a.status === "ongoing").length || 0,
      icon: AlertCircle,
      bgClass: "border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5",
      trend: "+12%",
    },
    {
      title: "Mitigated Today",
      value: attacksQuery.data?.filter((a: any) => a.status === "mitigated").length || 0,
      icon: Shield,
      bgClass: "border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5",
      trend: "+8%",
    },
    {
      title: "Traffic Volume",
      value: `${Math.round(parseFloat(String(attacksQuery.data?.[0]?.peakTraffic || 0)))} Gbps`,
      icon: TrendingUp,
      bgClass: "border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5",
      trend: "-5%",
    },
    {
      title: "Alerts Pending",
      value: alertsQuery.data?.length || 0,
      icon: Zap,
      bgClass: "border-[#d9c06c]/30 text-[#d9c06c] bg-[#d9c06c]/5",
      trend: "+3%",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Security Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time threat monitoring and attack analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="hud-border p-6 bg-[#13151a]/30 transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 border flex items-center justify-center transition-transform duration-300 ${metric.bgClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge className="bg-[#1b1e24] text-[#c5a880] border border-[#c5a880]/20 rounded-none font-mono text-[9px]">
                    {metric.trend}
                  </Badge>
                </div>
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">{metric.title}</h3>
                <p className="text-2xl font-bold font-serif text-[#e2e8f0]">{metric.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="traffic" className="space-y-6">
          <TabsList className="bg-[#13151a] border border-[#c5a880]/15 rounded-none p-0.5">
            <TabsTrigger value="traffic" className="rounded-none font-mono text-[10px] uppercase px-4 data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12]">
              <Activity className="w-3.5 h-3.5 mr-2" />
              Traffic
            </TabsTrigger>
            <TabsTrigger value="attacks" className="rounded-none font-mono text-[10px] uppercase px-4 data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12]">
              <AlertCircle className="w-3.5 h-3.5 mr-2" />
              Attacks
            </TabsTrigger>
            <TabsTrigger value="protocols" className="rounded-none font-mono text-[10px] uppercase px-4 data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12]">
              <Lock className="w-3.5 h-3.5 mr-2" />
              Protocols
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-6">
            <Card className="glass-card rounded-none">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Traffic Volume & Request Rate</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] uppercase font-mono">Last 60 minutes of network activity</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {trafficQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trafficData}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c5a880" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#c5a880" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(197, 168, 128, 0.05)" />
                      <XAxis dataKey="time" stroke="rgba(197, 168, 128, 0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="rgba(197, 168, 128, 0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(19, 21, 26, 0.95)", border: "1px solid #c5a880", borderRadius: "0px", color: "#e2e8f0", fontFamily: 'monospace', fontSize: 10 }} />
                      <Area type="monotone" dataKey="volume" stroke="#c5a880" fillOpacity={1} fill="url(#colorVolume)" name="Volume (Gbps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attacks" className="space-y-6">
            <Card className="glass-card rounded-none">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Attack Severity Distribution</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] uppercase font-mono">Breakdown of detected attacks by severity level</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {severityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name.toUpperCase()}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "rgba(19, 21, 26, 0.95)", border: "1px solid #c5a880", borderRadius: "0px", color: "#e2e8f0", fontFamily: 'monospace', fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs font-mono">NO ATTACK DATA REPORTED</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocols" className="space-y-6">
            <Card className="glass-card rounded-none">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Protocol Breakdown</CardTitle>
                <CardDescription className="text-muted-foreground text-[10px] uppercase font-mono">Network protocols detected in traffic</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {protocolData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={protocolData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(197, 168, 128, 0.05)" />
                      <XAxis dataKey="name" stroke="rgba(197, 168, 128, 0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="rgba(197, 168, 128, 0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(19, 21, 26, 0.95)", border: "1px solid #c5a880", borderRadius: "0px", color: "#e2e8f0", fontFamily: 'monospace', fontSize: 10 }} />
                      <Bar dataKey="value" fill="#c5a880" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs font-mono">NO PROTOCOL METRICS AVAILABLE</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Attacks */}
        <Card className="glass-card rounded-none">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-[#c5a880] font-serif text-sm tracking-wider uppercase">
              <AlertCircle className="w-4 h-4 text-[#e05a5a]" />
              Recent Incidents Log
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] uppercase font-mono">Latest detected DDoS attacks and mitigation status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {attacksQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : attacksQuery.data && attacksQuery.data.length > 0 ? (
              <div className="space-y-3">
                {attacksQuery.data.slice(0, 5).map((attack: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold font-serif text-xs text-[#e2e8f0] uppercase tracking-wider">{attack.attackType}</h4>
                        <Badge className={`badge-${attack.severity.toLowerCase()} rounded-none text-[8px] font-mono uppercase px-1.5 py-0.5`}>{attack.severity}</Badge>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#c5a880]" />
                        {new Date(attack.startTime).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={`badge-${attack.status.toLowerCase()} rounded-none text-[8px] font-mono uppercase px-1.5 py-0.5`}>{attack.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs font-mono">NO RECORDED THREAT INCIDENTS</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
