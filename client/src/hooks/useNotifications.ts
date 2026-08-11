import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export interface Notification {
  type: "attack_detected" | "alert_triggered" | "playbook_executed" | "threat_detected";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  data?: Record<string, any>;
  timestamp?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connect = useCallback(() => {
    try {
      // Connect to SSE endpoint
      const es = new EventSource("/api/notifications/sse");

      es.onopen = () => {
        setIsConnected(true);
        console.log("[Notifications] Connected to SSE stream");
      };

      es.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);

          // Add to notifications list
          setNotifications((prev) => [notification, ...prev].slice(0, 100));

          // Show toast based on severity
          const toastFn =
            notification.severity === "critical"
              ? toast.error
              : notification.severity === "high"
                ? toast.warning
                : notification.severity === "medium"
                  ? toast.info
                  : toast.success;

          toastFn(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        } catch (error) {
          console.error("[Notifications] Failed to parse message:", error);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        console.error("[Notifications] SSE connection error");
        es.close();

        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          connect();
        }, 5000);
      };

      setEventSource(es);
    } catch (error) {
      console.error("[Notifications] Failed to connect:", error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
    }
  }, [eventSource]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    notifications,
    isConnected,
    connect,
    disconnect,
    clearNotifications: () => setNotifications([]),
  };
}
