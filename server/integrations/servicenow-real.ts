/**
 * Real ServiceNow REST API Integration
 * Requires: SERVICENOW_INSTANCE, SERVICENOW_USERNAME, SERVICENOW_PASSWORD
 */

export interface ServiceNowConfig {
  instance: string;
  username: string;
  password: string;
}

export interface ServiceNowIncident {
  number: string;
  sysId: string;
  url: string;
  state: string;
}

export class ServiceNowIntegration {
  private config: ServiceNowConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ServiceNowConfig) {
    this.config = config;
    this.baseUrl = `https://${config.instance}.service-now.com`;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
  }

  /**
   * Create incident in ServiceNow
   */
  async createIncident(
    attackId: string,
    severity: string,
    description: string,
    sourceIp: string
  ): Promise<ServiceNowIncident> {
    const body = {
      short_description: `DDoS Attack Detected: ${attackId}`,
      description: `Attack ID: ${attackId}\nSeverity: ${severity}\nSource IP: ${sourceIp}\n\n${description}`,
      urgency: this.mapSeverityToUrgency(severity),
      impact: this.mapSeverityToImpact(severity),
      category: "Security",
      subcategory: "DDoS Attack",
      assignment_group: "Security Team",
      tags: "ddos_attack,automated,sentinelflow",
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/now/table/incident`, {
        method: "POST",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const result = data.result;

      return {
        number: result.number,
        sysId: result.sys_id,
        url: `${this.baseUrl}/nav_to.do?uri=incident.do?sys_id=${result.sys_id}`,
        state: result.state,
      };
    } catch (error) {
      console.error("Failed to create ServiceNow incident:", error);
      throw error;
    }
  }

  /**
   * Update incident status
   */
  async updateIncident(sysId: string, state: string, notes: string): Promise<void> {
    const stateMap: Record<string, number> = {
      new: 1,
      in_progress: 2,
      on_hold: 3,
      resolved: 6,
      closed: 7,
    };

    try {
      await fetch(`${this.baseUrl}/api/now/table/incident/${sysId}`, {
        method: "PATCH",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: stateMap[state] || 2,
          work_notes: notes,
        }),
      });
    } catch (error) {
      console.error("Failed to update ServiceNow incident:", error);
      throw error;
    }
  }

  /**
   * Add work note to incident
   */
  async addWorkNote(sysId: string, note: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/now/table/incident/${sysId}`, {
        method: "PATCH",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          work_notes: note,
        }),
      });
    } catch (error) {
      console.error("Failed to add ServiceNow work note:", error);
      throw error;
    }
  }

  /**
   * Escalate incident
   */
  async escalateIncident(sysId: string, assignmentGroup: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/now/table/incident/${sysId}`, {
        method: "PATCH",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_group: assignmentGroup,
          urgency: 1,
          impact: 1,
          work_notes: "Incident escalated due to severity",
        }),
      });
    } catch (error) {
      console.error("Failed to escalate ServiceNow incident:", error);
      throw error;
    }
  }

  private mapSeverityToUrgency(severity: string): number {
    const mapping: Record<string, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return mapping[severity] || 3;
  }

  private mapSeverityToImpact(severity: string): number {
    const mapping: Record<string, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return mapping[severity] || 3;
  }
}

/**
 * Create ServiceNow integration instance
 */
export function createServiceNowIntegration(): ServiceNowIntegration | null {
  const instance = process.env.SERVICENOW_INSTANCE;
  const username = process.env.SERVICENOW_USERNAME;
  const password = process.env.SERVICENOW_PASSWORD;

  if (!instance || !username || !password) {
    console.warn("ServiceNow integration not configured (missing SERVICENOW_INSTANCE, SERVICENOW_USERNAME, or SERVICENOW_PASSWORD)");
    return null;
  }

  return new ServiceNowIntegration({ instance, username, password });
}
