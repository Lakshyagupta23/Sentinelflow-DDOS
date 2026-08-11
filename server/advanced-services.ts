import { eq, and, or } from "drizzle-orm";
import { getDb } from "./db";
import { alertRules, threatIntelligence, notifications } from "../drizzle/schema";
import { nanoid } from "nanoid";

// ============ Alert Rules Management ============

export async function createAlertRule(input: {
  organizationId: number;
  name: string;
  description?: string;
  conditions: Array<{
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains" | "in";
    value: any;
  }>;
  logicalOperator: "AND" | "OR";
  actions: Array<{
    type: "email" | "slack" | "webhook" | "sms";
    target: string;
  }>;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ruleId = `rule_${nanoid(12)}`;
  await db.insert(alertRules).values({
    ruleId,
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    conditions: input.conditions as any,
    logicalOperator: input.logicalOperator,
    actions: input.actions as any,
    createdBy: input.createdBy,
    isActive: true,
  });

  return { ruleId, ...input };
}

export async function getAlertRulesByOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.organizationId, organizationId));
}

export async function updateAlertRule(ruleId: string, updates: Partial<typeof alertRules.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(alertRules).set(updates).where(eq(alertRules.ruleId, ruleId));
  return { ruleId, ...updates };
}

export async function deleteAlertRule(ruleId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(alertRules).where(eq(alertRules.ruleId, ruleId));
  return { success: true };
}

export async function evaluateAlertRule(
  rule: typeof alertRules.$inferSelect,
  attackData: Record<string, any>
): Promise<boolean> {
  const conditions = rule.conditions as Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  const results = conditions.map((condition) => {
    const fieldValue = attackData[condition.field];

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "greater_than":
        return fieldValue > condition.value;
      case "less_than":
        return fieldValue < condition.value;
      case "contains":
        return String(fieldValue).includes(String(condition.value));
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  });

  if (rule.logicalOperator === "AND") {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

// ============ Threat Intelligence Management ============

export async function createThreatIntelligence(input: {
  sourceIp: string;
  reputation: "malicious" | "suspicious" | "clean";
  threatLevel: "critical" | "high" | "medium" | "low";
  threatType?: string;
  threatActor?: string;
  knownBotnets?: string[];
  vulnerabilities?: string[];
  source?: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const threatId = `threat_${nanoid(12)}`;
  await db.insert(threatIntelligence).values({
    threatId,
    sourceIp: input.sourceIp,
    reputation: input.reputation,
    threatLevel: input.threatLevel,
    threatType: input.threatType,
    threatActor: input.threatActor,
    knownBotnets: input.knownBotnets as any,
    vulnerabilities: input.vulnerabilities as any,
    source: input.source,
    metadata: input.metadata as any,
    lastSeen: new Date(),
  });

  return { threatId, ...input };
}

export async function getThreatIntelligenceByIp(sourceIp: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check database cache first
  const result = await db
    .select()
    .from(threatIntelligence)
    .where(eq(threatIntelligence.sourceIp, sourceIp))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Query external APIs if not cached
  try {
    const { enrichThreatIntelligence: enrichExternal } = await import("./external-threat-intel");
    const enriched = await enrichExternal(sourceIp);

    // Store in database
    await db.insert(threatIntelligence).values({
      threatId: `threat_${Date.now()}`,
      sourceIp: enriched.ip,
      reputation: enriched.reputation,
      threatLevel: enriched.threatLevel,
      threatType: enriched.threatType,
      threatActor: enriched.threatActor,
      knownBotnets: enriched.knownBotnets as any,
      source: enriched.sources?.join(", "),
      metadata: { sources: enriched.sources } as any,
      lastSeen: new Date(),
    });

    return enriched as any;
  } catch (error) {
    console.error("Error enriching threat intelligence:", error);
    // Return a clean entry if enrichment fails
    return {
      threatId: `threat_${Date.now()}`,
      sourceIp,
      reputation: "clean" as const,
      threatLevel: "low" as const,
      source: "fallback",
      lastSeen: new Date(),
    };
  }
}

export async function getMaliciousIps(limit = 100) {
  try {
    const { getMaliciousIpsFromFeeds } = await import("./external-threat-intel");
    const maliciousIps = await getMaliciousIpsFromFeeds();

    // Enrich each IP with threat intelligence
    const results = [];
    for (const ip of maliciousIps.slice(0, limit)) {
      try {
        const intel = await getThreatIntelligenceByIp(ip);
        results.push(intel);
      } catch (error) {
        console.error(`Error enriching IP ${ip}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error("Error getting malicious IPs:", error);
    // Fallback to database
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(threatIntelligence)
      .where(eq(threatIntelligence.reputation, "malicious"))
      .limit(limit);
  }
}

export async function updateThreatIntelligence(threatId: string, lastSeen: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(threatIntelligence)
    .set({ lastSeen })
    .where(eq(threatIntelligence.threatId, threatId));

  return { threatId, lastSeen };
}

// ============ Notifications Management ============

export async function createNotification(input: {
  userId: number;
  organizationId: number;
  type: "attack_detected" | "alert_triggered" | "playbook_executed" | "threat_detected";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  relatedAttackId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const notificationId = `notif_${nanoid(12)}`;
  await db.insert(notifications).values({
    notificationId,
    userId: input.userId,
    organizationId: input.organizationId,
    type: input.type,
    title: input.title,
    message: input.message,
    severity: input.severity,
    relatedAttackId: input.relatedAttackId,
    isRead: false,
  });

  return { notificationId, ...input };
}

export async function getUserNotifications(userId: number, organizationId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, organizationId)
      )
    )
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

export async function getUnreadNotifications(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, organizationId),
        eq(notifications.isRead, false)
      )
    );
}

export async function markNotificationAsRead(notificationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.notificationId, notificationId));

  return { notificationId, isRead: true };
}

export async function markAllNotificationsAsRead(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, organizationId),
        eq(notifications.isRead, false)
      )
    );

  return { success: true };
}

// ============ Threat Intelligence API Integration ============

export async function enrichThreatIntelligence(sourceIp: string) {
  // This would integrate with external APIs like AlienVault OTX, Shodan, etc.
  // For now, returning a placeholder structure
  const existingThreat = await getThreatIntelligenceByIp(sourceIp);

  if (existingThreat) {
    return existingThreat;
  }

  // In production, call external APIs here
  // const otxData = await fetchFromOTX(sourceIp);
  // const shodanData = await fetchFromShodan(sourceIp);

  // For demo, create a basic entry
  const threatData = await createThreatIntelligence({
    sourceIp,
    reputation: "clean",
    threatLevel: "low",
    source: "internal",
    metadata: {
      lastChecked: new Date().toISOString(),
      source: "internal_scan",
    },
  });

  return threatData;
}
