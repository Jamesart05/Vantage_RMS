"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Icons from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NAV_MAIN, NAV_FUTURE } from "@/lib/nav";
import { useSession, useActiveOrganization } from "@/lib/auth-client";
import { initials, humanize } from "@/lib/format";
import clsx from "clsx";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [futureOpen, setFutureOpen] = useState(false);
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();

  const userName = session?.user?.name ?? "…";
  const memberRole = activeOrg?.members?.find((m) => m.userId === session?.user?.id)?.role;

  return (
    <>
      <aside
        className={clsx(
          "fixed left-0 top-0 z-40 flex h-full w-[252px] flex-shrink-0 flex-col bg-brand-800 text-[#DCEDE4] transition-transform duration-200 dark:bg-[#06211A]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2.5 px-[18px] pb-3.5 pt-5">
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="#3EBB89" strokeWidth="2" opacity="0.5" />
            <circle cx="20" cy="20" r="13" stroke="#DCEDE4" strokeWidth="2" opacity="0.8" />
            <circle cx="20" cy="20" r="6.5" fill="#3EBB89" />
          </svg>
          <div>
            <div className="font-display text-[17px] font-extrabold leading-tight text-white">BusinessOS</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9FC7B4]">SME Operating System</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-5">
          {NAV_MAIN.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#CFE7DB]",
                  active ? "bg-brand-500 font-semibold text-white shadow-card" : "hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <NavIcon name={item.icon} className="h-[17px] w-[17px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setFutureOpen((v) => !v)}
            className="mt-3.5 flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#7FAB98]"
          >
            <span>Future Modules</span>
            {futureOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {futureOpen &&
            NAV_FUTURE.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#CFE7DB] opacity-70",
                    active && "bg-brand-500 text-white opacity-100"
                  )}
                >
                  <NavIcon name={item.icon} className="h-[17px] w-[17px] flex-shrink-0" />
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9.5px] tracking-wide text-[#B9D9C9]">Soon</span>
                </Link>
              );
            })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link href="/settings" onClick={onClose} className="flex items-center gap-2.5 rounded-[10px] p-2 hover:bg-white/[0.06]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white">
              {initials(userName)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-white">{userName}</div>
              <div className="truncate text-[11px] text-[#9FC7B4]">
                {memberRole ? humanize(memberRole) : "Member"}
                {activeOrg?.name ? ` · ${activeOrg.name}` : ""}
              </div>
            </div>
          </Link>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
    </>
  );
}
