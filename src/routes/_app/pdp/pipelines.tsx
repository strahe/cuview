import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/format";
import { formatPieceCidShort } from "@/utils/pdp";
import { PipelineFailedTasks } from "./-components/pipeline-failed-tasks";
import {
  usePdpPipelineFailedTasks,
  usePdpPipelineRemove,
  usePdpPipelines,
} from "./-module/queries";
import type { PdpPipeline } from "./-module/types";

export const Route = createFileRoute("/_app/pdp/pipelines")({
  component: PdpPipelines,
});

function PdpPipelines() {
  const [page, setPage] = useState(0);
  const limit = 25;
  const { data: pipelines, isLoading } = usePdpPipelines(limit, page * limit);
  const { data: failedStats } = usePdpPipelineFailedTasks();

  const removeMutation = usePdpPipelineRemove();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<PdpPipeline>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => {
          const d = row.original.created_at;
          return d ? formatDateTime(d) : "—";
        },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.id.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: "miner",
        header: "SP ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.miner || "—"}</span>
        ),
      },
      {
        accessorKey: "piece_cid_v2",
        header: "Piece CID",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatPieceCidShort(row.original.piece_cid_v2)}
          </span>
        ),
      },
      {
        id: "stage",
        header: "Status",
        cell: ({ row }) => {
          const p = row.original;
          if (p.complete) return <StatusBadge status="done" label="Complete" />;
          if (p.indexed)
            return (
              <StatusBadge
                status="running"
                label={p.announce ? "Announcing" : "Indexed"}
              />
            );
          if (p.after_save_cache && !p.indexed)
            return <StatusBadge status="running" label="Indexing" />;
          if (p.after_add_piece && !p.after_save_cache)
            return <StatusBadge status="running" label="Save Cache" />;
          if (p.aggregated && !p.after_add_piece)
            return <StatusBadge status="running" label="Add Piece" />;
          if (p.after_commp && !p.aggregated)
            return <StatusBadge status="running" label="Aggregating" />;
          if (p.downloaded && !p.after_commp)
            return <StatusBadge status="running" label="CommP" />;
          if (!p.downloaded)
            return <StatusBadge status="running" label="Downloading" />;
          return <StatusBadge status="pending" label="Accepted" />;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const id = row.original.id;
          if (confirmRemoveId === id) {
            return (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    removeMutation.mutate([id], {
                      onSettled: () => setConfirmRemoveId(null),
                    });
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmRemoveId(null)}
                >
                  ×
                </Button>
              </div>
            );
          }
          return (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmRemoveId(id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          );
        },
      },
    ],
    [confirmRemoveId, removeMutation],
  );

  return (
    <div className="space-y-4">
      <PipelineFailedTasks stats={failedStats} />

      <Card>
        <CardHeader>
          <CardTitle>PDP Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pipelines ?? []}
            loading={isLoading}
            pagination={false}
            emptyMessage="No PDP pipelines"
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">Page {page + 1}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={(pipelines?.length ?? 0) < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
