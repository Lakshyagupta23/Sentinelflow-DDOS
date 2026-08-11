/**
 * Playbook Automation tRPC Routes
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as playbookEngine from "./playbook-engine";

export const playbookRouter = router({
  // Create playbook
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        trigger: z.object({
          type: z.enum(["attack_detected", "alert_triggered", "threat_detected", "manual"]),
          conditions: z
            .array(
              z.object({
                field: z.string(),
                operator: z.enum(["equals", "greater_than", "less_than", "contains", "in"]),
                value: z.any(),
              })
            )
            .optional(),
        }),
        actions: z.array(
          z.object({
            id: z.string(),
            type: z.enum(["notification", "mitigation", "webhook", "slack", "pagerduty", "splunk"]),
            config: z.record(z.string(), z.any()),
            condition: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const playbook = playbookEngine.createPlaybook(
        input.organizationId,
        input.name,
        input.trigger,
        input.actions,
        ctx.user?.id || 0,
        input.description
      );

      return playbook;
    }),

  // List playbooks
  list: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      return playbookEngine.listPlaybooks(input.organizationId);
    }),

  // Get playbook
  get: protectedProcedure
    .input(z.object({ playbookId: z.string() }))
    .query(async ({ input }) => {
      return playbookEngine.getPlaybook(input.playbookId);
    }),

  // Update playbook
  update: protectedProcedure
    .input(
      z.object({
        playbookId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        trigger: z.any().optional(),
        actions: z.array(z.any()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { playbookId, ...updates } = input;
      return playbookEngine.updatePlaybook(playbookId, updates);
    }),

  // Delete playbook
  delete: protectedProcedure
    .input(z.object({ playbookId: z.string() }))
    .mutation(async ({ input }) => {
      return playbookEngine.deletePlaybook(input.playbookId);
    }),

  // Execute playbook
  execute: protectedProcedure
    .input(
      z.object({
        playbookId: z.string(),
        triggeredBy: z.string(),
        eventData: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await playbookEngine.executePlaybook(
          input.playbookId,
          input.triggeredBy,
          input.eventData
        );
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Playbook execution failed");
      }
    }),

  // Get execution
  getExecution: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ input }) => {
      return playbookEngine.getExecution(input.executionId);
    }),

  // List executions for playbook
  listExecutions: protectedProcedure
    .input(z.object({ playbookId: z.string() }))
    .query(async ({ input }) => {
      return playbookEngine.listExecutions(input.playbookId);
    }),

  // Get recent executions
  getRecentExecutions: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return playbookEngine.getRecentExecutions(input.limit);
    }),
});
