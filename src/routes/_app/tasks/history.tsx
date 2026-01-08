import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import type { TaskHistorySummary } from "@/types/task";
import type { ColumnDef } from "@tanstack/react-table";

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

function TaskHistoryPage() {
  const { data, isLoading } = useCurioRpc<TaskHistorySummary[]>(
    "ClusterTaskHistory",
    [100, 0],
    { refetchInterval: 20_000 },
  );

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      loading={isLoading}
      searchable
      searchPlaceholder="Search task history..."
      searchColumn="Name"
      emptyMessage="No task history"
    />
  );
}
