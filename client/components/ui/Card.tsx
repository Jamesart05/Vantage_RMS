import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({ children, className, padded }: { children?: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 bg-white shadow-card dark:border-white/10 dark:bg-[#132420]",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("flex items-center justify-between gap-3 px-5 pt-4", className)}>{children}</div>;
}
