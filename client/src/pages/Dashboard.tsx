import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Activity, Shield, TrendingUp, Zap, Lock, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#06b6d4", "#3b82f6", "#6366f1", "#f97316", "#ef4444"];

export default function Dashboard() {
  const { user, loading } = useAuth();

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
    time: new Date(m.timestamp).toLocaleTimeString(),
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
      color: "from-red-500 to-orange-400",
      trend: "+12%",
    },
    {
      title: "Mitigated Today",
      value: attacksQuery.data?.filter((a: any) => a.status === "mitigated").length || 0,
      icon: Shield,
      color: "from-green-500 to-emerald-400",
      trend: "+8%",
    },
    {
      title: "Traffic Volume",
      value: `${Math.round(parseFloat(String(attacksQuery.data?.[0]?.peakTraffic || 0)))} Gbps`,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-400",
      trend: "-5%",
    },
    {
      title: "Alerts Pending",
      value: alertsQuery.data?.length || 0,
      icon: Zap,
      color: "from-yellow-500 to-orange-400",
      trend: "+3%",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gradient mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time threat monitoring and attack analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="glass-card hud-border p-6 hover:neon-glow-primary transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 neon-glow-cyan/20`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-cyan-950/40 text-cyan-400 border border-cyan-500/30">{metric.trend}</Badge>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{metric.title}</h3>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-purple-400">{metric.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="traffic" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="traffic" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <Activity className="w-4 h-4 mr-2" />
              Traffic
            </TabsTrigger>
            <TabsTrigger value="attacks" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <AlertCircle className="w-4 h-4 mr-2" />
              Attacks
            </TabsTrigger>
            <TabsTrigger value="protocols" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              <Lock className="w-4 h-4 mr-2" />
              Protocols
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-6">
            <Card className="glass-card hud-border border-none">
              <CardHeader>
                <CardTitle className="text-cyan-400 font-bold">Traffic Volume & Request Rate</CardTitle>
                <CardDescription className="text-muted-foreground">Last 60 minutes of network activity</CardDescription>
              </CardHeader>
              <CardContent>
                {trafficQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trafficData}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 242, 255, 0.08)" />
                      <XAxis dataKey="time" stroke="rgba(0, 242, 255, 0.5)" />
                      <YAxis stroke="rgba(0, 242, 255, 0.5)" />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.95)", border: "1px solid rgba(0, 242, 255, 0.2)", borderRadius: "8px", color: "#f5f8f8" }} />
                      <Area type="monotone" dataKey="volume" stroke="#00f2ff" fillOpacity={1} fill="url(#colorVolume)" name="Volume (Gbps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attacks" className="space-y-6">
            <Card className="glass-card hud-border border-none">
              <CardHeader>
                <CardTitle className="text-cyan-400 font-bold">Attack Severity Distribution</CardTitle>
                <CardDescription className="text-muted-foreground">Breakdown of detected attacks by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                {severityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.95)", border: "1px solid rgba(0, 242, 255, 0.2)", borderRadius: "8px", color: "#f5f8f8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No attack data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocols" className="space-y-6">
            <Card className="glass-card hud-border border-none">
              <CardHeader>
                <CardTitle className="text-cyan-400 font-bold">Protocol Breakdown</CardTitle>
                <CardDescription className="text-muted-foreground">Network protocols detected in traffic</CardDescription>
              </CardHeader>
              <CardContent>
                {protocolData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={protocolData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 242, 255, 0.08)" />
                      <XAxis dataKey="name" stroke="rgba(0, 242, 255, 0.5)" />
                      <YAxis stroke="rgba(0, 242, 255, 0.5)" />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.95)", border: "1px solid rgba(0, 242, 255, 0.2)", borderRadius: "8px", color: "#f5f8f8" }} />
                      <Bar dataKey="value" fill="#00f2ff" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No protocol data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Attacks */}
        <Card className="glass-card hud-border border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400 font-bold">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Recent Attacks
            </CardTitle>
            <CardDescription className="text-muted-foreground">Latest detected DDoS attacks and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {attacksQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : attacksQuery.data && attacksQuery.data.length > 0 ? (
              <div className="space-y-3">
                {attacksQuery.data.slice(0, 5).map((attack: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-cyan-500/10 rounded-lg hover:border-cyan-400/40 hover:neon-glow-primary transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-[#f5f8f8]">{attack.attackType}</h4>
                        <Badge className={`badge-${attack.severity.toLowerCase()}`}>{attack.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {new Date(attack.startTime).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={`badge-${attack.status.toLowerCase()}`}>{attack.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No attacks detected</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
