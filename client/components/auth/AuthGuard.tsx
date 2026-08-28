"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useActiveOrganization } from "@/lib/auth-client";
import type { ReactNode } from "react";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F9F7] dark:bg-[#0B1512]">
      <div className="flex flex-col items-center gap-3 text-ink-muted">
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none" className="animate-pulse">
          <circle cx="20" cy="20" r="18" stroke="#147A52" strokeWidth="2" opacity="0.35" />
          <circle cx="20" cy="20" r="12" stroke="#147A52" strokeWidth="2" opacity="0.6" />
          <circle cx="20" cy="20" r="5.5" fill="#0F4C3A" />
        </svg>
        <span className="text-[13px] font-medium">Loading BusinessOS…</span>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization();

  useEffect(() => {
    if (sessionPending) return;
    if (!session?.user) {
      router.replace("/sign-in");
      return;
    }
    if (!orgPending && !activeOrg) {
      router.replace("/onboarding");
    }
  }, [session, sessionPending, activeOrg, orgPending, router]);

  if (sessionPending || !session?.user || orgPending || !activeOrg) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
