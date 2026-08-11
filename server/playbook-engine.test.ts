import { describe, it, expect, beforeEach } from "vitest";
import * as playbookEngine from "./playbook-engine";

describe("Playbook Engine", () => {
  beforeEach(() => {
    // Clear playbooks before each test
    const playbooks = playbookEngine.listPlaybooks(1);
    playbooks.forEach((p) => playbookEngine.deletePlaybook(p.id));
  });

  it("should create a playbook", () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      { type: "attack_detected" },
      [
        {
          id: "action1",
          type: "notification",
          config: { message: "Attack detected" },
        },
      ],
      1,
      "Test description"
    );

    expect(playbook).toBeDefined();
    expect(playbook.name).toBe("Test Playbook");
    expect(playbook.isActive).toBe(true);
  });

  it("should list playbooks for organization", () => {
    playbookEngine.createPlaybook(1, "Playbook 1", { type: "attack_detected" }, [], 1);
    playbookEngine.createPlaybook(1, "Playbook 2", { type: "alert_triggered" }, [], 1);
    playbookEngine.createPlaybook(2, "Playbook 3", { type: "threat_detected" }, [], 1);

    const playbooks = playbookEngine.listPlaybooks(1);
    expect(playbooks).toHaveLength(2);
  });

  it("should get playbook by ID", () => {
    const created = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      { type: "attack_detected" },
      [],
      1
    );
    const retrieved = playbookEngine.getPlaybook(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Test Playbook");
  });

  it("should update playbook", () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      { type: "attack_detected" },
      [],
      1
    );

    const updated = playbookEngine.updatePlaybook(playbook.id, {
      name: "Updated Playbook",
      isActive: false,
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe("Updated Playbook");
    expect(updated?.isActive).toBe(false);
  });

  it("should delete playbook", () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      { type: "attack_detected" },
      [],
      1
    );

    const deleted = playbookEngine.deletePlaybook(playbook.id);
    expect(deleted).toBe(true);

    const retrieved = playbookEngine.getPlaybook(playbook.id);
    expect(retrieved).toBeUndefined();
  });

  it("should evaluate trigger without conditions", () => {
    const trigger = { type: "attack_detected" as const };
    const eventData = { severity: "high" };

    const result = playbookEngine.evaluateTrigger(trigger, eventData);
    expect(result).toBe(true);
  });

  it("should evaluate trigger with conditions", () => {
    const trigger = {
      type: "attack_detected" as const,
      conditions: [
        { field: "severity", operator: "equals" as const, value: "high" },
      ],
    };

    const matchingData = { severity: "high" };
    const nonMatchingData = { severity: "low" };

    expect(playbookEngine.evaluateTrigger(trigger, matchingData)).toBe(true);
    expect(playbookEngine.evaluateTrigger(trigger, nonMatchingData)).toBe(false);
  });

  it("should execute playbook successfully", async () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      {
        type: "attack_detected",
        conditions: [
          { field: "severity", operator: "equals", value: "high" },
        ],
      },
      [
        {
          id: "action1",
          type: "notification",
          config: { message: "High severity attack" },
        },
      ],
      1
    );

    const execution = await playbookEngine.executePlaybook(
      playbook.id,
      "attack_123",
      { severity: "high" }
    );

    expect(execution).toBeDefined();
    expect(execution.status).toBe("success");
    expect(execution.executionLog).toHaveLength(1);
    expect(execution.executionLog[0].status).toBe("success");
  });

  it("should fail execution when trigger conditions not met", async () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      {
        type: "attack_detected",
        conditions: [
          { field: "severity", operator: "equals", value: "high" },
        ],
      },
      [],
      1
    );

    try {
      await playbookEngine.executePlaybook(
        playbook.id,
        "attack_123",
        { severity: "low" }
      );
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error instanceof Error).toBe(true);
      expect((error as Error).message).toContain("Trigger conditions not met");
    }
  });

  it("should get execution by ID", async () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      { type: "attack_detected" },
      [
        {
          id: "action1",
          type: "notification",
          config: { message: "Test" },
        },
      ],
      1
    );

    const execution = await playbookEngine.executePlaybook(
      playbook.id,
      "attack_123",
      {}
    );

    const retrieved = playbookEngine.getExecution(execution.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.playbookId).toBe(playbook.id);
  });

  it("should list executions for playbook", async () => {
    const playbook = playbookEngine.createPlaybook(
      1,
      "Test Playbook",
      { type: "attack_detected" },
      [
        {
          id: "action1",
          type: "notification",
          config: { message: "Test" },
        },
      ],
      1
    );

    await playbookEngine.executePlaybook(playbook.id, "attack_1", {});
    await playbookEngine.executePlaybook(playbook.id, "attack_2", {});

    const executions = playbookEngine.listExecutions(playbook.id);
    expect(executions).toHaveLength(2);
  });
});
