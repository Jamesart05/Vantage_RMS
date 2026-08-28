import { Router } from "express";
import { z } from "zod";
import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization, requirePermission } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildMeta, getSort } from "../../utils/pagination";
import { auditFromRequest } from "../../lib/audit";

export const saleRouter = Router();
saleRouter.use(requireAuth, requireOrganization);

const SaleStatus = z.enum(["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"]);
const PaymentStatus = z.enum(["UNPAID", "PARTIAL", "PAID"]);

const saleItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  // Optional — defaults to the product's current selling price.
  unitPrice: z.coerce.number().nonnegative().optional(),
});

const createSaleSchema = z.object({
  invoiceNumber: z.string().max(60).optional(),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(30).optional(),
  status: SaleStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
  discount: z.coerce.number().nonnegative().optional(),
  tax: z.coerce.number().nonnegative().optional(),
  soldAt: z.coerce.date().optional(),
  items: z.array(saleItemSchema).min(1, "A sale needs at least one item."),
  /** Allow the sale to go through even if it would take stock negative. */
  allowNegativeStock: z.boolean().optional(),
});

const updateSaleSchema = z.object({
  status: SaleStatus.optional(),
  paymentStatus: PaymentStatus.optional(),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(30).optional(),
});

async function nextInvoiceNumber(organizationId: string) {
  const count = await prisma.sale.count({ where: { organizationId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

saleRouter.get(
  "/",
  requirePermission({ sale: ["read"] }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const orderBy = getSort(req, ["soldAt", "total", "createdAt"], { soldAt: "desc" });
    const search = String(req.query.search ?? "").trim();

    const where: Prisma.SaleWhereInput = {
      organizationId: req.organizationId,
      ...(req.query.status ? { status: req.query.status as never } : {}),
      ...(req.query.paymentStatus ? { paymentStatus: req.query.paymentStatus as never } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { customerName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } },
      }),
      prisma.sale.count({ where }),
    ]);

    return ok(res, rows, buildMeta(page, pageSize, total));
  })
);

saleRouter.get(
  "/summary",
  requirePermission({ sale: ["read"] }),
  asyncHandler(async (req, res) => {
    const organizationId = req.organizationId!;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todaySales, weekSales, overdueAgg, paidAgg] = await Promise.all([
      prisma.sale.aggregate({
        where: { organizationId, soldAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { organizationId, soldAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { organizationId, paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { organizationId, paymentStatus: "PAID" },
        _sum: { total: true },
      }),
    ]);

    return ok(res, {
      todaySales: todaySales._sum.total ?? 0,
      weeklyRevenue: weekSales._sum.total ?? 0,
      outstandingPayments: overdueAgg._sum.total ?? 0,
      totalPaid: paidAgg._sum.total ?? 0,
    });
  })
);

saleRouter.get(
  "/:id",
  requirePermission({ sale: ["read"] }),
  asyncHandler(async (req, res) => {
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { items: { include: { product: true } } },
    });
    if (!sale) throw ApiError.notFound("Sale not found.");
    return ok(res, sale);
  })
);

saleRouter.post(
  "/",
  requirePermission({ sale: ["create"] }),
  asyncHandler(async (req, res) => {
    const input = createSaleSchema.parse(req.body);
    const organizationId = req.organizationId!;

    const products = await prisma.product.findMany({
      where: { organizationId, id: { in: input.items.map((i) => i.productId) } },
      include: { inventory: true },
    });
    const productMap = new Map<string, (typeof products)[number]>(
      products.map((p: (typeof products)[number]) => [p.id, p] as const)
    );

    for (const item of input.items) {
      if (!productMap.has(item.productId)) {
        throw ApiError.badRequest(`Product ${item.productId} was not found in this organization.`);
      }
    }

    const lineItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice ?? Number(product.sellingPrice);
      const subtotal = unitPrice * item.quantity;
      return { ...item, unitPrice, subtotal, product };
    });

    const subtotal = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = input.discount ?? 0;
    const tax = input.tax ?? 0;
    const total = subtotal - discount + tax;

    if (!input.allowNegativeStock) {
      for (const item of lineItems) {
        const available = Number(item.product.inventory[0]?.quantity ?? 0);
        if (available < item.quantity) {
          throw ApiError.conflict(
            `Not enough stock for "${item.product.name}" — ${available} available, ${item.quantity} requested.`
          );
        }
      }
    }

    const invoiceNumber = input.invoiceNumber || (await nextInvoiceNumber(organizationId));

    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          organizationId,
          invoiceNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          status: input.status ?? "COMPLETED",
          paymentStatus: input.paymentStatus ?? "PAID",
          subtotal,
          discount,
          tax,
          total,
          soldAt: input.soldAt ?? new Date(),
          items: {
            create: lineItems.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      if (createdSale.status !== "CANCELLED") {
        for (const item of lineItems) {
          const inventoryItem = item.product.inventory[0];
          if (inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: Number(inventoryItem.quantity) - item.quantity },
            });
          }
          await tx.inventoryMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              type: "SALE",
              quantity: -item.quantity,
              referenceId: createdSale.id,
              note: `Sale ${invoiceNumber}`,
            },
          });
        }
      }

      if (createdSale.paymentStatus === "PAID") {
        await tx.financialTransaction.create({
          data: {
            organizationId,
            type: "INCOME",
            category: "Sales",
            description: `Sale ${invoiceNumber}`,
            amount: total,
            referenceId: createdSale.id,
            referenceType: "Sale",
            transactionDate: createdSale.soldAt,
          },
        });
      }

      await auditFromRequest(req)("sale.created", "Sale", createdSale.id, { invoiceNumber, total }, tx);

      return createdSale;
    });

    return created(res, sale);
  })
);

saleRouter.patch(
  "/:id",
  requirePermission({ sale: ["update"] }),
  asyncHandler(async (req, res) => {
    const input = updateSaleSchema.parse(req.body);
    const existing = await prisma.sale.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: { items: true },
    });
    if (!existing) throw ApiError.notFound("Sale not found.");

    const isCancelling =
      input.status && ["CANCELLED", "REFUNDED"].includes(input.status) && !["CANCELLED", "REFUNDED"].includes(existing.status);

    const updated = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.update({ where: { id: existing.id }, data: input });

      if (isCancelling) {
        for (const item of existing.items) {
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: { organizationId: req.organizationId, productId: item.productId },
          });
          if (inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: Number(inventoryItem.quantity) + Number(item.quantity) },
            });
          }
          await tx.inventoryMovement.create({
            data: {
              organizationId: req.organizationId!,
              productId: item.productId,
              type: "RETURN",
              quantity: Number(item.quantity),
              referenceId: sale.id,
              note: `Reversal for ${sale.invoiceNumber} (${input.status})`,
            },
          });
        }
      }

      await auditFromRequest(req)("sale.updated", "Sale", sale.id, input, tx);
      return sale;
    });

    return ok(res, updated);
  })
);
