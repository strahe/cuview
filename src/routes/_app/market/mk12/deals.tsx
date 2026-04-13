import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MK12Pipeline } from "@/types/market";
import { formatBytes } from "@/utils/format";
import { FailedTasksCard } from "../-components/failed-tasks-card";
import {
  useDealPipelineRemove,
  useMK12BulkRemove,
  useMK12BulkRestart,
  useMK12DDODeals,
  useMK12Deals,
  useMK12FailedTasks,
  useMK12Pipelines,
} from "../-module/queries";
import type { MK12DealListItem } from "../-module/types";

export const Route = createFileRoute("/_app/market/mk12/deals")({
  component: MK12DealsPage,
});

function PipelineSubRow({ row }: { row: { original: MK12Pipeline } }) {
  const d = row.original;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-8 py-3 text-xs sm:grid-cols-3">
      <div>
        <span className="text-muted-foreground">Offline:</span>{" "}
        {d.offline ? "Yes" : "No"}
      </div>
      <div>
        <span className="text-muted-foreground">Raw Size:</span>{" "}
        {d.raw_size ? formatBytes(d.raw_size) : "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Sector:</span> {d.sector ?? "—"}
      </div>
      <div>
        <span className="text-muted-foreground">URL:</span>{" "}
        {d.url ? <span title={d.url}>{d.url.slice(0, 40)}</span> : "—"}
      </div>
      <div>
        <span className="text-muted-foreground">CID v2:</span>{" "}
        {d.piece_cid_v2 || "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Announce:</span>{" "}
        {d.announce ? "Yes" : "No"}
      </div>
    </div>
  );
}

const mk12DealColumns: ColumnDef<MK12DealListItem>[] = [
  {
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => (
      <Link
        to="/market/mk12/deal/$id"
        params={{ id: row.original.uuid }}
        className="block max-w-[10rem] truncate font-mono text-xs text-primary hover:underline lg:max-w-[16rem] xl:max-w-[24rem]"
        title={row.original.uuid}
      >
        {row.original.uuid || "—"}
      </Link>
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
      <span
        className="block max-w-[12rem] truncate font-mono text-xs lg:max-w-[20rem] xl:max-w-[28rem]"
        title={row.original.piece_cid}
      >
        {row.original.piece_cid || "—"}
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
          ? errObj.Valid &&
            !!((errObj as { Valid: boolean; String?: string }).String ?? "")
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

function MK12DealsPage() {
  const [tab, setTab] = useState("pipelines");

  const { data: pipelineData, isLoading: pipelinesLoading } =
    useMK12Pipelines();
  const { data: dealList, isLoading: dealsLoading } = useMK12Deals();
  const { data: ddoDealList, isLoading: ddoLoading } = useMK12DDODeals();
  const { data: failedStats } = useMK12FailedTasks();

  const bulkRestartMutation = useMK12BulkRestart();
  const bulkRemoveMutation = useMK12BulkRemove();
  const removePipelineMutation = useDealPipelineRemove();

  const pipelines = pipelineData ?? [];
  const deals = dealList ?? [];
  const ddoDeals = ddoDealList ?? [];

  const stats = useMemo(() => {
    let active = 0;
    let complete = 0;
    let pending = 0;
    for (const p of pipelines) {
      if (p.started && !p.complete) active++;
      if (p.complete) complete++;
      if (!p.started) pending++;
    }
    return { total: pipelines.length, active, complete, pending };
  }, [pipelines]);

  const failedCategories = useMemo(
    () =>
      failedStats
        ? ([
            ["Download", failedStats.DownloadingFailed],
            ["CommP", failedStats.CommPFailed],
            ["PSD", failedStats.PSDFailed],
            ["FindDeal", failedStats.FindDealFailed],
            ["Index", failedStats.IndexFailed],
          ] as const)
        : ([] as const),
    [failedStats],
  );

  const pipelineColumns: ColumnDef<MK12Pipeline>[] = useMemo(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => row.toggleExpanded()}
            aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </Button>
        ),
        size: 30,
      },
      {
        accessorKey: "uuid",
        header: "UUID",
        cell: ({ row }) => (
          <Link
            to="/market/mk12/deal/$id"
            params={{ id: row.original.uuid }}
            className="block max-w-[10rem] truncate font-mono text-xs text-primary hover:underline lg:max-w-[16rem] xl:max-w-[24rem]"
            title={row.original.uuid}
          >
            {row.original.uuid || "—"}
          </Link>
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
          <span
            className="block max-w-[12rem] truncate font-mono text-xs lg:max-w-[20rem] xl:max-w-[28rem]"
            title={row.original.piece_cid}
          >
            {row.original.piece_cid || "—"}
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
          if (p.after_commp)
            return <StatusBadge status="running" label="CommP" />;
          if (p.started)
            return <StatusBadge status="running" label="Started" />;
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
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removePipelineMutation.mutate([row.original.uuid])}
            disabled={removePipelineMutation.isPending}
            title="Remove pipeline"
            aria-label="Remove pipeline"
          >
            {removePipelineMutation.isPending &&
            removePipelineMutation.variables?.[0] === row.original.uuid ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
          </Button>
        ),
      },
    ],
    [removePipelineMutation],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KPICard label="Pipelines" value={stats.total} />
        <KPICard label="Active" value={stats.active} />
        <KPICard label="Complete" value={stats.complete} />
        <KPICard label="Deals" value={deals.length} />
        <KPICard label="DDO Deals" value={ddoDeals.length} />
      </div>

      {failedStats && (
        <FailedTasksCard
          categories={failedCategories}
          onRestart={() => bulkRestartMutation.mutate(["all"])}
          onRemove={() => bulkRemoveMutation.mutate(["all"])}
          restartPending={bulkRestartMutation.isPending}
          removePending={bulkRemoveMutation.isPending}
        />
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "pipelines" | "deals" | "ddo")}
      >
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="deals">Deal List</TabsTrigger>
          <TabsTrigger value="ddo">DDO Deals</TabsTrigger>
        </TabsList>
        <div>
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
            />
          )}
          {tab === "deals" && (
            <DataTable
              columns={mk12DealColumns}
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
              columns={mk12DealColumns}
              data={ddoDeals}
              loading={ddoLoading}
              searchable
              searchPlaceholder="Search DDO deals..."
              searchColumn="piece_cid"
              emptyMessage="No MK12 DDO deals"
            />
          )}
        </div>
      </Tabs>
    </div>
  );
}
