"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPurchase } from "@/lib/queries";
import { fmtNGN } from "@/lib/format";
import type { Product, Supplier } from "@/lib/types";

interface LineItem {
  productId: string;
  quantity: string;
  unitCost: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]";

export function NewPurchaseModal({
  open,
  suppliers,
  products,
  onClose,
  onCreated,
}: {
  open: boolean;
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1", unitCost: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const total = items.reduce((sum, item) => sum + (Number(item.unitCost) || 0) * (Number(item.quantity) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Choose a supplier.");
      return;
    }
    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0 && i.unitCost !== "");
    if (validItems.length === 0) {
      setError("Add at least one product line with a unit cost.");
      return;
    }

    setSubmitting(true);
    try {
      await createPurchase({
        supplierId,
        paymentStatus,
        items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
      });
      setSupplierId("");
      setItems([{ productId: "", quantity: "1", unitCost: "" }]);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the purchase order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#06140f]/50 py-[6vh]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-[560px] max-w-[94vw] rounded-2xl border border-slate-200 bg-white shadow-elevated dark:border-white/10 dark:bg-[#132420]">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/10">
          <h3 className="text-[15px] font-bold">New Purchase Order</h3>
          <button onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Supplier</span>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass} required>
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Payment status</span>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputClass}>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </label>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-soft">Items</span>
            <button
              type="button"
              onClick={() => setItems((rows) => [...rows, { productId: "", quantity: "1", unitCost: "" }])}
              className="flex items-center gap-1 text-[12px] font-semibold text-brand-700 dark:text-brand-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(i, { productId: e.target.value })}
                  className={inputClass + " flex-[2]"}
                  required
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: e.target.value })}
                  className={inputClass + " w-20"}
                  placeholder="Qty"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.unitCost}
                  onChange={(e) => updateItem(i, { unitCost: e.target.value })}
                  className={inputClass + " w-28"}
                  placeholder="Unit cost"
                />
                <button
                  type="button"
                  onClick={() => setItems((rows) => rows.filter((_, idx) => idx !== i))}
                  disabled={items.length === 1}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[13.5px] font-bold dark:border-white/10">
            <span>Estimated total</span>
            <span>{fmtNGN(total)}</span>
          </div>

          {error && (
            <p className="mt-3.5 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <Button type="button" className="flex-1 justify-center" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="flex-1 justify-center">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {submitting ? "Creating…" : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
