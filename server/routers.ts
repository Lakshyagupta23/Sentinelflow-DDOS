import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { createAuditLog } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Attack Detection Router ============
  attacks: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return await db.getRecentAttacks(input?.limit ?? 10);
      }),

    ongoing: protectedProcedure.query(async () => {
      return await db.getOngoingAttacks();
    }),

    getById: protectedProcedure
      .input(z.object({ attackId: z.string() }))
      .query(async ({ input }) => {
        return await db.getAttackById(input.attackId);
      }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["volumetric", "protocol", "application_layer"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        sourceIp: z.string().optional(),
        destinationUrl: z.string().optional(),
        peakTraffic: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const attackId = nanoid();
        const result = await db.createAttack({
          attackId,
          type: input.type,
          severity: input.severity,
          status: "ongoing",
          sourceIp: input.sourceIp,
          destinationUrl: input.destinationUrl,
          peakTraffic: input.peakTraffic ? (input.peakTraffic.toString() as any) : undefined,
          startTime: new Date(),
        });

        // Log the action
        await createAuditLog({
          logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: ctx.user?.id,
          action: "attack_detected",
          resourceType: "attack",
          resourceId: attackId,
          details: { type: input.type, severity: input.severity },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return result;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        attackId: z.string(),
        status: z.enum(["ongoing", "mitigated", "resolved"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.updateAttackStatus(input.attackId, input.status);

        await createAuditLog({
          logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: ctx.user?.id,
          action: "attack_status_updated",
          resourceType: "attack",
          resourceId: input.attackId,
          details: { newStatus: input.status },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return result;
      }),

    statistics: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        return await db.getAttackStatistics(input.days);
      }),
  }),

  // ============ Traffic Metrics Router ============
  traffic: router({
    recent: protectedProcedure
      .input(z.object({ limit: z.number().default(60) }).optional())
      .query(async ({ input }) => {
        return await db.getRecentTrafficMetrics(input?.limit ?? 60);
      }),

    range: protectedProcedure
      .input(z.object({
        startTime: z.date(),
        endTime: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getTrafficMetricsInRange(input.startTime, input.endTime);
      }),

    record: protectedProcedure
      .input(z.object({
        trafficVolume: z.number(),
        requestRate: z.number(),
        protocolBreakdown: z.record(z.string(), z.number()),
        sourceCountry: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createTrafficMetric({
          timestamp: new Date(),
          trafficVolume: input.trafficVolume.toString() as any,
          requestRate: input.requestRate.toString() as any,
          protocolBreakdown: JSON.stringify(input.protocolBreakdown),
          sourceCountry: input.sourceCountry,
        });

        return result;
      }),
  }),

  // ============ Alerts Router ============
  alerts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return await db.getRecentAlerts(input?.limit ?? 20);
      }),

    unread: protectedProcedure.query(async () => {
      return await db.getUnreadAlerts();
    }),

    create: protectedProcedure
      .input(z.object({
        type: z.enum(["traffic_spike", "anomaly", "attack_detected", "threshold_exceeded"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        message: z.string(),
        attackId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const alertId = nanoid();
        const result = await db.createAlert({
          alertId,
          type: input.type,
          severity: input.severity,
          message: input.message,
          attackId: input.attackId,
          isRead: false,
        });

        return result;
      }),

    markAsRead: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.markAlertAsRead(input.alertId);
      }),
  }),

  // ============ Mitigation Controls Router ============
  mitigation: router({
    rules: protectedProcedure.query(async () => {
      return await db.getActiveMitigationRules();
    }),

    createRule: protectedProcedure
      .input(z.object({
        type: z.enum(["ip_block", "rate_limit", "captcha_challenge", "geo_block"]),
        target: z.string(),
        threshold: z.number().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const ruleId = nanoid();
        const result = await db.createMitigationRule({
          ruleId,
          type: input.type,
          target: input.target,
          threshold: input.threshold,
          duration: input.duration,
          createdBy: ctx.user?.id,
          isActive: true,
        });

        await createAuditLog({
          logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: ctx.user?.id,
          action: "mitigation_rule_created",
          resourceType: "mitigation_rule",
          resourceId: ruleId,
          details: { type: input.type, target: input.target },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return result;
      }),

    toggleRule: protectedProcedure
      .input(z.object({
        ruleId: z.string(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.toggleMitigationRule(input.ruleId, input.isActive);

        await createAuditLog({
          logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: ctx.user?.id,
          action: "mitigation_rule_toggled",
          resourceType: "mitigation_rule",
          resourceId: input.ruleId,
          details: { isActive: input.isActive },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return result;
      }),
  }),

  // ============ Alert Configuration Router ============
  alertConfig: router({
    getUserConfigs: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return [];
      return await db.getUserAlertConfigs(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        eventType: z.string(),
        threshold: z.number(),
        notificationChannels: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");

        const result = await db.createAlertConfig({
          userId: ctx.user.id,
          eventType: input.eventType,
          threshold: input.threshold.toString() as any,
          notificationChannels: input.notificationChannels as any,
          isEnabled: true,
        });

        return result;
      }),
  }),

  // ============ Audit Logs Router ============
  auditLogs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        return await db.getRecentAuditLogs(input?.limit ?? 50);
      }),
  }),

  // ============ Attack Vectors Router ============
  vectors: router({
    topIps: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return await db.getTopAttackVectors("source_ip", input?.limit ?? 10);
      }),

    topUrls: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return await db.getTopAttackVectors("destination_url", input?.limit ?? 10);
      }),

    topUserAgents: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return await db.getTopAttackVectors("user_agent", input?.limit ?? 10);
      }),

    topCountries: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return await db.getTopAttackVectors("country", input?.limit ?? 10);
      }),
  }),

  // ============ Real-Time Updates Router ============
  realtime: router({
    recentAttacks: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getRecentAttacks(input?.limit ?? 10);
      }),

    recentMetrics: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getRecentTrafficMetrics(input?.limit ?? 50);
      }),

    recentAlerts: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getRecentAlerts(input?.limit ?? 20);
      }),
  }),

  // ============ Playbooks Router ============
  playbooks: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getPlaybooksByOrganization(input.organizationId);
      }),

    getById: protectedProcedure
      .input(z.object({ playbookId: z.string() }))
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getPlaybookById(input.playbookId);
      }),

    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        attackType: z.enum(["volumetric", "protocol", "application_layer", "custom"]),
        steps: z.array(z.object({
          action: z.string(),
          description: z.string(),
          parameters: z.record(z.string(), z.any()).optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advFeatures = await import("./advanced-features");
        return await advFeatures.createPlaybook({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    execute: protectedProcedure
      .input(z.object({
        playbookId: z.number(),
        attackId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advFeatures = await import("./advanced-features");
        return await advFeatures.executePlaybook({
          playbookId: input.playbookId,
          attackId: input.attackId,
          executedBy: ctx.user.id,
        });
      }),

    history: protectedProcedure
      .input(z.object({ playbookId: z.number(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getPlaybookExecutionHistory(input.playbookId, input.limit);
      }),
  }),

  // ============ Organizations Router ============
  organizations: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        logo: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advFeatures = await import("./advanced-features");
        return await advFeatures.createOrganization({
          ...input,
          ownerId: ctx.user.id,
        });
      }),

    getById: protectedProcedure
      .input(z.object({ orgId: z.string() }))
      .query(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getOrganizationById(input.orgId);
      }),

    myOrganizations: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advFeatures = await import("./advanced-features");
        return await advFeatures.getUserOrganizations(ctx.user.id);
      }),

    addMember: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        userId: z.number(),
        role: z.enum(["owner", "admin", "member"]),
      }))
      .mutation(async ({ input }) => {
        const advFeatures = await import("./advanced-features");
        return await advFeatures.addOrganizationMember(input);
      }),
  }),

  // ============ Alert Rules Router ============
  alertRules: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        const advServices = await import("./advanced-services");
        return await advServices.getAlertRulesByOrganization(input.organizationId);
      }),

    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        conditions: z.array(z.object({
          field: z.string(),
          operator: z.enum(["equals", "greater_than", "less_than", "contains", "in"]),
          value: z.any(),
        })),
        logicalOperator: z.enum(["AND", "OR"]),
        enabled: z.boolean().default(true),
        actions: z.array(z.object({
          type: z.enum(["email", "slack", "webhook", "sms"]),
          target: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advServices = await import("./advanced-services");
        return await advServices.createAlertRule({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const advServices = await import("./advanced-services");
        return await advServices.deleteAlertRule(input.id.toString());
      }),
  }),

  // ============ Threat Intelligence Router ============
  threatIntel: router({
    getByIp: protectedProcedure
      .input(z.object({ sourceIp: z.string() }))
      .query(async ({ input }) => {
        const advServices = await import("./advanced-services");
        return await advServices.getThreatIntelligenceByIp(input.sourceIp);
      }),

    getMaliciousIps: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }).optional())
      .query(async ({ input }) => {
        const advServices = await import("./advanced-services");
        return await advServices.getMaliciousIps(input?.limit ?? 100);
      }),

    enrich: protectedProcedure
      .input(z.object({ sourceIp: z.string() }))
      .mutation(async ({ input }) => {
        const advServices = await import("./advanced-services");
        return await advServices.enrichThreatIntelligence(input.sourceIp);
      }),
  }),

  // ============ Webhook Management Router ============
  webhooks: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        const webhooksDb = await import("./webhooks-db");
        return await webhooksDb.listWebhooks(input.organizationId);
      }),

    register: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        url: z.string().url(),
        secret: z.string(),
        events: z.array(z.string()),
        retryPolicy: z.object({
          maxRetries: z.number(),
          retryDelayMs: z.number(),
          backoffMultiplier: z.number(),
        }),
      }))
      .mutation(async ({ input }) => {
        const webhooksDb = await import("./webhooks-db");
        return await webhooksDb.registerWebhook(input.organizationId, {
          url: input.url,
          secret: input.secret,
          events: input.events,
          isActive: true,
          retryPolicy: input.retryPolicy,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ webhookId: z.string() }))
      .mutation(async ({ input }) => {
        const webhooksDb = await import("./webhooks-db");
        return await webhooksDb.deleteWebhook(input.webhookId);
      }),
  }),

  // ============ Team Management Router ============
  teams: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        const teamsDb = await import("./teams-db");
        return await teamsDb.listTeams(input.organizationId);
      }),

    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        name: z.string(),
        permissions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const teamsDb = await import("./teams-db");
        return await teamsDb.createTeam(
          input.organizationId,
          input.name,
          ctx.user.id,
          input.permissions
        );
      }),

    addMember: protectedProcedure
      .input(z.object({
        teamId: z.string(),
        userId: z.number(),
        role: z.enum(["member", "lead", "admin"]),
      }))
      .mutation(async ({ input }) => {
        const teamsDb = await import("./teams-db");
        return await teamsDb.addTeamMember(input.teamId, input.userId, input.role);
      }),

    removeMember: protectedProcedure
      .input(z.object({
        teamId: z.string(),
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const teamsDb = await import("./teams-db");
        return await teamsDb.removeTeamMember(input.teamId, input.userId);
      }),
  }),

  // ============ Playbook Automation Router (Extended) ============
  // Extending existing playbooks router with automation features
  playbooksAutomation: router({
    execute: protectedProcedure
      .input(z.object({
        playbookId: z.string(),
        triggeredBy: z.string(),
        eventData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        const playbookDb = await import("./playbook-engine-db");
        return await playbookDb.executePlaybook(
          input.playbookId,
          input.triggeredBy,
          input.eventData
        );
      }),

    getExecution: protectedProcedure
      .input(z.object({ executionId: z.string() }))
      .query(async ({ input }) => {
        const playbookDb = await import("./playbook-engine-db");
        return playbookDb.getExecution(input.executionId);
      }),
  }),

  // ============ Notifications Router ============
  notifications: router({
    subscribe: publicProcedure.query(async ({ ctx }) => {
      // This is a placeholder for SSE subscription
      // In production, use Express middleware to handle SSE
      return { subscribed: true, message: "Use /api/notifications/sse for SSE stream" };
    }),

    list: protectedProcedure
      .input(z.object({ organizationId: z.number(), limit: z.number().default(50) }).optional())
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advServices = await import("./advanced-services");
        return await advServices.getUserNotifications(
          ctx.user.id,
          input?.organizationId ?? 1,
          input?.limit ?? 50
        );
      }),

    unread: protectedProcedure
      .input(z.object({ organizationId: z.number() }).optional())
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advServices = await import("./advanced-services");
        return await advServices.getUnreadNotifications(
          ctx.user.id,
          input?.organizationId ?? 1
        );
      }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ input }) => {
        const advServices = await import("./advanced-services");
        return await advServices.markNotificationAsRead(input.notificationId);
      }),

    markAllAsRead: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const advServices = await import("./advanced-services");
        return await advServices.markAllNotificationsAsRead(ctx.user.id, input.organizationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;


