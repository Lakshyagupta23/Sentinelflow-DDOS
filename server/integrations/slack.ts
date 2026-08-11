import axios from "axios";

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: Array<Record<string, unknown>>;
  attachments?: Array<Record<string, unknown>>;
}

export interface SlackIntegrationConfig {
  webhookUrl: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Slack Integration Service
 * Sends notifications to Slack channels via webhooks
 */
export class SlackIntegration {
  private webhookUrl: string;
  private retryAttempts: number;
  private retryDelayMs: number;

  constructor(config: SlackIntegrationConfig) {
    this.webhookUrl = config.webhookUrl;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  /**
   * Send a message to Slack with retry logic
   */
  async sendMessage(message: SlackMessage): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(this.webhookUrl, message, {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          console.log(`[Slack] Message sent successfully on attempt ${attempt + 1}`);
          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Slack] Attempt ${attempt + 1} failed:`, lastError.message);

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          console.error(`[Slack] Client error (${error.response.status}), not retrying`);
          return false;
        }

        // Wait before retrying
        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[Slack] Failed after ${this.retryAttempts} attempts:`, lastError?.message);
    return false;
  }

  /**
   * Send an attack alert to Slack
   */
  async sendAttackAlert(attackData: {
    attackId: string;
    type: string;
    severity: string;
    sourceIp: string;
    targetIp: string;
    packetRate: number;
    startTime: string;
  }): Promise<boolean> {
    const severityColor = {
      critical: "#FF0000",
      high: "#FF6600",
      medium: "#FFCC00",
      low: "#00CC00",
    }[attackData.severity] || "#808080";

    const message: SlackMessage = {
      channel: "#security-alerts",
      attachments: [
        {
          color: severityColor,
          title: `🚨 DDoS Attack Detected - ${attackData.severity.toUpperCase()}`,
          fields: [
            {
              title: "Attack ID",
              value: attackData.attackId,
              short: true,
            },
            {
              title: "Attack Type",
              value: attackData.type,
              short: true,
            },
            {
              title: "Source IP",
              value: attackData.sourceIp,
              short: true,
            },
            {
              title: "Target IP",
              value: attackData.targetIp,
              short: true,
            },
            {
              title: "Packet Rate",
              value: `${attackData.packetRate} pps`,
              short: true,
            },
            {
              title: "Start Time",
              value: attackData.startTime,
              short: true,
            },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send a mitigation status update to Slack
   */
  async sendMitigationUpdate(mitigationData: {
    attackId: string;
    status: "started" | "in_progress" | "completed" | "failed";
    rulesApplied: number;
    trafficBlocked: number;
  }): Promise<boolean> {
    const statusEmoji = {
      started: "🔄",
      in_progress: "⚙️",
      completed: "✅",
      failed: "❌",
    }[mitigationData.status];

    const message: SlackMessage = {
      channel: "#security-alerts",
      attachments: [
        {
          color: mitigationData.status === "completed" ? "#00CC00" : "#FFCC00",
          title: `${statusEmoji} Mitigation ${mitigationData.status.replace("_", " ").toUpperCase()}`,
          fields: [
            {
              title: "Attack ID",
              value: mitigationData.attackId,
              short: true,
            },
            {
              title: "Rules Applied",
              value: String(mitigationData.rulesApplied),
              short: true,
            },
            {
              title: "Traffic Blocked",
              value: `${mitigationData.trafficBlocked} packets`,
              short: true,
            },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send a playbook execution notification to Slack
   */
  async sendPlaybookNotification(playbookData: {
    playbookId: string;
    playbookName: string;
    status: "started" | "completed" | "failed";
    executionTime: number;
    actionsExecuted: number;
  }): Promise<boolean> {
    const statusEmoji = {
      started: "🚀",
      completed: "✅",
      failed: "❌",
    }[playbookData.status];

    const message: SlackMessage = {
      channel: "#automation-logs",
      attachments: [
        {
          color: playbookData.status === "completed" ? "#00CC00" : playbookData.status === "failed" ? "#FF0000" : "#0099FF",
          title: `${statusEmoji} Playbook ${playbookData.status.toUpperCase()}: ${playbookData.playbookName}`,
          fields: [
            {
              title: "Playbook ID",
              value: playbookData.playbookId,
              short: true,
            },
            {
              title: "Execution Time",
              value: `${playbookData.executionTime}ms`,
              short: true,
            },
            {
              title: "Actions Executed",
              value: String(playbookData.actionsExecuted),
              short: true,
            },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return this.sendMessage(message);
  }
}

/**
 * Create a Slack integration instance from environment variables
 */
export function createSlackIntegration(): SlackIntegration | null {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("[Slack] SLACK_WEBHOOK_URL not configured, Slack integration disabled");
    return null;
  }

  return new SlackIntegration({
    webhookUrl,
    retryAttempts: 3,
    retryDelayMs: 1000,
  });
}
