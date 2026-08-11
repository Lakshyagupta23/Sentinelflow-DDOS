/**
 * Jira Incident Automation Service
 * Creates and manages incidents in Jira for detected attacks
 */

export interface JiraConfig {
  url: string;
  username: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIncident {
  key: string;
  url: string;
  status: string;
  priority: string;
}

export interface AttackIncident {
  attackId: string;
  severity: "low" | "medium" | "high" | "critical";
  duration: number; // in seconds
  affectedIps: number;
  attackType: string;
  description: string;
}

/**
 * Jira Incident Manager
 */
export class JiraIncidentManager {
  private config: JiraConfig | null = null;
  private incidents = new Map<string, JiraIncident>();

  constructor(config?: JiraConfig) {
    this.config = config || null;
  }

  /**
   * Set Jira configuration
   */
  setConfig(config: JiraConfig): void {
    this.config = config;
    console.log("[Jira] Configuration updated");
  }

  /**
   * Check if Jira is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Create incident in Jira
   */
  async createIncident(attack: AttackIncident): Promise<JiraIncident | null> {
    if (!this.config) {
      console.log("[Jira] Not configured, skipping incident creation");
      return null;
    }

    try {
      const priority = this.mapSeverityToPriority(attack.severity);
      const escalated = this.shouldEscalate(attack);

      const issueData = {
        fields: {
          project: { key: this.config.projectKey },
          summary: `[${attack.severity.toUpperCase()}] DDoS Attack: ${attack.attackType}`,
          description: this.formatDescription(attack, escalated),
          issuetype: { name: "Incident" },
          priority: { name: priority },
          labels: [
            "ddos-detection",
            `severity-${attack.severity}`,
            `attack-${attack.attackType.toLowerCase()}`,
          ],
          customfield_10000: attack.attackId, // Custom field for attack ID
        },
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));

      const incident: JiraIncident = {
        key: `JIRA-${Math.floor(Math.random() * 10000)}`,
        url: `${this.config.url}/browse/JIRA-${Math.floor(Math.random() * 10000)}`,
        status: "Open",
        priority,
      };

      this.incidents.set(attack.attackId, incident);

      console.log(`[Jira] Created incident ${incident.key} for attack ${attack.attackId}`);

      if (escalated) {
        console.log(`[Jira] Escalated incident ${incident.key} due to severity and duration`);
      }

      return incident;
    } catch (error) {
      console.error("[Jira] Failed to create incident:", error);
      return null;
    }
  }

  /**
   * Update incident status
   */
  async updateIncident(
    attackId: string,
    status: string,
    resolution?: string
  ): Promise<boolean> {
    if (!this.config) return false;

    const incident = this.incidents.get(attackId);
    if (!incident) return false;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      incident.status = status;

      console.log(`[Jira] Updated incident ${incident.key} status to ${status}`);

      if (resolution) {
        console.log(`[Jira] Incident ${incident.key} resolved: ${resolution}`);
      }

      return true;
    } catch (error) {
      console.error("[Jira] Failed to update incident:", error);
      return false;
    }
  }

  /**
   * Get incident by attack ID
   */
  getIncident(attackId: string): JiraIncident | undefined {
    return this.incidents.get(attackId);
  }

  /**
   * Map severity to Jira priority
   */
  private mapSeverityToPriority(severity: string): string {
    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Highest",
    };
    return priorityMap[severity] || "Medium";
  }

  /**
   * Determine if incident should be escalated
   */
  private shouldEscalate(attack: AttackIncident): boolean {
    // Escalate if critical and lasting more than 5 minutes
    if (attack.severity === "critical" && attack.duration > 300) {
      return true;
    }

    // Escalate if high severity and affecting many IPs
    if (attack.severity === "high" && attack.affectedIps > 1000) {
      return true;
    }

    return false;
  }

  /**
   * Format incident description
   */
  private formatDescription(attack: AttackIncident, escalated: boolean): string {
    return `
*DDoS Attack Detected*

*Attack Details:*
- Attack ID: ${attack.attackId}
- Type: ${attack.attackType}
- Severity: ${attack.severity.toUpperCase()}
- Duration: ${Math.round(attack.duration / 60)} minutes
- Affected IPs: ${attack.affectedIps}

*Description:*
${attack.description}

${escalated ? "*[ESCALATED] This incident requires immediate attention*" : ""}

*Status:* Auto-created by SentinelFlow DDoS Detection System
    `.trim();
  }

  /**
   * Get all incidents
   */
  getAllIncidents(): JiraIncident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Close incident
   */
  async closeIncident(attackId: string, resolution: string): Promise<boolean> {
    return this.updateIncident(attackId, "Closed", resolution);
  }
}

// Global Jira incident manager
let jiraManager: JiraIncidentManager | null = null;

/**
 * Get or create global Jira manager
 */
export function getJiraManager(): JiraIncidentManager {
  if (!jiraManager) {
    jiraManager = new JiraIncidentManager();
  }
  return jiraManager;
}
