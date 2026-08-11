import { Response } from "express";
import { nanoid } from "nanoid";

// Store active SSE connections
const activeConnections = new Map<string, Response>();

export function registerSSEConnection(userId: number, res: Response) {
  const connectionId = `sse_${userId}_${nanoid(8)}`;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection message
  res.write(`:connected\n\n`);

  activeConnections.set(connectionId, res);

  // Handle client disconnect
  res.on("close", () => {
    activeConnections.delete(connectionId);
  });

  res.on("error", () => {
    activeConnections.delete(connectionId);
  });

  return connectionId;
}

export function broadcastNotification(notification: {
  type: string;
  title: string;
  message: string;
  severity: string;
  data?: Record<string, any>;
}) {
  const event = `data: ${JSON.stringify(notification)}\n\n`;

  activeConnections.forEach((res) => {
    try {
      res.write(event);
    } catch (error) {
      console.error("Error writing to SSE connection:", error);
    }
  });
}

export function sendNotificationToUser(
  userId: number,
  notification: {
    type: string;
    title: string;
    message: string;
    severity: string;
    data?: Record<string, any>;
  }
) {
  const event = `data: ${JSON.stringify({
    ...notification,
    userId,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  activeConnections.forEach((res) => {
    try {
      res.write(event);
    } catch (error) {
      console.error("Error writing to SSE connection:", error);
    }
  });
}

export function closeConnection(connectionId: string) {
  const res = activeConnections.get(connectionId);
  if (res) {
    res.end();
    activeConnections.delete(connectionId);
  }
}

export function getActiveConnectionCount() {
  return activeConnections.size;
}
