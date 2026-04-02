import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StorageGCMark, StorageGCStatsEntry } from "@/types/storage";
import { StorageGcToolbar } from "./-components/storage-gc-toolbar";
import { formatStoragePageInfo, summarizeStorageGc } from "./-module/filters";
import {
  useStorageGcApprove,
  useStorageGcApproveAll,
  useStorageGcMarks,
  useStorageGcStats,
  useStorageGcUnapprove,
  useStorageGcUnapproveAll,
} from "./-module/queries";
import {
  DEFAULT_STORAGE_GC_SEARCH,
  DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
  normalizeStorageGcSearch,
  patchStorageGcSearch,
} from "./-module/search-state";
import type {
  StorageGcSearchPatch,
  StorageGcSearchState,
} from "./-module/types";

export const Route = createFileRoute("/_app/storage/gc")({
  validateSearch: normalizeStorageGcSearch,
  search: {
    middlewares: [
      stripSearchParams<StorageGcSearchState>(DEFAULT_STORAGE_GC_SEARCH),
    ],
  },
  component: StorageGcPage,
});

type BulkGcAction = "approve" | "unapprove";

function StorageGcPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const gcStatsQuery = useStorageGcStats();
  const gcMarksQuery = useStorageGcMarks(
    search.miner || null,
    search.sectorNum,
    search.limit,
    search.offset,
  );
  const approveMutation = useStorageGcApprove();
  const unapproveMutation = useStorageGcUnapprove();
  const approveAllMutation = useStorageGcApproveAll();
  const unapproveAllMutation = useStorageGcUnapproveAll();
  const [pendingBulkAction, setPendingBulkAction] =
    useState<BulkGcAction | null>(null);
  const gcMarksLoading =
    gcMarksQuery.isLoading || gcMarksQuery.isPlaceholderData;
  const bulkMutationPending =
    approveAllMutation.isPending || unapproveAllMutation.isPending;

  const updateSearch = useCallback(
    (patch: StorageGcSearchPatch) => {
      navigate({
        search: (prev) => patchStorageGcSearch(prev, patch),
        replace: true,
      });
    },
    [navigate],
  );

  const summary = useMemo(
    () =>
      summarizeStorageGc(
        gcStatsQuery.data ?? [],
        gcMarksLoading ? 0 : (gcMarksQuery.data?.Marks.length ?? 0),
      ),
    [gcMarksLoading, gcMarksQuery.data?.Marks.length, gcStatsQuery.data],
  );

  const pageInfo = gcMarksLoading
    ? "Loading GC marks"
    : formatStoragePageInfo(
        gcMarksQuery.data?.Total ?? 0,
        search.offset,
        gcMarksQuery.data?.Marks.length ?? 0,
      );
  const hasPrev = search.offset > 0;
  const hasNext =
    (gcMarksQuery.data?.Total ?? 0) > search.offset + search.limit;

  const actorRows = useMemo(
    () =>
      [...(gcStatsQuery.data ?? [])].sort(
        (left, right) => right.Count - left.Count,
      ),
    [gcStatsQuery.data],
  );

  const actorColumns = useMemo<ColumnDef<StorageGCStatsEntry>[]>(
    () => [
      {
        accessorKey: "Miner",
        header: "Miner",
        cell: ({ row }) => (
          <Button
            type="button"
            className="h-auto p-0 font-mono text-xs"
            onClick={() =>
              updateSearch({
                miner: row.original.Miner,
              })
            }
            variant="link"
          >
            {row.original.Miner}
          </Button>
        ),
      },
      {
        accessorKey: "Count",
        header: "Marks",
      },
    ],
    [updateSearch],
  );

  const gcColumns = useMemo<ColumnDef<StorageGCMark>[]>(
    () => [
      {
        accessorKey: "Miner",
        header: "Miner",
        cell: ({ row }) => (
          <Link
            to="/actor/$id"
            params={{ id: row.original.Miner }}
            className="font-mono text-xs text-primary hover:underline"
          >
            {row.original.Miner}
          </Link>
        ),
      },
      {
        accessorKey: "SectorNum",
        header: "Sector",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.SectorNum}</span>
        ),
      },
      {
        accessorKey: "StorageID",
        header: "Storage Path",
        cell: ({ row }) => (
          <Link
            to="/storage/paths/$storageId"
            params={{ storageId: row.original.StorageID }}
            search={DEFAULT_STORAGE_PATH_DETAIL_SEARCH}
            className="font-mono text-xs text-primary hover:underline"
          >
            {row.original.StorageID}
          </Link>
        ),
      },
      {
        accessorKey: "Urls",
        header: "Hosts",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.Urls || "—"}
          </span>
        ),
      },
      {
        accessorKey: "PathType",
        header: "Path Type",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.PathType}</Badge>
        ),
      },
      {
        accessorKey: "TypeName",
        header: "File Type",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.TypeName}</Badge>
        ),
      },
      {
        accessorKey: "CreatedAt",
        header: "Marked At",
        cell: ({ row }) => new Date(row.original.CreatedAt).toLocaleString(),
      },
      {
        accessorKey: "Approved",
        header: "Approved",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.Approved ? "done" : "warning"}
            label={row.original.Approved ? "Approved" : "Pending"}
          />
        ),
      },
      {
        accessorKey: "ApprovedAt",
        header: "Approved At",
        cell: ({ row }) =>
          row.original.ApprovedAt
            ? new Date(row.original.ApprovedAt).toLocaleString()
            : "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.Approved ? (
              <Button
                variant="outline"
                size="sm"
                disabled={unapproveMutation.isPending}
                onClick={() =>
                  unapproveMutation.mutate([
                    row.original.Actor,
                    row.original.SectorNum,
                    row.original.FileType,
                    row.original.StorageID,
                  ])
                }
              >
                Unapprove
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={approveMutation.isPending}
                onClick={() =>
                  approveMutation.mutate([
                    row.original.Actor,
                    row.original.SectorNum,
                    row.original.FileType,
                    row.original.StorageID,
                  ])
                }
              >
                Approve
              </Button>
            )}
          </div>
        ),
      },
    ],
    [approveMutation, unapproveMutation],
  );

  const confirmBulkAction = () => {
    if (pendingBulkAction === "approve") {
      approveAllMutation.mutate([], {
        onSuccess: () => setPendingBulkAction(null),
      });
      return;
    }

    if (pendingBulkAction === "unapprove") {
      unapproveAllMutation.mutate([], {
        onSuccess: () => setPendingBulkAction(null),
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KPICard label="Total Marks" value={summary.totalMarks} />
          <KPICard label="Actors With Marks" value={summary.actorCount} />
          <KPICard
            label="Current Page"
            value={gcMarksLoading ? "Loading" : summary.currentPageCount}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Actor</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={actorColumns}
                data={actorRows}
                loading={gcStatsQuery.isLoading}
                pagination={false}
                emptyMessage="No GC marks found."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Garbage Collection Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <StorageGcToolbar
                  disabled={gcMarksLoading}
                  miner={search.miner}
                  sectorNum={search.sectorNum}
                  limit={search.limit}
                  pageInfo={pageInfo}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  onMinerChange={(value) => updateSearch({ miner: value })}
                  onSectorNumChange={(value) =>
                    updateSearch({ sectorNum: value })
                  }
                  onLimitChange={(value) => updateSearch({ limit: value })}
                  onPrev={() =>
                    updateSearch({
                      offset: Math.max(search.offset - search.limit, 0),
                    })
                  }
                  onNext={() =>
                    updateSearch({
                      offset: search.offset + search.limit,
                    })
                  }
                  onReset={() => updateSearch(DEFAULT_STORAGE_GC_SEARCH)}
                  actions={
                    <>
                      <Button
                        size="sm"
                        disabled={gcMarksLoading}
                        onClick={() => setPendingBulkAction("approve")}
                      >
                        <CheckCircle2 className="mr-1 size-4" />
                        Approve All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={gcMarksLoading}
                        onClick={() => setPendingBulkAction("unapprove")}
                      >
                        <XCircle className="mr-1 size-4" />
                        Unapprove All
                      </Button>
                    </>
                  }
                />
                <DataTable
                  columns={gcColumns}
                  data={gcMarksQuery.data?.Marks ?? []}
                  loading={gcMarksLoading}
                  pagination={false}
                  emptyMessage="No GC marks matched the current filters."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={pendingBulkAction !== null}
        onOpenChange={(open) => {
          if (!open && !bulkMutationPending) setPendingBulkAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingBulkAction === "approve"
                ? "Approve all GC marks?"
                : "Unapprove all GC marks?"}
            </DialogTitle>
            <DialogDescription>
              {pendingBulkAction === "approve"
                ? "This will mark every pending GC entry as approved, allowing the sweep task to remove them."
                : "This will clear approval from every currently approved GC entry."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={bulkMutationPending}
              onClick={() => setPendingBulkAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant={pendingBulkAction === "approve" ? "default" : "outline"}
              onClick={confirmBulkAction}
              disabled={bulkMutationPending}
            >
              {pendingBulkAction === "approve"
                ? bulkMutationPending
                  ? "Approving..."
                  : "Approve All"
                : bulkMutationPending
                  ? "Unapproving..."
                  : "Unapprove All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
