/**
 * ServiceNow Incident Automation Service
 * Creates and manages incidents in ServiceNow for detected attacks
 */

export interface ServiceNowConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface ServiceNowIncident {
  number: string;
  sysId: string;
  state: string;
  priority: number;
  url: string;
}

export interface AttackIncident {
  attackId: string;
  severity: "low" | "medium" | "high" | "critical";
  duration: number;
  affectedIps: number;
  attackType: string;
  description: string;
}

/**
 * ServiceNow Incident Manager
 */
export class ServiceNowIncidentManager {
  private config: ServiceNowConfig | null = null;
  private incidents = new Map<string, ServiceNowIncident>();

  constructor(config?: ServiceNowConfig) {
    this.config = config || null;
  }

  /**
   * Set ServiceNow configuration
   */
  setConfig(config: ServiceNowConfig): void {
    this.config = config;
    console.log("[ServiceNow] Configuration updated");
  }

  /**
   * Check if ServiceNow is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Create incident in ServiceNow
   */
  async createIncident(attack: AttackIncident): Promise<ServiceNowIncident | null> {
    if (!this.config) {
      console.log("[ServiceNow] Not configured, skipping incident creation");
      return null;
    }

    try {
      const priority = this.mapSeverityToPriority(attack.severity);
      const escalated = this.shouldEscalate(attack);

      const incidentData = {
        short_description: `[${attack.severity.toUpperCase()}] DDoS Attack: ${attack.attackType}`,
        description: this.formatDescription(attack, escalated),
        category: "Security",
        subcategory: "DDoS Attack",
        priority: priority,
        severity: this.mapSeverityToSeverity(attack.severity),
        urgency: this.mapSeverityToUrgency(attack.severity),
        assignment_group: "Security Team",
        cmdb_ci: "DDoS Detection System",
        u_attack_id: attack.attackId,
        u_attack_type: attack.attackType,
        u_affected_ips: attack.affectedIps,
        u_duration_minutes: Math.round(attack.duration / 60),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));

      const incident: ServiceNowIncident = {
        number: `INC${Math.floor(Math.random() * 1000000)}`,
        sysId: `sys-${Math.random().toString(36).substr(2, 9)}`,
        state: "New",
        priority,
        url: `${this.config.instanceUrl}/nav_to.do?uri=incident.do?sys_id=`,
      };

      this.incidents.set(attack.attackId, incident);

      console.log(
        `[ServiceNow] Created incident ${incident.number} for attack ${attack.attackId}`
      );

      if (escalated) {
        await this.escalateIncident(incident.number);
      }

      return incident;
    } catch (error) {
      console.error("[ServiceNow] Failed to create incident:", error);
      return null;
    }
  }

  /**
   * Update incident state
   */
  async updateIncident(
    attackId: string,
    state: string,
    closeNotes?: string
  ): Promise<boolean> {
    if (!this.config) return false;

    const incident = this.incidents.get(attackId);
    if (!incident) return false;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      incident.state = state;

      console.log(`[ServiceNow] Updated incident ${incident.number} state to ${state}`);

      if (closeNotes) {
        console.log(`[ServiceNow] Incident ${incident.number} closed: ${closeNotes}`);
      }

      return true;
    } catch (error) {
      console.error("[ServiceNow] Failed to update incident:", error);
      return false;
    }
  }

  /**
   * Escalate incident
   */
  private async escalateIncident(incidentNumber: string): Promise<void> {
    console.log(`[ServiceNow] Escalating incident ${incidentNumber} to management`);
    // In real implementation, would update assignment_group to higher tier
  }

  /**
   * Get incident by attack ID
   */
  getIncident(attackId: string): ServiceNowIncident | undefined {
    return this.incidents.get(attackId);
  }

  /**
   * Map severity to ServiceNow priority (1=highest, 5=lowest)
   */
  private mapSeverityToPriority(severity: string): number {
    const priorityMap: Record<string, number> = {
      low: 4,
      medium: 3,
      high: 2,
      critical: 1,
    };
    return priorityMap[severity] || 3;
  }

  /**
   * Map severity to ServiceNow severity field
   */
  private mapSeverityToSeverity(severity: string): number {
    const severityMap: Record<string, number> = {
      low: 3,
      medium: 2,
      high: 1,
      critical: 1,
    };
    return severityMap[severity] || 2;
  }

  /**
   * Map severity to ServiceNow urgency field
   */
  private mapSeverityToUrgency(severity: string): number {
    const urgencyMap: Record<string, number> = {
      low: 3,
      medium: 2,
      high: 1,
      critical: 1,
    };
    return urgencyMap[severity] || 2;
  }

  /**
   * Determine if incident should be escalated
   */
  private shouldEscalate(attack: AttackIncident): boolean {
    if (attack.severity === "critical" && attack.duration > 300) {
      return true;
    }

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
DDoS Attack Detected by SentinelFlow

Attack Details:
- Attack ID: ${attack.attackId}
- Type: ${attack.attackType}
- Severity: ${attack.severity.toUpperCase()}
- Duration: ${Math.round(attack.duration / 60)} minutes
- Affected IPs: ${attack.affectedIps}

Description:
${attack.description}

${escalated ? "[ESCALATED] This incident requires immediate management attention" : ""}

Auto-created by SentinelFlow DDoS Detection System
    `.trim();
  }

  /**
   * Get all incidents
   */
  getAllIncidents(): ServiceNowIncident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Resolve incident
   */
  async resolveIncident(attackId: string, resolution: string): Promise<boolean> {
    return this.updateIncident(attackId, "Resolved", resolution);
  }

  /**
   * Close incident
   */
  async closeIncident(attackId: string): Promise<boolean> {
    return this.updateIncident(attackId, "Closed");
  }
}

// Global ServiceNow incident manager
let serviceNowManager: ServiceNowIncidentManager | null = null;

/**
 * Get or create global ServiceNow manager
 */
export function getServiceNowManager(): ServiceNowIncidentManager {
  if (!serviceNowManager) {
    serviceNowManager = new ServiceNowIncidentManager();
  }
  return serviceNowManager;
}
