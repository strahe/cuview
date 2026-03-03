import { useMemo } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/utils/format";
import { useRestartFailedTask, useTaskDetailBundle } from "../-module/queries";

interface TaskDetailPanelProps {
  taskId: number | null;
  taskType: string;
  embedded?: boolean;
}

const statusToBadge = (status: string) => {
  if (
    status === "pending" ||
    status === "running" ||
    status === "done" ||
    status === "failed"
  ) {
    return status;
  }
  return "info";
};

export function TaskDetailPanel({
  taskId,
  taskType,
  embedded = false,
}: TaskDetailPanelProps) {
  const detail = useTaskDetailBundle({
    taskId,
    taskType,
    includeTaskTypeData: false,
  });
  const restartMutation = useRestartFailedTask();

  const canRestart = useMemo(() => {
    const status = detail.taskStatus?.status ?? "unknown";
    const latest = detail.taskHistoryById[0];
    return status === "failed" || (!!latest && !latest.result);
  }, [detail.taskHistoryById, detail.taskStatus?.status]);

  if (taskId === null) {
    if (embedded) {
      return (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
          Select a task to view status and execution history.
        </div>
      );
    }

    return (
      <SectionCard title="Task Detail">
        <p className="text-sm text-muted-foreground">
          Select a task row to inspect status, detail, history and recovery
          actions.
        </p>
      </SectionCard>
    );
  }

  if (
    detail.taskStatusLoading ||
    detail.taskDetailLoading ||
    detail.taskHistoryByIdLoading
  ) {
    if (embedded) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    return (
      <SectionCard title={`Task #${taskId}`}>
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </SectionCard>
    );
  }

  const restartAction = canRestart ? (
    <Button
      size="sm"
      variant="outline"
      disabled={restartMutation.isPending}
      onClick={() => restartMutation.mutate([taskId])}
    >
      {restartMutation.isPending ? "Restarting..." : "Restart Failed Task"}
    </Button>
  ) : null;

  const content = (
    <div className="space-y-4 text-sm">
      {detail.taskStatus ? (
        <div className="rounded-xl border border-border p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-medium">
              {detail.taskStatus.name || "Unknown"}
            </span>
            <StatusBadge
              status={statusToBadge(detail.taskStatus.status)}
              label={detail.taskStatus.status}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Owner Machine: {detail.taskStatus.ownerId ?? "—"}</div>
            <div>
              Posted:{" "}
              {detail.taskStatus.postedAt
                ? formatDateTime(detail.taskStatus.postedAt)
                : "—"}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Task status unavailable.
        </p>
      )}

      {detail.taskDetail && (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Runtime Detail
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div>Name: {detail.taskDetail.name || "—"}</div>
            <div>Owner ID: {detail.taskDetail.ownerId ?? "—"}</div>
            <div>Owner Addr: {detail.taskDetail.ownerAddr || "—"}</div>
            <div>Owner Name: {detail.taskDetail.ownerName || "—"}</div>
            <div>Posted: {formatDateTime(detail.taskDetail.postedTime)}</div>
            <div>Updated: {formatDateTime(detail.taskDetail.updateTime)}</div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          Recent Execution History
        </p>
        {detail.taskHistoryById.length === 0 ? (
          <p className="text-xs text-muted-foreground">No history found.</p>
        ) : (
          <div
            className={`space-y-2 overflow-auto ${
              embedded ? "max-h-[50vh]" : "max-h-64"
            }`}
          >
            {detail.taskHistoryById.slice(0, 8).map((entry, index) => (
              <div
                key={`history-${entry.id}-${entry.taskId}-${entry.workStart}-${index}`}
                className="rounded border border-border/70 p-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{entry.name}</span>
                  <StatusBadge
                    status={entry.result ? "done" : "failed"}
                    label={entry.result ? "Success" : "Failed"}
                  />
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
                  <div>Worker: {entry.completedBy || "—"}</div>
                  <div>Took: {entry.took || "—"}</div>
                  <div>Posted: {formatDateTime(entry.posted)}</div>
                  <div>Events: {entry.eventCount}</div>
                </div>
                {entry.err && (
                  <p className="mt-2 rounded bg-destructive/[0.1] p-1.5 text-destructive">
                    {entry.err}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        {restartAction ? (
          <div className="flex items-center justify-end">{restartAction}</div>
        ) : null}
        {content}
      </div>
    );
  }

  return (
    <SectionCard title={`Task #${taskId}`} action={restartAction}>
      {content}
    </SectionCard>
  );
}
