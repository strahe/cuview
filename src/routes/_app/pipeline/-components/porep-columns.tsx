import type { ColumnDef } from "@tanstack/react-table";
import { Play, RotateCcw, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/composed/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PorepSectorActionType, PorepSectorView } from "../-module/types";

export interface PorepColumnMeta {
  onAction?: (
    spId: number,
    sectorNum: number,
    type: PorepSectorActionType,
  ) => void;
}

export function createPorepColumns(
  options: { expandable?: boolean } = {},
): ColumnDef<PorepSectorView>[] {
  const cols: ColumnDef<PorepSectorView>[] = [];

  if (options.expandable) {
    cols.push({
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => row.toggleExpanded()}
          aria-label={
            row.getIsExpanded()
              ? "Collapse sector details"
              : "Expand sector details"
          }
        >
          {row.getIsExpanded() ? "▼" : "▶"}
        </Button>
      ),
      size: 30,
    });
  }

  cols.push(
    { accessorKey: "sectorNumber", header: "Sector" },
    { accessorKey: "address", header: "Miner" },
    { accessorKey: "createTime", header: "Created" },
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
        return (
          <span className="inline-flex items-center">
            <StatusBadge status={status} label={r.stage} />
            {r.isRunning && (
              <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-success" />
            )}
          </span>
        );
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
      id: "chain",
      header: "Chain",
      cell: ({ row }) => {
        const r = row.original;
        if (!r.chainAlloc && !r.chainSector) return "—";
        return (
          <div className="flex gap-1">
            {r.chainActive && (
              <Badge variant="default" className="text-[10px]">
                Active
              </Badge>
            )}
            {r.chainUnproven && (
              <Badge variant="outline" className="text-[10px]">
                Unproven
              </Badge>
            )}
            {r.chainFaulty && (
              <Badge variant="destructive" className="text-[10px]">
                Faulty
              </Badge>
            )}
            {r.chainSector &&
              !r.chainActive &&
              !r.chainUnproven &&
              !r.chainFaulty && (
                <Badge variant="secondary" className="text-[10px]">
                  Allocated
                </Badge>
              )}
          </div>
        );
      },
    },
    {
      id: "error",
      header: "Error",
      cell: ({ row }) =>
        row.original.failed ? (
          <span
            className="max-w-xs truncate text-xs text-destructive"
            title={row.original.failedReason}
          >
            {row.original.failedReason}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row, table }) => {
        const meta = table.options.meta as PorepColumnMeta | undefined;
        if (!meta?.onAction) return null;
        const r = row.original;
        return (
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => meta.onAction!(r.spId, r.sectorNumber, "resume")}
              title="Resume sector"
              aria-label="Resume sector"
            >
              <Play className="size-3" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={() => meta.onAction!(r.spId, r.sectorNumber, "restart")}
              title="Restart sector"
              aria-label="Restart sector"
            >
              <RotateCcw className="size-3" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => meta.onAction!(r.spId, r.sectorNumber, "remove")}
              title="Remove sector"
              aria-label="Remove sector"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      },
    },
  );

  return cols;
}
