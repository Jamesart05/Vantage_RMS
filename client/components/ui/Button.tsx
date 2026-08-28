"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  size?: "md" | "sm";
}

export function Button({ variant = "default", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors border",
        size === "md" ? "px-3.5 py-2 text-[13.5px]" : "px-2.5 py-1.5 text-[12.5px]",
        variant === "default" &&
          "border-slate-200 bg-white text-ink hover:border-brand-500 dark:border-white/10 dark:bg-[#132420] dark:text-slate-100",
        variant === "primary" &&
          "border-brand-700 bg-brand-700 text-white hover:bg-brand-600 hover:border-brand-600",
        variant === "ghost" &&
          "border-transparent bg-transparent hover:bg-brand-100 dark:hover:bg-brand-500/15",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
