import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc, ownerAc, memberAc } from "better-auth/plugins/organization/access";

/**
 * Every business resource in BusinessOS, and the actions that can be
 * performed on it. `defaultStatements` contributes the built-in
 * organization/member/invitation resources used by better-auth itself.
 */
export const statement = {
  ...defaultStatements,
  employee: ["create", "read", "update", "delete"],
  department: ["create", "read", "update", "delete"],
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  sale: ["create", "read", "update", "delete"],
  purchase: ["create", "read", "update", "delete", "receive"],
  supplier: ["create", "read", "update", "delete"],
  production: ["create", "read", "update", "delete"],
  finance: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
  auditlog: ["read"],
} as const;

export const ac = createAccessControl(statement);

const ALL_BUSINESS: Record<string, string[]> = {
  employee: ["create", "read", "update", "delete"],
  department: ["create", "read", "update", "delete"],
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  sale: ["create", "read", "update", "delete"],
  purchase: ["create", "read", "update", "delete", "receive"],
  supplier: ["create", "read", "update", "delete"],
  production: ["create", "read", "update", "delete"],
  finance: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read", "update"],
  auditlog: ["read"],
};

/** Owner — full access to everything, including org/member management. */
export const owner = ac.newRole({
  ...ALL_BUSINESS,
  ...ownerAc.statements,
} as never);

/** Administrator — full business access, can manage members but not delete the org. */
export const admin = ac.newRole({
  ...ALL_BUSINESS,
  ...adminAc.statements,
} as never);

/** General Manager — broad read/update access, limited destructive actions. */
export const manager = ac.newRole({
  employee: ["read", "update"],
  department: ["read"],
  product: ["create", "read", "update"],
  category: ["create", "read", "update"],
  inventory: ["read", "adjust"],
  sale: ["create", "read", "update"],
  purchase: ["create", "read", "update"],
  supplier: ["create", "read", "update"],
  production: ["create", "read", "update"],
  finance: ["read"],
  report: ["read", "export"],
  settings: ["read"],
  auditlog: ["read"],
  ...memberAc.statements,
} as never);

/** HR — full control over employees/departments, read-only elsewhere. */
export const hr = ac.newRole({
  employee: ["create", "read", "update", "delete"],
  department: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  settings: ["read"],
} as never);

/** Accountant — owns finance/payment status, reads sales/purchases and reports. */
export const accountant = ac.newRole({
  finance: ["create", "read", "update", "delete"],
  sale: ["read", "update"],
  purchase: ["read", "update"],
  supplier: ["read"],
  report: ["read", "export"],
  settings: ["read"],
} as never);

/** Storekeeper — owns products/inventory and receiving purchases. */
export const storekeeper = ac.newRole({
  product: ["create", "read", "update"],
  category: ["create", "read", "update"],
  inventory: ["read", "adjust"],
  purchase: ["read", "receive"],
  supplier: ["read"],
  production: ["create", "read", "update"],
  sale: ["read"],
  report: ["read"],
} as never);

/** Sales Manager — owns sales, reads products/inventory to sell against. */
export const salesManager = ac.newRole({
  sale: ["create", "read", "update"],
  product: ["read"],
  category: ["read"],
  inventory: ["read"],
  report: ["read", "export"],
} as never);

export const roles = { owner, admin, manager, hr, accountant, storekeeper, salesManager };

export type BusinessRole = keyof typeof roles;
export const BUSINESS_ROLES = Object.keys(roles) as BusinessRole[];

/**
 * Check whether a given org role has permission for a resource/action pair
 * without a network round-trip. Used by the `requirePermission` middleware.
 */
export function roleHasPermission(role: string, permissions: Record<string, string[]>): boolean {
  const roleDef = roles[role as BusinessRole];
  if (!roleDef) return false;
  const result = roleDef.authorize(permissions as never);
  return !!result?.success;
}
