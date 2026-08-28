import type { ReactNode } from "react";

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <span>BusinessOS</span>
        <span className="text-slate-300 dark:text-white/20">/</span>
        <span className="font-semibold text-ink dark:text-slate-100">{title}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[23px] font-extrabold">{title}</h1>
          {desc && <p className="m-0 text-[13.5px] text-ink-muted">{desc}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
