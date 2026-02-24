import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type { MK12Pipeline, PipelineFailedStats } from "@/types/market";
import { formatBytes } from "@/utils/format";

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
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.uuid.slice(0, 8)}…
      </span>
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
      if (p.after_find_deal)
        return <StatusBadge status="running" label="FindDeal" />;
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
      row.original.indexed ? <StatusBadge status="done" label="Yes" /> : "—",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onRemove?: (id: string) => void;
        onSealNow?: (spId: number, sectorNum: number) => void;
      };
      return (
        <div className="flex gap-1">
          {meta?.onRemove && (
            <button
              className="rounded p-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
              onClick={() => meta.onRemove!(row.original.uuid)}
              title="Remove pipeline"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      );
    },
  },
];

const dealColumns: ColumnDef<StorageDealListItem>[] = [
  {
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.uuid.slice(0, 8)}…
      </span>
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
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const errObj = row.original.error;
      const hasError =
        errObj && typeof errObj === "object" && "Valid" in errObj
          ? errObj.Valid
          : !!errObj;
      if (hasError) return <StatusBadge status="failed" label="Error" />;
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
        <span className="text-[hsl(var(--muted-foreground))]">Offline:</span>{" "}
        {d.offline ? "Yes" : "No"}
      </div>
      <div>
        <span className="text-[hsl(var(--muted-foreground))]">Raw Size:</span>{" "}
        {d.raw_size ? formatBytes(d.raw_size) : "—"}
      </div>
      <div>
        <span className="text-[hsl(var(--muted-foreground))]">Sector:</span>{" "}
        {d.sector ?? "—"}
      </div>
      <div>
        <span className="text-[hsl(var(--muted-foreground))]">URL:</span>{" "}
        {d.url ? <span title={d.url}>{d.url.slice(0, 40)}</span> : "—"}
      </div>
      <div>
        <span className="text-[hsl(var(--muted-foreground))]">CID v2:</span>{" "}
        {d.piece_cid_v2 || "—"}
      </div>
      <div>
        <span className="text-[hsl(var(--muted-foreground))]">Announce:</span>{" "}
        {d.announce ? "Yes" : "No"}
      </div>
    </div>
  );
}

function MK12DealsPage() {
  const [tab, setTab] = useState("pipelines");

  const { data: pipelineData, isLoading: pipelinesLoading } = useCurioRpc<
    MK12Pipeline[]
  >("GetMK12DealPipelines", [], { refetchInterval: 30_000 });
  const { data: dealList, isLoading: dealsLoading } = useCurioRpc<
    StorageDealListItem[]
  >("MK12StorageDealList", [100, 0], { refetchInterval: 30_000 });
  const { data: ddoDealList, isLoading: ddoLoading } = useCurioRpc<
    StorageDealListItem[]
  >("MK12DDOStorageDealList", [100, 0], { refetchInterval: 30_000 });
  const { data: failedStats } = useCurioRpc<PipelineFailedStats>(
    "MK12PipelineFailedTasks",
    [],
    { refetchInterval: 60_000 },
  );

  const bulkRemoveMutation = useCurioRpcMutation(
    "MK12BulkRemoveFailedMarketPipelines",
    {
      invalidateKeys: [
        ["curio", "GetMK12DealPipelines"],
        ["curio", "MK12PipelineFailedTasks"],
      ],
    },
  );
  const bulkRestartMutation = useCurioRpcMutation(
    "MK12BulkRestartFailedMarketTasks",
    {
      invalidateKeys: [
        ["curio", "GetMK12DealPipelines"],
        ["curio", "MK12PipelineFailedTasks"],
      ],
    },
  );
  const removePipelineMutation = useCurioRpcMutation("DealPipelineRemove", {
    invalidateKeys: [["curio", "GetMK12DealPipelines"]],
  });

  const pipelines = pipelineData ?? [];
  const deals = dealList ?? [];
  const ddoDeals = ddoDealList ?? [];

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
      failedStats.PSDFailed +
      failedStats.FindDealFailed +
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
              <AlertTriangle className="size-4 text-[hsl(var(--destructive))]" />{" "}
              Failed Tasks
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(
                [
                  ["Download", failedStats.DownloadingFailed],
                  ["CommP", failedStats.CommPFailed],
                  ["PSD", failedStats.PSDFailed],
                  ["FindDeal", failedStats.FindDealFailed],
                  ["Index", failedStats.IndexFailed],
                ] as const
              ).map(([name, count]) => (
                <div
                  key={name}
                  className="rounded border border-[hsl(var(--border))] p-2 text-center"
                >
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {name}
                  </p>
                  <p
                    className={`text-lg font-bold ${count > 0 ? "text-[hsl(var(--destructive))]" : ""}`}
                  >
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs>
        <TabsList>
          <TabsTrigger
            active={tab === "pipelines"}
            onClick={() => setTab("pipelines")}
          >
            Pipelines
          </TabsTrigger>
          <TabsTrigger active={tab === "deals"} onClick={() => setTab("deals")}>
            Deal List
          </TabsTrigger>
          <TabsTrigger active={tab === "ddo"} onClick={() => setTab("ddo")}>
            DDO Deals
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
              searchColumn="piece_cid"
              emptyMessage="No MK12 deal pipelines"
              getRowCanExpand={() => true}
              renderSubComponent={PipelineSubRow}
              meta={{
                onRemove: (id: string) => removePipelineMutation.mutate([id]),
              }}
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
          {tab === "ddo" && (
            <DataTable
              columns={dealColumns}
              data={ddoDeals}
              loading={ddoLoading}
              searchable
              searchPlaceholder="Search DDO deals..."
              searchColumn="piece_cid"
              emptyMessage="No MK12 DDO deals"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
