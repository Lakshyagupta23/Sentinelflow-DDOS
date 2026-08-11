import { describe, it, expect, beforeEach } from "vitest";
import { Logger, LogLevel, ErrorRecovery, PerformanceMonitor, getLogger, getPerformanceMonitor } from "./error-handler";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG);
  });

  it("should log messages at different levels", () => {
    logger.debug("Debug message");
    logger.info("Info message");
    logger.warn("Warn message");
    logger.error("Error message", new Error("Test error"));

    const logs = logger.getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(4);
  });

  it("should filter logs by level", () => {
    logger.debug("Debug");
    logger.info("Info");
    logger.error("Error", new Error("Test"));

    const errors = logger.getLogs({ level: LogLevel.ERROR });
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].level).toBe(LogLevel.ERROR);
  });

  it("should track log statistics", () => {
    logger.info("Info 1");
    logger.info("Info 2");
    logger.error("Error 1", new Error("Test"));

    const stats = logger.getStats();
    expect(stats[LogLevel.INFO]).toBeGreaterThanOrEqual(2);
    expect(stats[LogLevel.ERROR]).toBeGreaterThanOrEqual(1);
  });

  it("should include context in logs", () => {
    const context = { userId: "user123", requestId: "req456" };
    logger.info("User action", context);

    const logs = logger.getLogs({ limit: 1 });
    expect(logs[0].context).toEqual(context);
    expect(logs[0].userId).toBe("user123");
    expect(logs[0].requestId).toBe("req456");
  });

  it("should enforce max logs limit", () => {
    const customLogger = new Logger(LogLevel.DEBUG);
    // Add more logs than max
    for (let i = 0; i < 10100; i++) {
      customLogger.info(`Log ${i}`);
    }

    const logs = customLogger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(10000);
  });

  it("should clear logs", () => {
    logger.info("Message 1");
    logger.info("Message 2");
    expect(logger.getLogs().length).toBeGreaterThan(0);

    logger.clear();
    expect(logger.getLogs().length).toBe(0);
  });
});

describe("ErrorRecovery", () => {
  it("should retry with exponential backoff", async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Temporary failure");
      }
      return "success";
    };

    const result = await ErrorRecovery.retryWithBackoff(fn, 5, 10);
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should fail after max attempts", async () => {
    const fn = async () => {
      throw new Error("Persistent failure");
    };

    try {
      await ErrorRecovery.retryWithBackoff(fn, 2, 10);
      expect.fail("Should have thrown error");
    } catch (error) {
      expect((error as Error).message).toBe("Persistent failure");
    }
  });

  it("should use fallback on primary failure", async () => {
    const primary = async () => {
      throw new Error("Primary failed");
    };

    const fallback = async () => "fallback result";

    const result = await ErrorRecovery.withFallback(primary, fallback);
    expect(result).toBe("fallback result");
  });

  it("should use primary on success", async () => {
    const primary = async () => "primary result";
    const fallback = async () => "fallback result";

    const result = await ErrorRecovery.withFallback(primary, fallback);
    expect(result).toBe("primary result");
  });

  it("should implement circuit breaker pattern", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error("Service unavailable");
    };

    const breaker = ErrorRecovery.createCircuitBreaker(fn, 2, 100);

    // First two calls should fail
    for (let i = 0; i < 2; i++) {
      try {
        await breaker();
      } catch {
        // Expected
      }
    }

    // Third call should fail immediately (circuit open)
    try {
      await breaker();
      expect.fail("Circuit breaker should be open");
    } catch (error) {
      expect((error as Error).message).toBe("Circuit breaker is open");
    }

    expect(callCount).toBe(2);
  });
});

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it("should measure operation duration", async () => {
    const result = await monitor.measure("test-op", async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "result";
    });

    expect(result.result).toBe("result");
    expect(result.duration).toBeGreaterThanOrEqual(10);
  });

  it("should track metrics", async () => {
    await monitor.measure("op1", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return "result1";
    });

    await monitor.measure("op1", async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "result2";
    });

    const metrics = monitor.getMetrics();
    expect(metrics["op1"]).toBeDefined();
    expect(metrics["op1"].count).toBe(2);
    expect(metrics["op1"].avg).toBeGreaterThan(0);
  });

  it("should calculate min/max/avg correctly", async () => {
    for (let i = 0; i < 5; i++) {
      await monitor.measure("op", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5 + i * 3));
        return i;
      });
    }

    const metrics = monitor.getMetrics();
    expect(metrics["op"].count).toBe(5);
    expect(metrics["op"].min).toBeGreaterThan(0);
    expect(metrics["op"].max).toBeGreaterThan(metrics["op"].min);
    expect(metrics["op"].avg).toBeGreaterThan(0);
  });

  it("should clear metrics", async () => {
    await monitor.measure("op", async () => "result");
    expect(Object.keys(monitor.getMetrics()).length).toBeGreaterThan(0);

    monitor.clear();
    expect(Object.keys(monitor.getMetrics()).length).toBe(0);
  });

  it("should handle operation errors", async () => {
    try {
      await monitor.measure("error-op", async () => {
        throw new Error("Operation failed");
      });
    } catch {
      // Expected
    }

    const metrics = monitor.getMetrics();
    expect(metrics["error-op_error"]).toBeDefined();
  });
});

describe("Global instances", () => {
  it("should provide global logger instance", () => {
    const logger1 = getLogger();
    const logger2 = getLogger();
    expect(logger1).toBe(logger2);
  });

  it("should provide global performance monitor instance", () => {
    const monitor1 = getPerformanceMonitor();
    const monitor2 = getPerformanceMonitor();
    expect(monitor1).toBe(monitor2);
  });
});
