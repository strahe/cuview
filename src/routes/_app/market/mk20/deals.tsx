import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Mk20Pipeline } from "@/types/market";
import { formatBytes } from "@/utils/format";
import { FailedTasksCard } from "../-components/failed-tasks-card";
import { ProductsSection } from "../-components/products-section";
import {
  useDealPipelineRemove,
  useMK20BulkRemove,
  useMK20BulkRestart,
  useMK20Deals,
  useMK20FailedTasks,
  useMK20Pipelines,
} from "../-module/queries";
import type { MK20DealListItem } from "../-module/types";
import { extractNullable } from "../-module/types";

export const Route = createFileRoute("/_app/market/mk20/deals")({
  component: MK20DealsPage,
});

function PipelineSubRow({ row }: { row: { original: Mk20Pipeline } }) {
  const d = row.original;
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 px-8 py-3 text-xs sm:grid-cols-3">
      <div>
        <span className="text-muted-foreground">Client:</span> {d.client || "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Offline:</span>{" "}
        {d.offline ? "Yes" : "No"}
      </div>
      <div>
        <span className="text-muted-foreground">Piece CID:</span>{" "}
        {d.piece_cid ? (
          <span className="break-all font-mono" title={d.piece_cid}>
            {d.piece_cid}
          </span>
        ) : (
          "—"
        )}
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
        <span className="text-muted-foreground">Announce:</span>{" "}
        {d.announce ? "Yes" : "No"}
      </div>
    </div>
  );
}

const mk20DealColumns: ColumnDef<MK20DealListItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <Link
        to="/market/mk20/deal/$id"
        params={{ id: row.original.id }}
        className="block max-w-[10rem] truncate font-mono text-xs text-primary hover:underline lg:max-w-[16rem] xl:max-w-[24rem]"
        title={row.original.id}
      >
        {row.original.id || "—"}
      </Link>
    ),
  },
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => {
      const miner = extractNullable(row.original.miner);
      return <span className="font-mono text-xs">{miner ?? "—"}</span>;
    },
  },
  {
    accessorKey: "piece_cid_v2",
    header: "Piece CID",
    cell: ({ row }) => {
      const cid = extractNullable(row.original.piece_cid_v2);
      return (
        <span
          className="block max-w-[12rem] truncate font-mono text-xs lg:max-w-[20rem] xl:max-w-[28rem]"
          title={cid ?? undefined}
        >
          {cid ?? "—"}
        </span>
      );
    },
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

function MK20DealsPage() {
  const [tab, setTab] = useState("pipelines");

  const { data: pipelineData, isLoading: pipelinesLoading } =
    useMK20Pipelines();
  const { data: dealList, isLoading: dealsLoading } = useMK20Deals();
  const { data: failedStats } = useMK20FailedTasks();

  const bulkRestartMutation = useMK20BulkRestart();
  const bulkRemoveMutation = useMK20BulkRemove();
  const removePipelineMutation = useDealPipelineRemove();

  const pipelines = pipelineData ?? [];
  const deals = dealList ?? [];

  const stats = useMemo(() => {
    const total = pipelines.length;
    const active = pipelines.filter((p) => p.started && !p.complete).length;
    const complete = pipelines.filter((p) => p.complete).length;
    const pending = pipelines.filter((p) => !p.started).length;
    return { total, active, complete, pending };
  }, [pipelines]);

  const failedCategories = useMemo(
    () =>
      failedStats
        ? ([
            ["Download", failedStats.DownloadingFailed],
            ["CommP", failedStats.CommPFailed],
            ["Agg", failedStats.AggFailed],
            ["Index", failedStats.IndexFailed],
          ] as const)
        : ([] as const),
    [failedStats],
  );

  const pipelineColumns: ColumnDef<Mk20Pipeline>[] = useMemo(
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
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <Link
            to="/market/mk20/deal/$id"
            params={{ id: row.original.id }}
            className="block max-w-[10rem] truncate font-mono text-xs text-primary hover:underline lg:max-w-[16rem] xl:max-w-[24rem]"
            title={row.original.id}
          >
            {row.original.id || "—"}
          </Link>
        ),
      },
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => (
          <span
            className="block max-w-[10rem] truncate font-mono text-xs lg:max-w-[16rem] xl:max-w-[24rem]"
            title={row.original.client}
          >
            {row.original.client || "—"}
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
        accessorKey: "piece_cid_v2",
        header: "Piece CID",
        cell: ({ row }) => (
          <span
            className="block max-w-[12rem] truncate font-mono text-xs lg:max-w-[20rem] xl:max-w-[28rem]"
            title={row.original.piece_cid_v2 ?? undefined}
          >
            {row.original.piece_cid_v2 || "—"}
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
          if (p.indexed)
            return <StatusBadge status="running" label="Indexed" />;
          if (p.sealed) return <StatusBadge status="running" label="Sealed" />;
          if (p.aggregated)
            return <StatusBadge status="running" label="Aggregated" />;
          if (p.after_commp)
            return <StatusBadge status="running" label="CommP" />;
          if (p.downloaded)
            return <StatusBadge status="running" label="Downloaded" />;
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
            onClick={() => removePipelineMutation.mutate([row.original.id])}
            disabled={removePipelineMutation.isPending}
            title="Remove pipeline"
            aria-label="Remove pipeline"
          >
            <Trash2 className="size-3" />
          </Button>
        ),
      },
    ],
    [removePipelineMutation],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Pipelines" value={stats.total} />
        <KPICard label="Active" value={stats.active} />
        <KPICard label="Complete" value={stats.complete} />
        <KPICard label="Deals" value={deals.length} />
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
        onValueChange={(v) => setTab(v as "pipelines" | "deals" | "products")}
      >
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="deals">Deal List</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <div>
          {tab === "pipelines" && (
            <DataTable
              columns={pipelineColumns}
              data={pipelines}
              loading={pipelinesLoading}
              searchable
              searchPlaceholder="Search pipelines..."
              searchColumn="piece_cid_v2"
              emptyMessage="No MK20 deal pipelines"
              getRowCanExpand={() => true}
              renderSubComponent={PipelineSubRow}
            />
          )}
          {tab === "deals" && (
            <DataTable
              columns={mk20DealColumns}
              data={deals}
              loading={dealsLoading}
              searchable
              searchPlaceholder="Search deals..."
              searchColumn="id"
              emptyMessage="No MK20 storage deals"
            />
          )}
          {tab === "products" && <ProductsSection />}
        </div>
      </Tabs>
    </div>
  );
}
