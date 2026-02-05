import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type { HarmonyTaskStat } from "@/types/cluster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/composed/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_app/tasks/overview")({
  component: TaskOverviewPage,
});

interface HarmonyMachineDesc {
  machine_id: number;
  machine_name: string;
  host_and_port: string;
  miners: string;
}

interface TaskStatus {
  task_id: number;
  status: string;
  owner_id?: number;
  name: string;
  posted_at?: string;
}

const machineColumns: ColumnDef<HarmonyMachineDesc>[] = [
  { accessorKey: "machine_id", header: "ID" },
  { accessorKey: "machine_name", header: "Machine" },
  {
    accessorKey: "host_and_port",
    header: "Address",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.host_and_port}</span>,
  },
  { accessorKey: "miners", header: "Actors" },
];

function TaskMachinesDialog({ taskName, open, onClose }: { taskName: string; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useCurioRpc<HarmonyMachineDesc[]>(
    "HarmonyTaskMachines", [taskName], { enabled: open },
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Machines running: {taskName}</DialogTitle>
        </DialogHeader>
        <DataTable
          columns={machineColumns}
          data={data ?? []}
          loading={isLoading}
          emptyMessage="No machines found for this task"
        />
      </DialogContent>
    </Dialog>
  );
}

function TaskOverviewPage() {
  const { data, isLoading } = useCurioRpc<HarmonyTaskStat[]>(
    "HarmonyTaskStats", [], { refetchInterval: 30_000 },
  );

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskIdQuery, setTaskIdQuery] = useState("");
  const [taskStatusId, setTaskStatusId] = useState<number | null>(null);

  const { data: taskStatus } = useCurioRpc<TaskStatus>(
    "GetTaskStatus", [taskStatusId!], { enabled: taskStatusId !== null },
  );

  const handleLookup = useCallback(() => {
    const id = parseInt(taskIdQuery, 10);
    if (!isNaN(id) && id > 0) setTaskStatusId(id);
  }, [taskIdQuery]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const stats = data ?? [];
  const sorted = [...stats].sort((a, b) => b.TotalCount - a.TotalCount);
  const totals = stats.reduce(
    (acc, s) => ({ total: acc.total + s.TotalCount, success: acc.success + s.TrueCount, failed: acc.failed + s.FalseCount }),
    { total: 0, success: 0, failed: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Tasks</p>
            <p className="mt-1 text-3xl font-bold">{totals.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Succeeded</p>
            <p className="mt-1 text-3xl font-bold text-[hsl(var(--success))]">{totals.success}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Failed</p>
            <p className="mt-1 text-3xl font-bold text-[hsl(var(--destructive))]">{totals.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Task ID Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="size-4" /> Task Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter task ID..."
              value={taskIdQuery}
              onChange={(e) => setTaskIdQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleLookup} disabled={!taskIdQuery.trim()}>
              Lookup
            </Button>
          </div>
          {taskStatus && (
            <div className="mt-3 rounded border border-[hsl(var(--border))] p-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">#{taskStatus.task_id}</span>
                <span className="font-medium">{taskStatus.name}</span>
                <StatusBadge
                  status={taskStatus.status === "done" ? "done" : taskStatus.status === "running" ? "running" : taskStatus.status === "failed" ? "failed" : "pending"}
                  label={taskStatus.status}
                />
              </div>
              {taskStatus.posted_at && (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Posted: {taskStatus.posted_at}</p>
              )}
              {taskStatus.owner_id && (
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Owner Machine ID: {taskStatus.owner_id}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Types with machine drill-down */}
      <Card>
        <CardHeader>
          <CardTitle>Task Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((stat) => {
              const rate = stat.TotalCount === 0 ? 0 : (stat.TrueCount / stat.TotalCount) * 100;
              return (
                <div
                  key={stat.Name}
                  className="flex cursor-pointer items-center justify-between border-b border-[hsl(var(--border))] pb-2 last:border-0 hover:bg-[hsl(var(--accent)/0.3)]"
                  onClick={() => setSelectedTask(stat.Name)}
                >
                  <span className="font-medium">{stat.Name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">{stat.TotalCount} runs</span>
                    <span className={rate >= 95 ? "text-[hsl(var(--success))]" : rate >= 80 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--destructive))]"}>
                      {rate.toFixed(1)}% success
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedTask && (
        <TaskMachinesDialog taskName={selectedTask} open onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
