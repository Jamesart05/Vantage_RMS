"use client";

import { FileText, Grid3x3, File, TrendingUp, Box, ShoppingCart, Users, UserCheck, Truck, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

const REPORT_ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  Box,
  ShoppingCart,
  Users,
  UserCheck,
  Truck,
};

export function ReportCard({ name, desc, icon }: { name: string; desc: string; icon: string }) {
  const showToast = useToast();
  const Icon = REPORT_ICONS[icon] ?? TrendingUp;
  return (
    <Card padded>
      <div className="mb-3 flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
        <Icon className="h-[17px] w-[17px]" />
      </div>
      <p className="text-[14.5px] font-bold">{name}</p>
      <p className="mb-1 text-[12px] text-ink-muted">{desc}</p>
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={() => showToast(`${name} exported as PDF`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-semibold dark:border-white/10"
        >
          <FileText className="h-3.5 w-3.5" /> PDF
        </button>
        <button
          onClick={() => showToast(`${name} exported as Excel`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-semibold dark:border-white/10"
        >
          <Grid3x3 className="h-3.5 w-3.5" /> Excel
        </button>
        <button
          onClick={() => showToast(`${name} exported as CSV`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-semibold dark:border-white/10"
        >
          <File className="h-3.5 w-3.5" /> CSV
        </button>
      </div>
    </Card>
  );
}
