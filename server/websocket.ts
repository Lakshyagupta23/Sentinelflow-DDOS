import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { nanoid } from "nanoid";

/**
 * WebSocket Server for Real-Time Updates
 * Handles attack feeds, notifications, and live metrics
 */

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId: number;
  organizationId: number;
  subscriptions: Set<string>;
  isAlive: boolean;
}

class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WebSocketClient>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: "/api/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Heartbeat to detect stale connections
    this.heartbeatInterval = setInterval(() => {
    this.wss?.clients.forEach((ws: WebSocket) => {
      const client = Array.from(this.clients.values()).find((c) => c.ws === ws);
        if (!client) return;

        if (!client.isAlive) {
          ws.terminate();
          this.clients.delete(client.id);
          return;
        }

        client.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private handleConnection(ws: WebSocket) {
    const clientId = nanoid();
    let client: WebSocketClient | null = null;

    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data);

        // Handle authentication
        if (message.type === "auth") {
          client = {
            id: clientId,
            ws,
            userId: message.userId,
            organizationId: message.organizationId,
            subscriptions: new Set(),
            isAlive: true,
          };
          this.clients.set(clientId, client);

          ws.send(
            JSON.stringify({
              type: "auth_success",
              clientId,
              message: "Connected to real-time server",
            })
          );
          return;
        }

        if (!client) {
          ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
          return;
        }

        // Handle subscriptions
        if (message.type === "subscribe") {
          client.subscriptions.add(message.channel);
          ws.send(
            JSON.stringify({
              type: "subscription_confirmed",
              channel: message.channel,
            })
          );
          return;
        }

        if (message.type === "unsubscribe") {
          client.subscriptions.delete(message.channel);
          ws.send(
            JSON.stringify({
              type: "unsubscription_confirmed",
              channel: message.channel,
            })
          );
          return;
        }

        // Handle ping
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }
      } catch (error) {
        console.error("[WebSocket] Error handling message:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("pong", () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
      }
    });

    ws.on("close", () => {
      this.clients.delete(clientId);
    });

    ws.on("error", (error: Error) => {
      console.error("[WebSocket] Error:", error);
      this.clients.delete(clientId);
    });
  }

  /**
   * Broadcast attack update to all connected clients in an organization
   */
  broadcastAttackUpdate(organizationId: number, attack: any) {
    const message = JSON.stringify({
      type: "attack_update",
      data: attack,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (
        client.organizationId === organizationId &&
        client.subscriptions.has("attacks") &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Broadcast metric update to all connected clients in an organization
   */
  broadcastMetricsUpdate(organizationId: number, metrics: any) {
    const message = JSON.stringify({
      type: "metrics_update",
      data: metrics,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (
        client.organizationId === organizationId &&
        client.subscriptions.has("metrics") &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: number, organizationId: number, notification: any) {
    const message = JSON.stringify({
      type: "notification",
      data: notification,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (
        client.userId === userId &&
        client.organizationId === organizationId &&
        client.subscriptions.has("notifications") &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Broadcast alert to all connected clients in an organization
   */
  broadcastAlert(organizationId: number, alert: any) {
    const message = JSON.stringify({
      type: "alert",
      data: alert,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (
        client.organizationId === organizationId &&
        client.subscriptions.has("alerts") &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(message);
      }
    });
  }

  /**
   * Get connection count for an organization
   */
  getConnectionCount(organizationId: number): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.organizationId === organizationId) {
        count++;
      }
    });
    return count;
  }

  /**
   * Cleanup on server shutdown
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }
  }
}

export const realtimeServer = new RealtimeServer();
