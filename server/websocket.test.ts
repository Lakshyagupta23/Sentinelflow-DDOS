import { describe, it, expect, beforeEach } from "vitest";
import { realtimeServer } from "./websocket";

describe("WebSocket Realtime Server", () => {
  beforeEach(() => {
    // Reset server state before each test
  });

  describe("Connection Management", () => {
    it("should initialize WebSocket server", () => {
      expect(realtimeServer).toBeDefined();
      expect(realtimeServer.getConnectionCount).toBeDefined();
    });

    it("should track connection count", () => {
      const count = realtimeServer.getConnectionCount(1);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should have broadcast methods", () => {
      expect(realtimeServer.broadcastAttackUpdate).toBeDefined();
      expect(realtimeServer.broadcastMetricsUpdate).toBeDefined();
      expect(realtimeServer.broadcastAlert).toBeDefined();
      expect(realtimeServer.sendNotificationToUser).toBeDefined();
    });
  });

  describe("Message Broadcasting", () => {
    it("should broadcast attack updates", () => {
      const attack = {
        id: 1,
        type: "volumetric",
        severity: "high",
        peakTraffic: 100,
      };

      // Should not throw
      expect(() => {
        realtimeServer.broadcastAttackUpdate(1, attack);
      }).not.toThrow();
    });

    it("should broadcast metrics updates", () => {
      const metrics = {
        trafficVolume: 500,
        requestRate: 1000,
        protocolBreakdown: { TCP: 60, UDP: 40 },
      };

      // Should not throw
      expect(() => {
        realtimeServer.broadcastMetricsUpdate(1, metrics);
      }).not.toThrow();
    });

    it("should broadcast alerts", () => {
      const alert = {
        id: 1,
        title: "High Traffic Alert",
        message: "Traffic exceeds threshold",
        severity: "high",
      };

      // Should not throw
      expect(() => {
        realtimeServer.broadcastAlert(1, alert);
      }).not.toThrow();
    });

    it("should send notifications to specific user", () => {
      const notification = {
        id: 1,
        title: "Attack Detected",
        message: "DDoS attack detected on your infrastructure",
        severity: "critical",
      };

      // Should not throw
      expect(() => {
        realtimeServer.sendNotificationToUser(1, 1, notification);
      }).not.toThrow();
    });
  });

  describe("Shutdown", () => {
    it("should have shutdown method", () => {
      expect(realtimeServer.shutdown).toBeDefined();
    });

    it("should shutdown gracefully", () => {
      // Should not throw
      expect(() => {
        realtimeServer.shutdown();
      }).not.toThrow();
    });
  });
});
