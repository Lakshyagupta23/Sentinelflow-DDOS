import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "security_analyst", "devops_sre", "it_manager"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// DDoS Attacks table
export const attacks = mysqlTable("attacks", {
  id: int("id").autoincrement().primaryKey(),
  attackId: varchar("attackId", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["volumetric", "protocol", "application_layer"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  status: mysqlEnum("status", ["ongoing", "mitigated", "resolved"]).default("ongoing").notNull(),
  sourceIp: varchar("sourceIp", { length: 45 }),
  destinationUrl: text("destinationUrl"),
  peakTraffic: decimal("peakTraffic", { precision: 15, scale: 2 }),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  duration: int("duration"), // in seconds
  mitigationStatus: varchar("mitigationStatus", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attack = typeof attacks.$inferSelect;
export type InsertAttack = typeof attacks.$inferInsert;

// Traffic Metrics table
export const trafficMetrics = mysqlTable("traffic_metrics", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  trafficVolume: decimal("trafficVolume", { precision: 15, scale: 2 }).notNull(),
  requestRate: decimal("requestRate", { precision: 15, scale: 2 }).notNull(),
  protocolBreakdown: json("protocolBreakdown").notNull(), // {"http": 50, "https": 45, "other": 5}
  sourceCountry: varchar("sourceCountry", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrafficMetric = typeof trafficMetrics.$inferSelect;
export type InsertTrafficMetric = typeof trafficMetrics.$inferInsert;

// Alerts table
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  alertId: varchar("alertId", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["traffic_spike", "anomaly", "attack_detected", "threshold_exceeded"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  attackId: int("attackId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Mitigation Rules table
export const mitigationRules = mysqlTable("mitigation_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: varchar("ruleId", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["ip_block", "rate_limit", "captcha_challenge", "geo_block"]).notNull(),
  target: varchar("target", { length: 255 }).notNull(), // IP, URL, or country code
  isActive: boolean("isActive").default(true).notNull(),
  threshold: int("threshold"), // for rate limiting
  duration: int("duration"), // in seconds
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MitigationRule = typeof mitigationRules.$inferSelect;
export type InsertMitigationRule = typeof mitigationRules.$inferInsert;

// Alert Configuration table
export const alertConfigs = mysqlTable("alert_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(),
  notificationChannels: json("notificationChannels").notNull(), // ["email", "slack", "webhook"]
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertConfig = typeof alertConfigs.$inferSelect;
export type InsertAlertConfig = typeof alertConfigs.$inferInsert;

// Audit Logs table (extended with more fields)
export const auditLogsExtended = mysqlTable("audit_logs_extended", {
  id: int("id").autoincrement().primaryKey(),
  logId: varchar("logId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId"),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: varchar("resourceId", { length: 64 }),
  details: json("details"),
  changes: json("changes").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogExtended = typeof auditLogsExtended.$inferSelect;
export type InsertAuditLogExtended = typeof auditLogsExtended.$inferInsert;

// Top Attack Vectors table
export const topAttackVectors = mysqlTable("top_attack_vectors", {
  id: int("id").autoincrement().primaryKey(),
  vectorType: mysqlEnum("vectorType", ["source_ip", "destination_url", "user_agent", "country"]).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  count: int("count").notNull(),
  attackId: int("attackId"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type TopAttackVector = typeof topAttackVectors.$inferSelect;
export type InsertTopAttackVector = typeof topAttackVectors.$inferInsert;

// Organizations table for multi-tenant support
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  orgId: varchar("orgId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId").notNull(),
  logo: varchar("logo", { length: 255 }),
  website: varchar("website", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Organization Members table
export const organizationMembers = mysqlTable("organization_members", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

// Playbooks table for attack simulation and response
export const playbooks = mysqlTable("playbooks", {
  id: int("id").autoincrement().primaryKey(),
  playbookId: varchar("playbookId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  attackType: mysqlEnum("attackType", ["volumetric", "protocol", "application_layer", "custom"]).notNull(),
  steps: json("steps").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = typeof playbooks.$inferInsert;

// Playbook Executions table
export const playbookExecutions = mysqlTable("playbook_executions", {
  id: int("id").autoincrement().primaryKey(),
  executionId: varchar("executionId", { length: 64 }).notNull().unique(),
  playbookId: int("playbookId").notNull(),
  attackId: int("attackId"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  executedBy: int("executedBy").notNull(),
  result: json("result"),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlaybookExecution = typeof playbookExecutions.$inferSelect;
export type InsertPlaybookExecution = typeof playbookExecutions.$inferInsert;


// ============ Alert Rules Table ============
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: varchar("ruleId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  conditions: json("conditions").$type<Array<{
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains" | "in";
    value: any;
  }>>().notNull(),
  logicalOperator: mysqlEnum("logicalOperator", ["AND", "OR"]).default("AND").notNull(),
  actions: json("actions").$type<Array<{
    type: "email" | "slack" | "webhook" | "sms";
    target: string;
  }>>().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

// ============ Threat Intelligence Table ============
export const threatIntelligence = mysqlTable("threat_intelligence", {
  id: int("id").autoincrement().primaryKey(),
  threatId: varchar("threatId", { length: 64 }).notNull().unique(),
  sourceIp: varchar("sourceIp", { length: 45 }).notNull(),
  reputation: mysqlEnum("reputation", ["malicious", "suspicious", "clean"]).notNull(),
  threatLevel: mysqlEnum("threatLevel", ["critical", "high", "medium", "low"]).notNull(),
  threatType: varchar("threatType", { length: 255 }),
  threatActor: varchar("threatActor", { length: 255 }),
  knownBotnets: json("knownBotnets").$type<string[]>(),
  vulnerabilities: json("vulnerabilities").$type<string[]>(),
  lastSeen: timestamp("lastSeen"),
  source: varchar("source", { length: 64 }), // e.g., "otx", "shodan", "internal"
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThreatIntelligence = typeof threatIntelligence.$inferSelect;
export type InsertThreatIntelligence = typeof threatIntelligence.$inferInsert;

// ============ Notifications Table ============
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  notificationId: varchar("notificationId", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  type: mysqlEnum("type", ["attack_detected", "alert_triggered", "playbook_executed", "threat_detected"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedAttackId: varchar("relatedAttackId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


// ============ Webhooks Table ============
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: varchar("webhookId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(), // For HMAC signing
  events: json("events").$type<string[]>().notNull(), // e.g., ["attack_detected", "alert_triggered"]
  isActive: boolean("isActive").default(true).notNull(),
  retryPolicy: json("retryPolicy").$type<{
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  }>().notNull(),
  headers: json("headers").$type<Record<string, string>>(), // Custom headers
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

// ============ Webhook Deliveries Table ============
export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: varchar("deliveryId", { length: 64 }).notNull().unique(),
  webhookId: int("webhookId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  payload: json("payload").$type<Record<string, any>>().notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed", "retrying"]).default("pending").notNull(),
  statusCode: int("statusCode"),
  response: text("response"),
  retryCount: int("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type InsertWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// ============ Teams Table ============
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  teamId: varchar("teamId", { length: 64 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  permissions: json("permissions").$type<string[]>().notNull(), // e.g., ["view_attacks", "manage_rules"]
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ============ Team Members Table ============
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "lead", "admin"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ============ Extended Playbooks Table (for automation) ============
// Note: Basic playbooks table already exists above
// This extends it with automation trigger and action configuration
export const playbookAutomations = mysqlTable("playbook_automations", {
  id: int("id").autoincrement().primaryKey(),
  playbookId: int("playbookId").notNull(),
  trigger: json("trigger").$type<{
    type: "attack_detected" | "alert_triggered" | "threat_detected" | "manual";
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>().notNull(),
  actions: json("actions").$type<Array<{
    id: string;
    type: "notification" | "mitigation" | "webhook" | "slack" | "pagerduty" | "splunk";
    config: Record<string, any>;
    condition?: string;
  }>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlaybookAutomation = typeof playbookAutomations.$inferSelect;
export type InsertPlaybookAutomation = typeof playbookAutomations.$inferInsert;
