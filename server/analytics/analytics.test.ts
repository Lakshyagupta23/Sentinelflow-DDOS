import { describe, it, expect, beforeEach } from "vitest";
import { AnalyticsEngine, getAnalyticsEngine } from "./analytics-engine";

describe("Advanced Analytics", () => {
  let engine: AnalyticsEngine;

  beforeEach(() => {
    engine = new AnalyticsEngine();
  });

  it("should create analytics engine", () => {
    expect(engine).toBeDefined();
  });

  it("should record attack events", () => {
    engine.recordAttack("SYN Flood", 300, ["192.0.2.1", "192.0.2.2"]);
    engine.recordAttack("UDP Flood", 120, ["192.0.2.3"]);

    const trends = engine.getAttackTrends("hour");
    expect(trends.totalAttacks).toBe(2);
  });

  it("should record mitigation events", () => {
    engine.recordMitigation(true, 50);
    engine.recordMitigation(true, 75);
    engine.recordMitigation(false, 100);

    const metrics = engine.getMitigationMetrics();
    expect(metrics.totalMitigations).toBe(3);
    expect(metrics.successRate).toBeCloseTo(66.67, 0);
  });

  it("should calculate attack trends", () => {
    engine.recordAttack("SYN Flood", 300, ["192.0.2.1"]);
    engine.recordAttack("SYN Flood", 200, ["192.0.2.2"]);
    engine.recordAttack("UDP Flood", 150, ["192.0.2.3"]);

    const trends = engine.getAttackTrends("hour");
    expect(trends.totalAttacks).toBe(3);
    expect(trends.averageDuration).toBeCloseTo(216.67, 0);
    expect(trends.mostCommonType).toBe("SYN Flood");
  });

  it("should calculate mitigation metrics", () => {
    engine.recordMitigation(true, 100);
    engine.recordMitigation(true, 150);
    engine.recordMitigation(true, 200);

    const metrics = engine.getMitigationMetrics();
    expect(metrics.totalMitigations).toBe(3);
    expect(metrics.successRate).toBe(100);
    expect(metrics.averageResponseTime).toBe(150);
    expect(metrics.costSavings).toBe(15000); // 3 * 5000
  });

  it("should get top attack types", () => {
    engine.recordAttack("SYN Flood", 100, ["192.0.2.1"]);
    engine.recordAttack("SYN Flood", 100, ["192.0.2.2"]);
    engine.recordAttack("UDP Flood", 100, ["192.0.2.3"]);
    engine.recordAttack("HTTP Flood", 100, ["192.0.2.4"]);

    const topTypes = engine.getTopAttackTypes(3);
    expect(topTypes.length).toBe(3);
    expect(topTypes[0].type).toBe("SYN Flood");
    expect(topTypes[0].count).toBe(2);
  });

  it("should get top targeted IPs", () => {
    engine.recordAttack("SYN Flood", 100, ["192.0.2.1", "192.0.2.2"]);
    engine.recordAttack("UDP Flood", 100, ["192.0.2.1", "192.0.2.3"]);
    engine.recordAttack("HTTP Flood", 100, ["192.0.2.1"]);

    const topIps = engine.getTopTargetedIps(3);
    expect(topIps[0].ip).toBe("192.0.2.1");
    expect(topIps[0].count).toBe(3);
  });

  it("should generate comprehensive report", () => {
    engine.recordAttack("SYN Flood", 300, ["192.0.2.1"]);
    engine.recordAttack("UDP Flood", 120, ["192.0.2.2"]);
    engine.recordMitigation(true, 100);
    engine.recordMitigation(true, 150);

    const report = engine.generateReport("hour");
    expect(report.period).toBe("hour");
    expect(report.generatedAt).toBeGreaterThan(0);
    expect(report.attackTrends.totalAttacks).toBe(2);
    expect(report.mitigationMetrics.totalMitigations).toBe(2);
    expect(report.costAnalysis.roi).toBeGreaterThan(0);
  });

  it("should get time-series data for attacks", () => {
    engine.recordAttack("SYN Flood", 100, ["192.0.2.1"]);
    engine.recordAttack("UDP Flood", 100, ["192.0.2.2"]);

    const timeSeries = engine.getTimeSeriesData("attacks", "hour");
    expect(timeSeries.length).toBe(24);
    expect(timeSeries[0].timestamp).toBeGreaterThan(0);
    expect(timeSeries[0].value).toBeGreaterThanOrEqual(0);
  });

  it("should get time-series data for mitigation", () => {
    engine.recordMitigation(true, 100);

    const timeSeries = engine.getTimeSeriesData("mitigation", "day");
    expect(timeSeries.length).toBe(24);
    expect(timeSeries[0].label).toBeDefined();
  });

  it("should export report as JSON", () => {
    engine.recordAttack("SYN Flood", 100, ["192.0.2.1"]);
    engine.recordMitigation(true, 50);

    const json = engine.exportReportAsJson("hour");
    const parsed = JSON.parse(json);

    expect(parsed.period).toBe("hour");
    expect(parsed.attackTrends).toBeDefined();
    expect(parsed.mitigationMetrics).toBeDefined();
  });

  it("should export report as CSV", () => {
    engine.recordAttack("SYN Flood", 100, ["192.0.2.1"]);
    engine.recordMitigation(true, 50);

    const csv = engine.exportReportAsCsv("hour");
    expect(csv).toContain("SentinelFlow Analytics Report");
    expect(csv).toContain("Attack Trends");
    expect(csv).toContain("Mitigation Metrics");
    expect(csv).toContain("Cost Analysis");
  });

  it("should clear analytics data", () => {
    engine.recordAttack("SYN Flood", 100, ["192.0.2.1"]);
    engine.recordMitigation(true, 50);

    engine.clear();

    const trends = engine.getAttackTrends("hour");
    expect(trends.totalAttacks).toBe(0);
  });

  it("should get global analytics engine instance", () => {
    const engine1 = getAnalyticsEngine();
    const engine2 = getAnalyticsEngine();
    expect(engine1).toBe(engine2);
  });

  it("should handle empty analytics data", () => {
    const trends = engine.getAttackTrends("hour");
    expect(trends.totalAttacks).toBe(0);
    expect(trends.mostCommonType).toBe("N/A");

    const metrics = engine.getMitigationMetrics();
    expect(metrics.totalMitigations).toBe(0);
  });

  it("should calculate trend direction", () => {
    // Simulate increasing trend
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      engine.recordAttack("SYN Flood", 100, ["192.0.2.1"]);
    }

    const trends = engine.getAttackTrends("hour");
    expect(trends.trend).toMatch(/increasing|stable|decreasing/);
  });
});
