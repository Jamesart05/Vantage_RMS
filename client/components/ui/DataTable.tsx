"use client";

import { useMemo, useState } from "react";
import { Search, Filter, Plus, Trash2, Loader2 } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { SlideOver, SlideOverClose } from "./SlideOver";
import { CreateModal, type CreateField } from "./CreateModal";
import { useToast } from "./Toast";
import { initials } from "@/lib/format";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
}

export interface DetailField {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder: string;
  addLabel: string;
  getSearchText: (row: T) => string;
  getTitle: (row: T) => string;
  getSubtitle?: (row: T) => string;
  getDetailFields: (row: T) => DetailField[];
  getRowId: (row: T) => string;
  entityLabel: string;
  /** When provided, renders the "Add" button as a working create form. Omit to disable creation from this table. */
  createFields?: CreateField[];
  onCreate?: (values: Record<string, string>) => Promise<void>;
  /** Called after a row is deleted (e.g. to trigger a refetch). */
  onDelete?: (row: T) => Promise<void>;
  emptyDesc?: string;
}

export function DataTable<T>({
  columns,
  rows,
  searchPlaceholder,
  addLabel,
  getSearchText,
  getTitle,
  getSubtitle,
  getDetailFields,
  getRowId,
  entityLabel,
  createFields,
  onCreate,
  onDelete,
  emptyDesc,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [detailRow, setDetailRow] = useState<T | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const showToast = useToast();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => getSearchText(r).toLowerCase().includes(q));
  }, [query, rows, getSearchText]);

  async function handleDelete(row: T) {
    if (!onDelete) return;
    if (!confirm(`Delete this ${entityLabel.toLowerCase()}? This can't be undone.`)) return;
    const id = getRowId(row);
    setDeletingId(id);
    try {
      await onDelete(row);
      showToast(`${entityLabel} deleted`);
      if (detailRow && getRowId(detailRow) === id) setDetailRow(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't delete — try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2.5 p-4">
        <div className="flex w-full max-w-[280px] items-center gap-2 rounded-lg border border-slate-200 bg-[#F6F9F7] px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 flex-shrink-0 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-muted"
          />
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] font-semibold text-ink-soft dark:border-white/10">
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
        {createFields && onCreate && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {addLabel}
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No results" desc={emptyDesc ?? "No records match your search yet."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.header}
                    className="whitespace-nowrap border-y border-slate-200 bg-[#F6F9F7] px-5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-muted dark:border-white/10 dark:bg-white/5"
                  >
                    {c.header}
                  </th>
                ))}
                <th className="whitespace-nowrap border-y border-slate-200 bg-[#F6F9F7] px-5 py-2.5 dark:border-white/10 dark:bg-white/5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    onClick={() => setDetailRow(row)}
                    className="cursor-pointer border-b border-slate-200 transition-colors last:border-0 hover:bg-brand-50 dark:border-white/10 dark:hover:bg-brand-500/5"
                  >
                    {columns.map((c) => (
                      <td key={c.header} className="whitespace-nowrap px-5 py-3.5">
                        {c.cell(row)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {onDelete && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(row);
                            }}
                            disabled={deletingId === id}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            {deletingId === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3.5 text-[12.5px] text-ink-muted">
        <span>
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      <SlideOver open={!!detailRow} onClose={() => setDetailRow(null)}>
        {detailRow && (
          <>
            <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-white/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-[15px] font-bold text-white">
                {initials(getTitle(detailRow))}
              </div>
              <div>
                <div className="text-[15px] font-bold">{getTitle(detailRow)}</div>
                <div className="text-[12px] text-ink-muted">{getSubtitle ? getSubtitle(detailRow) : `${entityLabel} profile`}</div>
              </div>
              <SlideOverClose onClose={() => setDetailRow(null)} />
            </div>
            <div className="p-5">
              {getDetailFields(detailRow).map((f) => (
                <div key={f.label} className="flex justify-between border-b border-slate-200 py-2.5 text-[13px] dark:border-white/10">
                  <span className="text-ink-muted">{f.label}</span>
                  <span className="font-semibold">{f.value}</span>
                </div>
              ))}
              {onDelete && (
                <div className="mt-[18px] flex gap-2">
                  <Button
                    className="flex-1 justify-center border-red-200 text-red-600 hover:border-red-400 dark:border-red-500/20 dark:text-red-400"
                    onClick={() => handleDelete(detailRow)}
                    disabled={deletingId === getRowId(detailRow)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SlideOver>

      {createFields && onCreate && (
        <CreateModal
          open={createOpen}
          title={addLabel}
          fields={createFields}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (values) => {
            await onCreate(values);
            showToast(`${entityLabel} created`);
          }}
        />
      )}
    </Card>
  );
}
