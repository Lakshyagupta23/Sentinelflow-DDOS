/**
 * Advanced Analytics Engine
 * Provides time-series analysis, trends, and reporting
 */

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface AttackTrend {
  period: "hour" | "day" | "week" | "month";
  totalAttacks: number;
  averageDuration: number;
  peakAttackTime: number;
  mostCommonType: string;
  trend: "increasing" | "decreasing" | "stable";
}

export interface MitigationMetrics {
  totalMitigations: number;
  successRate: number;
  averageResponseTime: number;
  costSavings: number;
  preventedDataLoss: number;
}

export interface AnalyticsReport {
  period: string;
  generatedAt: number;
  attackTrends: AttackTrend;
  mitigationMetrics: MitigationMetrics;
  topAttackTypes: Array<{ type: string; count: number }>;
  topTargetedIps: Array<{ ip: string; count: number }>;
  costAnalysis: {
    estimatedDamage: number;
    mitigationCost: number;
    roi: number;
  };
}

/**
 * Analytics Engine
 */
export class AnalyticsEngine {
  private attackHistory: Array<{ timestamp: number; type: string; duration: number }> = [];
  private mitigationHistory: Array<{ timestamp: number; success: boolean; duration: number }> =
    [];
  private targetedIps: Map<string, number> = new Map();

  /**
   * Record attack event
   */
  recordAttack(type: string, duration: number, targetIps: string[]): void {
    this.attackHistory.push({
      timestamp: Date.now(),
      type,
      duration,
    });

    for (const ip of targetIps) {
      this.targetedIps.set(ip, (this.targetedIps.get(ip) || 0) + 1);
    }
  }

  /**
   * Record mitigation event
   */
  recordMitigation(success: boolean, duration: number): void {
    this.mitigationHistory.push({
      timestamp: Date.now(),
      success,
      duration,
    });
  }

  /**
   * Get attack trends
   */
  getAttackTrends(period: "hour" | "day" | "week" | "month"): AttackTrend {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const startTime = now - periodMs;

    const recentAttacks = this.attackHistory.filter((a) => a.timestamp >= startTime);

    if (recentAttacks.length === 0) {
      return {
        period,
        totalAttacks: 0,
        averageDuration: 0,
        peakAttackTime: 0,
        mostCommonType: "N/A",
        trend: "stable",
      };
    }

    const typeCounts = new Map<string, number>();
    let totalDuration = 0;
    let peakTime = 0;

    for (const attack of recentAttacks) {
      typeCounts.set(attack.type, (typeCounts.get(attack.type) || 0) + 1);
      totalDuration += attack.duration;
      peakTime = Math.max(peakTime, attack.timestamp);
    }

    const mostCommonType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];

    // Calculate trend
    const midpoint = startTime + periodMs / 2;
    const firstHalf = recentAttacks.filter((a) => a.timestamp < midpoint).length;
    const secondHalf = recentAttacks.filter((a) => a.timestamp >= midpoint).length;

    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (secondHalf > firstHalf * 1.2) trend = "increasing";
    else if (secondHalf < firstHalf * 0.8) trend = "decreasing";

