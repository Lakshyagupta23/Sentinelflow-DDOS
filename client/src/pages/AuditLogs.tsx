import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Filter, Clock, User, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

export default function AuditLogs() {
  const logsQuery = trpc.auditLogs.list.useQuery({ limit: 100 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredLogs = logsQuery.data?.filter((log: any) => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.resourceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.resourceType === filterType;
    return matchesSearch && matchesFilter;
  }) || [];

  const actionColors: Record<string, string> = {
    attack_detected: "badge-critical",
    attack_status_updated: "badge-high",
    mitigation_rule_created: "badge-medium",
    mitigation_rule_toggled: "badge-low",
    alert_created: "badge-high",
    user_login: "badge-low",
    user_logout: "badge-low",
  };

  const handleExportLogs = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Resource Type", "Resource ID", "Details"].join(","),
      ...filteredLogs.map((log: any) =>
        [
          new Date(log.createdAt).toLocaleString(),
          log.userId || "System",
          log.action,
          log.resourceType,
          log.resourceId || "-",
          log.details ? JSON.stringify(log.details) : "-",
        ].join(",")
      ),
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", `audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
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
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">Complete record of system and user actions</p>
          </div>
          <Button onClick={handleExportLogs} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by action or resource type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-input rounded-md bg-background text-foreground">
                <option value="all">All Types</option>
                <option value="attack">Attacks</option>
                <option value="mitigation_rule">Mitigation Rules</option>
                <option value="alert">Alerts</option>
                <option value="user">User Actions</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Showing {filteredLogs.length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Resource</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{log.userId ? `User ${log.userId}` : "System"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={actionColors[log.action as keyof typeof actionColors] || "badge-low"}>{log.action.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            {log.resourceType}
                            {log.resourceId && <span className="text-muted-foreground">({log.resourceId.substring(0, 8)}...)</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{log.details ? JSON.stringify(log.details).substring(0, 40) + "..." : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">No audit logs found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
