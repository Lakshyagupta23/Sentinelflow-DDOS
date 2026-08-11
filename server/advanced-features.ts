import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { organizations, organizationMembers, playbooks, playbookExecutions, users, attacks, trafficMetrics, alerts } from "../drizzle/schema";
import { nanoid } from "nanoid";

// ============ Organization Management ============

export async function createOrganization(input: {
  name: string;
  description?: string;
  ownerId: number;
  logo?: string;
  website?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orgId = `org_${nanoid(12)}`;
  await db.insert(organizations).values({
    orgId,
    name: input.name,
    description: input.description,
    ownerId: input.ownerId,
    logo: input.logo,
    website: input.website,
  });

  return { orgId, ...input };
}

export async function getOrganizationById(orgId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.orgId, orgId))
    .limit(1);

  return result[0];
}

export async function getUserOrganizations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId));
}

export async function addOrganizationMember(input: {
  organizationId: number;
  userId: number;
  role: "owner" | "admin" | "member";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(organizationMembers).values(input);
  return input;
}

// ============ Playbook Management ============

export async function createPlaybook(input: {
  organizationId: number;
  name: string;
  description?: string;
  attackType: "volumetric" | "protocol" | "application_layer" | "custom";
  steps: Array<{
    action: string;
    description: string;
    parameters?: Record<string, any>;
  }>;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const playbookId = `pb_${nanoid(12)}`;
  await db.insert(playbooks).values({
    playbookId,
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    attackType: input.attackType,
    steps: JSON.stringify(input.steps),
    createdBy: input.createdBy,
  });

  return { playbookId, ...input };
}

export async function getPlaybooksByOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(playbooks)
    .where(and(
      eq(playbooks.organizationId, organizationId),
      eq(playbooks.isActive, true)
    ));
}

export async function getPlaybookById(playbookId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(playbooks)
    .where(eq(playbooks.playbookId, playbookId))
    .limit(1);

  return result[0];
}

// ============ Playbook Execution ============

export async function executePlaybook(input: {
  playbookId: number;
  attackId?: number;
  executedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const executionId = `exec_${nanoid(12)}`;
  const now = new Date();

  await db.insert(playbookExecutions).values({
    executionId,
    playbookId: input.playbookId,
    attackId: input.attackId,
    executedBy: input.executedBy,
    status: "in_progress",
    startTime: now,
    result: JSON.stringify({ steps: [], status: "in_progress" }),
  });

  return { executionId, status: "in_progress", startTime: now };
}

export async function completePlaybookExecution(input: {
  executionId: string;
  status: "completed" | "failed";
  result: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const execution = await db
    .select()
    .from(playbookExecutions)
    .where(eq(playbookExecutions.executionId, input.executionId))
    .limit(1);

  if (!execution[0]) throw new Error("Execution not found");

  const endTime = new Date();
  await db
    .update(playbookExecutions)
    .set({
      status: input.status,
      result: JSON.stringify(input.result),
      endTime,
    })
    .where(eq(playbookExecutions.executionId, input.executionId));

  return { executionId: input.executionId, status: input.status, endTime };
}

export async function getPlaybookExecutionHistory(playbookId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(playbookExecutions)
    .where(eq(playbookExecutions.playbookId, playbookId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

// ============ Pre-built Playbooks ============

export async function createDefaultPlaybooks(organizationId: number, createdBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const defaultPlaybooks = [
    {
      name: "Volumetric Attack Response",
      description: "Automated response for volumetric DDoS attacks",
      attackType: "volumetric" as const,
      steps: [
        {
          action: "enable_rate_limiting",
          description: "Enable aggressive rate limiting on all endpoints",
          parameters: { threshold: 100, window: 60 },
        },
        {
          action: "activate_cdn",
          description: "Activate CDN protection to absorb traffic",
          parameters: { provider: "cloudflare" },
        },
        {
          action: "block_suspicious_ips",
          description: "Block IPs with abnormal traffic patterns",
          parameters: { threshold: 1000 },
        },
        {
          action: "notify_team",
          description: "Send notification to security team",
          parameters: { channels: ["email", "slack"] },
        },
      ],
    },
    {
      name: "Protocol Attack Response",
      description: "Automated response for protocol-based DDoS attacks",
      attackType: "protocol" as const,
      steps: [
        {
          action: "enable_syn_cookies",
          description: "Enable SYN cookie protection",
          parameters: {},
        },
        {
          action: "drop_malformed_packets",
          description: "Drop packets with malformed headers",
          parameters: {},
        },
        {
          action: "enable_connection_limits",
          description: "Limit concurrent connections per IP",
          parameters: { limit: 100 },
        },
        {
          action: "log_attack_vectors",
          description: "Log detailed attack vector information",
          parameters: {},
        },
      ],
    },
    {
      name: "Application Layer Attack Response",
      description: "Automated response for application-layer DDoS attacks",
      attackType: "application_layer" as const,
      steps: [
        {
          action: "enable_captcha",
          description: "Enable CAPTCHA challenges for suspicious requests",
          parameters: { difficulty: "medium" },
        },
        {
          action: "throttle_api_endpoints",
          description: "Throttle API endpoint access",
          parameters: { rps: 10 },
        },
        {
          action: "enable_waf_rules",
          description: "Enable Web Application Firewall rules",
          parameters: { ruleset: "owasp_top_10" },
        },
        {
          action: "cache_responses",
          description: "Enable aggressive response caching",
          parameters: { ttl: 300 },
        },
      ],
    },
  ];

  for (const pb of defaultPlaybooks) {
    await createPlaybook({
      organizationId,
      name: pb.name,
      description: pb.description,
      attackType: pb.attackType,
      steps: pb.steps,
      createdBy,
    });
  }

  return defaultPlaybooks;
}

// ============ Real-Time Updates Polling ============

export async function getRecentAttacks(limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(attacks)
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

export async function getRecentTrafficMetrics(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(trafficMetrics)
    .orderBy((t) => t.timestamp)
    .limit(limit);
}

export async function getRecentAlerts(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(alerts)
    .orderBy((t) => t.createdAt)
    .limit(limit);
}
