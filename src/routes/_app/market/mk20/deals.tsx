import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/composed/tabs";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type { Mk20Pipeline, Mk20PipelineFailedStats } from "@/types/market";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/market/mk20/deals")({
  component: MK20DealsPage,
});

interface MK20DealItem {
  id: string;
  created_at: string;
  piece_cid_v2?: { Valid: boolean; String: string } | string | null;
  processed: boolean;
  error?: { Valid: boolean; String: string } | string | null;
  miner?: { Valid: boolean; String: string } | string | null;
}

interface MK20PDPDealItem {
  id: string;
  created_at: string;
  piece_cid_v2?: { Valid: boolean; String: string } | string | null;
  processed: boolean;
  error?: { Valid: boolean; String: string } | string | null;
}

interface MK20PDPFailedStats {
  DownloadingFailed: number;
  CommPFailed: number;
  AggFailed: number;
  AddPieceFailed: number;
  SaveCacheFailed: number;
  IndexFailed: number;
}

const pipelineColumns: ColumnDef<Mk20Pipeline>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <button onClick={() => row.toggleExpanded()} className="p-1">
        {row.getIsExpanded() ? "▼" : "▶"}
      </button>
    ),
    size: 30,
  },
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
      <span className="font-mono text-xs">
        {row.original.client.slice(0, 12)}…
      </span>
    ),
  },
  {
    accessorKey: "piece_size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.original.piece_size),
  },
  {
    accessorKey: "sector",
    header: "Sector",
    cell: ({ row }) => {
      const s = row.original.sector;
      return s != null ? <span className="font-mono text-xs">{s}</span> : "—";
    },
  },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const p = row.original;
      if (p.complete) return <StatusBadge status="done" label="Complete" />;
      if (p.indexed) return <StatusBadge status="running" label="Indexed" />;
      if (p.sealed) return <StatusBadge status="running" label="Sealed" />;
      if (p.aggregated)
        return <StatusBadge status="running" label="Aggregated" />;
      if (p.after_commp) return <StatusBadge status="running" label="CommP" />;
      if (p.downloaded)
        return <StatusBadge status="running" label="Downloaded" />;
      if (p.started) return <StatusBadge status="running" label="Started" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  { accessorKey: "created_at", header: "Created" },
];

function extractStr(
  v: { Valid: boolean; String: string } | string | null | undefined,
): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  return v.Valid ? v.String : null;
}

const dealColumns: ColumnDef<MK20DealItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.id.slice(0, 8)}…</span>
    ),
  },
  {
    id: "miner",
    header: "Miner",
    cell: ({ row }) => {
      const m = extractStr(row.original.miner);
      return m ? <span className="font-mono text-xs">{m}</span> : "—";
    },
  },
  {
    id: "piece_cid",
    header: "Piece CID",
    cell: ({ row }) => {
      const c = extractStr(row.original.piece_cid_v2);
      return c ? (
        <span className="font-mono text-xs">{c.slice(0, 12)}…</span>
      ) : (
        "—"
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const errStr = extractStr(row.original.error);
      if (errStr) return <StatusBadge status="failed" label="Error" />;
      return row.original.processed ? (
        <StatusBadge status="done" label="Processed" />
      ) : (
        <StatusBadge status="pending" label="Pending" />
      );
    },
  },
  { accessorKey: "created_at", header: "Created" },
];

