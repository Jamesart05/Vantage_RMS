"use client";

import { useState } from "react";
import { Plus, PackageCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { NewPurchaseModal } from "@/components/purchases/NewPurchaseModal";
import { listPurchases, listSuppliers, listProducts, receivePurchase } from "@/lib/queries";
import { fmtNGN, formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Purchase } from "@/lib/types";
import { PAGE_META } from "@/lib/nav";

export default function PurchasesPage() {
  const [newPurchaseOpen, setNewPurchaseOpen] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const showToast = useToast();

  const purchases = useApi(() => listPurchases(), []);
  const suppliers = useApi(() => listSuppliers(), []);
  const products = useApi(() => listProducts(), []);

  async function handleReceive(id: string) {
    setReceivingId(id);
    try {
      await receivePurchase(id);
      showToast("Purchase order received — stock updated");
      purchases.refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't mark as received.");
    } finally {
      setReceivingId(null);
    }
  }

  const columns: Column<Purchase>[] = [
    { header: "PO Number", cell: (p) => <span className="font-bold">{p.referenceNumber}</span> },
    { header: "Supplier", cell: (p) => p.supplier?.name ?? "—" },
    { header: "Amount", cell: (p) => <span className="font-bold">{fmtNGN(p.total)}</span> },
    { header: "Payment", cell: (p) => <Badge status={p.paymentStatus} /> },
    { header: "Status", cell: (p) => <Badge status={p.status} /> },
    { header: "Date", cell: (p) => <span className="text-ink-muted">{formatDate(p.purchasedAt)}</span> },
    {
      header: "",
      cell: (p) =>
        p.status === "PENDING" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReceive(p.id);
            }}
            disabled={receivingId === p.id}
            className="flex items-center gap-1.5 rounded-lg border border-brand-700 px-2.5 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            {receivingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
            Receive
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title={PAGE_META.purchases.title}
        desc={PAGE_META.purchases.desc}
        actions={
          <button
            onClick={() => setNewPurchaseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-700 px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-[15px] w-[15px]" /> New Purchase Order
          </button>
        }
      />

      {purchases.error && (
        <Card padded className="mb-4 text-[13px] text-red-600 dark:text-red-400">
          {purchases.error}{" "}
          <button onClick={purchases.refetch} className="font-semibold underline">
            Retry
          </button>
        </Card>
      )}

      {purchases.loading ? (
        <Card padded className="h-64 animate-pulse" />
      ) : (
        <DataTable
          columns={columns}
          rows={purchases.data?.rows ?? []}
          searchPlaceholder="Search purchase orders…"
          addLabel="New Purchase Order"
          entityLabel="Purchase Order"
          getRowId={(p) => p.id}
          getSearchText={(p) => `${p.referenceNumber} ${p.supplier?.name ?? ""}`}
          getTitle={(p) => p.referenceNumber}
          getSubtitle={(p) => p.supplier?.name ?? "—"}
          getDetailFields={(p) => [
            { label: "Supplier", value: p.supplier?.name ?? "—" },
            { label: "Items", value: `${p.items.length} line item${p.items.length === 1 ? "" : "s"}` },
            { label: "Subtotal", value: fmtNGN(p.subtotal) },
            { label: "Total", value: fmtNGN(p.total) },
            { label: "Payment status", value: p.paymentStatus },
            { label: "Status", value: p.status },
            { label: "Date", value: formatDate(p.purchasedAt) },
          ]}
        />
      )}

      <NewPurchaseModal
        open={newPurchaseOpen}
        suppliers={suppliers.data?.rows ?? []}
        products={products.data?.rows ?? []}
        onClose={() => setNewPurchaseOpen(false)}
        onCreated={() => purchases.refetch()}
      />
    </>
  );
}
