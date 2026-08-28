import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Card } from "./Card";
import clsx from "clsx";

export function KpiCard({
  label,
  value,
  delta,
  up,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <Card padded className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-ink-muted">{label}</span>
        {Icon && (
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon className="h-[17px] w-[17px]" />
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      {delta && (
        <div className={clsx("flex items-center gap-1 text-xs font-bold", up ? "text-brand-600" : "text-red-600")}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {delta} vs last week
        </div>
      )}
    </Card>
  );
}
