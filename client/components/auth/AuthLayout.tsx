import type { ReactNode } from "react";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F9F7] px-4 dark:bg-[#0B1512]">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="#3EBB89" strokeWidth="2" opacity="0.5" />
            <circle cx="20" cy="20" r="13" stroke="#0F4C3A" strokeWidth="2" opacity="0.8" className="dark:stroke-white/70" />
            <circle cx="20" cy="20" r="6.5" fill="#147A52" />
          </svg>
          <div>
            <h1 className="font-display text-xl font-extrabold">{title}</h1>
            {subtitle && <p className="mt-1 text-[13.5px] text-ink-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-white/10 dark:bg-[#132420]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block last:mb-0">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export const authInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand-500 dark:border-white/10 dark:bg-[#0F1B16]";
