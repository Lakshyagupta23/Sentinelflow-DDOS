import { describe, it, expect, beforeEach } from "vitest";
import * as webhookService from "./webhooks";

describe("Webhook Service", () => {
  beforeEach(() => {
    // Clear webhooks before each test
    const webhooks = webhookService.listWebhooks();
    webhooks.forEach((w) => webhookService.deleteWebhook(w.id));
  });

  it("should register a webhook", () => {
    const webhook = webhookService.registerWebhook({
      url: "https://example.com/webhook",
      secret: "test-secret",
      events: ["attack_detected", "alert_triggered"],
      isActive: true,
      retryPolicy: {
        maxRetries: 3,
        retryDelayMs: 5000,
        backoffMultiplier: 2,
      },
    });

    expect(webhook).toBeDefined();
    expect(webhook.url).toBe("https://example.com/webhook");
    expect(webhook.events).toContain("attack_detected");
  });

  it("should list webhooks", () => {
    webhookService.registerWebhook({
      url: "https://example.com/webhook1",
      secret: "secret1",
      events: ["attack_detected"],
      isActive: true,
      retryPolicy: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    });

    webhookService.registerWebhook({
      url: "https://example.com/webhook2",
      secret: "secret2",
      events: ["alert_triggered"],
      isActive: true,
      retryPolicy: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    });

    const webhooks = webhookService.listWebhooks();
    expect(webhooks).toHaveLength(2);
  });

  it("should get webhook by ID", () => {
    const registered = webhookService.registerWebhook({
      url: "https://example.com/webhook",
      secret: "test-secret",
      events: ["attack_detected"],
      isActive: true,
      retryPolicy: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    });

    const retrieved = webhookService.getWebhook(registered.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.url).toBe("https://example.com/webhook");
  });

  it("should update webhook", () => {
    const webhook = webhookService.registerWebhook({
      url: "https://example.com/webhook",
      secret: "test-secret",
      events: ["attack_detected"],
      isActive: true,
      retryPolicy: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    });

    const updated = webhookService.updateWebhook(webhook.id, {
      isActive: false,
      events: ["alert_triggered"],
    });

    expect(updated).toBeDefined();
    expect(updated?.isActive).toBe(false);
    expect(updated?.events).toContain("alert_triggered");
  });

  it("should delete webhook", () => {
    const webhook = webhookService.registerWebhook({
      url: "https://example.com/webhook",
      secret: "test-secret",
      events: ["attack_detected"],
      isActive: true,
      retryPolicy: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    });

    const deleted = webhookService.deleteWebhook(webhook.id);
    expect(deleted).toBe(true);

    const retrieved = webhookService.getWebhook(webhook.id);
    expect(retrieved).toBeUndefined();
  });

  it("should generate and verify signature", () => {
    const payload = JSON.stringify({ test: "data" });
    const secret = "test-secret";

    const signature = webhookService.generateSignature(payload, secret);
    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(0);

    const verified = webhookService.verifySignature(payload, signature, secret);
    expect(verified).toBe(true);
  });

  it("should fail signature verification with wrong secret", () => {
    const payload = JSON.stringify({ test: "data" });
    const signature = webhookService.generateSignature(payload, "secret1");

    const verified = webhookService.verifySignature(payload, signature, "secret2");
    expect(verified).toBe(false);
  });
});
