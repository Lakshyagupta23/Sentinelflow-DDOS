/**
 * Webhook Management Service
 * Handles webhook registration, delivery, and retry logic
 */

import crypto from "crypto";

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  headers?: Record<string, string>;
}

export interface WebhookEvent {
  type: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: "pending" | "success" | "failed" | "retrying";
  statusCode?: number;
  response?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

// In-memory webhook storage (in production, use database)
const webhooks = new Map<string, WebhookConfig>();
const deliveries = new Map<string, WebhookDelivery>();

/**
 * Register a new webhook
 */
export function registerWebhook(config: Omit<WebhookConfig, "id">): WebhookConfig {
  const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const webhook: WebhookConfig = { id, ...config };
  webhooks.set(id, webhook);
  return webhook;
}

/**
 * Get webhook by ID
 */
export function getWebhook(id: string): WebhookConfig | undefined {
  return webhooks.get(id);
}

/**
 * List all webhooks
 */
export function listWebhooks(): WebhookConfig[] {
  return Array.from(webhooks.values());
}

/**
 * Update webhook configuration
 */
export function updateWebhook(id: string, updates: Partial<Omit<WebhookConfig, "id">>): WebhookConfig | null {
  const webhook = webhooks.get(id);
  if (!webhook) return null;

  const updated = { ...webhook, ...updates };
  webhooks.set(id, updated);
  return updated;
}

/**
 * Delete webhook
 */
export function deleteWebhook(id: string): boolean {
  return webhooks.delete(id);
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = generateSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Deliver webhook event
 */
export async function deliverWebhook(webhook: WebhookConfig, event: WebhookEvent): Promise<WebhookDelivery> {
  const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const payload = JSON.stringify(event);
  const signature = generateSignature(payload, webhook.secret);

  const delivery: WebhookDelivery = {
    id: deliveryId,
    webhookId: webhook.id,
    event,
    status: "pending",
    retryCount: 0,
  };

  deliveries.set(deliveryId, delivery);

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-ID": webhook.id,
        "X-Webhook-Timestamp": event.timestamp,
        ...webhook.headers,
      },
      body: payload,
    });

    delivery.statusCode = response.status;
    delivery.response = await response.text();

    if (response.ok) {
      delivery.status = "success";
    } else {
      delivery.status = "failed";
      scheduleRetry(delivery, webhook);
    }
  } catch (error) {
    delivery.status = "failed";
    delivery.response = error instanceof Error ? error.message : "Unknown error";
    scheduleRetry(delivery, webhook);
  }

  deliveries.set(deliveryId, delivery);
  return delivery;
}

/**
 * Schedule webhook retry
 */
function scheduleRetry(delivery: WebhookDelivery, webhook: WebhookConfig): void {
  if (delivery.retryCount >= webhook.retryPolicy.maxRetries) {
    delivery.status = "failed";
    return;
  }

  const delayMs =
    webhook.retryPolicy.retryDelayMs *
    Math.pow(webhook.retryPolicy.backoffMultiplier, delivery.retryCount);

  delivery.retryCount++;
  delivery.status = "retrying";
  delivery.nextRetryAt = new Date(Date.now() + delayMs);

  // Schedule retry
  setTimeout(() => {
    const webhook = webhooks.get(delivery.webhookId);
    if (webhook) {
      deliverWebhook(webhook, delivery.event);
    }
  }, delayMs);
}

/**
 * Get webhook deliveries
 */
export function getDeliveries(webhookId?: string): WebhookDelivery[] {
  const all = Array.from(deliveries.values());
  if (webhookId) {
    return all.filter((d) => d.webhookId === webhookId);
  }
  return all;
}

/**
 * Broadcast event to all webhooks
 */
export async function broadcastWebhookEvent(event: WebhookEvent): Promise<WebhookDelivery[]> {
  const results: WebhookDelivery[] = [];

  for (const webhook of webhooks.values()) {
    if (!webhook.isActive) continue;
    if (!webhook.events.includes(event.type)) continue;

    const delivery = await deliverWebhook(webhook, event);
    results.push(delivery);
  }

  return results;
}
