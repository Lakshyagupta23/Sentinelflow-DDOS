import { getDb } from "./db";
import { webhooks, webhookDeliveries } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
}

export interface WebhookRecord {
  id: number;
  webhookId: string;
  organizationId: number;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export async function registerWebhook(
  organizationId: number,
  config: WebhookConfig
): Promise<WebhookRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const webhookId = `wh_${crypto.randomBytes(8).toString("hex")}`;
  
  await db.insert(webhooks).values({
    webhookId,
    organizationId,
    name: config.url,
    url: config.url,
    secret: config.secret,
    events: config.events,
    isActive: config.isActive,
    retryPolicy: config.retryPolicy,
    createdBy: 1,
  });

  const result = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.webhookId, webhookId))
    .limit(1);

  if (!result.length) throw new Error("Failed to create webhook");

  const w = result[0];
  return {
    id: w.id,
    webhookId: w.webhookId,
    organizationId: w.organizationId,
    url: w.url,
    secret: w.secret,
    events: w.events,
    isActive: w.isActive,
    retryPolicy: w.retryPolicy,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

export async function listWebhooks(organizationId: number): Promise<WebhookRecord[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.organizationId, organizationId));

  return results.map((w) => ({
    id: w.id,
    webhookId: w.webhookId,
    organizationId: w.organizationId,
    url: w.url,
    secret: w.secret,
    events: w.events,
    isActive: w.isActive,
    retryPolicy: w.retryPolicy,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
}

export async function getWebhook(webhookId: string): Promise<WebhookRecord | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.webhookId, webhookId))
    .limit(1);

  if (!result.length) return null;

  const w = result[0];
  return {
    id: w.id,
    webhookId: w.webhookId,
    organizationId: w.organizationId,
    url: w.url,
    secret: w.secret,
    events: w.events,
    isActive: w.isActive,
    retryPolicy: w.retryPolicy,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

export async function updateWebhook(
  webhookId: string,
  updates: Partial<WebhookConfig>
): Promise<WebhookRecord | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(webhooks)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(webhooks.webhookId, webhookId));

  return getWebhook(webhookId);
}

export async function deleteWebhook(webhookId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .delete(webhooks)
    .where(eq(webhooks.webhookId, webhookId));

  return true;
}

export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function deliverWebhook(
  webhookId: string,
  eventType: string,
  payload: Record<string, any>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const webhook = await getWebhook(webhookId);
  if (!webhook || !webhook.isActive) return;

  if (!webhook.events.includes(eventType)) return;

  const payloadStr = JSON.stringify(payload);
  const signature = generateSignature(payloadStr, webhook.secret);

  const deliveryId = `del_${crypto.randomBytes(8).toString("hex")}`;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-ID": webhookId,
        "X-Event-Type": eventType,
      },
      body: payloadStr,
    });

    await db.insert(webhookDeliveries).values({
      deliveryId,
      webhookId: webhook.id,
      eventType,
      payload,
      status: response.ok ? "success" : "failed",
      statusCode: response.status,
      response: await response.text(),
      retryCount: 0,
    });
  } catch (error) {
    await db.insert(webhookDeliveries).values({
      deliveryId,
      webhookId: webhook.id,
      eventType,
      payload,
      status: "failed",
      response: error instanceof Error ? error.message : "Unknown error",
      retryCount: 0,
    });
  }
}

export async function getWebhookDeliveries(webhookId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const webhook = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.webhookId, webhookId))
    .limit(1);

  if (!webhook.length) return [];

  const { desc } = require('drizzle-orm');
  return db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, webhook[0].id))
    .limit(limit)
    .orderBy(desc(webhookDeliveries.createdAt));
}
