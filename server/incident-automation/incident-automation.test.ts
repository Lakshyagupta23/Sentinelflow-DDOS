import { describe, it, expect, beforeEach } from "vitest";
import { JiraIncidentManager, getJiraManager } from "./jira";
import { ServiceNowIncidentManager, getServiceNowManager } from "./servicenow";

describe("Incident Automation", () => {
  describe("Jira Incident Manager", () => {
    let manager: JiraIncidentManager;

    beforeEach(() => {
      manager = new JiraIncidentManager();
    });

    it("should create Jira manager instance", () => {
      expect(manager).toBeDefined();
    });

    it("should not be configured by default", () => {
      expect(manager.isConfigured()).toBe(false);
    });

    it("should set configuration", () => {
      manager.setConfig({
        url: "https://jira.example.com",
        username: "user",
        apiToken: "token",
        projectKey: "DDOS",
      });

      expect(manager.isConfigured()).toBe(true);
    });

    it("should create incident for critical attack", async () => {
      manager.setConfig({
        url: "https://jira.example.com",
        username: "user",
        apiToken: "token",
        projectKey: "DDOS",
      });

      const incident = await manager.createIncident({
        attackId: "attack-1",
        severity: "critical",
        duration: 600,
        affectedIps: 500,
        attackType: "SYN Flood",
        description: "Large SYN flood attack detected",
      });

      expect(incident).toBeDefined();
      expect(incident?.key).toMatch(/^JIRA-/);
      expect(incident?.priority).toBe("Highest");
    });

    it("should create incident for high severity attack", async () => {
      manager.setConfig({
        url: "https://jira.example.com",
        username: "user",
        apiToken: "token",
        projectKey: "DDOS",
      });

      const incident = await manager.createIncident({
        attackId: "attack-2",
        severity: "high",
        duration: 120,
        affectedIps: 200,
        attackType: "UDP Flood",
        description: "UDP flood attack",
      });

      expect(incident?.priority).toBe("High");
    });

    it("should not create incident if not configured", async () => {
      const incident = await manager.createIncident({
        attackId: "attack-3",
        severity: "critical",
        duration: 600,
        affectedIps: 500,
        attackType: "SYN Flood",
        description: "Test attack",
      });

      expect(incident).toBeNull();
    });

    it("should update incident status", async () => {
      manager.setConfig({
        url: "https://jira.example.com",
        username: "user",
        apiToken: "token",
        projectKey: "DDOS",
      });

      await manager.createIncident({
        attackId: "attack-4",
        severity: "high",
        duration: 300,
        affectedIps: 300,
        attackType: "HTTP Flood",
        description: "HTTP flood attack",
      });

      const updated = await manager.updateIncident("attack-4", "In Progress");
      expect(updated).toBe(true);
    });

    it("should close incident", async () => {
      manager.setConfig({
        url: "https://jira.example.com",
        username: "user",
        apiToken: "token",
        projectKey: "DDOS",
      });

      await manager.createIncident({
        attackId: "attack-5",
        severity: "medium",
        duration: 60,
        affectedIps: 100,
        attackType: "DNS Flood",
        description: "DNS flood attack",
      });

      const closed = await manager.closeIncident("attack-5", "Attack mitigated");
      expect(closed).toBe(true);
    });

    it("should get incident by attack ID", async () => {
      manager.setConfig({
        url: "https://jira.example.com",
        username: "user",
        apiToken: "token",
        projectKey: "DDOS",
      });

      await manager.createIncident({
        attackId: "attack-6",
        severity: "high",
        duration: 300,
        affectedIps: 400,
        attackType: "SYN Flood",
        description: "SYN flood",
      });

      const incident = manager.getIncident("attack-6");
      expect(incident).toBeDefined();
      expect(incident?.key).toMatch(/^JIRA-/);
    });

    it("should get global Jira manager instance", () => {
      const manager1 = getJiraManager();
      const manager2 = getJiraManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe("ServiceNow Incident Manager", () => {
    let manager: ServiceNowIncidentManager;

    beforeEach(() => {
      manager = new ServiceNowIncidentManager();
    });

    it("should create ServiceNow manager instance", () => {
      expect(manager).toBeDefined();
    });

    it("should not be configured by default", () => {
      expect(manager.isConfigured()).toBe(false);
    });

    it("should set configuration", () => {
      manager.setConfig({
        instanceUrl: "https://instance.service-now.com",
        clientId: "client-id",
        clientSecret: "client-secret",
      });

      expect(manager.isConfigured()).toBe(true);
    });

    it("should create incident for critical attack", async () => {
      manager.setConfig({
        instanceUrl: "https://instance.service-now.com",
        clientId: "client-id",
        clientSecret: "client-secret",
      });

      const incident = await manager.createIncident({
        attackId: "attack-1",
        severity: "critical",
        duration: 600,
        affectedIps: 500,
        attackType: "SYN Flood",
        description: "Large SYN flood attack",
      });

      expect(incident).toBeDefined();
      expect(incident?.number).toMatch(/^INC/);
      expect(incident?.priority).toBe(1);
    });

    it("should create incident for medium severity attack", async () => {
      manager.setConfig({
        instanceUrl: "https://instance.service-now.com",
        clientId: "client-id",
        clientSecret: "client-secret",
      });

      const incident = await manager.createIncident({
        attackId: "attack-2",
        severity: "medium",
        duration: 120,
        affectedIps: 200,
        attackType: "UDP Flood",
        description: "UDP flood",
      });

      expect(incident?.priority).toBe(3);
    });

    it("should resolve incident", async () => {
      manager.setConfig({
        instanceUrl: "https://instance.service-now.com",
        clientId: "client-id",
        clientSecret: "client-secret",
      });

      await manager.createIncident({
        attackId: "attack-3",
        severity: "high",
        duration: 300,
        affectedIps: 300,
        attackType: "HTTP Flood",
        description: "HTTP flood",
      });

      const resolved = await manager.resolveIncident("attack-3", "Attack mitigated");
      expect(resolved).toBe(true);
    });

    it("should close incident", async () => {
      manager.setConfig({
        instanceUrl: "https://instance.service-now.com",
        clientId: "client-id",
        clientSecret: "client-secret",
      });

      await manager.createIncident({
        attackId: "attack-4",
        severity: "low",
        duration: 30,
        affectedIps: 50,
        attackType: "DNS Flood",
        description: "DNS flood",
      });

      const closed = await manager.closeIncident("attack-4");
      expect(closed).toBe(true);
    });

    it("should get global ServiceNow manager instance", () => {
      const manager1 = getServiceNowManager();
      const manager2 = getServiceNowManager();
      expect(manager1).toBe(manager2);
    });
  });
});
