/**
 * Application Metrics Collection
 * Collects and exports metrics for monitoring and alerting
 */

export interface Metrics {
  // API Metrics
  apiRequests: number;
  apiErrors: number;
  apiLatency: number[];

  // Database Metrics
  dbConnections: number;
  dbQueries: number;
  dbErrors: number;
  dbLatency: number[];

  // WebSocket Metrics
  wsConnections: number;
  wsMessages: number;
  wsErrors: number;

  // Attack Metrics
  attacksDetected: number;
  attacksMitigated: number;
  mitigationTime: number[];

  // Webhook Metrics
  webhookDeliveries: number;
  webhookFailures: number;
  webhookRetries: number;

  // System Metrics
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
}

export class MetricsCollector {
  private metrics: Metrics = {
    apiRequests: 0,
    apiErrors: 0,
    apiLatency: [],
    dbConnections: 0,
    dbQueries: 0,
    dbErrors: 0,
    dbLatency: [],
    wsConnections: 0,
    wsMessages: 0,
    wsErrors: 0,
    attacksDetected: 0,
    attacksMitigated: 0,
    mitigationTime: [],
    webhookDeliveries: 0,
    webhookFailures: 0,
    webhookRetries: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    uptime: 0,
  };

  private startTime = Date.now();
  private latencyWindow = 100; // Keep last 100 latency measurements

  /**
   * Record an API request
   */
  recordApiRequest(latency: number, success: boolean): void {
    this.metrics.apiRequests++;
    if (!success) {
      this.metrics.apiErrors++;
    }
    this.recordLatency(this.metrics.apiLatency, latency);
  }

  /**
   * Record a database query
   */
  recordDbQuery(latency: number, success: boolean): void {
    this.metrics.dbQueries++;
    if (!success) {
      this.metrics.dbErrors++;
    }
    this.recordLatency(this.metrics.dbLatency, latency);
  }

  /**
   * Record database connection
   */
  recordDbConnection(count: number): void {
    this.metrics.dbConnections = count;
  }

  /**
   * Record WebSocket connection
   */
  recordWsConnection(connected: boolean): void {
    if (connected) {
      this.metrics.wsConnections++;
    } else if (this.metrics.wsConnections > 0) {
      this.metrics.wsConnections--;
    }
  }

  /**
   * Record WebSocket message
   */
  recordWsMessage(success: boolean): void {
    if (success) {
      this.metrics.wsMessages++;
    } else {
      this.metrics.wsErrors++;
    }
  }

  /**
   * Record attack detection
   */
  recordAttackDetected(): void {
    this.metrics.attacksDetected++;
  }

  /**
   * Record attack mitigation
   */
  recordAttackMitigated(mitigationTime: number): void {
    this.metrics.attacksMitigated++;
    this.recordLatency(this.metrics.mitigationTime, mitigationTime);
  }

  /**
   * Record webhook delivery
   */
  recordWebhookDelivery(success: boolean, retries: number = 0): void {
    if (success) {
      this.metrics.webhookDeliveries++;
    } else {
      this.metrics.webhookFailures++;
    }
    this.metrics.webhookRetries += retries;
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics & { timestamp: number } {
    this.recordSystemMetrics();
    return {
      ...this.metrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    apiMetrics: { requests: number; errors: number; errorRate: number; avgLatency: number };
    dbMetrics: { queries: number; errors: number; errorRate: number; avgLatency: number };
    wsMetrics: { connections: number; messages: number; errors: number };
    attackMetrics: { detected: number; mitigated: number; mitigationRate: number; avgTime: number };
    webhookMetrics: { deliveries: number; failures: number; failureRate: number; retries: number };
    systemMetrics: { memoryUsage: number; uptime: number };
  } {
    return {
      apiMetrics: {
        requests: this.metrics.apiRequests,
        errors: this.metrics.apiErrors,
        errorRate: this.metrics.apiRequests > 0 ? (this.metrics.apiErrors / this.metrics.apiRequests) * 100 : 0,
        avgLatency: this.getAverageLatency(this.metrics.apiLatency),
      },
      dbMetrics: {
        queries: this.metrics.dbQueries,
        errors: this.metrics.dbErrors,
        errorRate: this.metrics.dbQueries > 0 ? (this.metrics.dbErrors / this.metrics.dbQueries) * 100 : 0,
        avgLatency: this.getAverageLatency(this.metrics.dbLatency),
      },
      wsMetrics: {
        connections: this.metrics.wsConnections,
        messages: this.metrics.wsMessages,
        errors: this.metrics.wsErrors,
      },
      attackMetrics: {
        detected: this.metrics.attacksDetected,
        mitigated: this.metrics.attacksMitigated,
        mitigationRate: this.metrics.attacksDetected > 0 ? (this.metrics.attacksMitigated / this.metrics.attacksDetected) * 100 : 0,
        avgTime: this.getAverageLatency(this.metrics.mitigationTime),
      },
      webhookMetrics: {
        deliveries: this.metrics.webhookDeliveries,
        failures: this.metrics.webhookFailures,
        failureRate: this.metrics.webhookDeliveries + this.metrics.webhookFailures > 0 ? (this.metrics.webhookFailures / (this.metrics.webhookDeliveries + this.metrics.webhookFailures)) * 100 : 0,
        retries: this.metrics.webhookRetries,
      },
      systemMetrics: {
        memoryUsage: this.metrics.memoryUsage,
        uptime: this.metrics.uptime,
      },
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      apiRequests: 0,
      apiErrors: 0,
      apiLatency: [],
      dbConnections: 0,
      dbQueries: 0,
      dbErrors: 0,
      dbLatency: [],
      wsConnections: 0,
      wsMessages: 0,
      wsErrors: 0,
      attacksDetected: 0,
      attacksMitigated: 0,
      mitigationTime: [],
      webhookDeliveries: 0,
      webhookFailures: 0,
      webhookRetries: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      uptime: 0,
    };
    this.startTime = Date.now();
  }

  /**
   * Helper: Record latency measurement
   */
  private recordLatency(latencies: number[], latency: number): void {
    latencies.push(latency);
    if (latencies.length > this.latencyWindow) {
      latencies.shift();
    }
  }

  /**
   * Helper: Calculate average latency
   */
  private getAverageLatency(latencies: number[]): number {
    if (latencies.length === 0) return 0;
    const sum = latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / latencies.length);
  }
}

// Global metrics collector instance
let metricsCollector: MetricsCollector | null = null;

/**
 * Get or create the global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}
