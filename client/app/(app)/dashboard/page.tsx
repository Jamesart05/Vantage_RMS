"use client";

import { TrendingUp, BarChart2, Box, AlertCircle, Package, Activity, ShoppingCart, PlusCircle, FilePlus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { InventoryDonutChart } from "@/components/dashboard/InventoryDonutChart";
import { getDashboardOverview, listPurchases } from "@/lib/queries";
import { fmtNGN, humanize, relativeTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import Link from "next/link";
import { PAGE_META } from "@/lib/nav";

async function loadDashboard() {
  const [overview, pendingPurchases] = await Promise.all([
    getDashboardOverview(),
    listPurchases({ status: "PENDING" }),
  ]);
  return { overview, pendingPurchases: pendingPurchases.rows.slice(0, 5) };
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-[110px] rounded-xl" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi(loadDashboard, []);

  return (
    <>
      <PageHeader
        title={PAGE_META.dashboard.title}
        desc={PAGE_META.dashboard.desc}
        actions={
          <>
            <Link href="/sales" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13.5px] font-semibold dark:border-white/10">
              <PlusCircle className="h-[15px] w-[15px]" /> Quick Action
            </Link>
            <Link href="/sales" className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-700 px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-brand-600">
              <FilePlus className="h-[15px] w-[15px]" /> New Invoice
            </Link>
          </>
        }
      />

      {loading && <KpiSkeleton />}

      {error && !loading && (
        <Card padded className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[13px] font-medium">{error}</span>
          </div>
          <button onClick={refetch} className="text-[12.5px] font-semibold text-brand-700 dark:text-brand-400">
            Retry
          </button>
        </Card>
      )}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Today's Sales" value={fmtNGN(data.overview.kpis.todaySales)} icon={TrendingUp} />
            <KpiCard label="Weekly Revenue" value={fmtNGN(data.overview.kpis.weeklyRevenue)} icon={BarChart2} />
            <KpiCard label="Inventory Value" value={fmtNGN(data.overview.kpis.inventoryValue)} icon={Box} />
            <KpiCard label="Outstanding Payments" value={fmtNGN(data.overview.kpis.outstandingPayments)} icon={AlertCircle} />
          </div>

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHead>
                <div>
                  <p className="text-[14.5px] font-bold">Sales Trend</p>
                  <p className="text-xs text-ink-muted">Last 14 days</p>
                </div>
              </CardHead>
              <SalesTrendChart data={data.overview.salesTrend} />
            </Card>
            <Card>
              <CardHead>
                <div>
                  <p className="text-[14.5px] font-bold">Low Stock Alerts</p>
                  <p className="text-xs text-ink-muted">{data.overview.lowStock.count} products need reordering</p>
                </div>
                <Link href="/inventory" className="text-[12.5px] font-semibold text-brand-700 dark:text-brand-400">
                  View all
                </Link>
              </CardHead>
              <div className="mt-2">
                {data.overview.lowStock.items.length === 0 ? (
                  <EmptyState title="Stock levels look healthy" desc="No products are at or below their reorder level right now." icon={Package} />
                ) : (
                  data.overview.lowStock.items.slice(0, 6).map((item, i) => (
                    <ListRow
                      key={item.id}
                      first={i === 0}
                      icon={Package}
                      iconBg={
                        Number(item.quantity) <= 0
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      }
                      title={item.product.name}
                      subtitle={`${item.quantity} in stock · min ${item.reorderLevel}`}
                      meta={<Badge status={Number(item.quantity) <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK"} />}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            <Card>
              <CardHead className="pb-0">
                <p className="text-[14.5px] font-bold">Revenue Trend</p>
              </CardHead>
              <RevenueBarChart
                data={(() => {
                  const points = data.overview.salesTrend;
                  const mid = Math.ceil(points.length / 2);
                  const sum = (arr: typeof points) => arr.reduce((s, p) => s + p.total, 0);
                  return [
                    { week: "Previous 7d", value: sum(points.slice(0, mid)) },
                    { week: "Last 7d", value: sum(points.slice(mid)) },
                  ];
                })()}
              />
            </Card>
            <Card>
              <CardHead className="pb-0">
                <p className="text-[14.5px] font-bold">Inventory Status</p>
              </CardHead>
              <InventoryDonutChart
                data={(() => {
                  const lowCount = data.overview.lowStock.count;
                  const outCount = data.overview.lowStock.items.filter((i) => Number(i.quantity) <= 0).length;
                  const lowOnly = Math.max(lowCount - outCount, 0);
                  return [
                    { name: "Low Stock", value: lowOnly, color: "#D9A441" },
                    { name: "Out of Stock", value: outCount, color: "#C0453A" },
                  ];
                })()}
              />
            </Card>
            <Card>
              <CardHead className="pb-0">
                <p className="text-[14.5px] font-bold">Top Selling Products</p>
              </CardHead>
              <div className="mt-2">
                {data.overview.topProducts.length === 0 ? (
                  <EmptyState desc="No sales recorded yet this period." icon={TrendingUp} />
                ) : (
                  data.overview.topProducts.map((p, i) => (
                    <div
                      key={p.name}
                      className={`flex items-center gap-3 px-5 py-2.5 ${i !== 0 ? "border-t border-slate-200 dark:border-white/10" : ""}`}
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 text-[12px] font-extrabold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold">{p.name}</div>
                      </div>
                      <div className="ml-auto whitespace-nowrap text-[12px] tabular-nums text-ink-muted">{fmtNGN(p.revenue)}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
            <Card>
              <CardHead>
                <p className="text-[14.5px] font-bold">Recent Activity</p>
                <Link href="/notifications" className="text-[12.5px] font-semibold text-brand-700 dark:text-brand-400">
                  View log
                </Link>
              </CardHead>
              <div className="mt-2">
                {data.overview.recentActivity.length === 0 ? (
                  <EmptyState desc="Nothing has happened yet — actions across BusinessOS will show up here." icon={Activity} />
                ) : (
                  data.overview.recentActivity.map((a, i) => (
                    <ListRow
                      key={a.id}
                      first={i === 0}
                      icon={Activity}
                      title={`${humanize(a.action)}${a.resourceId ? ` — ${a.resource}` : ""}`}
                      meta={relativeTime(a.createdAt)}
                    />
                  ))
                )}
              </div>
            </Card>
            <Card>
              <CardHead>
                <p className="text-[14.5px] font-bold">Pending Purchase Orders</p>
                <Link href="/purchases" className="text-[12.5px] font-semibold text-brand-700 dark:text-brand-400">
                  View all
                </Link>
              </CardHead>
              <div className="mt-2">
                {data.pendingPurchases.length === 0 ? (
                  <EmptyState desc="No purchase orders are waiting right now." icon={ShoppingCart} />
                ) : (
                  data.pendingPurchases.map((p, i) => (
                    <ListRow
                      key={p.id}
                      first={i === 0}
                      icon={ShoppingCart}
                      iconBg="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                      title={`${p.referenceNumber} · ${p.supplier?.name ?? "Unknown supplier"}`}
                      subtitle={fmtNGN(p.total)}
                      meta={<Badge status={p.status} />}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
