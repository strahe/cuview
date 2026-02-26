import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type { TaskSummary } from "@/types/task";

export const Route = createFileRoute("/_app/tasks/active")({
  component: ActiveTasksPage,
});

interface HarmonyTask {
  ID: number;
  Name: string;
  UpdateTime: string;
  PostedTime: string;
  OwnerID: number;
  OwnerAddr: string;
  OwnerName: string;
}

const columns: ColumnDef<TaskSummary>[] = [
  {
    accessorKey: "ID",
    header: "ID",
  },
  {
    accessorKey: "Name",
    header: "Task Type",
  },
  {
    accessorKey: "Miner",
    header: "Miner",
  },
  {
    accessorKey: "Owner",
    header: "Owner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.Owner ?? "Unassigned"}
      </span>
    ),
  },
  {
    accessorKey: "SincePostedStr",
    header: "Duration",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Owner ? "running" : "pending"}
        label={row.original.Owner ? "Running" : "Pending"}
      />
    ),
  },
];

function ActiveTasksPage() {
  const { data, isLoading } = useCurioRpc<TaskSummary[]>(
    "ClusterTaskSummary",
    [],
    { refetchInterval: 10_000 },
  );
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showBgTasks, setShowBgTasks] = useState(false);
  const { data: taskDetail } = useCurioRpc<HarmonyTask>(
    "HarmonyTaskDetails",
    [selectedTaskId!],
    { enabled: selectedTaskId !== null },
  );

  const filteredData = useMemo(() => {
    const tasks = data ?? [];
    if (showBgTasks) return tasks;
    return tasks.filter((t) => !t.Name.startsWith("bg:"));
  }, [data, showBgTasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-bg-tasks"
          checked={showBgTasks}
          onChange={(e) => setShowBgTasks(e.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        <label
          htmlFor="show-bg-tasks"
          className="cursor-pointer text-sm text-muted-foreground"
        >
          Show background tasks
        </label>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchable
        searchPlaceholder="Search tasks..."
        searchColumn="Name"
        emptyMessage="No active tasks"
        onRowClick={(row) => setSelectedTaskId(row.ID)}
      />
      {selectedTaskId !== null && taskDetail && (
        <Dialog open onOpenChange={() => setSelectedTaskId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Task #{taskDetail.ID} - {taskDetail.Name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Owner</span>
                <div className="font-mono text-xs">
                  {taskDetail.OwnerName || taskDetail.OwnerAddr || "—"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Owner ID</span>
                <div>{taskDetail.OwnerID || "—"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Posted</span>
                <div className="text-xs">{taskDetail.PostedTime}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Updated</span>
                <div className="text-xs">{taskDetail.UpdateTime}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
