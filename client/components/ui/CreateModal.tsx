"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "./Button";

export interface CreateField {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "email" | "tel";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}

export function CreateModal({
  open,
  title,
  fields,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  fields: CreateField[];
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function setField(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
      setValues({});
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[#06140f]/50 pt-[10vh]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[460px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-elevated dark:border-white/10 dark:bg-[#132420]">
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/10">
          <h3 className="text-[15px] font-bold">{title}</h3>
          <button onClick={onClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          {fields.map((f) => (
            <label key={f.name} className="mb-3.5 block last:mb-0">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">{f.label}</span>
              {f.type === "select" ? (
                <select
                  required={f.required}
                  value={values[f.name] ?? f.defaultValue ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  required={f.required}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]"
                />
              ) : (
                <input
                  type={f.type ?? "text"}
                  required={f.required}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  step={f.type === "number" ? "any" : undefined}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]"
                />
              )}
            </label>
          ))}

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
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
