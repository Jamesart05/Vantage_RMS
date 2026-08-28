import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { createCrudController } from "../../utils/crudFactory";

const createSchema = z.object({ name: z.string().min(1).max(120) });
const updateSchema = createSchema.partial();

const controller = createCrudController({
  resourceName: "ProductCategory",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: () => prisma.productCategory as any,
  createSchema,
  updateSchema,
  sortableFields: ["name", "createdAt"],
  defaultSort: { name: "asc" },
  searchWhere: (search) => ({ name: { contains: search, mode: "insensitive" } }),
  include: { _count: { select: { products: true } } },
});

export const categoryRouter = Router();
categoryRouter.use(requireAuth, requireOrganization);

categoryRouter.get("/", requirePermission({ category: ["read"] }), controller.list);
categoryRouter.get("/:id", requirePermission({ category: ["read"] }), controller.getOne);
categoryRouter.post("/", requirePermission({ category: ["create"] }), controller.create);
categoryRouter.patch("/:id", requirePermission({ category: ["update"] }), controller.update);
categoryRouter.delete("/:id", requirePermission({ category: ["delete"] }), controller.remove);
