/**
 * Team Management tRPC Routes
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as teamService from "./teams";

export const teamRouter = router({
  // Create team
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        permissions: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const team = teamService.createTeam(
        input.organizationId,
        input.name,
        ctx.user?.id || 0,
        input.permissions,
        input.description
      );

      // Add creator as admin
      if (ctx.user?.id) {
        teamService.addTeamMember(team.id, ctx.user.id, "admin");
      }

      return team;
    }),

  // List teams for organization
  list: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      return teamService.listTeams(input.organizationId);
    }),

  // Get team
  get: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input }) => {
      return teamService.getTeam(input.teamId);
    }),

  // Update team permissions
  updatePermissions: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return teamService.updateTeamPermissions(input.teamId, input.permissions);
    }),

  // Add team member
  addMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.number(),
        role: z.enum(["member", "lead", "admin"]).default("member"),
      })
    )
    .mutation(async ({ input }) => {
      return teamService.addTeamMember(input.teamId, input.userId, input.role);
    }),

  // Remove team member
  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return teamService.removeTeamMember(input.teamId, input.userId);
    }),

  // Update member role
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.number(),
        role: z.enum(["member", "lead", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      return teamService.updateMemberRole(input.teamId, input.userId, input.role);
    }),

  // Get team members
  getMembers: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input }) => {
      return teamService.getTeamMembers(input.teamId);
    }),

  // Get user's teams
  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) return [];
    return teamService.getUserTeams(ctx.user.id);
  }),

  // Check permission
  hasPermission: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        permission: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) return false;
      return teamService.hasTeamPermission(input.teamId, ctx.user.id, input.permission);
    }),

  // Delete team
  delete: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input }) => {
      return teamService.deleteTeam(input.teamId);
    }),
});
