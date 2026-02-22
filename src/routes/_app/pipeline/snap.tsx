import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type { SnapPipelineSummary, SnapSectorEntry } from "@/types/pipeline";

export const Route = createFileRoute("/_app/pipeline/snap")({
  component: SnapPage,
});

const sectorColumns: ColumnDef<SnapSectorEntry>[] = [
  { accessorKey: "SectorNumber", header: "Sector" },
  { accessorKey: "Address", header: "Miner" },
  { accessorKey: "StartTime", header: "Started" },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const s = row.original;
      if (s.Failed) return <StatusBadge status="failed" label="Failed" />;
      if (s.AfterProveMsgSuccess)
        return <StatusBadge status="done" label="Done" />;
      if (s.AfterMoveStorage)
        return <StatusBadge status="running" label="MoveStorage" />;
      if (s.AfterSubmit) return <StatusBadge status="running" label="Submit" />;
      if (s.AfterProve) return <StatusBadge status="running" label="Prove" />;
      if (s.AfterEncode) return <StatusBadge status="running" label="Encode" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  {
    id: "taskId",
    header: "Task",
    cell: ({ row }) => {
      const s = row.original;
      const tid =
        s.TaskIDEncode ?? s.TaskIDProve ?? s.TaskIDSubmit ?? s.TaskIDMoveStorage;
      return tid ? (
        <span className="font-mono text-xs">#{tid}</span>
      ) : (
        "—"
      );
    },
  },
  {
    id: "updateReady",
    header: "Ready At",
    cell: ({ row }) =>
      row.original.UpdateReadyAt ? (
        <span className="text-xs">
          {new Date(row.original.UpdateReadyAt).toLocaleString()}
        </span>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "FailedReason",
    header: "Error",
    cell: ({ row }) =>
      row.original.Failed ? (
        <span
          className="max-w-xs truncate text-xs text-[hsl(var(--destructive))]"
          title={`${row.original.FailedReason}${row.original.FailedReasonMsg ? ": " + row.original.FailedReasonMsg : ""}`}
        >
          {row.original.FailedReason}
          {row.original.FailedReasonMsg && (
            <span className="ml-1 text-[hsl(var(--muted-foreground))]">
              ({row.original.FailedReasonMsg.slice(0, 30)})
            </span>
          )}
        </span>
      ) : (
        "—"
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onDelete?: (spId: number, sectorNum: number) => void;
        onResetTasks?: (spId: number, sectorNum: number) => void;
      };
      const s = row.original;
      // Extract SP ID from Address (e.g. "f01234" -> 1234)
      const spId = Number.parseInt(
        s.Address?.replace(/^[ft]0?/, "") || "0",
        10,
      );
      return (
        <div className="flex gap-1">
          {meta?.onResetTasks && (
            <button
              className="rounded p-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
              onClick={() => meta.onResetTasks!(spId, s.SectorNumber)}
              title="Reset task IDs"
            >
              <RotateCcw className="size-3" />
            </button>
          )}
          {meta?.onDelete && (
            <button
              className="rounded p-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
              onClick={() => meta.onDelete!(spId, s.SectorNumber)}
              title="Delete upgrade"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      );
    },
  },
];

function SnapPage() {
  const { data: summaryData, isLoading: summaryLoading } = useCurioRpc<
    SnapPipelineSummary[]
  >("PipelineStatsSnap", [], { refetchInterval: 30_000 });

  const { data: sectorsData, isLoading: sectorsLoading } = useCurioRpc<
    SnapSectorEntry[]
  >("UpgradeSectors", [], { refetchInterval: 30_000 });

  const restartAllMutation = useCurioRpcMutation("PipelineSnapRestartAll", {
    invalidateKeys: [
      ["curio", "PipelineStatsSnap"],
      ["curio", "UpgradeSectors"],
    ],
  });
  const deleteMutation = useCurioRpcMutation("UpgradeDelete", {
    invalidateKeys: [["curio", "UpgradeSectors"]],
  });
  const resetTasksMutation = useCurioRpcMutation("UpgradeResetTaskIDs", {
    invalidateKeys: [["curio", "UpgradeSectors"]],
  });

  const [confirmRestart, setConfirmRestart] = useState(false);

  const totals = useMemo(() => {
    if (!summaryData) return null;
    return summaryData.reduce(
      (acc, s) => ({
        encode: acc.encode + s.CountEncode,
        prove: acc.prove + s.CountProve,
        submit: acc.submit + s.CountSubmit,
        moveStorage: acc.moveStorage + s.CountMoveStorage,
        done: acc.done + s.CountDone,
        failed: acc.failed + s.CountFailed,
      }),
      { encode: 0, prove: 0, submit: 0, moveStorage: 0, done: 0, failed: 0 },
    );
  }, [summaryData]);

  if (summaryLoading && !summaryData) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Snap Pipeline</h2>
        {confirmRestart ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--destructive))]">
              Restart all failed Snap tasks?
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                restartAllMutation.mutate([]);
                setConfirmRestart(false);
              }}
              disabled={restartAllMutation.isPending}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmRestart(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmRestart(true)}
          >
            <RotateCcw className="mr-1 size-3" /> Restart All Failed
          </Button>
        )}
      </div>
      {totals && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard label="Encode" value={totals.encode} />
          <KPICard label="Prove" value={totals.prove} />
          <KPICard label="Submit" value={totals.submit} />
          <KPICard label="Move Storage" value={totals.moveStorage} />
          <KPICard label="Done" value={totals.done} />
          <KPICard label="Failed" value={totals.failed} />
        </div>
      )}

      {summaryData && summaryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Actor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">Encode</th>
                    <th className="px-3 py-2">Prove</th>
                    <th className="px-3 py-2">Submit</th>
                    <th className="px-3 py-2">Move</th>
                    <th className="px-3 py-2">Done</th>
                    <th className="px-3 py-2">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((s) => (
                    <tr
                      key={s.Actor}
                      className="border-b border-[hsl(var(--border))] last:border-0"
                    >
                      <td className="px-3 py-2 font-mono">{s.Actor}</td>
                      <td className="px-3 py-2">{s.CountEncode}</td>
                      <td className="px-3 py-2">{s.CountProve}</td>
                      <td className="px-3 py-2">{s.CountSubmit}</td>
                      <td className="px-3 py-2">{s.CountMoveStorage}</td>
                      <td className="px-3 py-2">{s.CountDone}</td>
                      <td className="px-3 py-2">{s.CountFailed || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Snap Upgrades</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={sectorColumns}
            data={sectorsData ?? []}
            loading={sectorsLoading}
            searchable
            searchPlaceholder="Search sectors..."
            searchColumn="Address"
            emptyMessage="No active snap upgrades"
            meta={{
              onDelete: (spId: number, sectorNum: number) =>
                deleteMutation.mutate([spId, sectorNum]),
              onResetTasks: (spId: number, sectorNum: number) =>
                resetTasksMutation.mutate([spId, sectorNum]),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
