import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
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
  const { data: taskDetail } = useCurioRpc<HarmonyTask>(
    "HarmonyTaskDetails",
    [selectedTaskId!],
    { enabled: selectedTaskId !== null },
  );

  return (
    <div>
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        searchable
        searchPlaceholder="Search tasks..."
        searchColumn="Name"
        emptyMessage="No active tasks"
        onRowClick={(row) => setSelectedTaskId(row.ID)}
      />
      {selectedTaskId !== null && taskDetail && (
        <Dialog open onOpenChange={() => setSelectedTaskId(null)}>
          <DialogContent
            className="max-w-md"
            onClose={() => setSelectedTaskId(null)}
          >
            <DialogHeader>
              <DialogTitle>
                Task #{taskDetail.ID} - {taskDetail.Name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">
                  Owner
                </span>
                <div className="font-mono text-xs">
                  {taskDetail.OwnerName || taskDetail.OwnerAddr || "—"}
                </div>
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">
                  Owner ID
                </span>
                <div>{taskDetail.OwnerID || "—"}</div>
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">
                  Posted
                </span>
                <div className="text-xs">{taskDetail.PostedTime}</div>
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">
                  Updated
                </span>
                <div className="text-xs">{taskDetail.UpdateTime}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
