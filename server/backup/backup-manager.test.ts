import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BackupManager, getBackupManager } from "./backup-manager";

describe("Backup Manager", () => {
  let manager: BackupManager;

  beforeEach(() => {
    manager = new BackupManager({
      retentionDays: 30,
      maxBackups: 5,
      backupInterval: 1000,
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  it("should create backup manager instance", () => {
    expect(manager).toBeDefined();
  });

  it("should create a backup", async () => {
    const backup = await manager.createBackup();
    expect(backup).toBeDefined();
    expect(backup.id).toMatch(/^backup-/);
    expect(backup.status).toBe("completed");
    expect(backup.size).toBeGreaterThan(0);
    expect(backup.tables).toBe(20);
  });

  it("should get all backups", async () => {
    await manager.createBackup();
    await manager.createBackup();

    const backups = manager.getBackups();
    expect(backups.length).toBe(2);
  });

  it("should get backup by ID", async () => {
    const created = await manager.createBackup();
    const retrieved = manager.getBackup(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  it("should restore from backup", async () => {
    const backup = await manager.createBackup();
    const result = await manager.restore(backup.id);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Successfully restored");
  });

  it("should fail to restore non-existent backup", async () => {
    const result = await manager.restore("non-existent");
    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("should delete backup", async () => {
    const backup = await manager.createBackup();
    const deleted = manager.deleteBackup(backup.id);

    expect(deleted).toBe(true);
    expect(manager.getBackup(backup.id)).toBeUndefined();
  });

  it("should get statistics", async () => {
    await manager.createBackup();
    await manager.createBackup();

    const stats = manager.getStatistics();
    expect(stats.totalBackups).toBe(2);
    expect(stats.completedBackups).toBe(2);
    expect(stats.failedBackups).toBe(0);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.latestBackup).toBeDefined();
  });

  it("should sort backups by timestamp (newest first)", async () => {
    const backup1 = await manager.createBackup();
    await new Promise((resolve) => setTimeout(resolve, 10));
    const backup2 = await manager.createBackup();

    const backups = manager.getBackups();
    expect(backups[0].id).toBe(backup2.id);
    expect(backups[1].id).toBe(backup1.id);
  });

  it("should get global backup manager instance", () => {
    const manager1 = getBackupManager();
    const manager2 = getBackupManager();
    expect(manager1).toBe(manager2);
  });

  it("should cleanup old backups when exceeding max", async () => {
    // Create more backups than the max (5)
    for (let i = 0; i < 7; i++) {
      await manager.createBackup();
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const backups = manager.getBackups();
    expect(backups.length).toBeLessThanOrEqual(5);
  });

  it("should start and stop automated backups", (done) => {
    let backupCount = 0;
    const originalCreate = manager.createBackup.bind(manager);

    manager.createBackup = async () => {
      backupCount++;
      return originalCreate();
    };

    manager.start();

    setTimeout(() => {
      manager.stop();
      expect(backupCount).toBeGreaterThan(0);
      done();
    }, 1500);
  });
});
