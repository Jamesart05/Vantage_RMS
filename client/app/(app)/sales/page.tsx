"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { NewSaleModal } from "@/components/sales/NewSaleModal";
import { listSales, getSalesSummary, listProducts } from "@/lib/queries";
import { fmtNGN, formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Sale } from "@/lib/types";
import { PAGE_META } from "@/lib/nav";

const columns: Column<Sale>[] = [
  { header: "Invoice", cell: (i) => <span className="font-bold">{i.invoiceNumber}</span> },
  { header: "Customer", cell: (i) => i.customerName ?? "Walk-in" },
  { header: "Amount", cell: (i) => <span className="font-bold">{fmtNGN(i.total)}</span> },
  { header: "Payment", cell: (i) => <Badge status={i.paymentStatus} /> },
  { header: "Status", cell: (i) => <Badge status={i.status} /> },
  { header: "Date", cell: (i) => <span className="text-ink-muted">{formatDate(i.soldAt)}</span> },
];

export default function SalesPage() {
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const sales = useApi(() => listSales(), []);
  const summary = useApi(() => getSalesSummary(), []);
  const products = useApi(() => listProducts(), []);

  return (
    <>
      <PageHeader
        title={PAGE_META.sales.title}
        desc={PAGE_META.sales.desc}
        actions={
          <button
            onClick={() => setNewSaleOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-700 px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-[15px] w-[15px]" /> New Invoice
          </button>
        }
      />

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Card padded>
          <span className="text-[12.5px] font-semibold text-ink-muted">Today&rsquo;s Sales</span>
          <div className="mt-1 text-2xl font-extrabold">{summary.data ? fmtNGN(summary.data.todaySales) : "—"}</div>
        </Card>
        <Card padded>
          <span className="text-[12.5px] font-semibold text-ink-muted">Paid</span>
          <div className="mt-1 text-2xl font-extrabold text-brand-600">{summary.data ? fmtNGN(summary.data.totalPaid) : "—"}</div>
        </Card>
        <Card padded>
          <span className="text-[12.5px] font-semibold text-ink-muted">Outstanding</span>
          <div className="mt-1 text-2xl font-extrabold text-red-600">{summary.data ? fmtNGN(summary.data.outstandingPayments) : "—"}</div>
        </Card>
      </div>

      {sales.error && (
        <Card padded className="mb-4 text-[13px] text-red-600 dark:text-red-400">
          {sales.error}{" "}
          <button onClick={sales.refetch} className="font-semibold underline">
            Retry
          </button>
        </Card>
      )}

      {sales.loading ? (
        <Card padded className="h-64 animate-pulse" />
      ) : (
        <DataTable
          columns={columns}
          rows={sales.data?.rows ?? []}
          searchPlaceholder="Search invoices…"
          addLabel="New Invoice"
          entityLabel="Invoice"
          getRowId={(i) => i.id}
          getSearchText={(i) => `${i.invoiceNumber} ${i.customerName ?? ""}`}
          getTitle={(i) => i.invoiceNumber}
          getSubtitle={(i) => i.customerName ?? "Walk-in customer"}
          getDetailFields={(i) => [
            { label: "Customer", value: i.customerName ?? "Walk-in" },
            { label: "Phone", value: i.customerPhone ?? "—" },
            { label: "Items", value: `${i.items.length} line item${i.items.length === 1 ? "" : "s"}` },
            { label: "Subtotal", value: fmtNGN(i.subtotal) },
            { label: "Discount", value: fmtNGN(i.discount) },
            { label: "Tax", value: fmtNGN(i.tax) },
            { label: "Total", value: fmtNGN(i.total) },
            { label: "Payment status", value: i.paymentStatus },
            { label: "Status", value: i.status },
            { label: "Date", value: formatDate(i.soldAt) },
          ]}
        />
      )}

      <NewSaleModal
        open={newSaleOpen}
        products={products.data?.rows ?? []}
        onClose={() => setNewSaleOpen(false)}
        onCreated={() => {
          sales.refetch();
          summary.refetch();
        }}
      />
    </>
  );
}
