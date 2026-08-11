import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";

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

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">DDoS attack trends, mitigation effectiveness, and ROI analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportJSON} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">328</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12% vs last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mitigated Attacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">308</div>
            <p className="text-xs text-muted-foreground mt-1">93.9% success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground mt-1">Time to mitigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$487,500</div>
            <p className="text-xs text-muted-foreground mt-1">Downtime prevention</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Attack Volume Over Time</CardTitle>
          <CardDescription>Daily DDoS attack detection and mitigation</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attacks" stroke="#3b82f6" name="Detected Attacks" strokeWidth={2} />
              <Line type="monotone" dataKey="mitigated" stroke="#10b981" name="Mitigated" strokeWidth={2} />
              <Line type="monotone" dataKey="blocked" stroke="#ef4444" name="Blocked" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attack Type Distribution & Mitigation Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attack Types Distribution</CardTitle>
            <CardDescription>Breakdown of detected attack vectors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attackTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attackTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mitigation Effectiveness</CardTitle>
            <CardDescription>Success rate by mitigation type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mitigationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="effectiveness" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Return on Investment (ROI)</CardTitle>
          <CardDescription>Cost-benefit analysis of DDoS mitigation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <p className="text-2xl font-bold">$125,000</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Downtime Prevented</p>
              <p className="text-2xl font-bold">156h</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Revenue Protected</p>
              <p className="text-2xl font-bold">$612,500</p>
            </div>
            <div className="border rounded-lg p-4 bg-green-50">
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className="text-2xl font-bold text-green-600">390%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Comprehensive attack and mitigation statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Metric</th>
                  <th className="text-left py-2 px-4">Value</th>
                  <th className="text-left py-2 px-4">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">Peak Attack Size</td>
                  <td className="py-2 px-4">487 Gbps</td>
                  <td className="py-2 px-4 text-red-500">+15%</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">Avg Attack Duration</td>
                  <td className="py-2 px-4">18.5 min</td>
                  <td className="py-2 px-4 text-green-500">-8%</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">False Positive Rate</td>
                  <td className="py-2 px-4">0.8%</td>
                  <td className="py-2 px-4 text-green-500">-2%</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="py-2 px-4">Unique Attack Sources</td>
                  <td className="py-2 px-4">2,847</td>
                  <td className="py-2 px-4 text-red-500">+25%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
