import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/composed/status-badge";
import type {
  TaskHistorySummaryView,
  TaskQueueRow,
  TaskStatView,
} from "../-module/types";

const renderCoalescedCell = (row: TaskQueueRow): string => {
  if (row.kind !== "coalesced") return "";
  return `${row.count} similar tasks hidden`;
};

export const taskQueueColumns: ColumnDef<TaskQueueRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) =>
      row.original.kind === "task" ? row.original.task.id : "—",
  },
  {
    id: "name",
    header: "Task Type",
    cell: ({ row }) =>
      row.original.kind === "task" ? (
        <span className="font-medium">{row.original.task.name}</span>
      ) : (
        <span className="text-xs text-muted-foreground">
          {renderCoalescedCell(row.original)}
        </span>
      ),
  },
  {
    id: "miner",
    header: "Miner",
    cell: ({ row }) =>
      row.original.kind === "task" ? row.original.task.miner || "—" : "—",
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) =>
      row.original.kind === "task" ? (
        <span className="font-mono text-xs">
          {row.original.task.owner || "—"}
        </span>
      ) : (
        "—"
      ),
  },
  {
    id: "duration",
    header: "Duration",
    cell: ({ row }) =>
      row.original.kind === "task"
        ? row.original.task.sincePostedStr || "—"
        : "—",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.kind === "task" ? (
        <StatusBadge status={row.original.task.status} />
      ) : (
        <StatusBadge status="info" label="Grouped" />
      ),
  },
];

export const taskHistoryColumns: ColumnDef<TaskHistorySummaryView>[] = [
  {
    accessorKey: "taskId",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Task Type",
  },
  {
    accessorKey: "completedBy",
    header: "Completed By",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.completedBy || "—"}
      </span>
    ),
  },
  {
    accessorKey: "queued",
    header: "Queued",
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
    accessorKey: "err",
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

export const taskTypeColumns: ColumnDef<TaskStatView>[] = [
  {
    accessorKey: "name",
    header: "Task Type",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "totalCount",
    header: "24h Runs",
  },
  {
    accessorKey: "trueCount",
    header: "Success",
  },
  {
    accessorKey: "falseCount",
    header: "Failed",
  },
  {
    id: "successRate",
    header: "Success Rate",
    cell: ({ row }) => {
      const rate = row.original.successRate;
      const style =
        rate >= 95
          ? "text-success"
          : rate >= 80
            ? "text-warning"
            : "text-destructive";
      return <span className={style}>{rate.toFixed(1)}%</span>;
    },
  },
  {
    accessorKey: "runningMachines",
    header: "Running Machines",
  },
];
