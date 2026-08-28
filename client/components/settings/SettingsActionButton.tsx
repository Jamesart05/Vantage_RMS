"use client";

import { Edit2, Shield, type LucideIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const ICONS: Record<string, LucideIcon> = { Edit2, Shield };

export function SettingsActionButton({
  label,
  message,
  icon,
  variant = "default",
}: {
  label: string;
  message: string;
  icon: string;
  variant?: "default" | "primary";
}) {
  const showToast = useToast();
  const Icon = ICONS[icon] ?? Edit2;
  return (
    <button
      onClick={() => showToast(message)}
      className={
        variant === "primary"
          ? "mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-700 px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-brand-600"
          : "mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13.5px] font-semibold dark:border-white/10"
      }
    >
      <Icon className="h-[15px] w-[15px]" /> {label}
    </button>
  );
}
