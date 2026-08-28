"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createSale } from "@/lib/queries";
import { fmtNGN } from "@/lib/format";
import type { Product } from "@/lib/types";

interface LineItem {
  productId: string;
  quantity: string;
  unitPrice: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]";

export function NewSaleModal({
  open,
  products,
  onClose,
  onCreated,
}: {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1", unitPrice: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function productPrice(productId: string) {
    return products.find((p) => p.id === productId)?.sellingPrice;
  }

  const total = items.reduce((sum, item) => {
    const price = item.unitPrice ? Number(item.unitPrice) : Number(productPrice(item.productId) ?? 0);
    return sum + price * (Number(item.quantity) || 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setError("Add at least one product line.");
      return;
    }

    setSubmitting(true);
    try {
      await createSale({
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentStatus,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: i.unitPrice ? Number(i.unitPrice) : undefined,
        })),
      });
      setCustomerName("");
      setCustomerPhone("");
      setItems([{ productId: "", quantity: "1", unitPrice: "" }]);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the sale.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#06140f]/50 py-[6vh]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-[560px] max-w-[94vw] rounded-2xl border border-slate-200 bg-white shadow-elevated dark:border-white/10 dark:bg-[#132420]">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/10">
          <h3 className="text-[15px] font-bold">New Invoice</h3>
          <button onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Customer name</span>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} placeholder="Walk-in customer" />
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Customer phone</span>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">Payment status</span>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputClass}>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </label>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-ink-soft">Items</span>
            <button
              type="button"
              onClick={() => setItems((rows) => [...rows, { productId: "", quantity: "1", unitPrice: "" }])}
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
                  onChange={(e) => updateItem(i, { productId: e.target.value, unitPrice: "" })}
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
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
                  className={inputClass + " w-28"}
                  placeholder={item.productId ? String(productPrice(item.productId) ?? "") : "Price"}
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
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {submitting ? "Creating…" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
