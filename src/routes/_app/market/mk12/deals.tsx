import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { KPICard } from "@/components/composed/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MK12Pipeline } from "@/types/market";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/market/mk12/deals")({
  component: MK12DealsPage,
});

const columns: ColumnDef<MK12Pipeline>[] = [
  {
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.uuid.slice(0, 8)}…</span>
    ),
  },
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.miner}</span>
    ),
  },
  {
    accessorKey: "piece_cid",
    header: "Piece CID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.piece_cid.slice(0, 12)}…
      </span>
    ),
  },
  {
    accessorKey: "piece_size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.original.piece_size),
  },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const p = row.original;
      if (p.complete) return <StatusBadge status="done" label="Complete" />;
      if (p.after_find_deal) return <StatusBadge status="running" label="FindDeal" />;
      if (p.after_psd) return <StatusBadge status="running" label="PSD" />;
      if (p.after_commp) return <StatusBadge status="running" label="CommP" />;
      if (p.started) return <StatusBadge status="running" label="Started" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  {
    id: "indexed",
    header: "Indexed",
    cell: ({ row }) =>
      row.original.indexed ? (
        <StatusBadge status="done" label="Yes" />
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
  },
];

function MK12DealsPage() {
  const { data, isLoading } = useCurioRpc<MK12Pipeline[]>(
    "GetMK12DealPipelines",
    [],
    { refetchInterval: 30_000 },
  );

  const pipelines = data ?? [];

  const stats = useMemo(() => {
    const total = pipelines.length;
    const active = pipelines.filter((p) => p.started && !p.complete).length;
    const complete = pipelines.filter((p) => p.complete).length;
    const pending = pipelines.filter((p) => !p.started).length;
    return { total, active, complete, pending };
  }, [pipelines]);

  return (
    <div className="space-y-6">
      {pipelines.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard label="Total" value={stats.total} />
          <KPICard label="Active" value={stats.active} />
          <KPICard label="Complete" value={stats.complete} />
          <KPICard label="Pending" value={stats.pending} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>MK12 Deal Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pipelines}
            loading={isLoading}
            searchable
            searchPlaceholder="Search deals..."
            searchColumn="piece_cid"
            emptyMessage="No MK12 deal pipelines"
          />
        </CardContent>
      </Card>
    </div>
  );
}
