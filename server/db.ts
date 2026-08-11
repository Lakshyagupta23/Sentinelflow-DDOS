import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, attacks, trafficMetrics, alerts, mitigationRules, alertConfigs, auditLogsExtended, topAttackVectors } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Attack Queries ============

export async function getRecentAttacks(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(attacks)
    .orderBy(desc(attacks.startTime))
    .limit(limit);
}

export async function getOngoingAttacks() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(attacks)
    .where(eq(attacks.status, "ongoing"))
    .orderBy(desc(attacks.startTime));
}

export async function getAttackById(attackId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(attacks)
    .where(eq(attacks.attackId, attackId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function createAttack(attack: typeof attacks.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(attacks).values(attack);
  return result;
}

export async function updateAttackStatus(attackId: string, status: "ongoing" | "mitigated" | "resolved") {
  const db = await getDb();
  if (!db) return null;
  
  return await db
    .update(attacks)
    .set({ status, updatedAt: new Date() })
    .where(eq(attacks.attackId, attackId));
}

// ============ Traffic Metrics Queries ============

export async function getRecentTrafficMetrics(limit: number = 60) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(trafficMetrics)
    .orderBy(desc(trafficMetrics.timestamp))
    .limit(limit);
}

export async function getTrafficMetricsInRange(startTime: Date, endTime: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(trafficMetrics)
    .where(and(
      gte(trafficMetrics.timestamp, startTime),
      lte(trafficMetrics.timestamp, endTime)
    ))
    .orderBy(trafficMetrics.timestamp);
}

export async function createTrafficMetric(metric: typeof trafficMetrics.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(trafficMetrics).values(metric);
}

// ============ Alert Queries ============

export async function getRecentAlerts(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(alerts)
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

export async function getUnreadAlerts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.isRead, false))
    .orderBy(desc(alerts.createdAt));
}

export async function createAlert(alert: typeof alerts.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(alerts).values(alert);
}

export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) return null;
  
  return await db
    .update(alerts)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(alerts.id, alertId));
}

// ============ Mitigation Rules Queries ============

export async function getActiveMitigationRules() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(mitigationRules)
    .where(eq(mitigationRules.isActive, true));
}

export async function createMitigationRule(rule: typeof mitigationRules.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(mitigationRules).values(rule);
}

export async function toggleMitigationRule(ruleId: string, isActive: boolean) {
  const db = await getDb();
  if (!db) return null;
  
  return await db
    .update(mitigationRules)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(mitigationRules.ruleId, ruleId));
}

// ============ Alert Config Queries ============

export async function getUserAlertConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(alertConfigs)
    .where(eq(alertConfigs.userId, userId));
}

export async function createAlertConfig(config: typeof alertConfigs.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(alertConfigs).values(config);
}

// ============ Audit Log Queries ============

export async function getRecentAuditLogs(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(auditLogsExtended)
    .orderBy(desc(auditLogsExtended.createdAt))
    .limit(limit);
}

export async function createAuditLog(log: typeof auditLogsExtended.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(auditLogsExtended).values(log);
}

// ============ Top Attack Vectors Queries ============

export async function getTopAttackVectors(vectorType: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(topAttackVectors)
    .where(eq(topAttackVectors.vectorType, vectorType as any))
    .orderBy(desc(topAttackVectors.count))
    .limit(limit);
}

export async function createTopAttackVector(vector: typeof topAttackVectors.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(topAttackVectors).values(vector);
}

// ============ Statistics Queries ============

export async function getAttackStatistics(days: number = 30) {
  const db = await getDb();
  if (!db) return { total: 0, byType: {}, bySeverity: {} };
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const results = await db
    .select({
      type: attacks.type,
      severity: attacks.severity,
      count: sql<number>`COUNT(*)`
    })
    .from(attacks)
    .where(gte(attacks.startTime, startDate))
    .groupBy(attacks.type, attacks.severity);
  
  return results;
}
