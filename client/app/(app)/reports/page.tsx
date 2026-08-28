import { PageHeader } from "@/components/ui/PageHeader";
import { ReportCard } from "@/components/reports/ReportCard";
import { PAGE_META } from "@/lib/nav";

const REPORTS = [
  { name: "Sales Report", icon: "TrendingUp", desc: "Revenue, invoices and payment status by period." },
  { name: "Inventory Report", icon: "Box", desc: "Stock levels, valuation and movement history." },
  { name: "Purchase Report", icon: "ShoppingCart", desc: "Orders, approvals and supplier spend." },
  { name: "Employee Report", icon: "Users", desc: "Headcount, departments and attendance." },
  { name: "Customer Report", icon: "UserCheck", desc: "Balances, purchase history and activity." },
  { name: "Supplier Report", icon: "Truck", desc: "Payables and performance by vendor." },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader title={PAGE_META.reports.title} desc={PAGE_META.reports.desc} />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <ReportCard key={r.name} {...r} />
        ))}
      </div>
    </>
  );
}
