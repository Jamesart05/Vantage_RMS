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

export const financeRouter = Router();
financeRouter.use(requireAuth, requireOrganization);

const TransactionType = z.enum(["INCOME", "EXPENSE"]);

const createSchema = z.object({
  type: TransactionType,
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.coerce.number().positive(),
  transactionDate: z.coerce.date().optional(),
});

financeRouter.get(
  "/",
  requirePermission({ finance: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const orderBy = getSort(req, ["transactionDate", "amount", "createdAt"], { transactionDate: "desc" });

    const where: Prisma.FinancialTransactionWhereInput = {
      organizationId: req.organizationId,
      ...(req.query.type ? { type: req.query.type as never } : {}),
      ...(req.query.category ? { category: String(req.query.category) } : {}),
      ...(req.query.from || req.query.to
        ? {
            transactionDate: {
              ...(req.query.from ? { gte: new Date(String(req.query.from)) } : {}),
              ...(req.query.to ? { lte: new Date(String(req.query.to)) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.financialTransaction.findMany({ where, orderBy, skip, take }),
      prisma.financialTransaction.count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  })
);

financeRouter.get(
  "/summary",
  requirePermission({ finance: ["read"] }),
  asyncHandler(async (req, res) => {
    const organizationId = req.organizationId!;
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.financialTransaction.aggregate({ where: { organizationId, type: "INCOME" }, _sum: { amount: true } }),
      prisma.financialTransaction.aggregate({ where: { organizationId, type: "EXPENSE" }, _sum: { amount: true } }),
    ]);
    const income = Number(incomeAgg._sum.amount ?? 0);
    const expense = Number(expenseAgg._sum.amount ?? 0);
    return ok(res, { income, expense, net: income - expense });
  })
);

financeRouter.post(
  "/",
  requirePermission({ finance: ["create"] }),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const row = await prisma.financialTransaction.create({
      data: { ...input, organizationId: req.organizationId! },
    });
    await auditFromRequest(req)("finance.created", "FinancialTransaction", row.id, input);
    return created(res, row);
  })
);

financeRouter.delete(
  "/:id",
  requirePermission({ finance: ["delete"] }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.financialTransaction.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!existing) throw ApiError.notFound("Transaction not found.");
    if (existing.referenceType) {
      throw ApiError.conflict("This transaction was generated automatically and cannot be deleted directly.");
    }
    await prisma.financialTransaction.delete({ where: { id: existing.id } });
    await auditFromRequest(req)("finance.deleted", "FinancialTransaction", existing.id);
    res.status(204).send();
  })
);
