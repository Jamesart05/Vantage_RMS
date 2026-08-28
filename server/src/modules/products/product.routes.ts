import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { createCrudController } from "../../utils/crudFactory";
import { ApiError } from "../../utils/ApiError";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  categoryId: z.string().cuid().optional(),
  unit: z.string().min(1).max(30),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  isActive: z.boolean().optional(),
  // Optional initial stock — if provided, seeds the auto-created InventoryItem.
  openingQuantity: z.coerce.number().nonnegative().optional(),
  reorderLevel: z.coerce.number().nonnegative().optional(),
});
const updateSchema = createSchema.omit({ openingQuantity: true, reorderLevel: true }).partial();

const controller = createCrudController({
  resourceName: "Product",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: () => prisma.product as any,
  createSchema,
  updateSchema,
  sortableFields: ["name", "sellingPrice", "createdAt"],
  defaultSort: { createdAt: "desc" },
  searchWhere: (search) => ({
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ],
  }),
  filterWhere: (req) => {
    const where: Record<string, unknown> = {};
    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === "true";
    return where;
  },
  include: {
    category: { select: { id: true, name: true } },
    inventory: { select: { quantity: true, reorderLevel: true, price: true } },
  },
  beforeCreate: (data) => {
    const { openingQuantity, reorderLevel, ...rest } = data;
    void openingQuantity;
    void reorderLevel;
    return rest;
  },
  afterCreate: async (record, req) => {
    const product = record as { id: string; sellingPrice: unknown };
    const body = req.body as { openingQuantity?: number; reorderLevel?: number };
    await prisma.inventoryItem.create({
      data: {
        organizationId: req.organizationId!,
        productId: product.id,
        price: product.sellingPrice as never,
        quantity: body.openingQuantity ?? 0,
        reorderLevel: body.reorderLevel ?? 0,
      },
    });
  },
  beforeDelete: async (existing) => {
    const product = existing as { id: string };
    const saleItemCount = await prisma.saleItem.count({ where: { productId: product.id } });
    if (saleItemCount > 0) {
      throw ApiError.conflict("This product has sales history and cannot be deleted. Mark it inactive instead.");
    }
  },
});

export const productRouter = Router();
productRouter.use(requireAuth, requireOrganization);

productRouter.get("/", requirePermission({ product: ["read"] }), controller.list);
productRouter.get("/:id", requirePermission({ product: ["read"] }), controller.getOne);
productRouter.post("/", requirePermission({ product: ["create"] }), controller.create);
productRouter.patch("/:id", requirePermission({ product: ["update"] }), controller.update);
productRouter.delete("/:id", requirePermission({ product: ["delete"] }), controller.remove);
