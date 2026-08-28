import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { auditFromRequest } from "../../lib/audit";
import { BUSINESS_ROLES } from "../../lib/permissions";

export const memberRouter = Router();
memberRouter.use(requireAuth, requireOrganization);

/**
 * Member creation happens through better-auth's own invitation flow
 * (POST /api/auth/organization/invite-member, then the invitee accepts via
 * /api/auth/organization/accept-invitation) so that email delivery, invite
 * expiry, and duplicate-user checks stay centralized in the auth layer.
 * This module covers reading the roster and the business-specific actions
 * of changing a member's BusinessOS role or removing them.
 */

memberRouter.get(
  "/",
  requirePermission({ member: ["read"] }),
  asyncHandler(async (req, res) => {
    const members = await prisma.member.findMany({
      where: { organizationId: req.organizationId },
      include: { user: { select: { id: true, name: true, email: true, image: true, lastActiveAt: true } } },
      orderBy: { createdAt: "asc" },
    });
    return ok(res, members);
  })
);

memberRouter.get(
  "/invitations",
  requirePermission({ invitation: ["read"] }),
  asyncHandler(async (req, res) => {
    const invitations = await prisma.invitation.findMany({
      where: { organizationId: req.organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, invitations);
  })
);

const updateRoleSchema = z.object({ role: z.enum(BUSINESS_ROLES as [string, ...string[]]) });

memberRouter.patch(
  "/:id/role",
  requirePermission({ member: ["update"] }),
  asyncHandler(async (req, res) => {
    const { role } = updateRoleSchema.parse(req.body);

    const target = await prisma.member.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!target) throw ApiError.notFound("Member not found.");

    if (target.role === "owner" && role !== "owner") {
      const ownerCount = await prisma.member.count({ where: { organizationId: req.organizationId, role: "owner" } });
      if (ownerCount <= 1) {
        throw ApiError.conflict("An organization must always have at least one owner.");
      }
    }

    const updated = await prisma.member.update({ where: { id: target.id }, data: { role } });
    await auditFromRequest(req)("member.role.updated", "Member", updated.id, { role });
    return ok(res, updated);
  })
);

memberRouter.delete(
  "/:id",
  requirePermission({ member: ["delete"] }),
  asyncHandler(async (req, res) => {
    const target = await prisma.member.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!target) throw ApiError.notFound("Member not found.");

    if (target.userId === req.user?.id) {
      throw ApiError.badRequest("You can't remove yourself from the organization. Ask another owner to do it.");
    }

    if (target.role === "owner") {
      const ownerCount = await prisma.member.count({ where: { organizationId: req.organizationId, role: "owner" } });
      if (ownerCount <= 1) {
        throw ApiError.conflict("An organization must always have at least one owner.");
      }
    }

    await prisma.member.delete({ where: { id: target.id } });
    await auditFromRequest(req)("member.removed", "Member", target.id);
    res.status(204).send();
  })
);
