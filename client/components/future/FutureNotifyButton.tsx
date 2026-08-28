"use client";

import { Bell } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function FutureNotifyButton({ moduleTitle }: { moduleTitle: string }) {
  const showToast = useToast();
  return (
    <button
      onClick={() => showToast(`We'll notify you when ${moduleTitle} is ready`)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-700 px-3.5 py-2 text-[13.5px] font-semibold text-white hover:bg-brand-600"
    >
      <Bell className="h-[15px] w-[15px]" /> Notify me when ready
    </button>
  );
}
