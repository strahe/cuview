import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import type { OpenDealInfo } from "@/types/market";
import { formatBytes } from "@/utils/format";
import { usePendingDeals, useSealNow } from "./-module/queries";

export const Route = createFileRoute("/_app/market/pending")({
  component: PendingDealsPage,
});

function PendingDealsPage() {
  const { data, isLoading } = usePendingDeals();
  const sealNowMutation = useSealNow();

  const deals = data ?? [];
  const stats = useMemo(() => {
    const snap = deals.filter((d) => d.SnapDeals).length;
    return { total: deals.length, snap, regular: deals.length - snap };
  }, [deals]);

  const columns: ColumnDef<OpenDealInfo>[] = useMemo(
    () => [
      {
        accessorKey: "Miner",
        header: "Miner",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.Miner}</span>
        ),
      },
      { accessorKey: "SectorNumber", header: "Sector" },
      {
        accessorKey: "PieceCID",
        header: "Piece CID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.PieceCID.slice(0, 16)}…
          </span>
        ),
      },
      {
        accessorKey: "PieceSize",
        header: "Piece Size",
        cell: ({ row }) =>
          row.original.PieceSizeStr || formatBytes(row.original.PieceSize),
      },
      {
        accessorKey: "RawSize",
        header: "Raw Size",
        cell: ({ row }) =>
          row.original.RawSize ? formatBytes(row.original.RawSize) : "—",
      },
      {
        id: "snap",
        header: "Type",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.SnapDeals ? "running" : "done"}
            label={row.original.SnapDeals ? "Snap" : "Regular"}
          />
        ),
      },
      {
        accessorKey: "CreatedAt",
        header: "Created",
        cell: ({ row }) => row.original.CreatedAtStr || row.original.CreatedAt,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() =>
              sealNowMutation.mutate([
                row.original.Actor,
                row.original.SectorNumber,
              ])
            }
            disabled={sealNowMutation.isPending}
          >
            Seal Now
          </Button>
        ),
      },
    ],
    [sealNowMutation],
  );

  return (
    <div className="space-y-4">
      {deals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Total Pending" value={stats.total} />
          <KPICard label="Regular" value={stats.regular} />
          <KPICard label="Snap Deals" value={stats.snap} />
        </div>
      )}
      <DataTable
        columns={columns}
        data={deals}
        loading={isLoading}
        searchable
        searchPlaceholder="Search pending deals..."
        searchColumn="Miner"
        emptyMessage="No pending deals"
      />
    </div>
  );
}
