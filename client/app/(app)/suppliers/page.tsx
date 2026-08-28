"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listSuppliers, createSupplier, deleteSupplier } from "@/lib/queries";
import { initials } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Supplier } from "@/lib/types";
import { PAGE_META } from "@/lib/nav";
import type { CreateField } from "@/components/ui/CreateModal";

const columns: Column<Supplier>[] = [
  {
    header: "Supplier",
    cell: (s) => (
      <div className="flex items-center gap-2.5 font-semibold">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11.5px] font-bold text-white">
          {initials(s.name)}
        </div>
        {s.name}
      </div>
    ),
  },
  { header: "Email", cell: (s) => <span className="text-ink-muted">{s.email ?? "—"}</span> },
  { header: "Phone", cell: (s) => <span className="text-ink-muted">{s.phone ?? "—"}</span> },
  { header: "Purchases", cell: (s) => <span className="text-ink-muted">{s._count?.purchases ?? 0}</span> },
  { header: "Status", cell: (s) => (s.status ? <Badge status={s.status} /> : <span className="text-ink-muted">—</span>) },
];

const createFields: CreateField[] = [
  { name: "name", label: "Supplier name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "address", label: "Address", type: "textarea" },
];

export default function SuppliersPage() {
  const { data, loading, error, refetch } = useApi(() => listSuppliers(), []);

  return (
    <>
      <PageHeader title={PAGE_META.suppliers.title} desc={PAGE_META.suppliers.desc} />

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
          searchPlaceholder="Search suppliers…"
          addLabel="Add Supplier"
          entityLabel="Supplier"
          getRowId={(s) => s.id}
          getSearchText={(s) => `${s.name} ${s.email ?? ""} ${s.phone ?? ""}`}
          getTitle={(s) => s.name}
          getSubtitle={() => "Supplier profile"}
          getDetailFields={(s) => [
            { label: "Email", value: s.email ?? "—" },
            { label: "Phone", value: s.phone ?? "—" },
            { label: "Address", value: s.address ?? "—" },
            { label: "Purchases on file", value: `${s._count?.purchases ?? 0}` },
          ]}
          createFields={createFields}
          onCreate={async (values) => {
            await createSupplier({
              name: values.name,
              email: values.email || undefined,
              phone: values.phone || undefined,
              address: values.address || undefined,
            });
            refetch();
          }}
          onDelete={async (s) => {
            await deleteSupplier(s.id);
            refetch();
          }}
        />
      )}
    </>
  );
}
