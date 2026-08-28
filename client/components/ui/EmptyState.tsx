import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  desc,
  icon: Icon = Inbox,
}: {
  title?: string;
  desc: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-[14.5px] font-bold">{title}</p>
      <p className="max-w-[300px] text-[12.5px] text-ink-muted">{desc}</p>
    </div>
  );
}
