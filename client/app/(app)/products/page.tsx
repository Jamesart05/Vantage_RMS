"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card } from "@/components/ui/Card";
import { listProducts, createProduct, deleteProduct, listCategories } from "@/lib/queries";
import { initials, fmtNGN, toNumber, stockStatus, STOCK_STATUS_LABEL, STOCK_STATUS_STYLE } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Product } from "@/lib/types";
import { PAGE_META } from "@/lib/nav";
import type { CreateField } from "@/components/ui/CreateModal";
import clsx from "clsx";

function stockOf(p: Product) {
  const row = p.inventory?.[0];
  return { quantity: toNumber(row?.quantity), reorderLevel: toNumber(row?.reorderLevel) };
}

const columns: Column<Product>[] = [
  {
    header: "Product",
    cell: (p) => (
      <div className="flex items-center gap-2.5 font-semibold">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11.5px] font-bold text-white">
          {initials(p.name)}
        </div>
        {p.name}
      </div>
    ),
  },
  { header: "SKU", cell: (p) => <span className="text-ink-muted">{p.sku ?? "—"}</span> },
  { header: "Category", cell: (p) => <span className="text-ink-muted">{p.category?.name ?? "—"}</span> },
  {
    header: "Stock",
    cell: (p) => {
      const { quantity, reorderLevel } = stockOf(p);
      return (
        <>
          {quantity} <span className="text-ink-muted">/ min {reorderLevel}</span>
        </>
      );
    },
  },
  { header: "Selling Price", cell: (p) => <span className="font-bold">{fmtNGN(p.sellingPrice)}</span> },
  {
    header: "Status",
    cell: (p) => {
      const { quantity, reorderLevel } = stockOf(p);
      const status = stockStatus(quantity, reorderLevel);
      return (
        <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", STOCK_STATUS_STYLE[status])}>
          {STOCK_STATUS_LABEL[status]}
        </span>
      );
    },
  },
];

const UNITS = ["pcs", "kg", "g", "L", "mL", "carton", "crate", "bag", "box", "pack"];

export default function ProductsPage() {
  const { data, loading, error, refetch } = useApi(() => listProducts(), []);
  const { data: categories } = useApi(() => listCategories(), []);

  const createFields: CreateField[] = [
    { name: "name", label: "Product name", required: true },
    { name: "sku", label: "SKU" },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      options: [{ value: "", label: "No category" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))],
    },
    { name: "unit", label: "Unit", type: "select", options: UNITS.map((u) => ({ value: u, label: u })), defaultValue: "pcs" },
    { name: "costPrice", label: "Cost price (₦)", type: "number", required: true },
    { name: "sellingPrice", label: "Selling price (₦)", type: "number", required: true },
    { name: "openingQuantity", label: "Opening stock quantity", type: "number", defaultValue: "0" },
    { name: "reorderLevel", label: "Reorder level", type: "number", defaultValue: "0" },
  ];

  return (
    <>
      <PageHeader title={PAGE_META.products.title} desc={PAGE_META.products.desc} />

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
          rows={data?.rows ?? []}
          searchPlaceholder="Search by name, SKU…"
          addLabel="Add Product"
          entityLabel="Product"
          getRowId={(p) => p.id}
          getSearchText={(p) => `${p.name} ${p.sku ?? ""} ${p.category?.name ?? ""}`}
          getTitle={(p) => p.name}
          getSubtitle={(p) => [p.sku, p.category?.name].filter(Boolean).join(" · ") || "Product profile"}
          getDetailFields={(p) => {
            const { quantity, reorderLevel } = stockOf(p);
            return [
              { label: "SKU", value: p.sku ?? "—" },
              { label: "Category", value: p.category?.name ?? "—" },
              { label: "Unit", value: p.unit },
              { label: "Current stock", value: `${quantity}` },
              { label: "Minimum stock", value: `${reorderLevel}` },
              { label: "Cost price", value: fmtNGN(p.costPrice) },
              { label: "Selling price", value: fmtNGN(p.sellingPrice) },
              { label: "Status", value: STOCK_STATUS_LABEL[stockStatus(quantity, reorderLevel)] },
            ];
          }}
          createFields={createFields}
          onCreate={async (values) => {
            await createProduct({
              name: values.name,
              sku: values.sku || undefined,
              categoryId: values.categoryId || undefined,
              unit: values.unit || "pcs",
              costPrice: Number(values.costPrice),
              sellingPrice: Number(values.sellingPrice),
              openingQuantity: values.openingQuantity ? Number(values.openingQuantity) : undefined,
              reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : undefined,
            });
            refetch();
          }}
          onDelete={async (p) => {
            await deleteProduct(p.id);
            refetch();
          }}
        />
      )}
    </>
  );
}
