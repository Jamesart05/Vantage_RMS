"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Zap, Bell, Sun, Moon, LogOut } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { authClient } from "@/lib/auth-client";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3.5 border-b border-slate-200 bg-white px-5 dark:border-white/10 dark:bg-[#122019]">
        <button onClick={onOpenMenu} className="flex p-1.5 md:hidden" aria-label="Open menu">
          <Menu className="h-[22px] w-[22px]" />
        </button>
        <button
          onClick={() => setCmdkOpen(true)}
          className="hidden max-w-[420px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-[#F6F9F7] px-3 py-2 text-left text-ink-muted dark:border-white/10 dark:bg-white/5 sm:flex"
        >
          <Search className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate text-[13.5px]">Search employees, invoices, products…</span>
          <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[10.5px] text-ink-muted dark:border-white/15">⌘K</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/ai-assistant"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-ink-soft hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
            title="AI Assistant"
          >
            <Zap className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/notifications"
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-lg text-ink-soft hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
            title="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Link>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-ink-soft hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-500/15 dark:hover:text-brand-400"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/sign-in");
              router.refresh();
            }}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
    </>
  );
}
