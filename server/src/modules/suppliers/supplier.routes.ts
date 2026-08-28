import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { createCrudController } from "../../utils/crudFactory";
import { ApiError } from "../../utils/ApiError";

const PaymentStatus = z.enum(["UNPAID", "PARTIAL", "PAID"]);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  status: PaymentStatus.optional(),
});
const updateSchema = createSchema.partial();

const controller = createCrudController({
  resourceName: "Supplier",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: () => prisma.supplier as any,
  createSchema,
  updateSchema,
  sortableFields: ["name", "createdAt"],
  defaultSort: { name: "asc" },
  searchWhere: (search) => ({
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ],
  }),
  include: { _count: { select: { purchases: true } } },
  beforeDelete: async (existing) => {
    const supplier = existing as { id: string };
    const purchaseCount = await prisma.purchase.count({ where: { supplierId: supplier.id } });
    if (purchaseCount > 0) {
      throw ApiError.conflict("This supplier has purchase history and cannot be deleted.");
    }
  },
});

export const supplierRouter = Router();
supplierRouter.use(requireAuth, requireOrganization);

supplierRouter.get("/", requirePermission({ supplier: ["read"] }), controller.list);
supplierRouter.get("/:id", requirePermission({ supplier: ["read"] }), controller.getOne);
supplierRouter.post("/", requirePermission({ supplier: ["create"] }), controller.create);
supplierRouter.patch("/:id", requirePermission({ supplier: ["update"] }), controller.update);
supplierRouter.delete("/:id", requirePermission({ supplier: ["delete"] }), controller.remove);
