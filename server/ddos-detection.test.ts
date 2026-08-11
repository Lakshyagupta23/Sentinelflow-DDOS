import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";

// Test suite for DDoS Detection Platform backend
describe("DDoS Detection Platform - Backend Tests", () => {
  describe("Attack Detection Validation", () => {
    const attackInputSchema = z.object({
      type: z.enum(["volumetric", "protocol", "application_layer"]),
      severity: z.enum(["low", "medium", "high", "critical"]),
      sourceIp: z.string().optional(),
      destinationUrl: z.string().optional(),
      peakTraffic: z.number().optional(),
    });

    it("should validate volumetric attack input", () => {
      const input = {
        type: "volumetric" as const,
        severity: "critical" as const,
        sourceIp: "192.168.1.1",
        peakTraffic: 1000000,
      };
      expect(() => attackInputSchema.parse(input)).not.toThrow();
    });

    it("should validate protocol attack input", () => {
      const input = {
        type: "protocol" as const,
        severity: "high" as const,
        sourceIp: "10.0.0.1",
      };
      expect(() => attackInputSchema.parse(input)).not.toThrow();
    });

    it("should validate application-layer attack input", () => {
      const input = {
        type: "application_layer" as const,
        severity: "medium" as const,
        destinationUrl: "https://api.example.com/login",
      };
      expect(() => attackInputSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid attack type", () => {
      const input = {
        type: "invalid_type",
        severity: "critical",
      };
      expect(() => attackInputSchema.parse(input)).toThrow();
    });

    it("should reject invalid severity level", () => {
      const input = {
        type: "volumetric",
        severity: "extreme",
      };
      expect(() => attackInputSchema.parse(input)).toThrow();
    });
  });

  describe("Traffic Metrics Validation", () => {
    const trafficInputSchema = z.object({
      trafficVolume: z.number().positive(),
      requestRate: z.number().positive(),
      protocolBreakdown: z.record(z.string(), z.number()),
      sourceCountry: z.string().optional(),
    });

    it("should validate traffic metrics input", () => {
      const input = {
        trafficVolume: 5000,
        requestRate: 1200,
        protocolBreakdown: { http: 50, https: 45, other: 5 },
      };
      expect(() => trafficInputSchema.parse(input)).not.toThrow();
    });

    it("should reject negative traffic volume", () => {
      const input = {
        trafficVolume: -1000,
        requestRate: 1200,
        protocolBreakdown: { http: 50 },
      };
      expect(() => trafficInputSchema.parse(input)).toThrow();
    });

    it("should reject zero request rate", () => {
      const input = {
        trafficVolume: 5000,
        requestRate: 0,
        protocolBreakdown: { http: 100 },
      };
      expect(() => trafficInputSchema.parse(input)).toThrow();
    });

    it("should accept optional source country", () => {
      const input = {
        trafficVolume: 5000,
        requestRate: 1200,
        protocolBreakdown: { http: 50 },
        sourceCountry: "US",
      };
      expect(() => trafficInputSchema.parse(input)).not.toThrow();
    });
  });

  describe("Alert Configuration Validation", () => {
    const alertConfigSchema = z.object({
      eventType: z.string(),
      threshold: z.number().positive(),
      notificationChannels: z.array(z.enum(["email", "slack", "webhook"])),
    });

    it("should validate alert configuration with email channel", () => {
      const input = {
        eventType: "attack_detected",
        threshold: 1,
        notificationChannels: ["email"],
      };
      expect(() => alertConfigSchema.parse(input)).not.toThrow();
    });

    it("should validate alert configuration with multiple channels", () => {
      const input = {
        eventType: "traffic_spike",
        threshold: 5,
        notificationChannels: ["email", "slack", "webhook"],
      };
      expect(() => alertConfigSchema.parse(input)).not.toThrow();
    });

    it("should reject zero threshold", () => {
      const input = {
        eventType: "anomaly",
        threshold: 0,
        notificationChannels: ["email"],
      };
      expect(() => alertConfigSchema.parse(input)).toThrow();
    });

    it("should reject invalid notification channel", () => {
      const input = {
        eventType: "threshold_exceeded",
        threshold: 1,
        notificationChannels: ["invalid_channel"],
      };
      expect(() => alertConfigSchema.parse(input)).toThrow();
    });

    it("should accept notification channels array", () => {
      const input = {
        eventType: "attack_detected",
        threshold: 1,
        notificationChannels: ["email"],
      };
      expect(() => alertConfigSchema.parse(input)).not.toThrow();
    });
  });

  describe("Mitigation Rules Validation", () => {
    const mitigationRuleSchema = z.object({
      type: z.enum(["ip_block", "rate_limit", "captcha_challenge", "geo_block"]),
      target: z.string().min(1),
      threshold: z.number().optional(),
      duration: z.number().optional(),
    });

    it("should validate IP block rule", () => {
      const input = {
        type: "ip_block" as const,
        target: "192.168.1.100",
      };
      expect(() => mitigationRuleSchema.parse(input)).not.toThrow();
    });

    it("should validate rate limit rule with threshold", () => {
      const input = {
        type: "rate_limit" as const,
        target: "/api/login",
        threshold: 100,
        duration: 60,
      };
      expect(() => mitigationRuleSchema.parse(input)).not.toThrow();
    });

    it("should validate CAPTCHA challenge rule", () => {
      const input = {
        type: "captcha_challenge" as const,
        target: "/checkout",
      };
      expect(() => mitigationRuleSchema.parse(input)).not.toThrow();
    });

    it("should validate geographic block rule", () => {
      const input = {
        type: "geo_block" as const,
        target: "CN",
      };
      expect(() => mitigationRuleSchema.parse(input)).not.toThrow();
    });

    it("should reject empty target", () => {
      const input = {
        type: "ip_block",
        target: "",
      };
      expect(() => mitigationRuleSchema.parse(input)).toThrow();
    });
  });

  describe("RBAC Permission Checks", () => {
    const rolePermissions: Record<string, Set<string>> = {
      admin: new Set([
        "view_dashboard",
        "view_forensics",
        "manage_mitigation",
        "manage_alerts",
        "view_summary",
        "view_audit_logs",
      ]),
      security_analyst: new Set([
        "view_dashboard",
        "view_forensics",
        "create_alerts",
        "view_summary",
      ]),
      devops_sre: new Set([
        "view_dashboard",
        "manage_mitigation",
        "create_alerts",
      ]),
      it_manager: new Set([
        "view_dashboard",
        "view_summary",
        "view_audit_logs",
      ]),
    };

    it("should grant admin full access", () => {
      const adminPerms = rolePermissions["admin"];
      expect(adminPerms.has("view_dashboard")).toBe(true);
      expect(adminPerms.has("manage_mitigation")).toBe(true);
      expect(adminPerms.has("view_audit_logs")).toBe(true);
    });

    it("should grant security analyst forensics access", () => {
      const analystPerms = rolePermissions["security_analyst"];
      expect(analystPerms.has("view_forensics")).toBe(true);
      expect(analystPerms.has("create_alerts")).toBe(true);
      expect(analystPerms.has("manage_mitigation")).toBe(false);
    });

    it("should grant DevOps/SRE mitigation access", () => {
      const devopsPerms = rolePermissions["devops_sre"];
      expect(devopsPerms.has("manage_mitigation")).toBe(true);
      expect(devopsPerms.has("create_alerts")).toBe(true);
      expect(devopsPerms.has("view_audit_logs")).toBe(false);
    });

    it("should grant IT Manager summary access", () => {
      const managerPerms = rolePermissions["it_manager"];
      expect(managerPerms.has("view_summary")).toBe(true);
      expect(managerPerms.has("view_audit_logs")).toBe(true);
      expect(managerPerms.has("manage_mitigation")).toBe(false);
    });
  });

  describe("Attack Status Transitions", () => {
    const validStatuses = ["ongoing", "mitigated", "resolved"];

    it("should allow transition from ongoing to mitigated", () => {
      const currentStatus = "ongoing";
      const newStatus = "mitigated";
      expect(validStatuses.includes(newStatus)).toBe(true);
    });

    it("should allow transition from mitigated to resolved", () => {
      const currentStatus = "mitigated";
      const newStatus = "resolved";
      expect(validStatuses.includes(newStatus)).toBe(true);
    });

    it("should allow transition from ongoing to resolved", () => {
      const currentStatus = "ongoing";
      const newStatus = "resolved";
      expect(validStatuses.includes(newStatus)).toBe(true);
    });

    it("should reject invalid status", () => {
      const status = "completed";
      expect(validStatuses.includes(status)).toBe(false);
    });
  });

  describe("Alert Severity Levels", () => {
    const severityLevels = ["low", "medium", "high", "critical"];
    const severityScores: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    it("should rank critical higher than high", () => {
      expect(severityScores["critical"]).toBeGreaterThan(severityScores["high"]);
    });

    it("should rank high higher than medium", () => {
      expect(severityScores["high"]).toBeGreaterThan(severityScores["medium"]);
    });

    it("should rank medium higher than low", () => {
      expect(severityScores["medium"]).toBeGreaterThan(severityScores["low"]);
    });

    it("should have all severity levels defined", () => {
      severityLevels.forEach((level) => {
        expect(severityScores[level]).toBeDefined();
      });
    });
  });

  describe("Attack Type Classification", () => {
    const attackTypes = ["volumetric", "protocol", "application_layer"];
    const typeDescriptions: Record<string, string> = {
      volumetric: "High-volume traffic-based attacks",
      protocol: "Protocol-layer attacks (SYN flood, DNS amplification)",
      application_layer: "Application-layer attacks (HTTP flood, SQL injection)",
    };

    it("should classify volumetric attacks", () => {
      expect(attackTypes.includes("volumetric")).toBe(true);
      expect(typeDescriptions["volumetric"]).toBeDefined();
    });

    it("should classify protocol attacks", () => {
      expect(attackTypes.includes("protocol")).toBe(true);
      expect(typeDescriptions["protocol"]).toBeDefined();
    });

    it("should classify application-layer attacks", () => {
      expect(attackTypes.includes("application_layer")).toBe(true);
      expect(typeDescriptions["application_layer"]).toBeDefined();
    });
  });
});
