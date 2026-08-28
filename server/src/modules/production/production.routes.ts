import { Router } from "express";
import { z } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildMeta, getSort } from "../../utils/pagination";
import { auditFromRequest } from "../../lib/audit";

export const productionRouter = Router();
productionRouter.use(requireAuth, requireOrganization);

const createSchema = z.object({
  productId: z.string().cuid(),
  batchNumber: z.string().max(60).optional(),
  quantity: z.coerce.number().positive(),
  notes: z.string().max(1000).optional(),
});

productionRouter.get(
  "/",
  requirePermission({ production: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const orderBy = getSort(req, ["createdAt", "quantity"], { createdAt: "desc" });

    const where: Prisma.ProductionWhereInput = {
      organizationId: req.organizationId,
      ...(req.query.status ? { status: req.query.status as never } : {}),
      ...(req.query.productId ? { productId: String(req.query.productId) } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.production.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { product: { select: { id: true, name: true, unit: true } } },
      }),
      prisma.production.count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  })
);

productionRouter.get(
  "/:id",
  requirePermission({ production: ["read"] }),
  asyncHandler(async (req, res) => {
    const batch = await prisma.production.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { product: true },
    });
    if (!batch) throw ApiError.notFound("Production batch not found.");
    return ok(res, batch);
  })
);

productionRouter.post(
  "/",
  requirePermission({ production: ["create"] }),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const product = await prisma.product.findFirst({
      where: { id: input.productId, organizationId: req.organizationId },
    });
    if (!product) throw ApiError.badRequest("Product not found.");

    const batch = await prisma.production.create({
      data: { ...input, organizationId: req.organizationId!, status: "PLANNED" },
      include: { product: true },
    });

    await auditFromRequest(req)("production.created", "Production", batch.id, input);
    return created(res, batch);
  })
);

async function requireBatch(id: string, organizationId: string) {
  const batch = await prisma.production.findFirst({ where: { id, organizationId } });
  if (!batch) throw ApiError.notFound("Production batch not found.");
  return batch;
}

productionRouter.post(
  "/:id/start",
  requirePermission({ production: ["update"] }),
  asyncHandler(async (req, res) => {
    const batch = await requireBatch(req.params.id, req.organizationId!);
    if (batch.status !== "PLANNED") throw ApiError.conflict("Only planned batches can be started.");

    const updated = await prisma.production.update({
      where: { id: batch.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    await auditFromRequest(req)("production.started", "Production", updated.id);
    return ok(res, updated);
  })
);

productionRouter.post(
  "/:id/complete",
  requirePermission({ production: ["update"] }),
  asyncHandler(async (req, res) => {
    const batch = await requireBatch(req.params.id, req.organizationId!);
    if (batch.status !== "IN_PROGRESS") throw ApiError.conflict("Only in-progress batches can be completed.");

    const organizationId = req.organizationId!;

    const updated = await prisma.$transaction(async (tx) => {
      const finished = await tx.production.update({
        where: { id: batch.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      const inventoryItem = await tx.inventoryItem.findFirst({
        where: { organizationId, productId: batch.productId },
      });
      if (inventoryItem) {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: Number(inventoryItem.quantity) + Number(batch.quantity) },
        });
      } else {
        const product = await tx.product.findUniqueOrThrow({ where: { id: batch.productId } });
        await tx.inventoryItem.create({
          data: {
            organizationId,
            productId: batch.productId,
            price: product.sellingPrice,
            quantity: batch.quantity,
            reorderLevel: 0,
          },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          organizationId,
          productId: batch.productId,
          type: "PRODUCTION_IN",
          quantity: Number(batch.quantity),
          referenceId: finished.id,
          note: `Completed production batch ${finished.batchNumber ?? finished.id}`,
        },
      });

      await auditFromRequest(req)("production.completed", "Production", finished.id, undefined, tx);
      return finished;
    });

    return ok(res, updated);
  })
);

productionRouter.post(
  "/:id/cancel",
  requirePermission({ production: ["update"] }),
  asyncHandler(async (req, res) => {
    const batch = await requireBatch(req.params.id, req.organizationId!);
    if (batch.status === "COMPLETED") throw ApiError.conflict("A completed batch cannot be cancelled.");

    const updated = await prisma.production.update({ where: { id: batch.id }, data: { status: "CANCELLED" } });
    await auditFromRequest(req)("production.cancelled", "Production", updated.id);
    return ok(res, updated);
  })
);
