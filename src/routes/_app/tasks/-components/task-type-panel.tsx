import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/utils/format";
import {
  useSingletonRunNow,
  useSingletonTaskInfo,
  useTaskDetailBundle,
} from "../-module/queries";
import type { TaskHistoryEntryView, TaskMachineView } from "../-module/types";

type OpenTaskHandler = (taskId: number, taskType: string) => void;

const machineColumns: ColumnDef<TaskMachineView>[] = [
  {
    accessorKey: "machineId",
    header: "Machine ID",
  },
  {
    accessorKey: "name",
    header: "Machine Name",
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.address || "—"}</span>
    ),
  },
  {
    accessorKey: "actors",
    header: "Actors",
  },
];

const createHistoryColumns = (
  taskType: string,
  onOpenTask?: OpenTaskHandler,
): ColumnDef<TaskHistoryEntryView>[] => [
  {
    accessorKey: "taskId",
    header: "Task ID",
    cell: ({ row }) =>
      onOpenTask ? (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto p-0 font-mono text-xs"
          aria-label={`Open task ${row.original.taskId}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenTask(row.original.taskId, taskType);
          }}
        >
          {row.original.taskId}
        </Button>
      ) : (
        <span className="font-mono text-xs">{row.original.taskId}</span>
      ),
  },
  {
    accessorKey: "completedBy",
    header: "Executor",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.completedBy || "—"}
      </span>
    ),
  },
  {
    accessorKey: "took",
    header: "Took",
  },
  {
    id: "result",
    header: "Result",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.result ? "done" : "failed"}
        label={row.original.result ? "Success" : "Failed"}
      />
    ),
  },
  {
    id: "posted",
    header: "Posted",
    cell: ({ row }) => formatDateTime(row.original.posted),
  },
  {
    id: "error",
    header: "Error",
    cell: ({ row }) =>
      row.original.err ? (
        <span
          className="max-w-xs truncate text-xs text-destructive"
          title={row.original.err}
        >
          {row.original.err}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
];

interface TaskTypePanelProps {
  taskType: string;
  onOpenTask?: OpenTaskHandler;
}

export function TaskTypePanel({ taskType, onOpenTask }: TaskTypePanelProps) {
  const detail = useTaskDetailBundle({ taskId: null, taskType });
  const singletonQuery = useSingletonTaskInfo(taskType);
  const singletonRunNowMutation = useSingletonRunNow();
  const recentRuns = useMemo(
    () => detail.taskTypeHistory.slice(0, 25),
    [detail.taskTypeHistory],
  );
  const recentFailures = useMemo(
    () => detail.taskTypeFailedHistory.slice(0, 25),
    [detail.taskTypeFailedHistory],
  );
  const historyColumns = useMemo(
    () => createHistoryColumns(taskType, onOpenTask),
    [onOpenTask, taskType],
  );

  if (!taskType) {
    return (
      <SectionCard title="Task Type Detail">
        <p className="text-sm text-muted-foreground">
          Select a task type from the table to inspect machine coverage and
          recent failures.
        </p>
      </SectionCard>
    );
  }

  const singletonInfo = singletonQuery.data;
  const singletonTaskId = singletonInfo?.taskId ?? null;
  const singletonRunning = singletonTaskId !== null;
  const singletonRunRequested = singletonInfo?.runNowRequest ?? false;
  const singletonRunDisabled =
    singletonRunNowMutation.isPending ||
    singletonRunning ||
    singletonRunRequested;

  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="machines">Machines</TabsTrigger>
        <TabsTrigger value="runs">Recent Runs</TabsTrigger>
        <TabsTrigger value="failures">Failures</TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <SectionCard title={`Task Type: ${taskType}`}>
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            {singletonInfo ? (
              <div className="rounded border border-border p-3 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">Singleton</p>
                    <StatusBadge
                      status={singletonRunning ? "running" : "idle"}
                      label={singletonRunning ? "Running" : "Idle"}
                    />
                    {singletonRunRequested ? (
                      <StatusBadge status="pending" label="Run Requested" />
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={singletonRunDisabled}
                    onClick={() => singletonRunNowMutation.mutate([taskType])}
                  >
                    {singletonRunRequested
                      ? "Run Requested"
                      : singletonRunNowMutation.isPending
                        ? "Requesting..."
                        : "Run Now"}
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Current Task</p>
                    {singletonTaskId && onOpenTask ? (
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="h-auto p-0 font-mono text-xs"
                        aria-label={`Open singleton task ${singletonTaskId}`}
                        onClick={() => onOpenTask(singletonTaskId, taskType)}
                      >
                        Task #{singletonTaskId}
                      </Button>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Run</p>
                    <p className="font-medium">
                      {singletonInfo.lastRunTime
                        ? formatDateTime(singletonInfo.lastRunTime)
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="rounded border border-border p-3">
              <p className="text-muted-foreground">Machines</p>
              <p className="text-lg font-semibold">
                {detail.taskMachines.length}
              </p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="text-muted-foreground">Recent Failures</p>
              <p className="text-lg font-semibold">{recentFailures.length}</p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="text-muted-foreground">Recent Runs</p>
              <p className="text-lg font-semibold">{recentRuns.length}</p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="text-muted-foreground">Last Error</p>
              <p className="line-clamp-2 text-sm font-medium">
                {recentFailures[0]?.err ||
                  "No failures in the selected window."}
              </p>
            </div>
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="machines">
        <SectionCard title="Machine Coverage">
          <div className="max-h-[68vh] overflow-auto">
            <DataTable
              columns={machineColumns}
              data={detail.taskMachines}
              loading={detail.taskMachinesLoading}
              emptyMessage="No machine coverage found for this task type."
              pagination={false}
            />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="runs">
        <SectionCard title="Recent Runs (24h)">
          <div className="max-h-[68vh] overflow-auto">
            <DataTable
              columns={historyColumns}
              data={recentRuns}
              loading={detail.taskTypeHistoryLoading}
              emptyMessage="No runs found."
              pagination={false}
            />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="failures">
        <SectionCard title="Recent Failures (24h)">
          <div className="max-h-[68vh] overflow-auto">
            <DataTable
              columns={historyColumns}
              data={recentFailures}
              loading={detail.taskTypeFailedHistoryLoading}
              emptyMessage="No failures found."
              pagination={false}
            />
          </div>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}
