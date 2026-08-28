import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth, requireOrganization } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, requireOrganization);

/** GET /dashboard/overview — everything the BusinessOS dashboard screen needs, in one call. */
dashboardRouter.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const organizationId = req.organizationId!;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      todaySalesAgg,
      weekSalesAgg,
      outstandingAgg,
      inventoryItems,
      pendingPurchaseCount,
      employeeCount,
      recentSales,
      recentAudit,
      salesLast14Days,
    ] = await Promise.all([
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
      prisma.inventoryItem.findMany({
        where: { organizationId },
        include: { product: { select: { id: true, name: true, sku: true } } },
      }),
      prisma.purchase.count({ where: { organizationId, status: "PENDING" } }),
      prisma.employee.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.sale.findMany({
        where: { organizationId },
        orderBy: { soldAt: "desc" },
        take: 5,
        include: { items: { include: { product: { select: { name: true } } } } },
      }),
      prisma.auditLog.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.sale.findMany({
        where: { organizationId, soldAt: { gte: fourteenDaysAgo }, status: { not: "CANCELLED" } },
        select: { soldAt: true, total: true },
      }),
    ]);

    let inventoryValue = 0;
    let lowStockCount = 0;
    const lowStockItems: unknown[] = [];
    for (const item of inventoryItems) {
      const qty = Number(item.quantity);
      const reorder = Number(item.reorderLevel);
      inventoryValue += qty * Number(item.price);
      if (qty <= reorder) {
        lowStockCount += 1;
        lowStockItems.push(item);
      }
    }

    // Bucket the last 14 days of sales into a day-by-day trend, matching the
    // BusinessOS dashboard's "Sales Trend" chart.
    const trendMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const sale of salesLast14Days) {
      const key = sale.soldAt.toISOString().slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + Number(sale.total));
    }
    const salesTrend = Array.from(trendMap.entries()).map(([date, total]) => ({ date, total }));

    // Top products by revenue within the last 14 days.
    const revenueByProduct = new Map<string, { name: string; revenue: number }>();
    for (const sale of recentSales) {
      for (const item of sale.items) {
        const key = item.productId;
        const existing = revenueByProduct.get(key) ?? { name: item.product.name, revenue: 0 };
        existing.revenue += Number(item.subtotal);
        revenueByProduct.set(key, existing);
      }
    }
    const topProducts = Array.from(revenueByProduct.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return ok(res, {
      kpis: {
        todaySales: todaySalesAgg._sum.total ?? 0,
        weeklyRevenue: weekSalesAgg._sum.total ?? 0,
        inventoryValue,
        outstandingPayments: outstandingAgg._sum.total ?? 0,
        employeeCount,
        pendingPurchaseOrders: pendingPurchaseCount,
      },
      lowStock: { count: lowStockCount, items: lowStockItems },
      salesTrend,
      topProducts,
      recentSales,
      recentActivity: recentAudit,
    });
  })
);
