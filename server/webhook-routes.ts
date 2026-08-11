/**
 * Webhook Management tRPC Routes
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as webhookService from "./webhooks";

export const webhookRouter = router({
  // Create webhook
  create: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string()),
        headers: z.record(z.string(), z.string()).optional(),
        maxRetries: z.number().default(3),
        retryDelayMs: z.number().default(5000),
        backoffMultiplier: z.number().default(2),
      })
    )
    .mutation(async ({ input }) => {
      const webhook = webhookService.registerWebhook({
        url: input.url,
        secret: `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        events: input.events,
        isActive: true,
        retryPolicy: {
          maxRetries: input.maxRetries,
          retryDelayMs: input.retryDelayMs,
          backoffMultiplier: input.backoffMultiplier,
        },
        headers: input.headers as Record<string, string> | undefined,
      });

      return webhook;
    }),

  // List webhooks
  list: protectedProcedure.query(async () => {
    return webhookService.listWebhooks();
  }),

  // Get webhook
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return webhookService.getWebhook(input.id);
    }),

  // Update webhook
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        headers: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return webhookService.updateWebhook(id, updates as Partial<Omit<webhookService.WebhookConfig, "id">>);
    }),

  // Delete webhook
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return webhookService.deleteWebhook(input.id);
    }),

  // Get webhook deliveries
  getDeliveries: protectedProcedure
    .input(z.object({ webhookId: z.string().optional() }))
    .query(async ({ input }) => {
      return webhookService.getDeliveries(input.webhookId);
    }),

  // Test webhook
  test: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const webhook = webhookService.getWebhook(input.id);
      if (!webhook) {
        throw new Error("Webhook not found");
      }

      const testEvent: webhookService.WebhookEvent = {
        type: "test",
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test webhook delivery",
          timestamp: new Date().toISOString(),
        },
      };

      return await webhookService.deliverWebhook(webhook, testEvent);
    }),
});
