import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

export type UserRole = "admin" | "security_analyst" | "devops_sre" | "it_manager" | "user";

/**
 * Role-based access control definitions
 * Each role has specific permissions for different features
 */
export const rolePermissions: Record<UserRole, Set<string>> = {
  admin: new Set([
    // Full access to all features
    "view_dashboard",
    "view_forensics",
    "manage_mitigation",
    "manage_alerts",
    "view_summary",
    "view_audit_logs",
    "create_users",
    "manage_roles",
    "export_reports",
  ]),

  security_analyst: new Set([
    // Deep access to threat analysis and forensics
    "view_dashboard",
    "view_forensics",
    "view_attack_details",
    "create_alerts",
    "view_summary",
    "view_audit_logs",
    "export_reports",
    "analyze_vectors",
  ]),

  devops_sre: new Set([
    // Focus on mitigation and operational controls
    "view_dashboard",
    "manage_mitigation",
    "view_forensics",
    "create_alerts",
    "view_audit_logs",
    "manage_rate_limits",
    "manage_ip_blocks",
  ]),

  it_manager: new Set([
    // Executive-level view with reporting
    "view_dashboard",
    "view_summary",
    "view_audit_logs",
    "export_reports",
    "view_forensics",
  ]),

  user: new Set([
    // Limited read-only access
    "view_dashboard",
  ]),
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.has(permission) ?? false;
}

/**
 * Get scoped data based on user role
 * Different roles see different subsets of data
 */
export function getScopedAttackFilters(role: UserRole) {
  switch (role) {
    case "security_analyst":
      // Security analysts see all attacks
      return {};

    case "devops_sre":
      // DevOps/SRE focus on active/mitigated attacks
      return { status: ["ongoing", "mitigated"] };

    case "it_manager":
      // IT Managers see only critical/high severity
      return { severity: ["critical", "high"] };

    case "admin":
      // Admins see everything
      return {};

    default:
      // Regular users see nothing
      return { status: "none" };
  }
}

/**
 * Get scoped dashboard metrics based on role
 */
export function getScopedMetrics(role: UserRole) {
  switch (role) {
    case "security_analyst":
      return {
        showDetectionAccuracy: true,
        showForensicDetails: true,
        showVectorAnalysis: true,
        showMitigationStatus: true,
      };

    case "devops_sre":
      return {
        showDetectionAccuracy: false,
        showForensicDetails: false,
        showVectorAnalysis: false,
        showMitigationStatus: true,
      };

    case "it_manager":
      return {
        showDetectionAccuracy: true,
        showForensicDetails: false,
        showVectorAnalysis: false,
        showMitigationStatus: true,
      };

    case "admin":
      return {
        showDetectionAccuracy: true,
        showForensicDetails: true,
        showVectorAnalysis: true,
        showMitigationStatus: true,
      };

    default:
      return {
        showDetectionAccuracy: false,
        showForensicDetails: false,
        showVectorAnalysis: false,
        showMitigationStatus: false,
      };
  }
}

/**
 * Create role-based procedure middleware
 */
export function createRoleBasedProcedure(allowedRoles: UserRole[]) {
  return (ctx: TrpcContext) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
    }

    const userRole = (ctx.user.role as UserRole) || "user";

    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}. Your role: ${userRole}`,
      });
    }
  };
}

/**
 * Create permission-based procedure middleware
 */
export function createPermissionBasedProcedure(requiredPermission: string) {
  return (ctx: TrpcContext) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
    }

    const userRole = (ctx.user.role as UserRole) || "user";

    if (!hasPermission(userRole, requiredPermission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires the '${requiredPermission}' permission. Your role (${userRole}) does not have this permission.`,
      });
    }
  };
}
