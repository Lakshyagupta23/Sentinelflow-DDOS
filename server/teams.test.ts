import { describe, it, expect, beforeEach } from "vitest";
import * as teamService from "./teams";

describe("Team Service", () => {
  beforeEach(() => {
    // Clear teams before each test
    const teams = teamService.listTeams(1);
    teams.forEach((t) => teamService.deleteTeam(t.id));
  });

  it("should create a team", () => {
    const team = teamService.createTeam(1, "Security Team", 1, ["view_attacks", "manage_rules"]);

    expect(team).toBeDefined();
    expect(team.name).toBe("Security Team");
    expect(team.organizationId).toBe(1);
    expect(team.permissions).toContain("view_attacks");
  });

  it("should list teams for organization", () => {
    teamService.createTeam(1, "Team 1", 1, []);
    teamService.createTeam(1, "Team 2", 1, []);
    teamService.createTeam(2, "Team 3", 1, []);

    const teams = teamService.listTeams(1);
    expect(teams).toHaveLength(2);
  });

  it("should get team by ID", () => {
    const created = teamService.createTeam(1, "Test Team", 1, []);
    const retrieved = teamService.getTeam(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Test Team");
  });

  it("should add team member", () => {
    const team = teamService.createTeam(1, "Test Team", 1, []);
    const added = teamService.addTeamMember(team.id, 2, "member");

    expect(added).toBe(true);
    const members = teamService.getTeamMembers(team.id);
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(2);
  });

  it("should remove team member", () => {
    const team = teamService.createTeam(1, "Test Team", 1, []);
    teamService.addTeamMember(team.id, 2, "member");

    const removed = teamService.removeTeamMember(team.id, 2);
    expect(removed).toBe(true);

    const members = teamService.getTeamMembers(team.id);
    expect(members).toHaveLength(0);
  });

  it("should update member role", () => {
    const team = teamService.createTeam(1, "Test Team", 1, []);
    teamService.addTeamMember(team.id, 2, "member");

    const updated = teamService.updateMemberRole(team.id, 2, "lead");
    expect(updated).toBe(true);

    const role = teamService.getUserTeamRole(team.id, 2);
    expect(role).toBe("lead");
  });

  it("should check team permission", () => {
    const team = teamService.createTeam(1, "Test Team", 1, ["view_attacks", "manage_rules"]);
    teamService.addTeamMember(team.id, 2, "member");

    const hasPermission = teamService.hasTeamPermission(team.id, 2, "view_attacks");
    expect(hasPermission).toBe(true);
  });

  it("should grant all permissions to admin", () => {
    const team = teamService.createTeam(1, "Test Team", 1, ["view_attacks"]);
    teamService.addTeamMember(team.id, 2, "admin");

    const hasPermission = teamService.hasTeamPermission(team.id, 2, "any_permission");
    expect(hasPermission).toBe(true);
  });

  it("should get user teams", () => {
    const team1 = teamService.createTeam(1, "Team 1", 1, []);
    const team2 = teamService.createTeam(1, "Team 2", 1, []);

    teamService.addTeamMember(team1.id, 2, "member");
    teamService.addTeamMember(team2.id, 2, "member");

    const userTeams = teamService.getUserTeams(2);
    expect(userTeams).toHaveLength(2);
  });

  it("should identify team admin", () => {
    const team = teamService.createTeam(1, "Test Team", 1, []);
    teamService.addTeamMember(team.id, 2, "admin");

    const isAdmin = teamService.isTeamAdmin(team.id, 2);
    expect(isAdmin).toBe(true);
  });

  it("should identify team lead", () => {
    const team = teamService.createTeam(1, "Test Team", 1, []);
    teamService.addTeamMember(team.id, 2, "lead");

    const isLead = teamService.isTeamLead(team.id, 2);
    expect(isLead).toBe(true);
  });

  it("should delete team", () => {
    const team = teamService.createTeam(1, "Test Team", 1, []);
    const deleted = teamService.deleteTeam(team.id);

    expect(deleted).toBe(true);
    const retrieved = teamService.getTeam(team.id);
    expect(retrieved).toBeUndefined();
  });
});
