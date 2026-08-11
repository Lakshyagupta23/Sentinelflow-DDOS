import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Activity, Shield, TrendingUp, Lock, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#0ea5e9", "#3b82f6", "#6366f1", "#f97316", "#ef4444"];

// Role-based view configurations
const roleViewConfig = {
  admin: {
    title: "Administrator Dashboard",
    description: "Full system access with comprehensive monitoring and control",
    showForensics: true,
    showMitigation: true,
    showAudit: true,
    showMetrics: ["all"],
  },
  security_analyst: {
    title: "Security Analyst Dashboard",
    description: "Threat analysis and forensic investigation focused view",
    showForensics: true,
    showMitigation: false,
    showAudit: true,
    showMetrics: ["detection", "forensics", "vectors"],
  },
  devops_sre: {
    title: "DevOps/SRE Dashboard",
    description: "Operational controls and mitigation management",
    showForensics: false,
    showMitigation: true,
    showAudit: false,
    showMetrics: ["mitigation", "traffic"],
  },
  it_manager: {
    title: "IT Manager Dashboard",
    description: "Executive summary and compliance reporting",
    showForensics: false,
    showMitigation: false,
    showAudit: true,
    showMetrics: ["summary", "uptime"],
  },
};

export default function RoleScopedDashboard() {
  const { user } = useAuth();
  const attacksQuery = trpc.attacks.ongoing.useQuery();
  const trafficQuery = trpc.traffic.recent.useQuery({ limit: 60 });
  const alertsQuery = trpc.alerts.unread.useQuery();

  const userRole = (user?.role as keyof typeof roleViewConfig) || "user";
  const config = roleViewConfig[userRole] || roleViewConfig.admin;

  const trafficData = trafficQuery.data?.map((m: any) => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    volume: parseFloat(m.trafficVolume),
    rate: parseFloat(m.requestRate),
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Role Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{config.title}</h1>
            <p className="text-muted-foreground mt-1">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="capitalize">{userRole.replace(/_/g, " ")}</Badge>
          </div>
        </div>

        {/* Role-specific Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Always show - Active Attacks */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Attacks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attacksQuery.data?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {attacksQuery.data?.filter((a: any) => a.status === "ongoing").length || 0} ongoing
              </p>
            </CardContent>
          </Card>

          {/* Security Analyst - Detection Accuracy */}
          {config.showMetrics.includes("detection") && (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Detection Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground mt-1">False positive rate: 0.2%</p>
              </CardContent>
            </Card>
          )}

          {/* DevOps/SRE - Mitigation Status */}
          {config.showMetrics.includes("mitigation") && (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mitigation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground mt-1">4 rules engaged</p>
              </CardContent>
            </Card>
          )}

          {/* IT Manager - System Uptime */}
          {config.showMetrics.includes("uptime") && (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">99.99%</div>
                <p className="text-xs text-muted-foreground mt-1">Protected infrastructure</p>
              </CardContent>
            </Card>
          )}

          {/* Traffic Volume - All roles */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Traffic Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(trafficData[trafficData.length - 1]?.volume || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Requests/min</p>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {config.showForensics && <TabsTrigger value="forensics">Forensics</TabsTrigger>}
            {config.showMitigation && <TabsTrigger value="mitigation">Mitigation</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Traffic Monitoring</CardTitle>
                <CardDescription>Real-time traffic analysis</CardDescription>
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
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                      <Area type="monotone" dataKey="volume" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVolume)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {config.showForensics && (
            <TabsContent value="forensics">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Attack Forensics</CardTitle>
                  <CardDescription>Detailed threat analysis and investigation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Navigate to Attack Forensics page for comprehensive analysis</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {config.showMitigation && (
            <TabsContent value="mitigation">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Mitigation Controls</CardTitle>
                  <CardDescription>Active defense mechanisms</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Navigate to Mitigation Controls page for rule management</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Role-specific Information Panel */}
        <Card className="card-elevated border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Role-Based Access Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {userRole === "admin" && (
                <p>You have full system access including user management, audit logs, and all security features.</p>
              )}
              {userRole === "security_analyst" && (
                <p>You have access to threat analysis, forensic investigation, and detailed attack vectors. Focus on threat intelligence and incident analysis.</p>
              )}
              {userRole === "devops_sre" && (
                <p>You have access to mitigation controls and operational management. Focus on implementing and managing defense rules.</p>
              )}
              {userRole === "it_manager" && (
                <p>You have access to executive summaries and compliance reporting. Focus on high-level security posture and incident metrics.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
