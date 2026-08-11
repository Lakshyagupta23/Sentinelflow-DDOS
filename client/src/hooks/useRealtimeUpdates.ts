import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export interface RealtimeMessage {
  type: "attack_update" | "metrics_update" | "notification" | "alert" | "auth_success" | "error";
  data?: any;
  message?: string;
  timestamp?: string;
}

interface UseRealtimeUpdatesOptions {
  channels?: string[];
  onMessage?: (message: RealtimeMessage) => void;
  autoConnect?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const { channels = ["attacks", "metrics", "notifications", "alerts"], onMessage, autoConnect = true } = options;

  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">(
    "disconnected"
  );
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!user?.id) {
      console.warn("[Realtime] User not authenticated");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[Realtime] Already connected");
      return;
    }

    setConnectionStatus("connecting");

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[Realtime] Connected to WebSocket server");
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;

        // Authenticate
        ws.send(
          JSON.stringify({
            type: "auth",
            userId: user.id,
            organizationId: user.organizationId || 1,
          })
        );

        // Subscribe to channels
        channels.forEach((channel) => {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channel,
            })
          );
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);

          // Handle authentication
          if (message.type === "auth_success") {
            console.log("[Realtime] Authenticated successfully");
            toast.success("Connected to real-time updates");
            return;
          }

          // Handle errors
          if (message.type === "error") {
            console.error("[Realtime] Error:", message.message);
            toast.error(message.message || "Real-time error");
            return;
          }

          // Call custom handler
          if (onMessage) {
            onMessage(message);
          }

          // Show toast for important messages
          if (message.type === "alert" || message.type === "notification") {
            const severity = message.data?.severity || "info";
            const toastFn =
              severity === "critical"
                ? toast.error
                : severity === "high"
                  ? toast.warning
                  : severity === "medium"
                    ? toast.info
                    : toast.success;

            toastFn(message.data?.title || "Update", {
              description: message.data?.message,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("[Realtime] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[Realtime] WebSocket error:", error);
        setConnectionStatus("disconnected");
        toast.error("Real-time connection error");
      };

      ws.onclose = () => {
        console.log("[Realtime] Disconnected from WebSocket server");
        setIsConnected(false);
        setConnectionStatus("disconnected");
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[Realtime] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          console.error("[Realtime] Max reconnection attempts reached");
          toast.error("Failed to maintain real-time connection");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[Realtime] Error connecting to WebSocket:", error);
      setConnectionStatus("disconnected");
      toast.error("Failed to connect to real-time server");
    }
  }, [user, channels, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const subscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "subscribe",
          channel,
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "unsubscribe",
          channel,
        })
      );
    }
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ping" }));
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user?.id, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendPing,
  };
}
