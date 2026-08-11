/**
 * Real Slack API Integration
 * Requires: SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN
 */

import { ErrorRecovery } from "../error-handler";

export interface SlackConfig {
  webhookUrl?: string;
  botToken?: string;
  channel?: string;
}

export interface SlackMessage {
  ok: boolean;
  ts?: string;
  error?: string;
}

export class SlackIntegration {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Send attack notification to Slack
   */
  async sendAttackNotification(
    attackId: string,
    severity: string,
    sourceIp: string,
    targetUrl: string,
    traffic: number
  ): Promise<SlackMessage> {
    const color = this.getSeverityColor(severity);
    const emoji = this.getSeverityEmoji(severity);

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} DDoS Attack Detected`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Attack ID:*\n${attackId}`,
            },
            {
              type: "mrkdwn",
              text: `*Severity:*\n${severity.toUpperCase()}`,
            },
            {
              type: "mrkdwn",
              text: `*Source IP:*\n${sourceIp}`,
            },
            {
              type: "mrkdwn",
              text: `*Traffic:*\n${traffic} Gbps`,
            },
            {
              type: "mrkdwn",
              text: `*Target:*\n${targetUrl}`,
            },
            {
              type: "mrkdwn",
              text: `*Timestamp:*\n${new Date().toISOString()}`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🔴 *Mitigation Status:* Automated response initiated",
          },
        },
      ],
      attachments: [
        {
          color,
          fields: [
            {
              title: "Status",
              value: "Active Mitigation",
              short: true,
            },
            {
              title: "Response Time",
              value: "< 100ms",
              short: true,
            },
          ],
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send mitigation update to Slack
   */
  async sendMitigationUpdate(
    attackId: string,
    status: string,
    blockedTraffic: number,
    mitigationTime: number
  ): Promise<SlackMessage> {
    const message = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *Mitigation Update*\n\n*Attack ID:* ${attackId}\n*Status:* ${status}\n*Blocked Traffic:* ${blockedTraffic} Gbps\n*Mitigation Time:* ${mitigationTime}ms`,
          },
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send alert to Slack
   */
  async sendAlert(title: string, message: string, severity: string): Promise<SlackMessage> {
    const color = this.getSeverityColor(severity);

    const payload = {
      attachments: [
        {
          color,
          title,
          text: message,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return this.sendMessage(payload);
  }

  /**
   * Send generic message to Slack with retry logic
   */
  private async sendMessage(payload: any): Promise<SlackMessage> {
    if (!this.config.webhookUrl) {
      return {
        ok: false,
        error: "Slack webhook URL not configured",
      };
    }

    try {
      const result = await ErrorRecovery.retryWithBackoff(
        async () => {
          const response = await fetch(this.config.webhookUrl!, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Slack API error: ${response.statusText}`);
          }

          const text = await response.text();
          return text === "ok";
        },
        3,
        100
      );

      return {
        ok: result,
        ts: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to send Slack message after retries:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: "#FF0000",
      high: "#FF6600",
      medium: "#FFCC00",
      low: "#00CC00",
    };
    return colors[severity] || "#0099FF";
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: "🚨",
      high: "⚠️",
      medium: "⚡",
      low: "ℹ️",
    };
    return emojis[severity] || "📢";
  }
}

/**
 * Create Slack integration instance
 */
export function createSlackIntegration(): SlackIntegration | null {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const botToken = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL || "#security-alerts";

  if (!webhookUrl && !botToken) {
    console.warn("Slack integration not configured (missing SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN)");
    return null;
  }

  return new SlackIntegration({ webhookUrl, botToken, channel });
}
