export function fmtNGN(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n;
  return "₦" + (Number.isFinite(num) ? num : 0).toLocaleString("en-NG");
}

export function toNumber(n: number | string | null | undefined): number {
  if (n === null || n === undefined) return 0;
  const num = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(num) ? num : 0;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export function relativeTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

/** Human labels for backend enum values, e.g. "ON_LEAVE" -> "On Leave". */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Tailwind classes per backend enum status value (badges render `humanize(status)` as the label).
export const STATUS_STYLES: Record<string, string> = {
  // shared "good" states
  ACTIVE: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  COMPLETED: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  PAID: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  RECEIVED: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  APPROVED: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  PLANNED: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  // caution states
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  ON_LEAVE: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  PARTIAL: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  INVITED: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  // bad states
  UNPAID: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  TERMINATED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  REFUNDED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  // neutral states
  CANCELLED: "bg-slate-100 text-ink-muted dark:bg-white/5 dark:text-ink-muted",
  INACTIVE: "bg-slate-100 text-ink-muted dark:bg-white/5 dark:text-ink-muted",
};

/** Computed (not stored) stock-level status, from an inventory item's quantity vs reorder level. */
export function stockStatus(quantity: number, reorderLevel: number): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= reorderLevel) return "LOW_STOCK";
  return "IN_STOCK";
}
export const STOCK_STATUS_LABEL: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};
export const STOCK_STATUS_STYLE: Record<string, string> = {
  IN_STOCK: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  LOW_STOCK: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  OUT_OF_STOCK: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};
