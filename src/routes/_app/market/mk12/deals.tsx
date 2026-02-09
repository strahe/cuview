import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { KPICard } from "@/components/composed/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { MK12Pipeline, PipelineFailedStats } from "@/types/market";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { formatBytes } from "@/utils/format";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/market/mk12/deals")({
  component: MK12DealsPage,
});

interface StorageDealListItem {
  uuid: string;
  sp_id: number;
  created_at: string;
  piece_cid: string;
  piece_size: number;
  raw_size?: { Valid: boolean; Int64: number } | null;
  piece_cid_v2?: string;
  processed: boolean;
  error?: { Valid: boolean; String: string } | null;
  miner: string;
}

const pipelineColumns: ColumnDef<MK12Pipeline>[] = [
  {
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.uuid.slice(0, 8)}…</span>,
  },
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.miner}</span>,
  },
  {
    accessorKey: "piece_cid",
    header: "Piece CID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.piece_cid.slice(0, 12)}…</span>,
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
    cell: ({ row }) => row.original.indexed ? <StatusBadge status="done" label="Yes" /> : "—",
  },
  { accessorKey: "created_at", header: "Created" },
];

const dealColumns: ColumnDef<StorageDealListItem>[] = [
  {
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.uuid.slice(0, 8)}…</span>,
  },
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.miner}</span>,
  },
  {
    accessorKey: "piece_cid",
    header: "Piece CID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.piece_cid.slice(0, 12)}…</span>,
  },
  {
    accessorKey: "piece_size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.original.piece_size),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const errObj = row.original.error;
      const hasError = errObj && typeof errObj === "object" && "Valid" in errObj ? errObj.Valid : !!errObj;
      if (hasError) return <StatusBadge status="failed" label="Error" />;
      return row.original.processed
        ? <StatusBadge status="done" label="Processed" />
        : <StatusBadge status="pending" label="Pending" />;
    },
  },
  { accessorKey: "created_at", header: "Created" },
];

function MK12DealsPage() {
  const [tab, setTab] = useState("pipelines");

  const { data: pipelineData, isLoading: pipelinesLoading } = useCurioRpc<MK12Pipeline[]>(
    "GetMK12DealPipelines", [], { refetchInterval: 30_000 },
  );
  const { data: dealList, isLoading: dealsLoading } = useCurioRpc<StorageDealListItem[]>(
    "MK12StorageDealList", [100, 0], { refetchInterval: 30_000 },
  );
  const { data: failedStats } = useCurioRpc<PipelineFailedStats>(
    "MK12PipelineFailedTasks", [], { refetchInterval: 60_000 },
  );

  const bulkRemoveMutation = useCurioRpcMutation("MK12BulkRemoveFailedMarketPipelines", {
    invalidateKeys: [["curio", "GetMK12DealPipelines"], ["curio", "MK12PipelineFailedTasks"]],
  });
  const bulkRestartMutation = useCurioRpcMutation("MK12BulkRestartFailedMarketTasks", {
    invalidateKeys: [["curio", "GetMK12DealPipelines"], ["curio", "MK12PipelineFailedTasks"]],
  });

  const pipelines = pipelineData ?? [];
  const deals = dealList ?? [];

  const stats = useMemo(() => {
    const total = pipelines.length;
    const active = pipelines.filter((p) => p.started && !p.complete).length;
    const complete = pipelines.filter((p) => p.complete).length;
    const pending = pipelines.filter((p) => !p.started).length;
    return { total, active, complete, pending };
  }, [pipelines]);

  const totalFailed = failedStats
    ? failedStats.DownloadingFailed + failedStats.CommPFailed + failedStats.PSDFailed + failedStats.FindDealFailed + failedStats.IndexFailed
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KPICard label="Pipelines" value={stats.total} />
        <KPICard label="Active" value={stats.active} />
        <KPICard label="Complete" value={stats.complete} />
        <KPICard label="Deals" value={deals.length} />
        <KPICard label="Failed" value={totalFailed} />
      </div>

      {failedStats && totalFailed > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-[hsl(var(--destructive))]" /> Failed Tasks
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkRestartMutation.mutate(["all"])} disabled={bulkRestartMutation.isPending}>
                <RotateCcw className="mr-1 size-3" /> Restart All
              </Button>
              <Button size="sm" variant="destructive" onClick={() => bulkRemoveMutation.mutate(["all"])} disabled={bulkRemoveMutation.isPending}>
                <Trash2 className="mr-1 size-3" /> Remove All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {([
                ["Download", failedStats.DownloadingFailed],
                ["CommP", failedStats.CommPFailed],
                ["PSD", failedStats.PSDFailed],
                ["FindDeal", failedStats.FindDealFailed],
                ["Index", failedStats.IndexFailed],
              ] as const).map(([name, count]) => (
                <div key={name} className="rounded border border-[hsl(var(--border))] p-2 text-center">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{name}</p>
                  <p className={`text-lg font-bold ${count > 0 ? "text-[hsl(var(--destructive))]" : ""}`}>{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs>
        <TabsList>
          <TabsTrigger active={tab === "pipelines"} onClick={() => setTab("pipelines")}>Pipelines</TabsTrigger>
          <TabsTrigger active={tab === "deals"} onClick={() => setTab("deals")}>Deal List</TabsTrigger>
        </TabsList>
        <TabsContent>
          {tab === "pipelines" && (
            <DataTable
              columns={pipelineColumns}
              data={pipelines}
              loading={pipelinesLoading}
              searchable
              searchPlaceholder="Search pipelines..."
              searchColumn="piece_cid"
              emptyMessage="No MK12 deal pipelines"
            />
          )}
          {tab === "deals" && (
            <DataTable
              columns={dealColumns}
              data={deals}
              loading={dealsLoading}
              searchable
              searchPlaceholder="Search deals..."
              searchColumn="piece_cid"
              emptyMessage="No MK12 storage deals"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