function PipelineSubRow({ row }: { row: any }) {
  const d = row.original;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-8 py-3 text-xs sm:grid-cols-3">
      <div>
        <span className="text-muted-foreground">Contract:</span>{" "}
        <span className="font-mono" title={d.contract}>
          {d.contract?.slice(0, 16)}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Piece CID:</span>{" "}
        <span className="font-mono" title={d.piece_cid}>
          {d.piece_cid?.slice(0, 16)}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Raw Size:</span>{" "}
        {d.raw_size ? formatBytes(d.raw_size) : "—"}
      </div>
      <div>
        <span className="text-muted-foreground">URL:</span>{" "}
        {d.url ? <span title={d.url}>{d.url.slice(0, 40)}</span> : "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Allocation:</span>{" "}
        {d.allocation_id ?? "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Duration:</span>{" "}
        {d.duration ?? "—"}
      </div>
    </div>
  );
}

function MK20DealsPage() {
  const [tab, setTab] = useState("pipelines");

  const { data: pipelineData, isLoading: pipelinesLoading } = useCurioRpc<
    Mk20Pipeline[]
  >("MK20DDOPipelines", [100, 0], { refetchInterval: 30_000 });
  const { data: dealList, isLoading: dealsLoading } = useCurioRpc<
    MK20DealItem[]
  >("MK20DDOStorageDeals", [100, 0], { refetchInterval: 30_000 });
  const { data: failedStats } = useCurioRpc<Mk20PipelineFailedStats>(
    "MK20PipelineFailedTasks",
    [],
    { refetchInterval: 60_000 },
  );

  const bulkRemoveMutation = useCurioRpcMutation(
    "MK20BulkRemoveFailedMarketPipelines",
    {
      invalidateKeys: [
        ["curio", "MK20DDOPipelines"],
        ["curio", "MK20PipelineFailedTasks"],
      ],
    },
  );
  const bulkRestartMutation = useCurioRpcMutation(
    "MK20BulkRestartFailedMarketTasks",
    {
      invalidateKeys: [
        ["curio", "MK20DDOPipelines"],
        ["curio", "MK20PipelineFailedTasks"],
      ],
    },
  );

  // PDP deals & operations
  const { data: pdpDealList, isLoading: pdpLoading } = useCurioRpc<
    MK20PDPDealItem[]
  >("MK20PDPStorageDeals", [100, 0], { refetchInterval: 30_000 });
  const { data: pdpFailedStats } = useCurioRpc<MK20PDPFailedStats>(
    "MK20PDPPipelineFailedTasks",
    [],
    { refetchInterval: 60_000 },
  );
  const bulkRemovePDP = useCurioRpcMutation(
    "MK20BulkRemoveFailedPDPPipelines",
    {
      invalidateKeys: [
        ["curio", "MK20PDPStorageDeals"],
        ["curio", "MK20PDPPipelineFailedTasks"],
      ],
    },
  );
  const bulkRestartPDP = useCurioRpcMutation("MK20BulkRestartFailedPDPTasks", {
    invalidateKeys: [
      ["curio", "MK20PDPStorageDeals"],
      ["curio", "MK20PDPPipelineFailedTasks"],
    ],
  });

  const pipelines = pipelineData ?? [];
  const deals = dealList ?? [];
  const pdpDeals = pdpDealList ?? [];

  const stats = useMemo(() => {
    const total = pipelines.length;
    const active = pipelines.filter((p) => p.started && !p.complete).length;
    const complete = pipelines.filter((p) => p.complete).length;
    const pending = pipelines.filter((p) => !p.started).length;
    return { total, active, complete, pending };
  }, [pipelines]);

  const totalFailed = failedStats
    ? failedStats.DownloadingFailed +
      failedStats.CommPFailed +
      failedStats.AggFailed +
      failedStats.IndexFailed
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
              <AlertTriangle className="size-4 text-destructive" /> Failed Tasks
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkRestartMutation.mutate(["all"])}
                disabled={bulkRestartMutation.isPending}
              >
                <RotateCcw className="mr-1 size-3" /> Restart All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => bulkRemoveMutation.mutate(["all"])}
                disabled={bulkRemoveMutation.isPending}
              >
                <Trash2 className="mr-1 size-3" /> Remove All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Download", failedStats.DownloadingFailed],
                  ["CommP", failedStats.CommPFailed],
                  ["Aggregation", failedStats.AggFailed],
                  ["Index", failedStats.IndexFailed],
                ] as const
              ).map(([name, count]) => (
                <div
                  key={name}
                  className="rounded border border-border p-2 text-center"
                >
                  <p className="text-xs text-muted-foreground">{name}</p>
                  <p
                    className={`text-lg font-bold ${count > 0 ? "text-destructive" : ""}`}
                  >
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pdpFailedStats &&
        (() => {
          const total =
            pdpFailedStats.DownloadingFailed +
            pdpFailedStats.CommPFailed +
            pdpFailedStats.AggFailed +
            pdpFailedStats.AddPieceFailed +
            pdpFailedStats.SaveCacheFailed +
            pdpFailedStats.IndexFailed;
          if (total === 0) return null;
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" /> PDP
                  Failed Tasks
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkRestartPDP.mutate(["all"])}
                    disabled={bulkRestartPDP.isPending}
                  >
                    <RotateCcw className="mr-1 size-3" /> Restart All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => bulkRemovePDP.mutate(["all"])}
                    disabled={bulkRemovePDP.isPending}
                  >
                    <Trash2 className="mr-1 size-3" /> Remove All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                  {(
                    [
                      ["Download", pdpFailedStats.DownloadingFailed],
                      ["CommP", pdpFailedStats.CommPFailed],
                      ["Aggregation", pdpFailedStats.AggFailed],
                      ["AddPiece", pdpFailedStats.AddPieceFailed],
                      ["SaveCache", pdpFailedStats.SaveCacheFailed],
                      ["Index", pdpFailedStats.IndexFailed],
                    ] as const
                  ).map(([name, count]) => (
                    <div
                      key={name}
                      className="rounded border border-border p-2 text-center"
                    >
                      <p className="text-xs text-muted-foreground">{name}</p>
                      <p
                        className={`text-lg font-bold ${count > 0 ? "text-destructive" : ""}`}
                      >
                        {count}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

      <Tabs>
        <TabsList>
          <TabsTrigger
            active={tab === "pipelines"}
            onClick={() => setTab("pipelines")}
          >
            Pipelines
          </TabsTrigger>
          <TabsTrigger active={tab === "deals"} onClick={() => setTab("deals")}>
            DDO Deals
          </TabsTrigger>
          <TabsTrigger active={tab === "pdp"} onClick={() => setTab("pdp")}>
            PDP Deals
          </TabsTrigger>
        </TabsList>
        <TabsContent>
          {tab === "pipelines" && (
            <DataTable
              columns={pipelineColumns}
              data={pipelines}
              loading={pipelinesLoading}
              searchable
              searchPlaceholder="Search pipelines..."
              searchColumn="client"
              emptyMessage="No MK20 deal pipelines"
              getRowCanExpand={() => true}
              renderSubComponent={PipelineSubRow}
            />
          )}
          {tab === "deals" && (
            <DataTable
              columns={dealColumns}
              data={deals}
              loading={dealsLoading}
              searchable
              searchPlaceholder="Search deals..."
              searchColumn="id"
              emptyMessage="No MK20 DDO deals"
            />
          )}
          {tab === "pdp" && (
            <DataTable
              columns={dealColumns}
              data={pdpDeals}
              loading={pdpLoading}
              searchable
              searchPlaceholder="Search PDP deals..."
              searchColumn="id"
              emptyMessage="No MK20 PDP deals"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
