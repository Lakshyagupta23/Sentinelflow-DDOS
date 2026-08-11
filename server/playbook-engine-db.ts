import { getDb } from "./db";
import { playbooks, playbookAutomations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface PlaybookRecord {
  id: number;
  playbookId: string;
  organizationId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookAutomationRecord {
  id: number;
  playbookId: number;
  trigger: {
    type: "attack_detected" | "alert_triggered" | "threat_detected" | "manual";
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  actions: Array<{
    id: string;
    type: "notification" | "mitigation" | "webhook" | "slack" | "pagerduty" | "splunk";
    config: Record<string, any>;
    condition?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookExecutionRecord {
  id: string;
  playbookId: number;
  triggeredBy: string;
  eventData: Record<string, any>;
  status: "success" | "failed" | "partial";
  executionLog: Array<{
    actionId: string;
    status: "success" | "failed";
    message: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const executionStore = new Map<string, PlaybookExecutionRecord>();

export async function createPlaybook(
  organizationId: number,
  name: string,
  trigger: PlaybookAutomationRecord["trigger"],
  actions: PlaybookAutomationRecord["actions"],
  createdBy: number,
  description?: string
): Promise<PlaybookRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const playbookId = `pb_${crypto.randomBytes(8).toString("hex")}`;

  await db.insert(playbooks).values({
    playbookId,
    organizationId,
    name,
    description,
    attackType: "custom",
    steps: actions,
    isActive: true,
    createdBy,
  });

  const result = await db
    .select()
    .from(playbooks)
    .where(eq(playbooks.playbookId, playbookId))
    .limit(1);

  if (!result.length) throw new Error("Failed to create playbook");

  const pb = result[0];

  // Create automation configuration
  await db.insert(playbookAutomations).values({
    playbookId: pb.id,
    trigger,
    actions,
  });

  return {
    id: pb.id,
    playbookId: pb.playbookId,
    organizationId: pb.organizationId,
    name: pb.name,
    description: pb.description || undefined,
    isActive: pb.isActive,
    createdBy: pb.createdBy,
    createdAt: pb.createdAt,
    updatedAt: pb.updatedAt,
  };
}

export async function listPlaybooks(organizationId: number): Promise<PlaybookRecord[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(playbooks)
    .where(eq(playbooks.organizationId, organizationId));

  return results.map((pb) => ({
    id: pb.id,
    playbookId: pb.playbookId,
    organizationId: pb.organizationId,
    name: pb.name,
    description: pb.description || undefined,
    isActive: pb.isActive,
    createdBy: pb.createdBy,
    createdAt: pb.createdAt,
    updatedAt: pb.updatedAt,
  }));
}

export async function getPlaybook(playbookId: string): Promise<PlaybookRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(playbooks)
    .where(eq(playbooks.playbookId, playbookId))
    .limit(1);

  if (!result.length) return null;

  const pb = result[0];
  return {
    id: pb.id,
    playbookId: pb.playbookId,
    organizationId: pb.organizationId,
    name: pb.name,
    description: pb.description || undefined,
    isActive: pb.isActive,
    createdBy: pb.createdBy,
    createdAt: pb.createdAt,
    updatedAt: pb.updatedAt,
  };
}

export async function updatePlaybook(
  playbookId: string,
  updates: Partial<PlaybookRecord>
): Promise<PlaybookRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const { id, createdAt, ...updateData } = updates;

  await db
    .update(playbooks)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(playbooks.playbookId, playbookId));

  return getPlaybook(playbookId);
}

export async function deletePlaybook(playbookId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const playbook = await getPlaybook(playbookId);
  if (!playbook) return false;

  await db
    .delete(playbookAutomations)
    .where(eq(playbookAutomations.playbookId, playbook.id));

  await db
    .delete(playbooks)
    .where(eq(playbooks.playbookId, playbookId));

  return true;
}

export function evaluateTrigger(
  trigger: PlaybookAutomationRecord["trigger"],
  eventData: Record<string, any>
): boolean {
  if (!trigger.conditions || trigger.conditions.length === 0) {
    return true;
  }

  return trigger.conditions.every((condition) => {
    const value = eventData[condition.field];

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "greater_than":
        return value > condition.value;
      case "less_than":
        return value < condition.value;
      case "contains":
        return String(value).includes(String(condition.value));
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  });
}

export async function executePlaybook(
  playbookId: string,
  triggeredBy: string,
  eventData: Record<string, any>
): Promise<PlaybookExecutionRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const playbook = await getPlaybook(playbookId);
  if (!playbook) throw new Error("Playbook not found");

  const automationResult = await db
    .select()
    .from(playbookAutomations)
    .where(eq(playbookAutomations.playbookId, playbook.id))
    .limit(1);

  if (!automationResult.length) throw new Error("Playbook automation not found");

  const automation = automationResult[0];

  if (!evaluateTrigger(automation.trigger, eventData)) {
    throw new Error("Trigger conditions not met");
  }

  const executionId = `exec_${crypto.randomBytes(8).toString("hex")}`;
  const executionLog: PlaybookExecutionRecord["executionLog"] = [];

  for (const action of automation.actions) {
    try {
      await executeAction(action, eventData);
      executionLog.push({
        actionId: action.id,
        status: "success",
        message: `${action.type} action executed successfully`,
        timestamp: new Date(),
      });
    } catch (error) {
      executionLog.push({
        actionId: action.id,
        status: "failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });
    }
  }

  const execution: PlaybookExecutionRecord = {
    id: executionId,
    playbookId: playbook.id,
    triggeredBy,
    eventData,
    status: executionLog.every((log) => log.status === "success") ? "success" : "partial",
    executionLog,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  executionStore.set(executionId, execution);
  return execution;
}

async function executeAction(
  action: PlaybookAutomationRecord["actions"][0],
  eventData: Record<string, any>
): Promise<void> {
  switch (action.type) {
    case "notification":
      console.log("[Playbook] Notification:", action.config.message);
      break;

    case "mitigation":
      console.log("[Playbook] Mitigation:", action.config.action, action.config.target);
      break;

    case "webhook":
      if (action.config.url) {
        await fetch(action.config.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
      }
      break;

    case "slack":
      console.log("[Playbook] Slack notification:", action.config.channel);
      break;

    case "pagerduty":
      console.log("[Playbook] PagerDuty incident:", action.config.service);
      break;

    case "splunk":
      console.log("[Playbook] Splunk event:", action.config.index);
      break;

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export function getExecution(executionId: string): PlaybookExecutionRecord | undefined {
  return executionStore.get(executionId);
}

export function listExecutions(playbookId: number): PlaybookExecutionRecord[] {
  return Array.from(executionStore.values()).filter((e) => e.playbookId === playbookId);
}
