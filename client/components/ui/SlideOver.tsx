"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function SlideOver({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-[#06140f]/45"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-full w-[460px] max-w-[94vw] animate-slideIn overflow-y-auto bg-white shadow-elevated dark:bg-[#132420]">
        {children}
      </div>
    </div>
  );
}

export function SlideOverClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close panel"
      className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
