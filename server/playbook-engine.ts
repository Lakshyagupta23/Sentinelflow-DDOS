/**
 * Attack Playbook Automation Engine
 * Handles playbook definition, execution, and integration with external tools
 */

export type PlaybookTriggerType = "attack_detected" | "alert_triggered" | "threat_detected" | "manual";
export type PlaybookActionType = "notification" | "mitigation" | "webhook" | "slack" | "pagerduty" | "splunk";

export interface PlaybookCondition {
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains" | "in";
  value: any;
}

export interface PlaybookTrigger {
  type: PlaybookTriggerType;
  conditions?: PlaybookCondition[];
}

export interface PlaybookAction {
  id: string;
  type: PlaybookActionType;
  config: Record<string, any>;
  condition?: string; // Optional conditional logic (e.g., "severity > high")
}

export interface Playbook {
  id: string;
  organizationId: number;
  name: string;
  description?: string;
  trigger: PlaybookTrigger;
  actions: PlaybookAction[];
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookExecutionLog {
  actionId: string;
  status: "pending" | "success" | "failed";
  result?: any;
  error?: string;
  timestamp: string;
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  triggeredBy: string; // attack_id, alert_id, manual, etc.
  status: "pending" | "running" | "success" | "failed" | "partial";
  executionLog: PlaybookExecutionLog[];
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory playbook storage (in production, use database)
const playbooks = new Map<string, Playbook>();
const executions = new Map<string, PlaybookExecution>();

/**
 * Create a new playbook
 */
export function createPlaybook(
  organizationId: number,
  name: string,
  trigger: PlaybookTrigger,
  actions: PlaybookAction[],
  createdBy: number,
  description?: string
): Playbook {
  const id = `pb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const playbook: Playbook = {
    id,
    organizationId,
    name,
    description,
    trigger,
    actions,
    isActive: true,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  playbooks.set(id, playbook);
  return playbook;
}

/**
 * Get playbook by ID
 */
export function getPlaybook(id: string): Playbook | undefined {
  return playbooks.get(id);
}

/**
 * List playbooks for organization
 */
export function listPlaybooks(organizationId: number): Playbook[] {
  return Array.from(playbooks.values()).filter((p) => p.organizationId === organizationId);
}

/**
 * Update playbook
 */
export function updatePlaybook(id: string, updates: Partial<Omit<Playbook, "id" | "createdBy" | "createdAt">>): Playbook | null {
  const playbook = playbooks.get(id);
  if (!playbook) return null;

  const updated = { ...playbook, ...updates, updatedAt: new Date() };
  playbooks.set(id, updated);
  return updated;
}

/**
 * Delete playbook
 */
export function deletePlaybook(id: string): boolean {
  return playbooks.delete(id);
}

/**
 * Check if trigger matches conditions
 */
export function evaluateTrigger(trigger: PlaybookTrigger, eventData: Record<string, any>): boolean {
  if (!trigger.conditions || trigger.conditions.length === 0) {
    return true; // No conditions means always trigger
  }

  return trigger.conditions.every((condition) => evaluateCondition(condition, eventData));
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(condition: PlaybookCondition, data: Record<string, any>): boolean {
  const value = data[condition.field];

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
}

/**
 * Execute playbook
 */
export async function executePlaybook(
  playbookId: string,
  triggeredBy: string,
  eventData: Record<string, any>
): Promise<PlaybookExecution> {
  const playbook = playbooks.get(playbookId);
  if (!playbook) {
    throw new Error(`Playbook not found: ${playbookId}`);
  }

  if (!playbook.isActive) {
    throw new Error(`Playbook is not active: ${playbookId}`);
  }

  // Check trigger conditions
  if (!evaluateTrigger(playbook.trigger, eventData)) {
    throw new Error("Trigger conditions not met");
  }

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const execution: PlaybookExecution = {
    id: executionId,
    playbookId,
    triggeredBy,
    status: "running",
    executionLog: [],
    startedAt: new Date(),
  };

  executions.set(executionId, execution);

  try {
    // Execute all actions
    for (const action of playbook.actions) {
      const log: PlaybookExecutionLog = {
        actionId: action.id,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      try {
        // Check action condition if present
        if (action.condition && !evaluateActionCondition(action.condition, eventData)) {
          log.status = "success";
          log.result = "Condition not met, skipped";
          execution.executionLog.push(log);
          continue;
        }

        // Execute action based on type
        const result = await executeAction(action, eventData);
        log.status = "success";
        log.result = result;
      } catch (error) {
        log.status = "failed";
        log.error = error instanceof Error ? error.message : "Unknown error";
      }

      execution.executionLog.push(log);
    }

    // Determine overall status
    const failedCount = execution.executionLog.filter((l) => l.status === "failed").length;
    if (failedCount === 0) {
      execution.status = "success";
    } else if (failedCount === execution.executionLog.length) {
      execution.status = "failed";
    } else {
      execution.status = "partial";
    }
  } catch (error) {
    execution.status = "failed";
  }

  execution.completedAt = new Date();
  executions.set(executionId, execution);
  return execution;
}

/**
 * Evaluate action condition
 */
function evaluateActionCondition(condition: string, data: Record<string, any>): boolean {
  try {
    // Simple evaluation of conditions like "severity > high"
    // In production, use a proper expression evaluator
    const func = new Function("data", `return ${condition.replace(/severity|priority|level/g, "data.severity")}`);
    return func(data);
  } catch {
    return true; // If condition is invalid, execute action
  }
}

/**
 * Execute a single action
 */
async function executeAction(action: PlaybookAction, eventData: Record<string, any>): Promise<any> {
  switch (action.type) {
    case "notification":
      return executeNotificationAction(action.config, eventData);
    case "mitigation":
      return executeMitigationAction(action.config, eventData);
    case "webhook":
      return executeWebhookAction(action.config, eventData);
    case "slack":
      return executeSlackAction(action.config, eventData);
    case "pagerduty":
      return executePagerDutyAction(action.config, eventData);
    case "splunk":
      return executeSplunkAction(action.config, eventData);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

/**
 * Execute notification action
 */
async function executeNotificationAction(config: Record<string, any>, eventData: Record<string, any>): Promise<any> {
  console.log("[Playbook] Sending notification:", config.message);
  return { sent: true, message: config.message };
}

/**
 * Execute mitigation action
 */
async function executeMitigationAction(config: Record<string, any>, eventData: Record<string, any>): Promise<any> {
  console.log("[Playbook] Applying mitigation:", config.type);
  return { applied: true, type: config.type };
}

/**
 * Execute webhook action
 */
async function executeWebhookAction(config: Record<string, any>, eventData: Record<string, any>): Promise<any> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  return { statusCode: response.status };
}

/**
 * Execute Slack action
 */
async function executeSlackAction(config: Record<string, any>, eventData: Record<string, any>): Promise<any> {
  console.log("[Playbook] Sending Slack message to", config.channel);
  return { sent: true, channel: config.channel };
}

/**
 * Execute PagerDuty action
 */
async function executePagerDutyAction(config: Record<string, any>, eventData: Record<string, any>): Promise<any> {
  console.log("[Playbook] Creating PagerDuty incident");
  return { incidentCreated: true };
}

/**
 * Execute Splunk action
 */
async function executeSplunkAction(config: Record<string, any>, eventData: Record<string, any>): Promise<any> {
  console.log("[Playbook] Sending event to Splunk");
  return { sent: true };
}

/**
 * Get playbook execution
 */
export function getExecution(id: string): PlaybookExecution | undefined {
  return executions.get(id);
}

/**
 * List executions for playbook
 */
export function listExecutions(playbookId: string): PlaybookExecution[] {
  return Array.from(executions.values()).filter((e) => e.playbookId === playbookId);
}

/**
 * Get recent executions
 */
export function getRecentExecutions(limit: number = 50): PlaybookExecution[] {
  return Array.from(executions.values())
    .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0))
    .slice(0, limit);
}
