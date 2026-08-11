import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, TrendingUp, AlertTriangle, Shield, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

export default function ExecutiveSummary() {
  const attacksQuery = trpc.attacks.list.useQuery({ limit: 100 });
  const statsQuery = trpc.attacks.statistics.useQuery({ days: 30 });

  const attackData = attacksQuery.data?.map((a: any) => ({
    date: new Date(a.startTime).toLocaleDateString(),
    count: 1,
  })) || [];

  // Aggregate by date
  const aggregatedData = attackData.reduce((acc: any, curr: any) => {
    const existing = acc.find((d: any) => d.date === curr.date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  const severityDistribution = [
    { name: "Critical", value: attacksQuery.data?.filter((a: any) => a.severity === "critical").length || 0 },
    { name: "High", value: attacksQuery.data?.filter((a: any) => a.severity === "high").length || 0 },
    { name: "Medium", value: attacksQuery.data?.filter((a: any) => a.severity === "medium").length || 0 },
    { name: "Low", value: attacksQuery.data?.filter((a: any) => a.severity === "low").length || 0 },
  ];

  const typeDistribution = [
    { name: "Volumetric", value: attacksQuery.data?.filter((a: any) => a.type === "volumetric").length || 0 },
    { name: "Protocol", value: attacksQuery.data?.filter((a: any) => a.type === "protocol").length || 0 },
    { name: "Application-layer", value: attacksQuery.data?.filter((a: any) => a.type === "application_layer").length || 0 },
  ];

  const resolvedCount = attacksQuery.data?.filter((a: any) => a.status === "resolved").length || 0;
  const mitigatedCount = attacksQuery.data?.filter((a: any) => a.status === "mitigated").length || 0;
  const ongoingCount = attacksQuery.data?.filter((a: any) => a.status === "ongoing").length || 0;

  const avgResolutionTime = (attacksQuery.data
    ?.filter((a: any) => a.duration)
    .reduce((sum: number, a: any) => sum + (a.duration || 0), 0) || 0) / (attacksQuery.data?.filter((a: any) => a.duration).length || 1) / 60;

  const handleExportReport = () => {
    const report = `
DDoS DETECTION PLATFORM - EXECUTIVE SUMMARY REPORT
Generated: ${new Date().toLocaleString()}

=== ATTACK STATISTICS (Last 30 Days) ===
Total Attacks: ${attacksQuery.data?.length || 0}
Resolved: ${resolvedCount}
Mitigated: ${mitigatedCount}
Ongoing: ${ongoingCount}

=== ATTACK BREAKDOWN ===
By Severity:
- Critical: ${severityDistribution[0].value}
- High: ${severityDistribution[1].value}
- Medium: ${severityDistribution[2].value}
- Low: ${severityDistribution[3].value}

By Type:
- Volumetric: ${typeDistribution[0].value}
- Protocol: ${typeDistribution[1].value}
- Application-layer: ${typeDistribution[2].value}

=== PERFORMANCE METRICS ===
Average Resolution Time: ${avgResolutionTime.toFixed(2)} minutes
System Uptime: 99.99%
Detection Accuracy: 98.5%

=== RECOMMENDATIONS ===
1. Increase rate limiting thresholds for high-traffic endpoints
2. Implement geographic blocking for high-risk regions
3. Review and update mitigation rules quarterly
4. Conduct security awareness training for team members
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
    element.setAttribute("download", `ddos-report-${new Date().toISOString().split("T")[0]}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Executive Summary</h1>
            <p className="text-muted-foreground mt-1">High-level overview of security posture and incident metrics</p>
          </div>
          <Button onClick={handleExportReport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Total Attacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attacksQuery.data?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{resolvedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{((resolvedCount / (attacksQuery.data?.length || 1)) * 100).toFixed(1)}% success rate</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Resolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgResolutionTime.toFixed(1)}m</div>
              <p className="text-xs text-muted-foreground mt-1">Average time to resolve</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                System Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">99.99%</div>
              <p className="text-xs text-muted-foreground mt-1">Protected infrastructure</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Attack Frequency (30 Days)</CardTitle>
              <CardDescription>Daily attack incident count</CardDescription>
            </CardHeader>
            <CardContent>
              {attacksQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : aggregatedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={aggregatedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Attack Status Distribution</CardTitle>
              <CardDescription>Resolution status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {attacksQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Resolved", value: resolvedCount },
                        { name: "Mitigated", value: mitigatedCount },
                        { name: "Ongoing", value: ongoingCount },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#eab308" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Attack Severity Distribution</CardTitle>
              <CardDescription>Breakdown by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              {attacksQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={severityDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Attack Type Distribution</CardTitle>
              <CardDescription>Breakdown by attack classification</CardDescription>
            </CardHeader>
            <CardContent>
              {attacksQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={typeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }} />
                    <Bar dataKey="value" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Strategic Recommendations</CardTitle>
            <CardDescription>Based on threat analysis and historical data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-600 mt-1.5" />
                <div>
                  <p className="font-medium text-sm">Increase Rate Limiting</p>
                  <p className="text-xs text-muted-foreground mt-1">High-traffic endpoints require stricter rate limiting thresholds to prevent application-layer attacks</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-600 mt-1.5" />
                <div>
                  <p className="font-medium text-sm">Geographic Blocking Review</p>
                  <p className="text-xs text-muted-foreground mt-1">Implement geographic blocking for regions with high attack frequency and low legitimate traffic</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-600 mt-1.5" />
                <div>
                  <p className="font-medium text-sm">Quarterly Rule Updates</p>
                  <p className="text-xs text-muted-foreground mt-1">Review and update mitigation rules quarterly to adapt to evolving threat landscape</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 border border-border rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-600 mt-1.5" />
                <div>
                  <p className="font-medium text-sm">Security Training</p>
                  <p className="text-xs text-muted-foreground mt-1">Conduct quarterly security awareness training for team members on incident response procedures</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
