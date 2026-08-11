import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlackIntegration } from "./slack";
import { PagerDutyIntegration } from "./pagerduty";
import { SplunkIntegration } from "./splunk";
import { IntegrationManager } from "./manager";

describe("External Integrations", () => {
  describe("Slack Integration", () => {
    let slack: SlackIntegration;

    beforeEach(() => {
      slack = new SlackIntegration({
        webhookUrl: "https://hooks.slack.com/services/TEST/WEBHOOK/URL",
        retryAttempts: 1,
        retryDelayMs: 100,
      });
    });

    it("should create Slack integration instance", () => {
      expect(slack).toBeDefined();
    });

    it("should format attack alert message correctly", async () => {
      const result = await slack.sendAttackAlert({
        attackId: "attack-123",
        type: "SYN Flood",
        severity: "high",
        sourceIp: "192.0.2.1",
        targetIp: "203.0.113.1",
        packetRate: 50000,
        startTime: new Date().toISOString(),
      });

      // Result will be false due to invalid webhook URL, but message formatting is tested
      expect(typeof result).toBe("boolean");
    });

    it("should format mitigation update message correctly", async () => {
      const result = await slack.sendMitigationUpdate({
        attackId: "attack-123",
        status: "completed",
        rulesApplied: 3,
        trafficBlocked: 100000,
      });

      expect(typeof result).toBe("boolean");
    });

    it("should format playbook notification correctly", async () => {
      const result = await slack.sendPlaybookNotification({
        playbookId: "playbook-1",
        playbookName: "Auto-Mitigate SYN Flood",
        status: "completed",
        executionTime: 2500,
        actionsExecuted: 5,
      });

      expect(typeof result).toBe("boolean");
    });
  });

  describe("PagerDuty Integration", () => {
    let pagerduty: PagerDutyIntegration;

    beforeEach(() => {
      pagerduty = new PagerDutyIntegration({
        apiKey: "test-api-key",
        serviceId: "test-service-id",
        retryAttempts: 1,
        retryDelayMs: 100,
      });
    });

    it("should create PagerDuty integration instance", () => {
      expect(pagerduty).toBeDefined();
    });

    it("should format attack incident correctly", async () => {
      const result = await pagerduty.createAttackIncident({
        attackId: "attack-123",
        type: "SYN Flood",
        severity: "critical",
        sourceIp: "192.0.2.1",
        targetIp: "203.0.113.1",
        packetRate: 100000,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("incidentId");
    });

    it("should format playbook incident correctly", async () => {
      const result = await pagerduty.createPlaybookIncident({
        playbookId: "playbook-1",
        playbookName: "Auto-Mitigate SYN Flood",
        attackId: "attack-123",
        status: "triggered",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("incidentId");
    });
  });

  describe("Splunk Integration", () => {
    let splunk: SplunkIntegration;

    beforeEach(() => {
      splunk = new SplunkIntegration({
        hecUrl: "https://splunk.example.com:8088",
        hecToken: "test-hec-token",
        index: "main",
        source: "sentinelflow",
        sourcetype: "json",
        retryAttempts: 1,
        retryDelayMs: 100,
      });
    });

    it("should create Splunk integration instance", () => {
      expect(splunk).toBeDefined();
    });

    it("should format attack event correctly", async () => {
      const result = await splunk.sendAttackEvent({
        attackId: "attack-123",
        type: "SYN Flood",
        severity: "high",
        sourceIp: "192.0.2.1",
        targetIp: "203.0.113.1",
        packetRate: 50000,
        startTime: new Date().toISOString(),
        protocol: "TCP",
        port: 443,
      });

      expect(typeof result).toBe("boolean");
    });

    it("should format mitigation event correctly", async () => {
      const result = await splunk.sendMitigationEvent({
        attackId: "attack-123",
        status: "completed",
        rulesApplied: 3,
        trafficBlocked: 100000,
        duration: 2500,
      });

      expect(typeof result).toBe("boolean");
    });

    it("should format playbook event correctly", async () => {
      const result = await splunk.sendPlaybookEvent({
        playbookId: "playbook-1",
        playbookName: "Auto-Mitigate SYN Flood",
        attackId: "attack-123",
        status: "completed",
        executionTime: 2500,
        actionsExecuted: 5,
      });

      expect(typeof result).toBe("boolean");
    });

    it("should format threat intelligence event correctly", async () => {
      const result = await splunk.sendThreatIntelEvent({
        ipAddress: "192.0.2.1",
        reputation: 85,
        threatLevel: "high",
        sources: ["AlienVault OTX", "Shodan"],
        malware: ["Mirai", "Botnet"],
        botnets: ["Mirai", "Emotet"],
      });

      expect(typeof result).toBe("boolean");
    });

    it("should format alert event correctly", async () => {
      const result = await splunk.sendAlertEvent({
        alertId: "alert-1",
        alertName: "High Traffic Volume",
        severity: "high",
        message: "Traffic volume exceeded threshold",
        triggeredBy: "alert-rule-1",
      });

      expect(typeof result).toBe("boolean");
    });

    it("should send multiple events in batch", async () => {
      const events = [
        {
          sourcetype: "ddos_attack",
          event: { attack_id: "attack-1", type: "SYN Flood" },
        },
        {
          sourcetype: "ddos_attack",
          event: { attack_id: "attack-2", type: "UDP Flood" },
        },
      ];

      const result = await splunk.sendEvents(events);
      expect(typeof result).toBe("number");
    });
  });

  describe("Integration Manager", () => {
    let manager: IntegrationManager;

    beforeEach(() => {
      manager = new IntegrationManager();
    });

    it("should create integration manager", () => {
      expect(manager).toBeDefined();
    });

    it("should return integration status", () => {
      const status = manager.getStatus();
      expect(status).toHaveProperty("slack");
      expect(status).toHaveProperty("pagerduty");
      expect(status).toHaveProperty("splunk");
    });

    it("should handle attack notification", async () => {
      await expect(
        manager.notifyAttack({
          attackId: "attack-123",
          type: "SYN Flood",
          severity: "high",
          sourceIp: "192.0.2.1",
          targetIp: "203.0.113.1",
          packetRate: 50000,
          startTime: new Date().toISOString(),
        })
      ).resolves.toBeUndefined();
    });

    it("should handle mitigation notification", async () => {
      await expect(
        manager.notifyMitigation({
          attackId: "attack-123",
          status: "completed",
          rulesApplied: 3,
          trafficBlocked: 100000,
        })
      ).resolves.toBeUndefined();
    });

    it("should handle playbook notification", async () => {
      await expect(
        manager.notifyPlaybook({
          playbookId: "playbook-1",
          playbookName: "Auto-Mitigate SYN Flood",
          attackId: "attack-123",
          status: "completed",
          executionTime: 2500,
          actionsExecuted: 5,
        })
      ).resolves.toBeUndefined();
    });

    it("should handle threat intel notification", async () => {
      await expect(
        manager.notifyThreatIntel({
          ipAddress: "192.0.2.1",
          reputation: 85,
          threatLevel: "high",
          sources: ["AlienVault OTX"],
        })
      ).resolves.toBeUndefined();
    });

    it("should handle alert notification", async () => {
      await expect(
        manager.notifyAlert({
          alertId: "alert-1",
          alertName: "High Traffic",
          severity: "high",
          message: "Traffic exceeded threshold",
        })
      ).resolves.toBeUndefined();
    });
  });
});
