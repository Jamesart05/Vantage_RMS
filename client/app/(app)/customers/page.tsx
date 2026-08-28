"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listSales } from "@/lib/queries";
import { initials, fmtNGN, toNumber, relativeTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { PAGE_META } from "@/lib/nav";
import clsx from "clsx";

interface CustomerAggregate {
  name: string;
  phone: string;
  balance: number;
  status: "PAID" | "PARTIAL" | "UNPAID";
  lastSaleAt: string;
  saleCount: number;
}

function deriveCustomers(sales: Awaited<ReturnType<typeof listSales>>["rows"]): CustomerAggregate[] {
  const map = new Map<string, CustomerAggregate>();
  for (const sale of sales) {
    if (sale.status === "CANCELLED") continue;
    const key = sale.customerName?.trim() || "Walk-in customer";
    const existing = map.get(key) ?? { name: key, phone: sale.customerPhone ?? "", balance: 0, status: "PAID" as const, lastSaleAt: sale.soldAt, saleCount: 0 };

    if (sale.paymentStatus !== "PAID") existing.balance += toNumber(sale.total);
    if (sale.paymentStatus === "UNPAID") existing.status = "UNPAID";
    else if (sale.paymentStatus === "PARTIAL" && existing.status !== "UNPAID") existing.status = "PARTIAL";

    if (new Date(sale.soldAt) > new Date(existing.lastSaleAt)) existing.lastSaleAt = sale.soldAt;
    if (sale.customerPhone) existing.phone = sale.customerPhone;
    existing.saleCount += 1;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.lastSaleAt).getTime() - new Date(a.lastSaleAt).getTime());
}

const columns: Column<CustomerAggregate>[] = [
  {
    header: "Customer",
    cell: (c) => (
      <div className="flex items-center gap-2.5 font-semibold">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11.5px] font-bold text-white">
          {initials(c.name)}
        </div>
        {c.name}
      </div>
    ),
  },
  { header: "Phone", cell: (c) => <span className="text-ink-muted">{c.phone || "—"}</span> },
  { header: "Sales", cell: (c) => <span className="text-ink-muted">{c.saleCount}</span> },
  {
    header: "Outstanding Balance",
    cell: (c) => <span className={clsx("font-bold", c.balance > 0 && "text-amber-600")}>{fmtNGN(c.balance)}</span>,
  },
  { header: "Status", cell: (c) => <Badge status={c.status} /> },
  { header: "Last Activity", cell: (c) => <span className="text-ink-muted">{relativeTime(c.lastSaleAt)}</span> },
];

export default function CustomersPage() {
  const { data, loading, error, refetch } = useApi(() => listSales(), []);
  const customers = data ? deriveCustomers(data.rows) : [];

  return (
    <>
      <PageHeader
        title={PAGE_META.customers.title}
        desc="Aggregated from your sales history — there's no separate customer database yet, so this view is derived from invoices."
      />

      {error && (
        <Card padded className="mb-4 text-[13px] text-red-600 dark:text-red-400">
          {error}{" "}
          <button onClick={refetch} className="font-semibold underline">
            Retry
          </button>
        </Card>
      )}

      {loading ? (
        <Card padded className="h-64 animate-pulse" />
      ) : (
        <DataTable
          columns={columns}
          rows={customers}
          searchPlaceholder="Search customers…"
          addLabel="Add Customer"
          entityLabel="Customer"
          getRowId={(c) => c.name}
          getSearchText={(c) => `${c.name} ${c.phone}`}
          getTitle={(c) => c.name}
          getSubtitle={() => "Derived from sales history"}
          getDetailFields={(c) => [
            { label: "Phone", value: c.phone || "—" },
            { label: "Total sales", value: `${c.saleCount}` },
            { label: "Outstanding balance", value: fmtNGN(c.balance) },
            { label: "Status", value: c.status },
            { label: "Last activity", value: relativeTime(c.lastSaleAt) },
          ]}
        />
      )}
    </>
  );
}
