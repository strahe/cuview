import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import type { PdpService, PdpPipeline } from "@/types/pdp";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldCheck, Key } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/pdp/")({
  component: PdpPage,
});

const serviceColumns: ColumnDef<PdpService>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "pubkey",
    header: "Public Key",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.pubkey.slice(0, 24)}…
      </span>
    ),
  },
];

const pipelineColumns: ColumnDef<PdpPipeline>[] = [
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
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const p = row.original;
      if (p.complete) return <StatusBadge status="done" label="Complete" />;
      if (p.indexed) return <StatusBadge status="running" label="Indexed" />;
      if (p.after_save_cache) return <StatusBadge status="running" label="SaveCache" />;
      if (p.after_add_piece_msg) return <StatusBadge status="running" label="AddPieceMsg" />;
      if (p.after_add_piece) return <StatusBadge status="running" label="AddPiece" />;
      if (p.aggregated) return <StatusBadge status="running" label="Aggregated" />;
      if (p.after_commp) return <StatusBadge status="running" label="CommP" />;
      if (p.downloaded) return <StatusBadge status="running" label="Downloaded" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
  },
];

function PdpPage() {
  usePageTitle("PDP");

  const { data: services, isLoading: servicesLoading } = useCurioRpc<
    PdpService[]
  >("PDPServices", [], { refetchInterval: 60_000 });

  const { data: keys, isLoading: keysLoading } = useCurioRpc<string[]>(
    "ListPDPKeys",
    [],
    { refetchInterval: 60_000 },
  );

  const { data: pipelines, isLoading: pipelinesLoading } = useCurioRpc<
    PdpPipeline[]
  >("MK20PDPPipelines", [100, 0], { refetchInterval: 30_000 });

  const stats = useMemo(() => {
    const pipelineList = pipelines ?? [];
    const total = pipelineList.length;
    const active = pipelineList.filter((p) => !p.complete).length;
    const complete = pipelineList.filter((p) => p.complete).length;
    return { total, active, complete };
  }, [pipelines]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">PDP</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Services" value={services?.length ?? 0} />
        <KPICard label="Keys" value={keys?.length ?? 0} />
        <KPICard label="Pipelines" value={stats.total} />
        <KPICard label="Active" value={stats.active} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> PDP Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={serviceColumns}
            data={services ?? []}
            loading={servicesLoading}
            emptyMessage="No PDP services"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-4" /> PDP Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Loading…
            </p>
          ) : keys && keys.length > 0 ? (
            <ul className="space-y-1">
              {keys.map((key, i) => (
                <li key={i} className="font-mono text-xs">
                  {key}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No PDP keys configured
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PDP Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={pipelineColumns}
            data={pipelines ?? []}
            loading={pipelinesLoading}
            searchable
            searchPlaceholder="Search pipelines..."
            searchColumn="client"
            emptyMessage="No PDP pipelines"
          />
        </CardContent>
      </Card>
    </div>
  );
}
