import { getDb } from "./db";
import { teams, teamMembers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface TeamRecord {
  id: number;
  teamId: string;
  organizationId: number;
  name: string;
  description?: string;
  permissions: string[];
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMemberRecord {
  id: number;
  teamId: number;
  userId: number;
  role: "member" | "lead" | "admin";
  joinedAt: Date;
}

export async function createTeam(
  organizationId: number,
  name: string,
  createdBy: number,
  permissions: string[] = []
): Promise<TeamRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const teamId = `team_${crypto.randomBytes(8).toString("hex")}`;

  await db.insert(teams).values({
    teamId,
    organizationId,
    name,
    permissions,
    createdBy,
  });

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.teamId, teamId))
    .limit(1);

  if (!result.length) throw new Error("Failed to create team");

  const t = result[0];
  return {
    id: t.id,
    teamId: t.teamId,
    organizationId: t.organizationId,
    name: t.name,
    description: t.description || undefined,
    permissions: t.permissions,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function listTeams(organizationId: number): Promise<TeamRecord[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(teams)
    .where(eq(teams.organizationId, organizationId));

  return results.map((t) => ({
    id: t.id,
    teamId: t.teamId,
    organizationId: t.organizationId,
    name: t.name,
    description: t.description || undefined,
    permissions: t.permissions,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

export async function getTeam(teamId: string): Promise<TeamRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.teamId, teamId))
    .limit(1);

  if (!result.length) return null;

  const t = result[0];
  return {
    id: t.id,
    teamId: t.teamId,
    organizationId: t.organizationId,
    name: t.name,
    description: t.description || undefined,
    permissions: t.permissions,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function updateTeam(
  teamId: string,
  updates: Partial<TeamRecord>
): Promise<TeamRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const { id, createdAt, ...updateData } = updates;

  await db
    .update(teams)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(teams.teamId, teamId));

  return getTeam(teamId);
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const team = await getTeam(teamId);
  if (!team) return false;

  await db
    .delete(teamMembers)
    .where(eq(teamMembers.teamId, team.id));

  await db
    .delete(teams)
    .where(eq(teams.teamId, teamId));

  return true;
}

export async function addTeamMember(
  teamId: string,
  userId: number,
  role: "member" | "lead" | "admin" = "member"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const team = await getTeam(teamId);
  if (!team) return false;

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role,
  });

  return true;
}

export async function removeTeamMember(teamId: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const team = await getTeam(teamId);
  if (!team) return false;

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)));

  return true;
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
  const db = await getDb();
  if (!db) return [];

  const team = await getTeam(teamId);
  if (!team) return [];

  const results = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, team.id));

  return results.map((m) => ({
    id: m.id,
    teamId: m.teamId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function updateMemberRole(
  teamId: string,
  userId: number,
  role: "member" | "lead" | "admin"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const team = await getTeam(teamId);
  if (!team) return false;

  await db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)));

  return true;
}

export async function getUserTeamRole(teamId: string, userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const team = await getTeam(teamId);
  if (!team) return null;

  const result = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)))
    .limit(1);

  return result.length ? result[0].role : null;
}

export async function hasTeamPermission(
  teamId: string,
  userId: number,
  permission: string
): Promise<boolean> {
  const role = await getUserTeamRole(teamId, userId);
  if (!role) return false;

  if (role === "admin") return true;

  const team = await getTeam(teamId);
  if (!team) return false;

  return team.permissions.includes(permission);
}

export async function isTeamAdmin(teamId: string, userId: number): Promise<boolean> {
  const role = await getUserTeamRole(teamId, userId);
  return role === "admin";
}

export async function isTeamLead(teamId: string, userId: number): Promise<boolean> {
  const role = await getUserTeamRole(teamId, userId);
  return role === "lead" || role === "admin";
}

export async function getUserTeams(userId: number): Promise<TeamRecord[]> {
  const db = await getDb();
  if (!db) return [];

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  const teamIds = members.map((m) => m.teamId);
  if (!teamIds.length) return [];

  const results = await db
    .select()
    .from(teams)
    .where((t) => {
      const { inArray } = require("drizzle-orm");
      return inArray(t.id, teamIds);
    });

  return results.map((t) => ({
    id: t.id,
    teamId: t.teamId,
    organizationId: t.organizationId,
    name: t.name,
    description: t.description || undefined,
    permissions: t.permissions,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}
