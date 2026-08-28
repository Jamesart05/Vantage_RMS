"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { listEmployees, createEmployee, deleteEmployee, listDepartments } from "@/lib/queries";
import { initials, humanize, formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Employee } from "@/lib/types";
import { PAGE_META } from "@/lib/nav";
import type { CreateField } from "@/components/ui/CreateModal";

const columns: Column<Employee>[] = [
  {
    header: "Employee",
    cell: (e) => (
      <div className="flex items-center gap-2.5 font-semibold">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-[11.5px] font-bold text-white">
          {initials(`${e.firstName} ${e.lastName}`)}
        </div>
        {e.firstName} {e.lastName}
      </div>
    ),
  },
  { header: "Department", cell: (e) => e.department?.name ?? "—" },
  { header: "Position", cell: (e) => <span className="text-ink-muted">{e.position ?? "—"}</span> },
  { header: "Phone", cell: (e) => <span className="text-ink-muted">{e.phone ?? "—"}</span> },
  { header: "Status", cell: (e) => <Badge status={e.status} /> },
  { header: "Date Joined", cell: (e) => <span className="text-ink-muted">{e.hireDate ? formatDate(e.hireDate) : "—"}</span> },
];

export default function EmployeesPage() {
  const { data, loading, error, refetch } = useApi(() => listEmployees(), []);
  const { data: departments } = useApi(() => listDepartments(), []);

  const createFields: CreateField[] = [
    { name: "firstName", label: "First name", required: true },
    { name: "lastName", label: "Last name", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "position", label: "Position" },
    {
      name: "departmentId",
      label: "Department",
      type: "select",
      options: [{ value: "", label: "No department" }, ...(departments ?? []).map((d) => ({ value: d.id, label: d.name }))],
    },
  ];

  return (
    <>
      <PageHeader title={PAGE_META.employees.title} desc={PAGE_META.employees.desc} />

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
          searchPlaceholder="Search employees by name, department…"
          addLabel="Add Employee"
          entityLabel="Employee"
          getRowId={(e) => e.id}
          getSearchText={(e) => `${e.firstName} ${e.lastName} ${e.department?.name ?? ""} ${e.position ?? ""} ${e.email ?? ""}`}
          getTitle={(e) => `${e.firstName} ${e.lastName}`}
          getSubtitle={(e) => [e.position, e.department?.name].filter(Boolean).join(" · ") || "Employee profile"}
          getDetailFields={(e) => [
            { label: "Department", value: e.department?.name ?? "—" },
            { label: "Position", value: e.position ?? "—" },
            { label: "Phone", value: e.phone ?? "—" },
            { label: "Email", value: e.email ?? "—" },
            { label: "Employment type", value: humanize(e.employmentType) },
            { label: "Status", value: humanize(e.status) },
            { label: "Date joined", value: e.hireDate ? formatDate(e.hireDate) : "—" },
          ]}
          createFields={createFields}
          onCreate={async (values) => {
            await createEmployee({
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email || undefined,
              phone: values.phone || undefined,
              position: values.position || undefined,
              departmentId: values.departmentId || undefined,
            });
            refetch();
          }}
          onDelete={async (e) => {
            await deleteEmployee(e.id);
            refetch();
          }}
        />
      )}
    </>
  );
}
