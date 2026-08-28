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

export const purchaseRouter = Router();
purchaseRouter.use(requireAuth, requireOrganization);

const PurchaseStatus = z.enum(["PENDING", "RECEIVED", "CANCELLED"]);
const PaymentStatus = z.enum(["UNPAID", "PARTIAL", "PAID"]);

const purchaseItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

const createPurchaseSchema = z.object({
  supplierId: z.string().cuid(),
  referenceNumber: z.string().max(60).optional(),
  paymentStatus: PaymentStatus.optional(),
  purchasedAt: z.coerce.date().optional(),
  items: z.array(purchaseItemSchema).min(1, "A purchase order needs at least one item."),
});

const updatePurchaseSchema = z.object({
  status: PurchaseStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
});

async function nextReferenceNumber(organizationId: string) {
  const count = await prisma.purchase.count({ where: { organizationId } });
  return `PO-${String(count + 1).padStart(4, "0")}`;
}

purchaseRouter.get(
  "/",
  requirePermission({ purchase: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const orderBy = getSort(req, ["purchasedAt", "total", "createdAt"], { purchasedAt: "desc" });
    const search = String(req.query.search ?? "").trim();

    const where: Prisma.PurchaseWhereInput = {
      organizationId: req.organizationId,
      ...(req.query.status ? { status: req.query.status as never } : {}),
      ...(req.query.paymentStatus ? { paymentStatus: req.query.paymentStatus as never } : {}),
      ...(search
        ? {
            OR: [
              { referenceNumber: { contains: search, mode: "insensitive" } },
              { supplier: { is: { name: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { supplier: { select: { id: true, name: true } }, items: true },
      }),
      prisma.purchase.count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  })
);

purchaseRouter.get(
  "/:id",
  requirePermission({ purchase: ["read"] }),
  asyncHandler(async (req, res) => {
    const purchase = await prisma.purchase.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { supplier: true, items: true },
    });
    if (!purchase) throw ApiError.notFound("Purchase order not found.");
    return ok(res, purchase);
  })
);

purchaseRouter.post(
  "/",
  requirePermission({ purchase: ["create"] }),
  asyncHandler(async (req, res) => {
    const input = createPurchaseSchema.parse(req.body);
    const organizationId = req.organizationId!;

    const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, organizationId } });
    if (!supplier) throw ApiError.badRequest("Supplier not found.");

    const productIds = input.items.map((i) => i.productId);
    const productCount = await prisma.product.count({ where: { organizationId, id: { in: productIds } } });
    if (productCount !== new Set(productIds).size) {
      throw ApiError.badRequest("One or more products were not found in this organization.");
    }

    const lineItems = input.items.map((item) => ({ ...item, subtotal: item.quantity * item.unitCost }));
    const subtotal = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
    const total = subtotal; // no separate tax/discount modeled on Purchase

    const referenceNumber = input.referenceNumber || (await nextReferenceNumber(organizationId));

    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.purchase.create({
        data: {
          organizationId,
          supplierId: input.supplierId,
          referenceNumber,
          paymentStatus: input.paymentStatus ?? "UNPAID",
          subtotal,
          total,
          purchasedAt: input.purchasedAt ?? new Date(),
          items: { create: lineItems },
        },
        include: { items: true, supplier: true },
      });

      await auditFromRequest(req)("purchase.created", "Purchase", createdPurchase.id, { referenceNumber, total }, tx);

      return createdPurchase;
    });

    return created(res, purchase);
  })
);

purchaseRouter.patch(
  "/:id",
  requirePermission({ purchase: ["update"] }),
  asyncHandler(async (req, res) => {
    const input = updatePurchaseSchema.parse(req.body);
    const existing = await prisma.purchase.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!existing) throw ApiError.notFound("Purchase order not found.");
    if (existing.status === "RECEIVED" && input.status && input.status !== "RECEIVED") {
      throw ApiError.conflict("A received purchase order's status can no longer be changed directly.");
    }

    const purchase = await prisma.purchase.update({ where: { id: existing.id }, data: input });
    await auditFromRequest(req)("purchase.updated", "Purchase", purchase.id, input);
    return ok(res, purchase);
  })
);

/** POST /purchases/:id/receive — marks goods received and increases inventory for each line item. */
purchaseRouter.post(
  "/:id/receive",
  requirePermission({ purchase: ["receive"] }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.purchase.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { items: true },
    });
    if (!existing) throw ApiError.notFound("Purchase order not found.");
    if (existing.status === "RECEIVED") throw ApiError.conflict("This purchase order was already received.");
    if (existing.status === "CANCELLED") throw ApiError.conflict("A cancelled purchase order cannot be received.");

    const organizationId = req.organizationId!;

    const purchase = await prisma.$transaction(async (tx) => {
      const updatedPurchase = await tx.purchase.update({
        where: { id: existing.id },
        data: { status: "RECEIVED" },
        include: { items: true, supplier: true },
      });

      for (const item of existing.items) {
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: { organizationId, productId: item.productId },
        });

        if (inventoryItem) {
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: Number(inventoryItem.quantity) + Number(item.quantity) },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              organizationId,
              productId: item.productId,
              price: item.unitCost,
              quantity: item.quantity,
              reorderLevel: 0,
            },
          });
        }

        await tx.inventoryMovement.create({
          data: {
            organizationId,
            productId: item.productId,
            type: "PURCHASE",
            quantity: Number(item.quantity),
            referenceId: updatedPurchase.id,
            note: `Received against ${updatedPurchase.referenceNumber}`,
          },
        });
      }

      if (updatedPurchase.paymentStatus === "PAID") {
        await tx.financialTransaction.create({
          data: {
            organizationId,
            type: "EXPENSE",
            category: "Purchases",
            description: `Purchase ${updatedPurchase.referenceNumber}`,
            amount: updatedPurchase.total,
            referenceId: updatedPurchase.id,
            referenceType: "Purchase",
          },
        });
      }

      await auditFromRequest(req)("purchase.received", "Purchase", updatedPurchase.id, undefined, tx);

      return updatedPurchase;
    });

    return ok(res, purchase);
  })
);
