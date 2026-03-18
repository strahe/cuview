import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/format";
import { formatPieceCidShort } from "@/utils/pdp";
import { extractNullable } from "@/utils/sql";
import { usePdpDeals } from "./-module/queries";
import type { PdpDealListItem } from "./-module/types";

export const Route = createFileRoute("/_app/pdp/deals")({
  component: PdpDeals,
});

function PdpDeals() {
  const [page, setPage] = useState(0);
  const limit = 25;
  const { data: deals, isLoading } = usePdpDeals(limit, page * limit);

  const columns = useMemo<ColumnDef<PdpDealListItem>[]>(
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
          <span className="font-mono text-xs">{row.original.id}</span>
        ),
      },
      {
        accessorKey: "piece_cid_v2",
        header: "Piece CID",
        cell: ({ row }) => {
          const cid = extractNullable(row.original.piece_cid_v2);
          return cid ? (
            <span className="font-mono text-xs">
              {formatPieceCidShort(cid)}
            </span>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          );
        },
      },
      {
        accessorKey: "processed",
        header: "Status",
        cell: ({ row }) => {
          const hasError = !!extractNullable(row.original.error);
          if (row.original.processed)
            return <StatusBadge status="done" label="Done" />;
          if (hasError) return <StatusBadge status="error" label="Failed" />;
          return <StatusBadge status="pending" label="Processing" />;
        },
      },
      {
        accessorKey: "error",
        header: "Error",
        cell: ({ row }) => {
          const err = extractNullable(row.original.error);
          if (!err) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="max-w-xs truncate text-xs text-destructive">
              {err}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDP Deals</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={deals ?? []}
          loading={isLoading}
          pagination={false}
          emptyMessage="No PDP deals"
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
            disabled={(deals?.length ?? 0) < limit}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
