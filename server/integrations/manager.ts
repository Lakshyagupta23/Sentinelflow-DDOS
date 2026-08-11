import { SlackIntegration, createSlackIntegration } from "./slack";
import { PagerDutyIntegration, createPagerDutyIntegration } from "./pagerduty";
import { SplunkIntegration, createSplunkIntegration } from "./splunk";

/**
 * Integration Manager
 * Coordinates all external service integrations
 */
export class IntegrationManager {
  private slack: SlackIntegration | null;
  private pagerduty: PagerDutyIntegration | null;
  private splunk: SplunkIntegration | null;

  constructor() {
    this.slack = createSlackIntegration();
    this.pagerduty = createPagerDutyIntegration();
    this.splunk = createSplunkIntegration();

    console.log("[IntegrationManager] Initialized with:");
    console.log(`  - Slack: ${this.slack ? "enabled" : "disabled"}`);
    console.log(`  - PagerDuty: ${this.pagerduty ? "enabled" : "disabled"}`);
    console.log(`  - Splunk: ${this.splunk ? "enabled" : "disabled"}`);
  }

  /**
   * Notify all services of a DDoS attack
   */
  async notifyAttack(attackData: {
    attackId: string;
    type: string;
    severity: string;
    sourceIp: string;
    targetIp: string;
    packetRate: number;
    startTime: string;
    protocol?: string;
    port?: number;
  }): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (this.slack) {
      promises.push(
        this.slack.sendAttackAlert({
          attackId: attackData.attackId,
          type: attackData.type,
          severity: attackData.severity,
          sourceIp: attackData.sourceIp,
          targetIp: attackData.targetIp,
          packetRate: attackData.packetRate,
          startTime: attackData.startTime,
        })
      );
    }

    if (this.pagerduty) {
      promises.push(
        this.pagerduty.createAttackIncident({
          attackId: attackData.attackId,
          type: attackData.type,
          severity: attackData.severity,
          sourceIp: attackData.sourceIp,
          targetIp: attackData.targetIp,
          packetRate: attackData.packetRate,
        })
      );
    }

    if (this.splunk) {
      promises.push(
        this.splunk.sendAttackEvent({
          attackId: attackData.attackId,
          type: attackData.type,
          severity: attackData.severity,
          sourceIp: attackData.sourceIp,
          targetIp: attackData.targetIp,
          packetRate: attackData.packetRate,
          startTime: attackData.startTime,
          protocol: attackData.protocol,
          port: attackData.port,
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Notify all services of mitigation action
   */
  async notifyMitigation(mitigationData: {
    attackId: string;
    status: "started" | "in_progress" | "completed" | "failed";
    rulesApplied: number;
    trafficBlocked: number;
  }): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (this.slack) {
      promises.push(
        this.slack.sendMitigationUpdate({
          attackId: mitigationData.attackId,
          status: mitigationData.status,
          rulesApplied: mitigationData.rulesApplied,
          trafficBlocked: mitigationData.trafficBlocked,
        })
      );
    }

    if (this.splunk) {
      promises.push(
        this.splunk.sendMitigationEvent({
          attackId: mitigationData.attackId,
          status: mitigationData.status,
          rulesApplied: mitigationData.rulesApplied,
          trafficBlocked: mitigationData.trafficBlocked,
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Notify all services of playbook execution
   */
  async notifyPlaybook(playbookData: {
    playbookId: string;
    playbookName: string;
    attackId: string;
    status: "started" | "completed" | "failed";
    executionTime: number;
    actionsExecuted: number;
  }): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (this.slack) {
      promises.push(
        this.slack.sendPlaybookNotification({
          playbookId: playbookData.playbookId,
          playbookName: playbookData.playbookName,
          status: playbookData.status,
          executionTime: playbookData.executionTime,
          actionsExecuted: playbookData.actionsExecuted,
        })
      );
    }

    if (this.pagerduty) {
      promises.push(
        this.pagerduty.createPlaybookIncident({
          playbookId: playbookData.playbookId,
          playbookName: playbookData.playbookName,
          attackId: playbookData.attackId,
          status: playbookData.status === "started" ? "triggered" : playbookData.status === "failed" ? "failed" : "triggered",
        })
      );
    }

    if (this.splunk) {
      promises.push(
        this.splunk.sendPlaybookEvent({
          playbookId: playbookData.playbookId,
          playbookName: playbookData.playbookName,
          attackId: playbookData.attackId,
          status: playbookData.status,
          executionTime: playbookData.executionTime,
          actionsExecuted: playbookData.actionsExecuted,
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Notify all services of threat intelligence lookup
   */
  async notifyThreatIntel(threatData: {
    ipAddress: string;
    reputation: number;
    threatLevel: string;
    sources: string[];
    malware?: string[];
    botnets?: string[];
  }): Promise<void> {
    if (this.splunk) {
      await this.splunk.sendThreatIntelEvent(threatData);
    }
  }

  /**
   * Notify all services of alert
   */
  async notifyAlert(alertData: {
    alertId: string;
    alertName: string;
    severity: string;
    message: string;
    triggeredBy?: string;
  }): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (this.slack) {
      promises.push(
        this.slack.sendMessage({
          channel: "#security-alerts",
          attachments: [
            {
              color: alertData.severity === "critical" ? "#FF0000" : alertData.severity === "high" ? "#FF6600" : "#FFCC00",
              title: `🚨 Alert: ${alertData.alertName}`,
              text: alertData.message,
              fields: [
                {
                  title: "Severity",
                  value: alertData.severity,
                  short: true,
                },
                {
                  title: "Triggered By",
                  value: alertData.triggeredBy || "system",
                  short: true,
                },
              ],
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        })
      );
    }

    if (this.splunk) {
      promises.push(
        this.splunk.sendAlertEvent({
          alertId: alertData.alertId,
          alertName: alertData.alertName,
          severity: alertData.severity,
          message: alertData.message,
          triggeredBy: alertData.triggeredBy,
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get integration status
   */
  getStatus(): {
    slack: boolean;
    pagerduty: boolean;
    splunk: boolean;
  } {
    return {
      slack: !!this.slack,
      pagerduty: !!this.pagerduty,
      splunk: !!this.splunk,
    };
  }
}

// Global integration manager instance
let integrationManager: IntegrationManager | null = null;

/**
 * Get or create the global integration manager
 */
export function getIntegrationManager(): IntegrationManager {
  if (!integrationManager) {
    integrationManager = new IntegrationManager();
  }
  return integrationManager;
}
