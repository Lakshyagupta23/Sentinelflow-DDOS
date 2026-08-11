import { describe, it, expect, beforeEach } from "vitest";
import { MetricsCollector, getMetricsCollector } from "./metrics";
import { HealthChecker, getHealthChecker } from "./health";

describe("Monitoring & Health", () => {
  describe("Metrics Collector", () => {
    let collector: MetricsCollector;

    beforeEach(() => {
      collector = new MetricsCollector();
    });

    it("should create metrics collector instance", () => {
      expect(collector).toBeDefined();
    });

    it("should record API requests", () => {
      collector.recordApiRequest(100, true);
      collector.recordApiRequest(150, false);

      const summary = collector.getSummary();
      expect(summary.apiMetrics.requests).toBe(2);
      expect(summary.apiMetrics.errors).toBe(1);
    });

    it("should calculate API error rate", () => {
      collector.recordApiRequest(100, true);
      collector.recordApiRequest(150, false);
      collector.recordApiRequest(120, false);

      const summary = collector.getSummary();
      expect(summary.apiMetrics.errorRate).toBeCloseTo(66.67, 1);
    });

    it("should record database queries", () => {
      collector.recordDbQuery(50, true);
      collector.recordDbQuery(75, false);

      const summary = collector.getSummary();
      expect(summary.dbMetrics.queries).toBe(2);
      expect(summary.dbMetrics.errors).toBe(1);
    });

    it("should record WebSocket connections", () => {
      collector.recordWsConnection(true);
      collector.recordWsConnection(true);
      collector.recordWsConnection(false);

      const summary = collector.getSummary();
      expect(summary.wsMetrics.connections).toBe(1);
    });

    it("should record WebSocket messages", () => {
      collector.recordWsMessage(true);
      collector.recordWsMessage(true);
      collector.recordWsMessage(false);

      const summary = collector.getSummary();
      expect(summary.wsMetrics.messages).toBe(2);
      expect(summary.wsMetrics.errors).toBe(1);
    });

    it("should record attack detection and mitigation", () => {
      collector.recordAttackDetected();
      collector.recordAttackDetected();
      collector.recordAttackMitigated(2500);

      const summary = collector.getSummary();
      expect(summary.attackMetrics.detected).toBe(2);
      expect(summary.attackMetrics.mitigated).toBe(1);
      expect(summary.attackMetrics.mitigationRate).toBe(50);
    });

    it("should record webhook deliveries", () => {
      collector.recordWebhookDelivery(true, 0);
      collector.recordWebhookDelivery(false, 2);

      const summary = collector.getSummary();
      expect(summary.webhookMetrics.deliveries).toBe(1);
      expect(summary.webhookMetrics.failures).toBe(1);
      expect(summary.webhookMetrics.retries).toBe(2);
    });

    it("should calculate average latency", () => {
      collector.recordApiRequest(100, true);
      collector.recordApiRequest(200, true);
      collector.recordApiRequest(300, true);

      const summary = collector.getSummary();
      expect(summary.apiMetrics.avgLatency).toBe(200);
    });

    it("should reset metrics", () => {
      collector.recordApiRequest(100, true);
      collector.recordAttackDetected();

      let summary = collector.getSummary();
      expect(summary.apiMetrics.requests).toBe(1);

      collector.reset();
      summary = collector.getSummary();
      expect(summary.apiMetrics.requests).toBe(0);
      expect(summary.attackMetrics.detected).toBe(0);
    });

    it("should get global metrics collector instance", () => {
      const collector1 = getMetricsCollector();
      const collector2 = getMetricsCollector();
      expect(collector1).toBe(collector2);
    });
  });

  describe("Health Checker", () => {
    let checker: HealthChecker;

    beforeEach(() => {
      checker = new HealthChecker();
    });

    it("should create health checker instance", () => {
      expect(checker).toBeDefined();
    });

    it("should return health status", () => {
      const health = checker.getHealthStatus();
      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("timestamp");
      expect(health).toHaveProperty("uptime");
      expect(health).toHaveProperty("checks");
    });

    it("should have healthy status by default", () => {
      const health = checker.getHealthStatus();
      expect(health.status).toBe("healthy");
    });

    it("should return readiness status", () => {
      const readiness = checker.getReadinessStatus();
      expect(readiness).toHaveProperty("ready");
      expect(typeof readiness.ready).toBe("boolean");
    });

    it("should return liveness status", () => {
      const liveness = checker.getLivenessStatus();
      expect(liveness).toHaveProperty("alive");
      expect(typeof liveness.alive).toBe("boolean");
    });

    it("should have API check in health status", () => {
      const health = checker.getHealthStatus();
      expect(health.checks.api).toHaveProperty("status");
      expect(health.checks.api).toHaveProperty("errorRate");
      expect(health.checks.api).toHaveProperty("avgLatency");
    });

    it("should have database check in health status", () => {
      const health = checker.getHealthStatus();
      expect(health.checks.database).toHaveProperty("status");
      expect(health.checks.database).toHaveProperty("errorRate");
      expect(health.checks.database).toHaveProperty("avgLatency");
    });

    it("should have WebSocket check in health status", () => {
      const health = checker.getHealthStatus();
      expect(health.checks.websocket).toHaveProperty("status");
      expect(health.checks.websocket).toHaveProperty("activeConnections");
      expect(health.checks.websocket).toHaveProperty("errors");
    });

    it("should have system check in health status", () => {
      const health = checker.getHealthStatus();
      expect(health.checks.system).toHaveProperty("status");
      expect(health.checks.system).toHaveProperty("memoryUsage");
      expect(health.checks.system).toHaveProperty("uptime");
    });

    it("should get global health checker instance", () => {
      const checker1 = getHealthChecker();
      const checker2 = getHealthChecker();
      expect(checker1).toBe(checker2);
    });
  });

  describe("Integration", () => {
    it("should track metrics and reflect in health status", () => {
      const collector = getMetricsCollector();
      const checker = getHealthChecker();

      // Simulate some activity
      collector.recordApiRequest(100, true);
      collector.recordDbQuery(50, true);
      collector.recordAttackDetected();

      const health = checker.getHealthStatus();
      expect(health.status).toBe("healthy");
      expect(health.checks.api.status).toBe("healthy");
      expect(health.checks.database.status).toBe("healthy");
    });
  });
});
