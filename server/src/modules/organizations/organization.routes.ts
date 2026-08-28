import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { auditFromRequest } from "../../lib/audit";

export const organizationRouter = Router();

/** GET /organizations — every organization the signed-in user belongs to (for an org switcher). */
organizationRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await prisma.member.findMany({
      where: { userId: req.user!.id },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return ok(
      res,
      memberships.map((m: (typeof memberships)[number]) => ({ ...m.organization, role: m.role, memberId: m.id }))
    );
  })
);

/** POST /organizations/active — switch which org subsequent requests operate on. */
organizationRouter.post(
  "/active",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { organizationId } = z.object({ organizationId: z.string() }).parse(req.body);

    const member = await prisma.member.findFirst({ where: { organizationId, userId: req.user!.id } });
    if (!member) throw ApiError.forbidden("You are not a member of this organization.");

    await prisma.session.update({
      where: { id: req.session!.id },
      data: { activeOrganizationId: organizationId },
    });

    return ok(res, { organizationId });
  })
);

organizationRouter.use(requireAuth, requireOrganization);

/** GET /organizations/current — the active organization's details. */
organizationRouter.get(
  "/current",
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: req.organizationId } });
    return ok(res, { ...org, role: req.member!.role });
  })
);

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  logo: z.string().url().optional(),
});

/** PATCH /organizations/current — rename the company / update its logo. */
organizationRouter.patch(
  "/current",
  requirePermission({ organization: ["update"] }),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const org = await prisma.organization.update({ where: { id: req.organizationId }, data: input });
    await auditFromRequest(req)("organization.updated", "Organization", org.id, input);
    return ok(res, org);
  })
);
