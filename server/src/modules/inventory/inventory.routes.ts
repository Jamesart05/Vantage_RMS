import { Router } from "express";
import { z } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildMeta } from "../../utils/pagination";
import { auditFromRequest } from "../../lib/audit";

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth, requireOrganization);

/** GET /inventory — stock levels per product. `?lowStock=true` filters to at/under reorder level. */
inventoryRouter.get(
  "/",
  requirePermission({ inventory: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const search = String(req.query.search ?? "").trim();

    const where: Prisma.InventoryItemWhereInput = {
      organizationId: req.organizationId,
      ...(search
        ? { product: { is: { name: { contains: search, mode: "insensitive" } } } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: { product: { select: { id: true, name: true, sku: true, unit: true, sellingPrice: true } } },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    const lowStockOnly = String(req.query.lowStock ?? "") === "true";
    const filtered = lowStockOnly
      ? items.filter((i: (typeof items)[number]) => Number(i.quantity) <= Number(i.reorderLevel))
      : items;

    return ok(res, filtered, buildMeta(page, pageSize, total));
  })
);

/** GET /inventory/summary — counts for the dashboard (in-stock / low-stock / out-of-stock, total value). */
inventoryRouter.get(
  "/summary",
  requirePermission({ inventory: ["read"] }),
  asyncHandler(async (req, res) => {
    const items = await prisma.inventoryItem.findMany({ where: { organizationId: req.organizationId } });

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    for (const item of items) {
      const qty = Number(item.quantity);
      const reorder = Number(item.reorderLevel);
      totalValue += qty * Number(item.price);
      if (qty <= 0) outOfStock += 1;
      else if (qty <= reorder) lowStock += 1;
      else inStock += 1;
    }

    return ok(res, { inStock, lowStock, outOfStock, totalValue, totalProducts: items.length });
  })
);

/** GET /inventory/movements — audit trail of stock changes. */
inventoryRouter.get(
  "/movements",
  requirePermission({ inventory: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const where: Prisma.InventoryMovementWhereInput = {
      organizationId: req.organizationId,
      ...(req.query.productId ? { productId: String(req.query.productId) } : {}),
      ...(req.query.type ? { type: req.query.type as never } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  })
);

const adjustSchema = z.object({
  productId: z.string().cuid(),
  type: z.enum(["ADJUSTMENT", "RETURN"]),
  // Positive to increase stock, negative to decrease. Required non-zero.
  quantity: z.coerce.number().refine((n) => n !== 0, "quantity must not be zero"),
  note: z.string().max(500).optional(),
});

/** POST /inventory/adjust — manual stock correction, fully audit-logged. */
inventoryRouter.post(
  "/adjust",
  requirePermission({ inventory: ["adjust"] }),
  asyncHandler(async (req, res) => {
    const input = adjustSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { organizationId: req.organizationId, productId: input.productId },
      });
      if (!item) throw ApiError.notFound("No inventory record for this product yet.");

      const newQuantity = Number(item.quantity) + input.quantity;
      if (newQuantity < 0) {
        throw ApiError.badRequest("Adjustment would result in negative stock.");
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: newQuantity },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          organizationId: req.organizationId!,
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
          note: input.note,
        },
      });

      await auditFromRequest(req)(
        "inventory.adjusted",
        "InventoryItem",
        item.id,
        { type: input.type, quantity: input.quantity, note: input.note },
        tx
      );

      return { inventory: updated, movement };
    });

    return ok(res, result);
  })
);

/** POST /inventory/transfer — placeholder for multi-branch transfer (recorded as a movement note; branches aren't modeled yet). */
const transferSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  destination: z.string().min(1).max(200),
  note: z.string().max(500).optional(),
});
inventoryRouter.post(
  "/transfer",
  requirePermission({ inventory: ["adjust"] }),
  asyncHandler(async (req, res) => {
    const input = transferSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { organizationId: req.organizationId, productId: input.productId },
      });
      if (!item) throw ApiError.notFound("No inventory record for this product yet.");
      if (Number(item.quantity) < input.quantity) {
        throw ApiError.badRequest("Not enough stock on hand to transfer that quantity.");
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: Number(item.quantity) - input.quantity },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          organizationId: req.organizationId!,
          productId: input.productId,
          type: "ADJUSTMENT",
          quantity: -Math.abs(input.quantity),
          note: `Transfer to ${input.destination}${input.note ? ` — ${input.note}` : ""}`,
        },
      });

      await auditFromRequest(req)("inventory.transferred", "InventoryItem", item.id, input, tx);

      return { inventory: updated, movement };
    });

    return ok(res, result);
  })
);
