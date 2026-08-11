import { getMetricsCollector } from "./metrics";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: number;
  uptime: number;
  checks: {
    api: {
      status: "healthy" | "degraded" | "unhealthy";
      errorRate: number;
      avgLatency: number;
    };
    database: {
      status: "healthy" | "degraded" | "unhealthy";
      connections: number;
      errorRate: number;
      avgLatency: number;
    };
    websocket: {
      status: "healthy" | "degraded" | "unhealthy";
      activeConnections: number;
      errors: number;
    };
    system: {
      status: "healthy" | "degraded" | "unhealthy";
      memoryUsage: number;
      uptime: number;
    };
  };
}

/**
 * Health Check Service
 * Monitors application health and provides status endpoints
 */
export class HealthChecker {
  private thresholds = {
    apiErrorRate: 1, // 1% error rate threshold
    apiLatency: 500, // 500ms latency threshold
    dbErrorRate: 2, // 2% error rate threshold
    dbLatency: 200, // 200ms latency threshold
    memoryUsage: 80, // 80% memory usage threshold
  };

  /**
   * Get overall health status
   */
  getHealthStatus(): HealthStatus {
    const metricsCollector = getMetricsCollector();
    const metrics = metricsCollector.getSummary();

    const apiStatus = this.getApiStatus(metrics);
    const dbStatus = this.getDbStatus(metrics);
    const wsStatus = this.getWsStatus(metrics);
    const systemStatus = this.getSystemStatus(metrics);

    const overallStatus = this.determineOverallStatus([apiStatus, dbStatus, wsStatus, systemStatus]);

    return {
      status: overallStatus,
      timestamp: Date.now(),
      uptime: metrics.systemMetrics.uptime,
      checks: {
        api: {
          status: apiStatus,
          errorRate: metrics.apiMetrics.errorRate,
          avgLatency: metrics.apiMetrics.avgLatency,
        },
        database: {
          status: dbStatus,
          connections: metrics.dbMetrics.queries,
          errorRate: metrics.dbMetrics.errorRate,
          avgLatency: metrics.dbMetrics.avgLatency,
        },
        websocket: {
          status: wsStatus,
          activeConnections: metrics.wsMetrics?.connections || 0,
          errors: metrics.wsMetrics?.errors || 0,
        },
        system: {
          status: systemStatus,
          memoryUsage: metrics.systemMetrics?.memoryUsage || 0,
          uptime: metrics.systemMetrics?.uptime || 0,
        },
      },
    };
  }

  /**
   * Get readiness status (for Kubernetes/load balancers)
   */
  getReadinessStatus(): {
    ready: boolean;
    reason?: string;
  } {
    const health = this.getHealthStatus();

    if (health.status === "unhealthy") {
      return {
        ready: false,
        reason: "Application is unhealthy",
      };
    }

    return {
      ready: true,
    };
  }

  /**
   * Get liveness status (for Kubernetes/load balancers)
   */
  getLivenessStatus(): {
    alive: boolean;
    reason?: string;
  } {
    const health = this.getHealthStatus();

    // Consider unhealthy or degraded as still alive (don't restart)
    // Only restart if completely broken
    if (health.checks.system.status === "unhealthy" && health.checks.system.memoryUsage > 95) {
      return {
        alive: false,
        reason: "Memory usage critical",
      };
    }

    return {
      alive: true,
    };
  }

  /**
   * Helper: Determine API status
   */
  private getApiStatus(metrics: any): "healthy" | "degraded" | "unhealthy" {
    if (metrics.apiMetrics.errorRate > this.thresholds.apiErrorRate) {
      return "unhealthy";
    }
    if (metrics.apiMetrics.avgLatency > this.thresholds.apiLatency) {
      return "degraded";
    }
    return "healthy";
  }

  /**
   * Helper: Determine database status
   */
  private getDbStatus(metrics: any): "healthy" | "degraded" | "unhealthy" {
    if (metrics.dbMetrics.errorRate > this.thresholds.dbErrorRate) {
      return "unhealthy";
    }
    if (metrics.dbMetrics.avgLatency > this.thresholds.dbLatency) {
      return "degraded";
    }
    return "healthy";
  }

  /**
   * Helper: Determine WebSocket status
   */
  private getWsStatus(metrics: any): "healthy" | "degraded" | "unhealthy" {
    if (metrics.wsMetrics?.errors > 10) {
      return "unhealthy";
    }
    if (metrics.wsMetrics?.errors > 5) {
      return "degraded";
    }
    return "healthy";
  }

  /**
   * Helper: Determine system status
   */
  private getSystemStatus(metrics: any): "healthy" | "degraded" | "unhealthy" {
    if ((metrics.systemMetrics?.memoryUsage || 0) > 95) {
      return "unhealthy";
    }
    if ((metrics.systemMetrics?.memoryUsage || 0) > this.thresholds.memoryUsage) {
      return "degraded";
    }
    return "healthy";
  }

  /**
   * Helper: Determine overall status
   */
  private determineOverallStatus(statuses: Array<"healthy" | "degraded" | "unhealthy">): "healthy" | "degraded" | "unhealthy" {
    if (statuses.includes("unhealthy")) {
      return "unhealthy";
    }
    if (statuses.includes("degraded")) {
      return "degraded";
    }
    return "healthy";
  }
}

// Global health checker instance
let healthChecker: HealthChecker | null = null;

/**
 * Get or create the global health checker
 */
export function getHealthChecker(): HealthChecker {
  if (!healthChecker) {
    healthChecker = new HealthChecker();
  }
  return healthChecker;
}
