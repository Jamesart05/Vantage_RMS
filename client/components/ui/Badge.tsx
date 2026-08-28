import { STATUS_STYLES, humanize } from "@/lib/format";
import clsx from "clsx";

export function Badge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-ink-muted dark:bg-white/5 dark:text-ink-muted";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap",
        style,
        className
      )}
    >
      {humanize(status)}
    </span>
  );
}
