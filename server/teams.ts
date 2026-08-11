/**
 * Team Management Service
 * Handles team creation, membership, and role-based access control
 */

export type TeamRole = "member" | "lead" | "admin";

export interface TeamMember {
  userId: number;
  role: TeamRole;
  joinedAt: Date;
}

export interface Team {
  id: string;
  organizationId: number;
  name: string;
  description?: string;
  permissions: string[];
  members: Map<number, TeamMember>;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory team storage (in production, use database)
const teams = new Map<string, Team>();

/**
 * Create a new team
 */
export function createTeam(
  organizationId: number,
  name: string,
  createdBy: number,
  permissions: string[] = [],
  description?: string
): Team {
  const id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const team: Team = {
    id,
    organizationId,
    name,
    description,
    permissions,
    members: new Map(),
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  teams.set(id, team);
  return team;
}

/**
 * Get team by ID
 */
export function getTeam(id: string): Team | undefined {
  return teams.get(id);
}

/**
 * List teams for organization
 */
export function listTeams(organizationId: number): Team[] {
  return Array.from(teams.values()).filter((t) => t.organizationId === organizationId);
}

/**
 * Add member to team
 */
export function addTeamMember(teamId: string, userId: number, role: TeamRole = "member"): boolean {
  const team = teams.get(teamId);
  if (!team) return false;

  team.members.set(userId, {
    userId,
    role,
    joinedAt: new Date(),
  });

  team.updatedAt = new Date();
  return true;
}

/**
 * Remove member from team
 */
export function removeTeamMember(teamId: string, userId: number): boolean {
  const team = teams.get(teamId);
  if (!team) return false;

  const removed = team.members.delete(userId);
  if (removed) {
    team.updatedAt = new Date();
  }
  return removed;
}

/**
 * Update member role
 */
export function updateMemberRole(teamId: string, userId: number, role: TeamRole): boolean {
  const team = teams.get(teamId);
  if (!team) return false;

  const member = team.members.get(userId);
  if (!member) return false;

  member.role = role;
  team.updatedAt = new Date();
  return true;
}

/**
 * Get team members
 */
export function getTeamMembers(teamId: string): TeamMember[] {
  const team = teams.get(teamId);
  if (!team) return [];
  return Array.from(team.members.values());
}

/**
 * Check if user has permission in team
 */
export function hasTeamPermission(teamId: string, userId: number, permission: string): boolean {
  const team = teams.get(teamId);
  if (!team) return false;

  const member = team.members.get(userId);
  if (!member) return false;

  // Admins have all permissions
  if (member.role === "admin") return true;

  // Check if permission is in team's permission list
  return team.permissions.includes(permission);
}

/**
 * Get user's role in team
 */
export function getUserTeamRole(teamId: string, userId: number): TeamRole | null {
  const team = teams.get(teamId);
  if (!team) return null;

  const member = team.members.get(userId);
  return member?.role || null;
}

/**
 * Update team permissions
 */
export function updateTeamPermissions(teamId: string, permissions: string[]): boolean {
  const team = teams.get(teamId);
  if (!team) return false;

  team.permissions = permissions;
  team.updatedAt = new Date();
  return true;
}

/**
 * Delete team
 */
export function deleteTeam(teamId: string): boolean {
  return teams.delete(teamId);
}

/**
 * Get user's teams
 */
export function getUserTeams(userId: number): Team[] {
  return Array.from(teams.values()).filter((team) => team.members.has(userId));
}

/**
 * Check if user is team admin
 */
export function isTeamAdmin(teamId: string, userId: number): boolean {
  const role = getUserTeamRole(teamId, userId);
  return role === "admin";
}

/**
 * Check if user is team lead or admin
 */
export function isTeamLead(teamId: string, userId: number): boolean {
  const role = getUserTeamRole(teamId, userId);
  return role === "lead" || role === "admin";
}
