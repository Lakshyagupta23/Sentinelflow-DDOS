import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Zap, Shield, Inbox } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: "attack_detected",
    title: "Critical DDoS Attack Detected",
    message: "Volumetric attack detected from 192.168.1.100 with 5.2Gbps traffic",
    severity: "critical",
    isRead: false,
    createdAt: "2 minutes ago",
    relatedAttackId: "attack_001",
  },
  {
    id: 2,
    type: "alert_triggered",
    title: "Alert Rule Triggered",
    message: "Custom rule 'High Traffic Alert' triggered on endpoint /api/users",
    severity: "high",
    isRead: false,
    createdAt: "15 minutes ago",
  },
  {
    id: 3,
    type: "playbook_executed",
    title: "Playbook Executed",
    message: "Volumetric Attack Response playbook executed successfully",
    severity: "medium",
    isRead: true,
    createdAt: "1 hour ago",
  },
  {
    id: 4,
    type: "threat_detected",
    title: "Known Threat Actor Detected",
    message: "Traffic from APT28 threat actor detected (192.168.1.50)",
    severity: "critical",
    isRead: true,
    createdAt: "3 hours ago",
  },
  {
    id: 5,
    type: "attack_detected",
    title: "Protocol Attack Detected",
    message: "SYN flood attack detected on port 443",
    severity: "high",
    isRead: true,
    createdAt: "5 hours ago",
  },
];

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "critical") return notif.severity === "critical";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    toast.success("Notification marked as read");
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "attack_detected":
        return <AlertTriangle className="w-4 h-4 text-[#e05a5a]" />;
      case "alert_triggered":
        return <Bell className="w-4 h-4 text-[#d9c06c]" />;
      case "playbook_executed":
        return <Zap className="w-4 h-4 text-[#c5a880]" />;
      case "threat_detected":
        return <Shield className="w-4 h-4 text-[#e6955a]" />;
      default:
        return <Bell className="w-4 h-4 text-[#c5a880]" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      case "high":
        return "border-[#e6955a]/30 text-[#e6955a] bg-[#e6955a]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      case "medium":
        return "border-[#d9c06c]/30 text-[#d9c06c] bg-[#d9c06c]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      case "low":
        return "border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
      default:
        return "border-[#64748b]/30 text-[#64748b] bg-[#64748b]/5 rounded-none font-mono text-[8px] uppercase px-1.5 py-0.5";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Incident Dispatch</h1>
              <p className="text-xs text-muted-foreground font-mono">Active security alert dispatch queue and client notification channels</p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-3">
                <Badge className="border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[9px] uppercase px-2 py-1">{unreadCount} pending</Badge>
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  size="sm"
                  className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8"
                >
                  Clear All Pending
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 animate-fade-in-up">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4"
                : "border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 px-4"
            }
          >
            All Logs ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={
              filter === "unread"
                ? "bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4"
                : "border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 px-4"
            }
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "critical" ? "default" : "outline"}
            onClick={() => setFilter("critical")}
            className={
              filter === "critical"
                ? "bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-[10px] uppercase tracking-wider rounded-none h-8 px-4"
                : "border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 px-4"
            }
          >
            Critical ({notifications.filter((n) => n.severity === "critical").length})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center glass-card rounded-none border-[#c5a880]/15">
              <Inbox className="w-8 h-8 mx-auto text-[#c5a880]/40 mb-3" />
              <p className="text-xs font-mono text-muted-foreground uppercase">Dispatcher Queue Empty</p>
            </Card>
          ) : (
            filteredNotifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-4 transition-all duration-300 rounded-none border ${
                  notif.isRead
                    ? "opacity-75 hover:opacity-100 border-[#c5a880]/10 bg-[#13151a]/10"
                    : "border-l-2 border-l-[#c5a880] border-[#c5a880]/20 bg-[#c5a880]/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="p-2 border border-[#c5a880]/10 bg-[#13151a]/40 rounded-none">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{notif.title}</h3>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1.5">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-[#c5a880] rounded-none mt-1" />
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#c5a880]/10">
                      <div className="flex gap-3">
                        <Badge className={getSeverityColor(notif.severity)}>
                          {notif.severity}
                        </Badge>
                        <span className="text-[9px] font-mono text-muted-foreground flex items-center">{notif.createdAt}</span>
                      </div>

                      <div className="flex gap-2">
                        {!notif.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-[9px] font-mono uppercase tracking-wider text-[#c5a880] hover:bg-[#c5a880]/5 rounded-none h-7"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notif.id)}
                          className="text-[9px] font-mono uppercase tracking-wider text-[#e05a5a] hover:bg-[#e05a5a]/5 rounded-none h-7"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Notification Preferences */}
        <Card className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/20">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Alert Delivery Rules</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-mono text-xs text-[#e2e8f0]">
            <div className="flex items-center justify-between p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
              <div>
                <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">SMTP Mail Dispatch</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Deliver critical alert updates to system admin emails
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#c5a880] border-[#c5a880]/30 rounded-none bg-[#13151a]" />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
              <div>
                <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">Slack Channel Webhook</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Stream threat event dispatches to registered Slack hooks
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#c5a880] border-[#c5a880]/30 rounded-none bg-[#13151a]" />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
              <div>
                <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">SMS Incident Alerts</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Direct mobile SMS notifications for high priority failures
                </p>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-[#c5a880] border-[#c5a880]/30 rounded-none bg-[#13151a]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
