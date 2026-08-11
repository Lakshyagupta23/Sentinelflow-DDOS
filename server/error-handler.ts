/**
 * Comprehensive Error Handling & Structured Logging Service
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  requestId?: string;
  userId?: string;
  duration?: number;
}

export class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 10000;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  /**
   * Log message
   */
  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        requestId: context?.requestId,
        userId: context?.userId,
        duration: context?.duration,
      };

      if (error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      }

      this.logs.push(entry);
      this.enforceMaxLogs();

      // Also log to console in development
      if (process.env.NODE_ENV !== "production") {
        console.log(JSON.stringify(entry));
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, error: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: { level?: LogLevel; userId?: string; limit?: number }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.userId) {
      filtered = filtered.filter((log) => log.userId === filter.userId);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get statistics
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const log of this.logs) {
      stats[log.level] = (stats[log.level] || 0) + 1;
    }

    return stats;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private enforceMaxLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!globalLogger) {
    const logLevel = (process.env.LOG_LEVEL || "INFO") as LogLevel;
    globalLogger = new Logger(logLevel);
  }
  return globalLogger;
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Retry with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelayMs: number = 100
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts - 1) {
          const delayMs = initialDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Graceful fallback
   */
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      getLogger().warn("Primary operation failed, using fallback", {}, error as Error);
      return await Promise.resolve(fallback());
    }
  }

  /**
   * Circuit breaker pattern
   */
  static createCircuitBreaker<T>(
    fn: () => Promise<T>,
    failureThreshold: number = 5,
    resetTimeoutMs: number = 60000
  ) {
    let failureCount = 0;
    let isOpen = false;
    let lastFailureTime = 0;

    return async (): Promise<T> => {
      if (isOpen) {
        if (Date.now() - lastFailureTime > resetTimeoutMs) {
          isOpen = false;
          failureCount = 0;
        } else {
          throw new Error("Circuit breaker is open");
        }
      }

      try {
        const result = await fn();
        failureCount = 0;
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();

        if (failureCount >= failureThreshold) {
          isOpen = true;
        }

        throw error;
      }
    };
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Measure operation duration
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric(operationName, duration);
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${operationName}_error`, duration);
      throw error;
    }
  }

  /**
   * Record metric
   */
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift();
    }
  }

  /**
   * Get metrics summary
   */
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [name, values] of this.metrics) {
      if (values.length === 0) continue;

      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return summary;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Global performance monitor
 */
let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}
