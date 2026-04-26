import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import type { IpniProviderSummary } from "@/types/ipni";
import { ProviderDetail } from "./-components/provider-detail";
import { useIpniSummary } from "./-module/queries";
import type { IpniProviderStats } from "./-module/types";

export const Route = createFileRoute("/_app/ipni/providers")({
  component: ProvidersPage,
});

const providerColumns: ColumnDef<IpniProviderSummary>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      if (!row.original.sync_status?.length) return null;
      return (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => row.toggleExpanded()}
          aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
          title={row.getIsExpanded() ? "Collapse row" : "Expand row"}
        >
          {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
        </Button>
      );
    },
    size: 30,
  },
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.miner}</span>
    ),
  },
  {
    accessorKey: "peer_id",
    header: "Peer ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.peer_id?.slice(0, 16)}…
      </span>
    ),
  },
  {
    accessorKey: "head",
    header: "Head",
    cell: ({ row }) =>
      row.original.head ? (
        <span className="font-mono text-xs">
          {row.original.head.slice(0, 16)}…
        </span>
      ) : (
        "—"
      ),
  },
  {
    id: "syncStatus",
    header: "Sync Status",
    cell: ({ row }) => {
      const statuses = row.original.sync_status;
      if (!statuses?.length) return "—";
      const hasError = statuses.some((s) => s.error);
      return (
        <StatusBadge
          status={hasError ? "warning" : "done"}
          label={hasError ? "Issues" : "OK"}
        />
      );
    },
  },
];

function ProvidersPage() {
  const { data: summary, isLoading } = useIpniSummary();
  const navigate = useNavigate();
  const providers = summary ?? [];

  const stats = useMemo<IpniProviderStats>(() => {
    const total = providers.length;
    const withHead = providers.filter((p) => p.head).length;
    const withErrors = providers.filter((p) =>
      p.sync_status?.some((s) => s.error),
    ).length;
    return { total, withHead, withErrors };
  }, [providers]);

  const handleSearchAd = (cid: string) => {
    navigate({ to: "/ipni/search", search: { cid } });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Providers" value={stats.total} />
        <KPICard label="With Head" value={stats.withHead} />
        <KPICard label="With Errors" value={stats.withErrors} />
      </div>

      <DataTable
        columns={providerColumns}
        data={providers}
        loading={isLoading}
        emptyMessage="No IPNI providers"
        getRowCanExpand={(row: Row<IpniProviderSummary>) =>
          Boolean(row.original.sync_status?.length)
        }
        renderSubComponent={({ row }) => (
          <div className="px-8 py-2">
            <ProviderDetail
              syncStatuses={row.original.sync_status ?? []}
              head={row.original.head}
              onSearchAd={handleSearchAd}
            />
          </div>
        )}
      />
    </div>
  );
}
