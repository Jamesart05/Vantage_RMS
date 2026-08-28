"use client";

import { Package, TrendingUp, ShoppingCart, FileText, UserPlus, Settings, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAuditLogs } from "@/lib/queries";
import { humanize, relativeTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { PAGE_META } from "@/lib/nav";

const RESOURCE_ICON: Record<string, typeof Package> = {
  InventoryItem: Package,
  Sale: TrendingUp,
  Purchase: ShoppingCart,
  FinancialTransaction: FileText,
  Employee: UserPlus,
  Member: UserPlus,
  Organization: Settings,
  OrganizationSettings: Settings,
};
const RESOURCE_COLOR: Record<string, string> = {
  InventoryItem: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Sale: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  Purchase: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Employee: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useApi(() => listAuditLogs(), []);

  return (
    <>
      <PageHeader title={PAGE_META.notifications.title} desc={PAGE_META.notifications.desc} />

      {error && (
        <Card padded className="mb-4 text-[13px] text-red-600 dark:text-red-400">
          {error}{" "}
          <button onClick={refetch} className="font-semibold underline">
            Retry
          </button>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="h-64 animate-pulse" />
        ) : (data?.rows.length ?? 0) === 0 ? (
          <EmptyState desc="Nothing has happened yet — actions across BusinessOS will show up here." icon={Activity} />
        ) : (
          data!.rows.map((n, i) => (
            <ListRow
              key={n.id}
              first={i === 0}
              icon={RESOURCE_ICON[n.resource] ?? Activity}
              iconBg={RESOURCE_COLOR[n.resource]}
              title={humanize(n.action)}
              subtitle={n.resource}
              meta={relativeTime(n.createdAt)}
            />
          ))
        )}
      </Card>
    </>
  );
}
