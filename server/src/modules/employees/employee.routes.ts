import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { createCrudController } from "../../utils/crudFactory";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { ok } from "../../utils/ApiResponse";
import { auditFromRequest } from "../../lib/audit";

const EmploymentType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]);
const EmployeeStatus = z.enum(["ACTIVE", "INACTIVE", "TERMINATED", "INVITED", "ON_LEAVE"]);

const createSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  employeeNumber: z.string().max(50).optional(),
  departmentId: z.string().cuid().optional(),
  position: z.string().max(120).optional(),
  employmentType: EmploymentType.optional(),
  status: EmployeeStatus.optional(),
  dateOfBirth: z.coerce.date().optional(),
  hireDate: z.coerce.date().optional(),
});
const updateSchema = createSchema.partial().extend({
  terminationDate: z.coerce.date().optional(),
});

const controller = createCrudController({
  resourceName: "Employee",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delegate: () => prisma.employee as any,
  createSchema,
  updateSchema,
  sortableFields: ["firstName", "lastName", "hireDate", "createdAt"],
  defaultSort: { createdAt: "desc" },
  searchWhere: (search) => ({
    OR: [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { employeeNumber: { contains: search, mode: "insensitive" } },
    ],
  }),
  filterWhere: (req) => {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.departmentId) where.departmentId = req.query.departmentId;
    if (req.query.employmentType) where.employmentType = req.query.employmentType;
    return where;
  },
  include: { department: { select: { id: true, name: true } } },
});

export const employeeRouter = Router();
employeeRouter.use(requireAuth, requireOrganization);

employeeRouter.get("/", requirePermission({ employee: ["read"] }), controller.list);
employeeRouter.get("/:id", requirePermission({ employee: ["read"] }), controller.getOne);
employeeRouter.post("/", requirePermission({ employee: ["create"] }), controller.create);
employeeRouter.patch("/:id", requirePermission({ employee: ["update"] }), controller.update);
employeeRouter.delete("/:id", requirePermission({ employee: ["delete"] }), controller.remove);

employeeRouter.post(
  "/:id/terminate",
  requirePermission({ employee: ["update"] }),
  asyncHandler(async (req, res) => {
    const { effectiveDate } = z.object({ effectiveDate: z.coerce.date().optional() }).parse(req.body ?? {});

    const existing = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!existing) throw ApiError.notFound("Employee not found.");

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { status: "TERMINATED", terminationDate: effectiveDate ?? new Date() },
    });

    await auditFromRequest(req)("employee.terminated", "Employee", employee.id);
    return ok(res, employee);
  })
);

employeeRouter.post(
  "/:id/reactivate",
  requirePermission({ employee: ["update"] }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!existing) throw ApiError.notFound("Employee not found.");

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { status: "ACTIVE", terminationDate: null },
    });

    await auditFromRequest(req)("employee.reactivated", "Employee", employee.id);
    return ok(res, employee);
  })
);
