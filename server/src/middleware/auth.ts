import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { roleHasPermission } from "../lib/permissions";

/**
 * Verifies the caller has a valid better-auth session and attaches
 * `req.user` / `req.session`. Does NOT require an active organization —
 * use `requireOrganization` after this for org-scoped routes.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!result?.session || !result.user) {
    throw ApiError.unauthorized("You must be signed in to access this resource.");
  }

  req.user = result.user as never;
  req.session = {
    id: result.session.id,
    userId: result.session.userId,
    activeOrganizationId: result.session.activeOrganizationId,
    expiresAt: result.session.expiresAt,
  };

  next();
});

/**
 * Resolves the organization this request operates on and confirms the
 * caller is a member of it. Resolution order:
 *   1. `x-organization-id` header (lets a user with multiple orgs pick one)
 *   2. the session's `activeOrganizationId`
 * Attaches `req.organizationId` and `req.member`.
 */
export const requireOrganization = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !req.session) {
    throw ApiError.unauthorized();
  }

  const requestedOrgId = (req.header("x-organization-id") || req.session.activeOrganizationId) ?? null;

  if (!requestedOrgId) {
    throw ApiError.badRequest(
      "No organization selected. Create a company first, or pass an X-Organization-Id header."
    );
  }

  const member = await prisma.member.findFirst({
    where: { organizationId: requestedOrgId, userId: req.user.id },
  });

  if (!member) {
    throw ApiError.forbidden("You are not a member of this organization.");
  }

  req.organizationId = requestedOrgId;
  req.member = member;

  next();
});

/**
 * Gate a route behind one or more resource:action permissions, checked
 * against the caller's org role (see src/lib/permissions.ts). Usage:
 *   router.post("/", requirePermission({ employee: ["create"] }), ...)
 */
export function requirePermission(permissions: Record<string, string[]>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.member) {
      return next(ApiError.unauthorized());
    }
    if (!roleHasPermission(req.member.role, permissions)) {
      return next(ApiError.forbidden("Your role does not have permission to perform this action."));
    }
    next();
  };
}

/** Convenience combination for the common case of every org-scoped route. */
export const requireAuthAndOrg = [requireAuth, requireOrganization];
