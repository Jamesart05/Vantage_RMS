import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { createCrudController } from "../../utils/crudFactory";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
});
const updateSchema = createSchema.partial();

const controller = createCrudController({
  resourceName: "Department",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: () => prisma.department as any,
  createSchema,
  updateSchema,
  sortableFields: ["name", "createdAt"],
  defaultSort: { name: "asc" },
  searchWhere: (search) => ({ name: { contains: search, mode: "insensitive" } }),
  include: { _count: { select: { employees: true } } },
});

export const departmentRouter = Router();
departmentRouter.use(requireAuth, requireOrganization);

departmentRouter.get("/", requirePermission({ department: ["read"] }), controller.list);
departmentRouter.get("/:id", requirePermission({ department: ["read"] }), controller.getOne);
departmentRouter.post("/", requirePermission({ department: ["create"] }), controller.create);
departmentRouter.patch("/:id", requirePermission({ department: ["update"] }), controller.update);
departmentRouter.delete("/:id", requirePermission({ department: ["delete"] }), controller.remove);
