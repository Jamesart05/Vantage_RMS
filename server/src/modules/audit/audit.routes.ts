import { Router } from "express";
import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { getPagination, buildMeta } from "../../utils/pagination";

export const auditRouter = Router();
auditRouter.use(requireAuth, requireOrganization);

auditRouter.get(
  "/",
  requirePermission({ auditlog: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);

    const where: Prisma.AuditLogWhereInput = {
      organizationId: req.organizationId,
      ...(req.query.resource ? { resource: String(req.query.resource) } : {}),
      ...(req.query.userId ? { userId: String(req.query.userId) } : {}),
      ...(req.query.from || req.query.to
        ? {
            createdAt: {
              ...(req.query.from ? { gte: new Date(String(req.query.from)) } : {}),
              ...(req.query.to ? { lte: new Date(String(req.query.to)) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.auditLog.count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  })
);
