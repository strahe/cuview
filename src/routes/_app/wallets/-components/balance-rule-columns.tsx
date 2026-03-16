import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/format";
import type { BalanceRuleView } from "../-module/types";

export const balanceRuleColumns: ColumnDef<BalanceRuleView>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">#{row.original.id}</span>
    ),
  },
  {
    accessorKey: "subjectType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.subjectType}
      </Badge>
    ),
  },
  {
    accessorKey: "subjectAddress",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.subjectAddress}</span>
    ),
  },
  {
    accessorKey: "secondAddress",
    header: "Second Address",
    cell: ({ row }) =>
      row.original.subjectType === "proofshare" ? (
        <span className="text-xs text-muted-foreground">—</span>
      ) : (
        <span className="font-mono text-xs">{row.original.secondAddress}</span>
      ),
  },
  {
    accessorKey: "actionTypeLabel",
    header: "Action",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.actionTypeLabel}</span>
    ),
  },
  {
    accessorKey: "lowWatermark",
    header: "Low WM",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.lowWatermark}</span>
    ),
  },
  {
    accessorKey: "highWatermark",
    header: "High WM",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.highWatermark}</span>
    ),
  },
  {
    id: "lastMsg",
    header: "Last Msg",
    cell: ({ row }) =>
      row.original.lastMsgCid ? (
        <span className="font-mono text-xs" title={row.original.lastMsgCid}>
          {row.original.lastMsgCid.slice(0, 12)}…
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "lastMsgTime",
    header: "Last Sent",
    cell: ({ row }) =>
      row.original.lastMsgSentAt ? (
        <span className="text-xs">
          {formatDateTime(row.original.lastMsgSentAt)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "taskId",
    header: "Task",
    cell: ({ row }) =>
      row.original.taskId ? (
        <Badge variant="outline" className="text-xs">
          #{row.original.taskId}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
];
