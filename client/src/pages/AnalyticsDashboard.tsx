import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, Clock, Shield, BarChart3, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Sample data for visualizations
  const timeSeriesData = [
    { date: "Mon", attacks: 45, mitigated: 42, blocked: 38 },
    { date: "Tue", attacks: 52, mitigated: 48, blocked: 44 },
    { date: "Wed", attacks: 38, mitigated: 35, blocked: 32 },
    { date: "Thu", attacks: 61, mitigated: 58, blocked: 55 },
    { date: "Fri", attacks: 55, mitigated: 52, blocked: 48 },
    { date: "Sat", attacks: 42, mitigated: 40, blocked: 36 },
    { date: "Sun", attacks: 35, mitigated: 33, blocked: 30 },
  ];

  const attackTypeData = [
    { name: "DDoS Volumetric", value: 45, count: 145 },
    { name: "Protocol Attack", value: 25, count: 85 },
    { name: "Application Layer", value: 18, count: 62 },
    { name: "DNS Amplification", value: 8, count: 28 },
    { name: "Botnet Attack", value: 4, count: 14 },
  ];

  const mitigationData = [
    { name: "Rate Limiting", effectiveness: 95 },
    { name: "IP Blocking", effectiveness: 88 },
    { name: "WAF Rules", effectiveness: 92 },
    { name: "Geo Blocking", effectiveness: 85 },
  ];

  const COLORS = ["#c5a880", "#b09670", "#9c845f", "#87724f", "#736040"];

  const handleExportJSON = () => {
    const data = { timeRange, timestamp: new Date().toISOString(), metrics: { timeSeriesData, attackTypeData } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    let csv = "Date,Attacks,Mitigated,Blocked\n";
    timeSeriesData.forEach(row => {
      csv += `${row.date},${row.attacks},${row.mitigated},${row.blocked}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Metrics Analytics</h1>
              <p className="text-xs text-muted-foreground font-mono">DDoS attack trends, mitigation effectiveness, and operations analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-32 rounded-none bg-[#13151a]/25 border-[#c5a880]/15 text-xs font-mono h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                  <SelectItem value="7d">7 Days Presets</SelectItem>
                  <SelectItem value="30d">30 Days Presets</SelectItem>
                  <SelectItem value="90d">90 Days Presets</SelectItem>
                  <SelectItem value="1y">1 Year Presets</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportJSON} variant="outline" size="sm" className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 px-3">
                <Download className="w-3.5 h-3.5 mr-1" />
                JSON
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 px-3">
                <Download className="w-3.5 h-3.5 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <Card className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/30 p-4">
            <p className="text-[9px] font-mono text-muted-foreground uppercase">Aggregated Threats</p>
            <div className="text-xl font-bold font-serif text-[#c5a880] mt-1">328 Incidents</div>
            <p className="text-[9px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-[#e05a5a] flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +12.00%
              </span>{" "}
              vs baseline period
            </p>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/30 p-4">
            <p className="text-[9px] font-mono text-muted-foreground uppercase">Mitigated Incidents</p>
            <div className="text-xl font-bold font-serif text-[#c5a880] mt-1">308 Incidents</div>
            <p className="text-[9px] font-mono text-[#8a9a86] mt-1">93.90% operational rate</p>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/30 p-4">
            <p className="text-[9px] font-mono text-muted-foreground uppercase">Mean Mitigation Time</p>
            <div className="text-xl font-bold font-serif text-[#c5a880] mt-1">245 ms</div>
            <p className="text-[9px] font-mono text-muted-foreground mt-1">First-alert response latency</p>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/30 p-4">
            <p className="text-[9px] font-mono text-muted-foreground uppercase">Operational Value Saved</p>
            <div className="text-xl font-bold font-serif text-[#8a9a86] mt-1">$487,500</div>
            <p className="text-[9px] font-mono text-muted-foreground mt-1">Critical downtime prevented</p>
          </Card>
        </div>

        {/* Time Series Chart */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Attack Volume Timeline</CardTitle>
            <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase">Daily DDoS attack vectors detected and processed</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 font-mono text-xs text-[#e2e8f0]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c5a880" strokeOpacity={0.1} />
                <XAxis dataKey="date" stroke="#c5a880" strokeOpacity={0.5} style={{ fontSize: 10 }} />
                <YAxis stroke="#c5a880" strokeOpacity={0.5} style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0c0d10", borderColor: "#c5a880" }} />
                <Legend style={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="attacks" stroke="#c5a880" name="Detected" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mitigated" stroke="#8a9a86" name="Mitigated" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="blocked" stroke="#e05a5a" name="Blocked" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attack Type Distribution & Mitigation Effectiveness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card rounded-none border-[#c5a880]/15">
            <CardHeader className="border-b border-[#c5a880]/10 pb-4">
              <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Attack Type Allocation</CardTitle>
              <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase">Percentage breakdown of attack category metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 font-mono text-xs text-[#e2e8f0]">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attackTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#c5a880"
                    dataKey="value"
                  >
                    {attackTypeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0d0e12" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0c0d10", borderColor: "#c5a880" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-none border-[#c5a880]/15">
            <CardHeader className="border-b border-[#c5a880]/10 pb-4">
              <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Scrubbing Effectiveness</CardTitle>
              <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase">Mitigation sequence containment rate</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 font-mono text-xs text-[#e2e8f0]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mitigationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c5a880" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#c5a880" strokeOpacity={0.5} style={{ fontSize: 10 }} />
                  <YAxis stroke="#c5a880" strokeOpacity={0.5} style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0c0d10", borderColor: "#c5a880" }} />
                  <Bar dataKey="effectiveness" fill="#c5a880" opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ROI Analysis */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Return on Investment (ROI) Metrics</CardTitle>
            <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase">Financial and uptime prevention index analysis</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Total Ingress Protection Cost</p>
                <p className="text-lg font-bold font-serif text-[#e2e8f0] mt-1">$125,000</p>
              </div>
              <div className="p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Uptime Outages Blocked</p>
                <p className="text-lg font-bold font-serif text-[#e2e8f0] mt-1">156 hours</p>
              </div>
              <div className="p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Revenue Safeguarded</p>
                <p className="text-lg font-bold font-serif text-[#e2e8f0] mt-1">$612,500</p>
              </div>
              <div className="p-4 bg-[#13151a]/30 border border-[#8a9a86]/30 bg-[#8a9a86]/5 rounded-none">
                <p className="text-[9px] font-mono text-[#8a9a86] uppercase">Aggregate ROI Index</p>
                <p className="text-lg font-bold font-serif text-[#8a9a86] mt-1">390%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics Table */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Operational Diagnostics Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#c5a880]/15 text-[10px] font-mono text-muted-foreground uppercase">
                    <th className="text-left py-2 px-4 font-normal">Metric Identification</th>
                    <th className="text-left py-2 px-4 font-normal">Value Status</th>
                    <th className="text-left py-2 px-4 font-normal">Variance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#c5a880]/10 hover:bg-[#c5a880]/5 transition-all">
                    <td className="py-3 px-4 text-[#e2e8f0]">Peak Volumetric Attack Size</td>
                    <td className="py-3 px-4 text-[#c5a880]">487 Gbps</td>
                    <td className="py-3 px-4 text-[#e05a5a]">+15.00%</td>
                  </tr>
                  <tr className="border-b border-[#c5a880]/10 hover:bg-[#c5a880]/5 transition-all">
                    <td className="py-3 px-4 text-[#e2e8f0]">Mean Ingress Attack Duration</td>
                    <td className="py-3 px-4 text-[#c5a880]">18.5 min</td>
                    <td className="py-3 px-4 text-[#8a9a86]">-8.00%</td>
                  </tr>
                  <tr className="border-b border-[#c5a880]/10 hover:bg-[#c5a880]/5 transition-all">
                    <td className="py-3 px-4 text-[#e2e8f0]">Defense False Positive Rate</td>
                    <td className="py-3 px-4 text-[#c5a880]">0.8%</td>
                    <td className="py-3 px-4 text-[#8a9a86]">-2.00%</td>
                  </tr>
                  <tr className="hover:bg-[#c5a880]/5 transition-all">
                    <td className="py-3 px-4 text-[#e2e8f0]">Unique Attack Vectors Registered</td>
                    <td className="py-3 px-4 text-[#c5a880]">2,847</td>
                    <td className="py-3 px-4 text-[#e05a5a]">+25.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
