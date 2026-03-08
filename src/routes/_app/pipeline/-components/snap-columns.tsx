import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import type { SnapSectorView } from "../-module/types";

export interface SnapColumnMeta {
  onDelete?: (spId: number, sectorNum: number) => void;
  onResetTasks?: (spId: number, sectorNum: number) => void;
}

export const snapSectorColumns: ColumnDef<SnapSectorView>[] = [
  { accessorKey: "sectorNumber", header: "Sector" },
  { accessorKey: "address", header: "Miner" },
  { accessorKey: "startTime", header: "Started" },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const r = row.original;
      const statusMap: Record<
        string,
        "pending" | "running" | "done" | "failed"
      > = {
        Pending: "pending",
        Done: "done",
        Failed: "failed",
      };
      const status = statusMap[r.stage] ?? "running";
      return <StatusBadge status={status} label={r.stage} />;
    },
  },
  {
    id: "taskId",
    header: "Task",
    cell: ({ row }) => {
      const tid = row.original.activeTaskId;
      return tid ? <span className="font-mono text-xs">#{tid}</span> : "—";
    },
  },
  {
    id: "updateReady",
    header: "Ready At",
    cell: ({ row }) =>
      row.original.updateReadyAt ? (
        <span className="text-xs">
          {new Date(row.original.updateReadyAt).toLocaleString()}
        </span>
      ) : (
        "—"
      ),
  },
  {
    id: "error",
    header: "Error",
    cell: ({ row }) => {
      const r = row.original;
      if (!r.failed) return "—";
      return (
        <span
          className="max-w-xs truncate text-xs text-destructive"
          title={`${r.failedReason}${r.failedReasonMsg ? `: ${r.failedReasonMsg}` : ""}`}
        >
          {r.failedReason}
          {r.failedReasonMsg && (
            <span className="ml-1 text-muted-foreground">
              ({r.failedReasonMsg.slice(0, 30)})
            </span>
          )}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as SnapColumnMeta | undefined;
      const r = row.original;
      return (
        <div className="flex gap-1">
          {meta?.onResetTasks && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => meta.onResetTasks!(r.spId, r.sectorNumber)}
              title="Reset task IDs"
              aria-label="Reset task IDs"
            >
              <RotateCcw className="size-3" />
            </Button>
          )}
          {meta?.onDelete && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => meta.onDelete!(r.spId, r.sectorNumber)}
              title="Delete upgrade"
              aria-label="Delete upgrade"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      );
    },
  },
];
