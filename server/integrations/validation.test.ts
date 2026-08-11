import { describe, it, expect } from "vitest";
import { createJiraIntegration } from "./jira-real";
import { createSlackIntegration } from "./slack-real";

describe("Integration Validation", () => {
  describe("Jira Integration", () => {
    it("should create Jira integration with valid config", () => {
      const jira = createJiraIntegration();
      
      // If credentials are configured, Jira should be initialized
      if (process.env.JIRA_URL && process.env.JIRA_USERNAME && process.env.JIRA_API_TOKEN) {
        expect(jira).toBeDefined();
        expect(jira).not.toBeNull();
      } else {
        // If not configured, should return null gracefully
        expect(jira).toBeNull();
      }
    });

    it("should have required Jira environment variables if integration is enabled", () => {
      const hasJiraConfig = process.env.JIRA_URL && process.env.JIRA_USERNAME && process.env.JIRA_API_TOKEN;
      
      if (hasJiraConfig) {
        expect(process.env.JIRA_URL).toBeDefined();
        expect(process.env.JIRA_USERNAME).toBeDefined();
        expect(process.env.JIRA_API_TOKEN).toBeDefined();
        expect(process.env.JIRA_PROJECT_KEY || "SEC").toBeDefined();
      }
    });
  });

  describe("Slack Integration", () => {
    it("should create Slack integration with valid config", () => {
      const slack = createSlackIntegration();
      
      // If credentials are configured, Slack should be initialized
      if (process.env.SLACK_WEBHOOK_URL) {
        expect(slack).toBeDefined();
        expect(slack).not.toBeNull();
      } else {
        // If not configured, should return null gracefully
        expect(slack).toBeNull();
      }
    });

    it("should have required Slack environment variables if integration is enabled", () => {
      const hasSlackConfig = process.env.SLACK_WEBHOOK_URL;
      
      if (hasSlackConfig) {
        expect(process.env.SLACK_WEBHOOK_URL).toBeDefined();
        expect(process.env.SLACK_CHANNEL || "#security-alerts").toBeDefined();
      }
    });

    it("should validate Slack webhook URL format", () => {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      
      if (webhookUrl) {
        // Slack webhook URLs should follow the pattern: https://hooks.slack.com/services/...
        expect(webhookUrl).toMatch(/^https:\/\/hooks\.slack\.com\/services\//);
      }
    });
  });

  describe("Integration Status", () => {
    it("should report integration status", () => {
      const jira = createJiraIntegration();
      const slack = createSlackIntegration();
      
      const status = {
        jira: jira !== null,
        slack: slack !== null,
      };
      
      // At least one integration should be configured if credentials exist
      const hasConfig = (process.env.JIRA_URL && process.env.JIRA_USERNAME && process.env.JIRA_API_TOKEN) || process.env.SLACK_WEBHOOK_URL;
      if (hasConfig) {
        expect(status.jira || status.slack).toBe(true);
      } else {
        // In local test environments without credentials, both will be false (which is normal)
        expect(status.jira || status.slack).toBe(false);
      }
    });
  });
});
