import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  FolderOpen,
  Globe,
  HardDrive,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import type { StorageGCMark, StoragePathSector } from "@/types/storage";
import { formatStoragePageInfo } from "../-module/filters";
import {
  getMachineIdForHost,
  normalizeStorageHost,
  useHostToMachineId,
  useRecentGcMarks,
  useStorageGcApprove,
  useStorageGcUnapprove,
  useStoragePathDetail,
  useStoragePathSectors,
} from "../-module/queries";
import {
  DEFAULT_STORAGE_GC_SEARCH,
  DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
  normalizeStoragePathDetailSearch,
  patchStoragePathDetailSearch,
} from "../-module/search-state";
import type { StoragePathDetailSearchState } from "../-module/types";

export const Route = createFileRoute("/_app/storage/paths/$storageId")({
  validateSearch: normalizeStoragePathDetailSearch,
  search: {
    middlewares: [
      stripSearchParams<StoragePathDetailSearchState>(
        DEFAULT_STORAGE_PATH_DETAIL_SEARCH,
      ),
    ],
  },
  component: StoragePathDetailPage,
});

function compactBadges(
  values: string[] | undefined,
  variant: "outline" | "destructive",
) {
  if (!values || values.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={`${variant}-${value}`} variant={variant}>
          {variant === "destructive" ? "−" : "+"}
          {value}
        </Badge>
      ))}
    </div>
  );
}

