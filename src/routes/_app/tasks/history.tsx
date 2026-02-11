import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import type { TaskHistoryEntry, TaskHistorySummary } from "@/types/task";

export const Route = createFileRoute("/_app/tasks/history")({
  component: TaskHistoryPage,
});

const columns: ColumnDef<TaskHistorySummary>[] = [
  {
    accessorKey: "TaskID",
    header: "ID",
  },
  {
    accessorKey: "Name",
    header: "Task Type",
  },
  {
    accessorKey: "CompletedBy",
    header: "Completed By",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.CompletedBy}</span>
    ),
  },
  {
    accessorKey: "Took",
    header: "Duration",
  },
  {
    accessorKey: "Queued",
    header: "Queued",
  },
  {
    id: "result",
    header: "Result",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Result ? "done" : "failed"}
        label={row.original.Result ? "Success" : "Failed"}
      />
    ),
  },
  {
    accessorKey: "Err",
    header: "Error",
    cell: ({ row }) =>
      row.original.Err ? (
        <span
          className="max-w-xs truncate text-xs text-[hsl(var(--destructive))]"
          title={row.original.Err}
        >
          {row.original.Err}
        </span>
      ) : (
        <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
      ),
  },
];

function TaskDetailDialog({
  taskId,
  open,
  onClose,
}: {
  taskId: number;
  open: boolean;
  onClose: () => void;
}) {
  const { data: history } = useCurioRpc<TaskHistoryEntry[]>(
    "HarmonyTaskHistoryById",
    [taskId],
    { enabled: open },
  );

  const restartMutation = useCurioRpcMutation("RestartFailedTask", {
    invalidateKeys: [["curio", "ClusterTaskHistory"]],
  });

  const entries = history ?? [];
  const latestFailed = entries.length > 0 && !entries[0]?.Result;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Task #{taskId} History</DialogTitle>
        </DialogHeader>
        {latestFailed && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => restartMutation.mutate([taskId])}
            disabled={restartMutation.isPending}
          >
            <RotateCcw className="mr-1 size-3" />
            {restartMutation.isPending
              ? "Restarting..."
              : "Restart Failed Task"}
          </Button>
        )}
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No history found.
            </p>
          ) : (
            entries.map((e, i) => (
              <div
                key={i}
                className="rounded border border-[hsl(var(--border))] p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{e.Name}</span>
                  <StatusBadge
                    status={e.Result ? "done" : "failed"}
                    label={e.Result ? "Success" : "Failed"}
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                  <div>
                    Completed by:{" "}
                    <span className="font-mono">{e.CompletedBy}</span>
                  </div>
                  <div>Duration: {e.Took}</div>
                  <div>Queued: {e.Queued}</div>
                  <div>Posted: {e.Posted}</div>
                </div>
                {e.Err && (
                  <div className="mt-2 rounded bg-[hsl(var(--destructive)/0.1)] p-2 text-xs text-[hsl(var(--destructive))]">
                    {e.Err}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskHistoryPage() {
  const { data, isLoading } = useCurioRpc<TaskHistorySummary[]>(
    "ClusterTaskHistory",
    [100, 0],
    { refetchInterval: 20_000 },
  );

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  return (
    <>
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        searchable
        searchPlaceholder="Search task history..."
        searchColumn="Name"
        emptyMessage="No task history"
        onRowClick={(row) => setSelectedTaskId(row.TaskID)}
      />
      {selectedTaskId !== null && (
        <TaskDetailDialog
          taskId={selectedTaskId}
          open
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}
