"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Repeat, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateModal, type CreateField } from "@/components/ui/CreateModal";
import { useToast } from "@/components/ui/Toast";
import {
  listInventory,
  getInventorySummary,
  listInventoryMovements,
  adjustInventory,
  listProducts,
} from "@/lib/queries";
import { fmtNGN, toNumber, relativeTime, humanize } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { PAGE_META } from "@/lib/nav";

const MOVEMENT_ICON = {
  PURCHASE: ArrowDownCircle,
  PRODUCTION_IN: ArrowDownCircle,
  RETURN: ArrowDownCircle,
  SALE: ArrowUpCircle,
  PRODUCTION_OUT: ArrowUpCircle,
  ADJUSTMENT: SlidersHorizontal,
} as const;

export default function InventoryPage() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const showToast = useToast();

  const summary = useApi(() => getInventorySummary(), []);
  const items = useApi(() => listInventory(), []);
  const movements = useApi(() => listInventoryMovements(), []);
  const products = useApi(() => listProducts(), []);

  const adjustFields: CreateField[] = [
    {
      name: "productId",
      label: "Product",
      type: "select",
      required: true,
      options: (products.data?.rows ?? []).map((p) => ({ value: p.id, label: p.name })),
    },
    {
      name: "type",
      label: "Reason",
      type: "select",
      options: [
        { value: "ADJUSTMENT", label: "Manual adjustment" },
        { value: "RETURN", label: "Customer return" },
      ],
      defaultValue: "ADJUSTMENT",
    },
    { name: "quantity", label: "Quantity change (use a negative number to reduce stock)", type: "number", required: true },
    { name: "note", label: "Note", type: "textarea" },
  ];

  return (
    <>
      <PageHeader
        title={PAGE_META.inventory.title}
        desc={PAGE_META.inventory.desc}
        actions={
          <button
            onClick={() => setAdjustOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-700 px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-[15px] w-[15px]" /> Record Movement
          </button>
        }
      />

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Card padded>
          <span className="text-[12.5px] font-semibold text-ink-muted">In Stock</span>
          <div className="mt-1 text-2xl font-extrabold">{summary.data?.inStock ?? "—"} products</div>
        </Card>
        <Card padded>
          <span className="text-[12.5px] font-semibold text-ink-muted">Low Stock</span>
          <div className="mt-1 text-2xl font-extrabold text-amber-600">{summary.data?.lowStock ?? "—"} products</div>
        </Card>
        <Card padded>
          <span className="text-[12.5px] font-semibold text-ink-muted">Out of Stock</span>
          <div className="mt-1 text-2xl font-extrabold text-red-600">{summary.data?.outOfStock ?? "—"} products</div>
        </Card>
      </div>

      <Card className="mb-3.5">
        <CardHead className="pb-4">
          <p className="text-[14.5px] font-bold">Stock Levels</p>
          {summary.data && (
            <span className="text-[12.5px] font-semibold text-ink-muted">Total value: {fmtNGN(summary.data.totalValue)}</span>
          )}
        </CardHead>
        {items.loading ? (
          <div className="h-32 animate-pulse px-5" />
        ) : (items.data?.rows.length ?? 0) === 0 ? (
          <EmptyState desc="No inventory records yet — add a product to start tracking stock." icon={ArrowDownCircle} />
        ) : (
          <div>
            {items.data!.rows.map((item, i) => (
              <ListRow
                key={item.id}
                first={i === 0}
                icon={SlidersHorizontal}
                title={item.product.name}
                subtitle={`${toNumber(item.quantity)} ${item.product.unit} on hand · reorder at ${toNumber(item.reorderLevel)}`}
                meta={fmtNGN(item.price)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHead className="pb-4">
          <p className="text-[14.5px] font-bold">Recent Inventory Movements</p>
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11.5px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            Every movement is audit-logged
          </span>
        </CardHead>
        {movements.loading ? (
          <div className="h-32 animate-pulse px-5" />
        ) : (movements.data?.rows.length ?? 0) === 0 ? (
          <EmptyState desc="No stock movements recorded yet." icon={Repeat} />
        ) : (
          <div>
            {movements.data!.rows.map((m, i) => (
              <ListRow
                key={m.id}
                first={i === 0}
                icon={MOVEMENT_ICON[m.type as keyof typeof MOVEMENT_ICON] ?? SlidersHorizontal}
                title={`${humanize(m.type)}${m.note ? ` · ${m.note}` : ""}`}
                meta={`${toNumber(m.quantity) > 0 ? "+" : ""}${toNumber(m.quantity)} · ${relativeTime(m.createdAt)}`}
              />
            ))}
          </div>
        )}
      </Card>

      <CreateModal
        open={adjustOpen}
        title="Record Inventory Movement"
        fields={adjustFields}
        onClose={() => setAdjustOpen(false)}
        onSubmit={async (values) => {
          await adjustInventory({
            productId: values.productId,
            type: values.type as "ADJUSTMENT" | "RETURN",
            quantity: Number(values.quantity),
            note: values.note || undefined,
          });
          showToast("Inventory updated");
          summary.refetch();
          items.refetch();
          movements.refetch();
        }}
      />
    </>
  );
}