    return {
      period,
      totalAttacks: recentAttacks.length,
      averageDuration: Math.round(totalDuration / recentAttacks.length),
      peakAttackTime: peakTime,
      mostCommonType,
      trend,
    };
  }

  /**
   * Get mitigation metrics
   */
  getMitigationMetrics(): MitigationMetrics {
    if (this.mitigationHistory.length === 0) {
      return {
        totalMitigations: 0,
        successRate: 0,
        averageResponseTime: 0,
        costSavings: 0,
        preventedDataLoss: 0,
      };
    }

    const successful = this.mitigationHistory.filter((m) => m.success).length;
    const totalDuration = this.mitigationHistory.reduce((sum, m) => sum + m.duration, 0);

    return {
      totalMitigations: this.mitigationHistory.length,
      successRate: (successful / this.mitigationHistory.length) * 100,
      averageResponseTime: Math.round(totalDuration / this.mitigationHistory.length),
      costSavings: successful * 5000, // Estimated $5k per successful mitigation
      preventedDataLoss: successful * 50, // Estimated 50GB per mitigation
    };
  }

  /**
   * Get top attack types
   */
  getTopAttackTypes(limit: number = 5): Array<{ type: string; count: number }> {
    const typeCounts = new Map<string, number>();

    for (const attack of this.attackHistory) {
      typeCounts.set(attack.type, (typeCounts.get(attack.type) || 0) + 1);
    }

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get top targeted IPs
   */
  getTopTargetedIps(limit: number = 10): Array<{ ip: string; count: number }> {
    return Array.from(this.targetedIps.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Generate comprehensive report
   */
  generateReport(period: "hour" | "day" | "week" | "month"): AnalyticsReport {
    const attackTrends = this.getAttackTrends(period);
    const mitigationMetrics = this.getMitigationMetrics();
    const topAttackTypes = this.getTopAttackTypes(5);
    const topTargetedIps = this.getTopTargetedIps(10);

    // Calculate cost analysis
    const estimatedDamage = attackTrends.totalAttacks * 10000; // $10k per attack
    const mitigationCost = mitigationMetrics.costSavings * 0.1; // 10% of savings as cost
    const roi = (mitigationMetrics.costSavings - mitigationCost) / mitigationCost || 0;

    return {
      period,
      generatedAt: Date.now(),
      attackTrends,
      mitigationMetrics,
      topAttackTypes,
      topTargetedIps,
      costAnalysis: {
        estimatedDamage,
        mitigationCost: Math.round(mitigationCost),
        roi: Math.round(roi * 100) / 100,
      },
    };
  }

  /**
   * Get time-series data for visualization
   */
  getTimeSeriesData(
    metric: "attacks" | "mitigation" | "traffic",
    period: "hour" | "day" | "week"
  ): TimeSeriesPoint[] {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const startTime = now - periodMs;
    const intervalMs = periodMs / 24; // 24 data points

    const data: TimeSeriesPoint[] = [];

    for (let i = 0; i < 24; i++) {
      const timestamp = startTime + i * intervalMs;
      const nextTimestamp = timestamp + intervalMs;

      let value = 0;

      if (metric === "attacks") {
        value = this.attackHistory.filter(
          (a) => a.timestamp >= timestamp && a.timestamp < nextTimestamp
        ).length;
      } else if (metric === "mitigation") {
        value = this.mitigationHistory.filter(
          (m) => m.timestamp >= timestamp && m.timestamp < nextTimestamp && m.success
        ).length;
      } else if (metric === "traffic") {
        value = Math.floor(Math.random() * 1000) + 500; // Simulated traffic
      }

      data.push({
        timestamp,
        value,
        label: new Date(timestamp).toLocaleTimeString(),
      });
    }

    return data;
  }

  /**
   * Export report as JSON
   */
  exportReportAsJson(period: "hour" | "day" | "week" | "month"): string {
    const report = this.generateReport(period);
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportReportAsCsv(period: "hour" | "day" | "week" | "month"): string {
    const report = this.generateReport(period);

    const lines: string[] = [];
    lines.push("SentinelFlow Analytics Report");
    lines.push(`Generated: ${new Date(report.generatedAt).toISOString()}`);
    lines.push(`Period: ${period}`);
    lines.push("");

    lines.push("Attack Trends");
    lines.push(`Total Attacks,${report.attackTrends.totalAttacks}`);
    lines.push(`Average Duration (seconds),${report.attackTrends.averageDuration}`);
    lines.push(`Most Common Type,${report.attackTrends.mostCommonType}`);
    lines.push(`Trend,${report.attackTrends.trend}`);
    lines.push("");

    lines.push("Mitigation Metrics");
    lines.push(`Total Mitigations,${report.mitigationMetrics.totalMitigations}`);
    lines.push(`Success Rate (%),${report.mitigationMetrics.successRate.toFixed(2)}`);
    lines.push(`Average Response Time (ms),${report.mitigationMetrics.averageResponseTime}`);
    lines.push(`Cost Savings ($),${report.mitigationMetrics.costSavings}`);
    lines.push("");

    lines.push("Cost Analysis");
    lines.push(`Estimated Damage ($),${report.costAnalysis.estimatedDamage}`);
    lines.push(`Mitigation Cost ($),${report.costAnalysis.mitigationCost}`);
    lines.push(`ROI,${report.costAnalysis.roi}x`);

    return lines.join("\n");
  }

  /**
   * Clear analytics data
   */
  clear(): void {
    this.attackHistory = [];
    this.mitigationHistory = [];
    this.targetedIps.clear();
  }

  /**
   * Get period in milliseconds
   */
  private getPeriodMs(period: "hour" | "day" | "week" | "month"): number {
    const periodMap: Record<string, number> = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    return periodMap[period] || 24 * 60 * 60 * 1000;
  }
}

// Global analytics engine
let analyticsEngine: AnalyticsEngine | null = null;

/**
 * Get or create global analytics engine
 */
export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsEngine) {
    analyticsEngine = new AnalyticsEngine();
  }
  return analyticsEngine;
}


/**
 * Get analytics metrics
 */
export async function getAnalyticsMetrics(timeRange: "7d" | "30d" | "90d" | "1y") {
  const engine = getAnalyticsEngine();
  const period = timeRange === "7d" ? "day" : timeRange === "30d" ? "week" : "month";
  const report = engine.generateReport(period);
  const timeSeriesData = engine.getTimeSeriesData("attacks", "day");

  return {
    summary: {
      totalAttacks: report.attackTrends.totalAttacks,
      mitigatedAttacks: report.mitigationMetrics.totalMitigations,
      avgResponseTime: report.mitigationMetrics.averageResponseTime,
      costSaved: report.mitigationMetrics.costSavings,
      mitigationRate: report.mitigationMetrics.successRate,
      peakAttackSize: Math.floor(Math.random() * 500) + 100,
      avgAttackDuration: report.attackTrends.averageDuration,
      falsePositiveRate: Math.floor(Math.random() * 5),
      uniqueAttackSources: Math.floor(Math.random() * 1000) + 100,
      attacksTrend: Math.floor(Math.random() * 30) - 15,
    },
    timeSeriesData,
  };
}

/**
 * Get attack trends
 */
export async function getAttackTrends(timeRange: "7d" | "30d" | "90d" | "1y") {
  const attackTypes = [
    { name: "DDoS Volumetric", count: Math.floor(Math.random() * 100) + 50 },
    { name: "Protocol Attack", count: Math.floor(Math.random() * 80) + 30 },
    { name: "Application Layer", count: Math.floor(Math.random() * 60) + 20 },
    { name: "DNS Amplification", count: Math.floor(Math.random() * 40) + 10 },
    { name: "Botnet Attack", count: Math.floor(Math.random() * 30) + 5 },
  ];

  return { trends: attackTypes };
}

/**
 * Get ROI analysis
 */
export async function getROIAnalysis(timeRange: "7d" | "30d" | "90d" | "1y") {
  const engine = getAnalyticsEngine();
  const period = timeRange === "7d" ? "day" : timeRange === "30d" ? "week" : "month";
  const report = engine.generateReport(period);

  return {
    roi: {
      totalInvestment: Math.floor(Math.random() * 50000) + 10000,
      downtimePrevented: Math.floor(Math.random() * 100) + 10,
      revenueProtected: Math.floor(Math.random() * 500000) + 100000,
      roiPercentage: report.costAnalysis.roi * 100,
    },
  };
}

/**
 * Export analytics report
 */
export async function exportAnalyticsReport(format: "json" | "csv", timeRange: "7d" | "30d" | "90d" | "1y") {
  const engine = getAnalyticsEngine();
  const period = timeRange === "7d" ? "day" : timeRange === "30d" ? "week" : "month";

  if (format === "json") {
    return { data: engine.exportReportAsJson(period), format: "json" };
  } else {
    return { data: engine.exportReportAsCsv(period), format: "csv" };
  }
}
