import axios from "axios";

export interface PagerDutyIncident {
  title: string;
  service_id: string;
  urgency?: "low" | "high";
  body?: {
    type: "incident_body";
    details: string;
  };
  client?: {
    name: string;
    url?: string;
  };
}

export interface PagerDutyIntegrationConfig {
  apiKey: string;
  serviceId: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * PagerDuty Integration Service
 * Creates and manages incidents in PagerDuty
 */
export class PagerDutyIntegration {
  private apiKey: string;
  private serviceId: string;
  private retryAttempts: number;
  private retryDelayMs: number;
  private baseUrl = "https://api.pagerduty.com";

  constructor(config: PagerDutyIntegrationConfig) {
    this.apiKey = config.apiKey;
    this.serviceId = config.serviceId;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  /**
   * Create an incident in PagerDuty with retry logic
   */
  async createIncident(incident: PagerDutyIncident): Promise<{ incidentId: string; success: boolean }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/incidents`,
          {
            incident: {
              type: "incident",
              title: incident.title,
              service: {
                id: this.serviceId,
                type: "service_reference",
              },
              urgency: incident.urgency || "high",
              body: incident.body || {
                type: "incident_body",
                details: "DDoS attack detected by SentinelFlow",
              },
              client: incident.client || {
                name: "SentinelFlow",
              },
            },
          },
          {
            timeout: 10000,
            headers: {
              Authorization: `Token token=${this.apiKey}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.pagerduty+json;version=2",
            },
          }
        );

        if (response.status === 201 && response.data.incident?.id) {
          console.log(`[PagerDuty] Incident created: ${response.data.incident.id}`);
          return {
            incidentId: response.data.incident.id,
            success: true,
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[PagerDuty] Attempt ${attempt + 1} failed:`, lastError.message);

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          console.error(`[PagerDuty] Client error (${error.response.status}), not retrying`);
          return {
            incidentId: "",
            success: false,
          };
        }

        // Wait before retrying
        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[PagerDuty] Failed after ${this.retryAttempts} attempts:`, lastError?.message);
    return {
      incidentId: "",
      success: false,
    };
  }

  /**
   * Resolve an incident in PagerDuty
   */
  async resolveIncident(incidentId: string): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await axios.put(
          `${this.baseUrl}/incidents/${incidentId}`,
          {
            incident: {
              type: "incident_reference",
              status: "resolved",
            },
          },
          {
            timeout: 10000,
            headers: {
              Authorization: `Token token=${this.apiKey}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.pagerduty+json;version=2",
            },
          }
        );

        if (response.status === 200) {
          console.log(`[PagerDuty] Incident resolved: ${incidentId}`);
          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[PagerDuty] Resolve attempt ${attempt + 1} failed:`, lastError.message);

        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          return false;
        }

        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[PagerDuty] Resolve failed after ${this.retryAttempts} attempts:`, lastError?.message);
    return false;
  }

  /**
   * Create an incident for a DDoS attack
   */
  async createAttackIncident(attackData: {
    attackId: string;
    type: string;
    severity: string;
    sourceIp: string;
    targetIp: string;
    packetRate: number;
  }): Promise<{ incidentId: string; success: boolean }> {
    const urgency = attackData.severity === "critical" || attackData.severity === "high" ? "high" : "low";

    return this.createIncident({
      title: `DDoS Attack: ${attackData.type} (${attackData.severity.toUpperCase()})`,
      service_id: this.serviceId,
      urgency,
      body: {
        type: "incident_body",
        details: `Attack ID: ${attackData.attackId}\nSource: ${attackData.sourceIp}\nTarget: ${attackData.targetIp}\nRate: ${attackData.packetRate} pps`,
      },
      client: {
        name: "SentinelFlow",
        url: `https://sentinelflow.example.com/attacks/${attackData.attackId}`,
      },
    });
  }

  /**
   * Create an incident for a playbook execution
   */
  async createPlaybookIncident(playbookData: {
    playbookId: string;
    playbookName: string;
    attackId: string;
    status: "triggered" | "failed";
  }): Promise<{ incidentId: string; success: boolean }> {
    return this.createIncident({
      title: `Playbook Execution: ${playbookData.playbookName} (${playbookData.status.toUpperCase()})`,
      service_id: this.serviceId,
      urgency: playbookData.status === "failed" ? "high" : "low",
      body: {
        type: "incident_body",
        details: `Playbook: ${playbookData.playbookName}\nAttack ID: ${playbookData.attackId}\nStatus: ${playbookData.status}`,
      },
    });
  }
}

/**
 * Create a PagerDuty integration instance from environment variables
 */
export function createPagerDutyIntegration(): PagerDutyIntegration | null {
  const apiKey = process.env.PAGERDUTY_API_KEY;
  const serviceId = process.env.PAGERDUTY_SERVICE_ID;

  if (!apiKey || !serviceId) {
    console.warn("[PagerDuty] PAGERDUTY_API_KEY or PAGERDUTY_SERVICE_ID not configured, PagerDuty integration disabled");
    return null;
  }

  return new PagerDutyIntegration({
    apiKey,
    serviceId,
    retryAttempts: 3,
    retryDelayMs: 1000,
  });
}
