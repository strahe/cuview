import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { KPICard } from "@/components/composed/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Mk20Pipeline } from "@/types/market";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/market/mk20/deals")({
  component: MK20DealsPage,
});

const columns: ColumnDef<Mk20Pipeline>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.id.slice(0, 8)}…</span>
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
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.client.slice(0, 12)}…</span>
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
      if (p.indexed) return <StatusBadge status="running" label="Indexed" />;
      if (p.sealed) return <StatusBadge status="running" label="Sealed" />;
      if (p.aggregated) return <StatusBadge status="running" label="Aggregated" />;
      if (p.after_commp) return <StatusBadge status="running" label="CommP" />;
      if (p.downloaded) return <StatusBadge status="running" label="Downloaded" />;
      if (p.started) return <StatusBadge status="running" label="Started" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
  },
];

function MK20DealsPage() {
  const { data, isLoading } = useCurioRpc<Mk20Pipeline[]>(
    "MK20DDOPipelines",
    [100, 0],
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
          <CardTitle>MK20 DDO Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pipelines}
            loading={isLoading}
            searchable
            searchPlaceholder="Search deals..."
            searchColumn="client"
            emptyMessage="No MK20 deal pipelines"
          />
        </CardContent>
      </Card>
    </div>
  );
}
