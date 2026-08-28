import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { auditFromRequest } from "../../lib/audit";

export const settingsRouter = Router();
settingsRouter.use(requireAuth, requireOrganization);

const updateSchema = z.object({
  timezone: z.string().min(1).max(60).optional(),
  currency: z.string().length(3).optional(),
  dateFormat: z.string().min(1).max(20).optional(),
});

settingsRouter.get(
  "/",
  requirePermission({ settings: ["read"] }),
  asyncHandler(async (req, res) => {
    const settings = await prisma.organizationSettings.upsert({
      where: { organizationId: req.organizationId },
      update: {},
      create: { organizationId: req.organizationId! },
    });
    return ok(res, settings);
  })
);

settingsRouter.patch(
  "/",
  requirePermission({ settings: ["update"] }),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const settings = await prisma.organizationSettings.upsert({
      where: { organizationId: req.organizationId },
      update: input,
      create: { organizationId: req.organizationId!, ...input },
    });
    await auditFromRequest(req)("settings.updated", "OrganizationSettings", settings.id, input);
    return ok(res, settings);
  })
);
