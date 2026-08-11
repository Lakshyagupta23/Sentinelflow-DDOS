import axios from "axios";

export interface SplunkEvent {
  time?: number;
  source?: string;
  sourcetype?: string;
  host?: string;
  index?: string;
  event: Record<string, unknown> | string;
}

export interface SplunkIntegrationConfig {
  hecUrl: string;
  hecToken: string;
  index?: string;
  source?: string;
  sourcetype?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Splunk HEC (HTTP Event Collector) Integration Service
 * Sends events to Splunk for indexing and analysis
 */
export class SplunkIntegration {
  private hecUrl: string;
  private hecToken: string;
  private index: string;
  private source: string;
  private sourcetype: string;
  private retryAttempts: number;
  private retryDelayMs: number;

  constructor(config: SplunkIntegrationConfig) {
    this.hecUrl = config.hecUrl;
    this.hecToken = config.hecToken;
    this.index = config.index || "main";
    this.source = config.source || "sentinelflow";
    this.sourcetype = config.sourcetype || "json";
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  /**
   * Send an event to Splunk HEC with retry logic
   */
  async sendEvent(event: SplunkEvent): Promise<boolean> {
    let lastError: Error | null = null;

    const payload = {
      time: event.time || Math.floor(Date.now() / 1000),
      source: event.source || this.source,
      sourcetype: event.sourcetype || this.sourcetype,
      host: event.host || "sentinelflow",
      index: event.index || this.index,
      event: event.event,
    };

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(`${this.hecUrl}/services/collector`, payload, {
          timeout: 10000,
          headers: {
            Authorization: `Splunk ${this.hecToken}`,
            "Content-Type": "application/json",
          },
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200) {
          console.log(`[Splunk] Event sent successfully on attempt ${attempt + 1}`);
          return true;
        } else if (response.status >= 400 && response.status < 500) {
          console.error(`[Splunk] Client error (${response.status}), not retrying`);
          return false;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Splunk] Attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[Splunk] Failed after ${this.retryAttempts} attempts:`, lastError?.message);
    return false;
  }

  /**
   * Send a batch of events to Splunk
   */
  async sendEvents(events: SplunkEvent[]): Promise<number> {
    let successCount = 0;

    for (const event of events) {
      const success = await this.sendEvent(event);
      if (success) {
        successCount++;
      }
    }

    console.log(`[Splunk] Sent ${successCount}/${events.length} events successfully`);
    return successCount;
  }

  /**
   * Send a DDoS attack event to Splunk
   */
  async sendAttackEvent(attackData: {
    attackId: string;
    type: string;
    severity: string;
    sourceIp: string;
    targetIp: string;
    packetRate: number;
    startTime: string;
    protocol?: string;
    port?: number;
  }): Promise<boolean> {
    return this.sendEvent({
      sourcetype: "ddos_attack",
      event: {
        event_type: "ddos_attack_detected",
        attack_id: attackData.attackId,
        attack_type: attackData.type,
        severity: attackData.severity,
        source_ip: attackData.sourceIp,
        target_ip: attackData.targetIp,
        packet_rate: attackData.packetRate,
        protocol: attackData.protocol || "unknown",
        port: attackData.port || 0,
        start_time: attackData.startTime,
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
  }

  /**
   * Send a mitigation event to Splunk
   */
  async sendMitigationEvent(mitigationData: {
    attackId: string;
    status: "started" | "in_progress" | "completed" | "failed";
    rulesApplied: number;
    trafficBlocked: number;
    duration?: number;
  }): Promise<boolean> {
    return this.sendEvent({
      sourcetype: "ddos_mitigation",
      event: {
        event_type: "mitigation_action",
        attack_id: mitigationData.attackId,
        status: mitigationData.status,
        rules_applied: mitigationData.rulesApplied,
        traffic_blocked: mitigationData.trafficBlocked,
        duration_ms: mitigationData.duration || 0,
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
  }

  /**
   * Send a playbook execution event to Splunk
   */
  async sendPlaybookEvent(playbookData: {
    playbookId: string;
    playbookName: string;
    attackId: string;
    status: "started" | "completed" | "failed";
    executionTime: number;
    actionsExecuted: number;
  }): Promise<boolean> {
    return this.sendEvent({
      sourcetype: "playbook_execution",
      event: {
        event_type: "playbook_executed",
        playbook_id: playbookData.playbookId,
        playbook_name: playbookData.playbookName,
        attack_id: playbookData.attackId,
        status: playbookData.status,
        execution_time_ms: playbookData.executionTime,
        actions_executed: playbookData.actionsExecuted,
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
  }

  /**
   * Send a threat intelligence event to Splunk
   */
  async sendThreatIntelEvent(threatData: {
    ipAddress: string;
    reputation: number;
    threatLevel: string;
    sources: string[];
    malware?: string[];
    botnets?: string[];
  }): Promise<boolean> {
    return this.sendEvent({
      sourcetype: "threat_intelligence",
      event: {
        event_type: "threat_intelligence_lookup",
        ip_address: threatData.ipAddress,
        reputation_score: threatData.reputation,
        threat_level: threatData.threatLevel,
        sources: threatData.sources,
        malware: threatData.malware || [],
        botnets: threatData.botnets || [],
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
  }

  /**
   * Send an alert event to Splunk
   */
  async sendAlertEvent(alertData: {
    alertId: string;
    alertName: string;
    severity: string;
    message: string;
    triggeredBy?: string;
  }): Promise<boolean> {
    return this.sendEvent({
      sourcetype: "security_alert",
      event: {
        event_type: "alert_triggered",
        alert_id: alertData.alertId,
        alert_name: alertData.alertName,
        severity: alertData.severity,
        message: alertData.message,
        triggered_by: alertData.triggeredBy || "system",
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
  }
}

/**
 * Create a Splunk integration instance from environment variables
 */
export function createSplunkIntegration(): SplunkIntegration | null {
  const hecUrl = process.env.SPLUNK_HEC_URL;
  const hecToken = process.env.SPLUNK_HEC_TOKEN;

  if (!hecUrl || !hecToken) {
    console.warn("[Splunk] SPLUNK_HEC_URL or SPLUNK_HEC_TOKEN not configured, Splunk integration disabled");
    return null;
  }

  return new SplunkIntegration({
    hecUrl,
    hecToken,
    index: process.env.SPLUNK_INDEX || "main",
    source: process.env.SPLUNK_SOURCE || "sentinelflow",
    sourcetype: process.env.SPLUNK_SOURCETYPE || "json",
    retryAttempts: 3,
    retryDelayMs: 1000,
  });
}
