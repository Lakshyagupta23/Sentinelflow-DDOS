import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

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
        return <AlertTriangle className="w-5 h-5" />;
      case "alert_triggered":
        return <Bell className="w-5 h-5" />;
      case "playbook_executed":
        return <Zap className="w-5 h-5" />;
      case "threat_detected":
        return <Shield className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Notifications Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time alerts and notifications from your security system
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 text-white">{unreadCount} unread</Badge>
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              Mark all as read
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === "critical" ? "default" : "outline"}
          onClick={() => setFilter("critical")}
        >
          Critical ({notifications.filter((n) => n.severity === "critical").length})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No notifications</p>
          </Card>
        ) : (
          filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 transition-all ${
                notif.isRead
                  ? "opacity-75 hover:opacity-100"
                  : "border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-950"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-lg ${getSeverityColor(notif.severity)}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{notif.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(notif.severity)}>
                        {notif.severity}
                      </Badge>
                      <span className="text-xs text-gray-500">{notif.createdAt}</span>
                    </div>

                    <div className="flex gap-2">
                      {!notif.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-xs"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notif.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Delete
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
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-900">
        <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive critical alerts via email
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Slack Integration</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send notifications to Slack channel
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Critical alerts via SMS
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </div>
  );
}
