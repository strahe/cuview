import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { KPICard } from "@/components/composed/kpi-card";
import type { OpenDealInfo } from "@/types/market";
import type { ColumnDef } from "@tanstack/react-table";
import { formatBytes } from "@/utils/format";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/market/pending")({
  component: PendingDealsPage,
});

const columns: ColumnDef<OpenDealInfo>[] = [
  {
    accessorKey: "Miner",
    header: "Miner",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.Miner}</span>,
  },
  { accessorKey: "SectorNumber", header: "Sector" },
  {
    accessorKey: "PieceCID",
    header: "Piece CID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.PieceCID.slice(0, 16)}…</span>,
  },
  {
    accessorKey: "PieceSize",
    header: "Size",
    cell: ({ row }) => row.original.PieceSizeStr || formatBytes(row.original.PieceSize),
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
];

function PendingDealsPage() {
  const { data, isLoading } = useCurioRpc<OpenDealInfo[]>(
    "DealsPending", [], { refetchInterval: 30_000 },
  );

  const deals = data ?? [];
  const stats = useMemo(() => {
    const snap = deals.filter((d) => d.SnapDeals).length;
    return { total: deals.length, snap, regular: deals.length - snap };
  }, [deals]);

  return (
    <div className="space-y-6">
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
