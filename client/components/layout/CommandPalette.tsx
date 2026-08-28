"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Truck, Package, FileText, ShoppingCart, Loader2 } from "lucide-react";
import { listEmployees, listProducts, listSuppliers, listSales, listPurchases } from "@/lib/queries";

interface Result {
  label: string;
  name: string;
  href: string;
  icon: typeof Users;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [employees, products, suppliers, sales, purchases] = await Promise.all([
          listEmployees({ search: query }),
          listProducts({ search: query }),
          listSuppliers({ search: query }),
          listSales({ search: query }),
          listPurchases({ search: query }),
        ]);
        if (cancelled) return;
        setResults(
          [
            ...employees.rows
              .slice(0, 4)
              .map((e) => ({ label: "Employee", name: `${e.firstName} ${e.lastName}`, href: "/employees", icon: Users })),
            ...products.rows.slice(0, 4).map((p) => ({ label: "Product", name: p.name, href: "/products", icon: Package })),
            ...suppliers.rows.slice(0, 4).map((s) => ({ label: "Supplier", name: s.name, href: "/suppliers", icon: Truck })),
            ...sales.rows
              .slice(0, 4)
              .map((s) => ({ label: "Invoice", name: `${s.invoiceNumber} — ${s.customerName ?? "Walk-in"}`, href: "/sales", icon: FileText })),
            ...purchases.rows
              .slice(0, 4)
              .map((p) => ({ label: "Purchase Order", name: p.referenceNumber, href: "/purchases", icon: ShoppingCart })),
          ].slice(0, 10)
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-[#06140f]/50 pt-[12vh]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated dark:border-white/10 dark:bg-[#132420]">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-[18px] py-3.5 dark:border-white/10">
          <Search className="h-[18px] w-[18px] text-ink-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, products, suppliers, invoices…"
            className="w-full bg-transparent text-[15px] outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-ink-muted" />}
        </div>
        <div className="max-h-[340px] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="p-6 text-center text-[13px] text-ink-muted">Type at least 2 characters to search.</div>
          ) : results.length === 0 && !loading ? (
            <div className="p-6 text-center text-[13px] text-ink-muted">No matches found.</div>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  onClose();
                  router.push(r.href);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13.5px] hover:bg-brand-100 dark:hover:bg-brand-500/15"
              >
                <r.icon className="h-[15px] w-[15px] text-ink-muted" />
                <span className="truncate">{r.name}</span>
                <span className="ml-auto flex-shrink-0 rounded bg-[#F6F9F7] px-1.5 py-0.5 text-[10.5px] text-ink-muted dark:bg-white/5">
                  {r.label}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
