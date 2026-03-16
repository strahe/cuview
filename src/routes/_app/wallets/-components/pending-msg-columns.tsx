import type { ColumnDef } from "@tanstack/react-table";
import type { PendingMessage } from "@/types/wallet";
import { formatDateTime } from "@/utils/format";
import {
  getMessageAgeColorClass,
  getMessageAgeSeverity,
} from "../-module/adapters";

export const pendingMsgColumns: ColumnDef<PendingMessage>[] = [
  {
    accessorKey: "added_at",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-xs">{formatDateTime(row.original.added_at)}</span>
    ),
  },
  {
    accessorKey: "message",
    header: "Message CID",
    cell: ({ row }) => {
      const severity = getMessageAgeSeverity(row.original.added_at);
      const colorClass = getMessageAgeColorClass(severity);
      return (
        <span className={`font-mono text-xs ${colorClass}`}>
          {row.original.message}
        </span>
      );
    },
  },
];