function StoragePathDetailPage() {
  const { storageId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const detailQuery = useStoragePathDetail(storageId);
  const sectorsQuery = useStoragePathSectors(
    storageId,
    search.limit,
    search.offset,
  );
  const recentGcMarks = useRecentGcMarks(detailQuery.data);
  const sectorsLoading =
    sectorsQuery.isLoading || sectorsQuery.isPlaceholderData;

  const path = detailQuery.data?.Info;
  usePageTitle(path ? `Storage ${path.StorageID}` : "Storage Path");

  const hosts = useMemo(
    () =>
      path?.HostList && path.HostList.length > 0
        ? path.HostList
        : (detailQuery.data?.URLs ?? []).map((url) => url.Host),
    [detailQuery.data?.URLs, path?.HostList],
  );
  const machineMapQuery = useHostToMachineId(hosts);
  const machineMap = machineMapQuery.data ?? {};

  const approveMutation = useStorageGcApprove();
  const unapproveMutation = useStorageGcUnapprove();

  const sectorColumns = useMemo<ColumnDef<StoragePathSector>[]>(
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
        accessorKey: "FileTypeStr",
        header: "File Type",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.FileTypeStr}</Badge>
        ),
      },
      {
        accessorKey: "IsPrimary",
        header: "Copy",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.IsPrimary ? "done" : "idle"}
            label={row.original.IsPrimary ? "Primary" : "Secondary"}
          />
        ),
      },
      {
        accessorKey: "ReadRefs",
        header: "Locks",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.ReadRefs > 0 ? (
              <Badge variant="secondary">R:{row.original.ReadRefs}</Badge>
            ) : null}
            {row.original.HasWriteLock ? (
              <Badge variant="destructive">Write</Badge>
            ) : null}
            {row.original.ReadRefs === 0 && !row.original.HasWriteLock
              ? "—"
              : null}
          </div>
        ),
      },
    ],
    [],
  );

  const recentGcColumns = useMemo<ColumnDef<StorageGCMark>[]>(
    () => [
      {
        accessorKey: "Miner",
        header: "Miner",
        cell: ({ row }) => (
          <Link
            to="/storage/gc"
            search={{
              ...DEFAULT_STORAGE_GC_SEARCH,
              miner: row.original.Miner,
              sectorNum: row.original.SectorNum,
            }}
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
          <Link
            to="/storage/gc"
            search={{
              ...DEFAULT_STORAGE_GC_SEARCH,
              miner: row.original.Miner,
              sectorNum: row.original.SectorNum,
            }}
            className="font-mono text-xs text-primary hover:underline"
          >
            {row.original.SectorNum}
          </Link>
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
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.Approved ? "done" : "warning"}
            label={row.original.Approved ? "Approved" : "Pending"}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
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
                    storageId,
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
                    storageId,
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
    [approveMutation, storageId, unapproveMutation],
  );

  const pageInfo = sectorsLoading
    ? "Loading sectors"
    : formatStoragePageInfo(
        sectorsQuery.data?.Total ?? 0,
        search.offset,
        sectorsQuery.data?.Sectors.length ?? 0,
        "0 entries",
      );
  const hasPrev = search.offset > 0;
  const hasNext =
    (sectorsQuery.data?.Total ?? 0) > search.offset + search.limit;
  const pathSearch = {
    q: search.q,
    capability: search.capability,
    health: search.health,
  };

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({
      search: (prev) => patchStoragePathDetailSearch(prev, patch),
      replace: true,
    });
  };

  if (detailQuery.isLoading && !path) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!path || !detailQuery.data) {
    return (
      <div className="py-2">
        <p className="text-sm text-muted-foreground">
          Storage path `{storageId}` was not found on the current Curio
          endpoint.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/storage/paths" search={pathSearch}>
          <Button variant="ghost" size="sm">
            <ArrowLeft data-icon="inline-start" />
            Back to Paths
          </Button>
        </Link>
        <FolderOpen className="size-5" />
        <h2 className="text-2xl font-bold tracking-tight">{path.StorageID}</h2>
        <Badge variant="outline">{path.PathType}</Badge>
        <StatusBadge
          status={path.HealthOK ? "done" : "failed"}
          label={path.HealthStatus}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard
          label="Sector Entries"
          value={detailQuery.data.TotalSectorEntries}
        />
        <KPICard label="Primary" value={detailQuery.data.PrimaryEntries} />
        <KPICard label="Secondary" value={detailQuery.data.SecondaryEntries} />
        <KPICard label="Pending GC" value={detailQuery.data.PendingGC} />
        <KPICard label="Approved GC" value={detailQuery.data.ApprovedGC} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="size-4" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p>{path.Weight ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Storage</p>
                    <p>{path.MaxStorageStr || "Unlimited"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Groups</p>
                    {compactBadges(path.GroupList, "outline")}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Allow To</p>
                    {compactBadges(path.AllowToList, "outline")}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Allow Types</p>
                    {compactBadges(path.AllowTypesList, "outline")}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deny Types</p>
                    {compactBadges(path.DenyTypesList, "destructive")}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Allow Miners</p>
                    {compactBadges(path.AllowMinersList, "outline")}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deny Miners</p>
                    {compactBadges(path.DenyMinersList, "destructive")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storage Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Progress
                  value={Math.min(path.UsedPercent, 100)}
                  className="mb-2"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{path.UsedPercent.toFixed(1)}% used</span>
                  <span>
                    {(path.ReservedPercent ?? 0).toFixed(1)}% reserved
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-sm font-medium">{path.CapacityStr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Used</p>
                  <p className="text-sm font-medium">{path.UsedStr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-sm font-medium">{path.AvailableStr}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">FS Available</p>
                  <p className="text-sm font-medium">
                    {path.FSAvailableStr || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-sm font-medium">
                    {path.ReservedStr || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Last Heartbeat
                  </p>
                  <p className="text-sm font-medium">
                    {path.LastHeartbeat
                      ? new Date(path.LastHeartbeat).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4" />
                Hosts and URL Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailQuery.data.URLs.length > 0 ? (
                detailQuery.data.URLs.map((url) => {
                  const normalizedHost = normalizeStorageHost(url.Host);
                  const displayHost = normalizedHost || url.Host;
                  const machineId = getMachineIdForHost(machineMap, url.Host);

                  return (
                    <div
                      key={url.URL}
                      className="rounded-lg border border-border/60 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        {machineId ? (
                          <Link
                            to="/machines/$id"
                            params={{ id: String(machineId) }}
                            className="font-medium text-primary hover:underline"
                          >
                            {displayHost}
                          </Link>
                        ) : (
                          <span className="font-medium">{displayHost}</span>
                        )}
                        <StatusBadge
                          status={url.IsLive ? "done" : "failed"}
                          label={url.IsLive ? "Live" : "Dead"}
                        />
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {url.URL}
                      </p>
                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span>Checked {url.LastCheckedStr}</span>
                        <span>
                          {url.IsLive
                            ? `Live ${url.LastLiveStr}`
                            : `Dead ${url.LastDeadStr}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No URL liveness data is available for this path.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />
                Placement Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">By File Type</p>
                {detailQuery.data.ByType.length > 0 ? (
                  <div className="space-y-2">
                    {detailQuery.data.ByType.map((entry) => (
                      <div
                        key={entry.FileType}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <Badge variant="outline">{entry.FileType}</Badge>
                        <span className="text-muted-foreground">
                          {entry.Count} total / {entry.Primary} primary
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No sector type data.
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">By Miner</p>
                {detailQuery.data.ByMiner.length > 0 ? (
                  <div className="space-y-2">
                    {detailQuery.data.ByMiner.map((entry) => (
                      <div
                        key={entry.Miner}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <Link
                          to="/actor/$id"
                          params={{ id: entry.Miner }}
                          className="font-mono text-primary hover:underline"
                        >
                          {entry.Miner}
                        </Link>
                        <span className="text-muted-foreground">
                          {entry.Count} total / {entry.Primary} primary
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No miner allocation data.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="size-4" />
              Recent GC Marks
            </CardTitle>
          </div>
          <Link
            to="/storage/gc"
            search={DEFAULT_STORAGE_GC_SEARCH}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Open GC queue →
          </Link>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={recentGcColumns}
            data={recentGcMarks}
            loading={detailQuery.isLoading}
            pagination={false}
            emptyMessage="No recent GC marks for this path."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Sector Entries</CardTitle>
            <p className="text-xs text-muted-foreground">{pageInfo}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(search.limit)}
              onValueChange={(value) =>
                !sectorsLoading &&
                updateSearch({
                  limit: Number.parseInt(value ?? String(search.limit), 10),
                })
              }
            >
              <SelectTrigger
                size="sm"
                className="h-8 min-w-20"
                disabled={sectorsLoading}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={sectorsLoading || !hasPrev}
              onClick={() =>
                updateSearch({
                  offset: Math.max(search.offset - search.limit, 0),
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={sectorsLoading || !hasNext}
              onClick={() =>
                updateSearch({
                  offset: search.offset + search.limit,
                })
              }
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={sectorColumns}
            data={sectorsQuery.data?.Sectors ?? []}
            loading={sectorsLoading}
            pagination={false}
            emptyMessage="No sector entries on this path."
          />
        </CardContent>
      </Card>
    </div>
  );
}
