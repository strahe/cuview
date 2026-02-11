import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { useCurioRpc } from "@/hooks/use-curio-query";
import type { TaskSummary } from "@/types/task";

export const Route = createFileRoute("/_app/tasks/active")({
  component: ActiveTasksPage,
});

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

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      loading={isLoading}
      searchable
      searchPlaceholder="Search tasks..."
      searchColumn="Name"
      emptyMessage="No active tasks"
    />
  );
}
