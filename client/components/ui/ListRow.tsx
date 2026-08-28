import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";

export function ListRow({
  icon: Icon,
  iconBg = "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  title,
  subtitle,
  meta,
  first,
}: {
  icon: LucideIcon;
  iconBg?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  first?: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-3 px-5 py-2.5", !first && "border-t border-slate-200 dark:border-white/10")}>
      <div className={clsx("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", iconBg)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{title}</div>
        {subtitle && <div className="truncate text-[12px] text-ink-muted">{subtitle}</div>}
      </div>
      {meta && <div className="ml-auto flex-shrink-0 whitespace-nowrap text-[12px] tabular-nums text-ink-muted">{meta}</div>}
    </div>
  );
}
