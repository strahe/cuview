import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, FolderOpen, HardDrive, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type {
  StorageGCMark,
  StorageGCMarksResponse,
  StorageGCStatsEntry,
  StoragePathDetailResult,
  StoragePathInfo,
  StoragePathSector,
  StoragePathSectorsResult,
  StorageStoreStats,
  StorageUseStat,
} from "@/types/storage";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/storage/")({
  component: StoragePage,
});

type StorageTab = "usage" | "paths" | "gc";

const gcMarkColumns: ColumnDef<StorageGCMark>[] = [
  {
    accessorKey: "Miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.Miner}</span>
    ),
  },
  { accessorKey: "SectorNum", header: "Sector" },
  {
    accessorKey: "TypeName",
    header: "File Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.TypeName}</Badge>,
  },
  {
    accessorKey: "StorageID",
    header: "Storage",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.StorageID.slice(0, 12)}…
      </span>
    ),
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
    accessorKey: "PathType",
    header: "Path Type",
  },
];

const pathColumns: ColumnDef<StoragePathInfo>[] = [
  {
    accessorKey: "StorageID",
    header: "Storage ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.StorageID.slice(0, 16)}…
      </span>
    ),
  },
  { accessorKey: "PathType", header: "Type" },
  {
    id: "capabilities",
    header: "Capabilities",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.CanSeal && (
          <Badge variant="outline" className="text-xs">
            Seal
          </Badge>
        )}
        {row.original.CanStore && (
          <Badge variant="outline" className="text-xs">
            Store
          </Badge>
        )}
      </div>
    ),
  },
  { accessorKey: "CapacityStr", header: "Capacity" },
  {
    accessorKey: "UsedPercent",
    header: "Usage",
    cell: ({ row }) => {
      const pct = row.original.UsedPercent;
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs">{pct.toFixed(1)}%</span>
        </div>
      );
    },
  },
  { accessorKey: "AvailableStr", header: "Available" },
  {
    accessorKey: "HealthStatus",
    header: "Health",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.HealthOK ? "done" : "failed"}
        label={
          row.original.HealthStatus || (row.original.HealthOK ? "OK" : "Error")
        }
      />
    ),
  },
  {
    id: "hosts",
    header: "Hosts",
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.HostList?.join(", ") || "—"}
      </span>
    ),
  },
];

const pathSectorColumns: ColumnDef<StoragePathSector>[] = [
  { accessorKey: "Miner", header: "Miner" },
  { accessorKey: "SectorNum", header: "Sector" },
  { accessorKey: "FileTypeStr", header: "File Type" },
  {
    accessorKey: "IsPrimary",
    header: "Primary",
    cell: ({ row }) => (row.original.IsPrimary ? "Yes" : "No"),
  },
  { accessorKey: "ReadRefs", header: "Read Refs" },
  {
    accessorKey: "HasWriteLock",
    header: "Write Lock",
    cell: ({ row }) =>
      row.original.HasWriteLock ? (
        <Badge variant="destructive">Locked</Badge>
      ) : (
        "No"
      ),
  },
];

function StoragePage() {
  usePageTitle("Storage");

  const [activeTab, setActiveTab] = useState<StorageTab>("usage");

  const { data: useStats } = useCurioRpc<StorageUseStat[]>(
    "StorageUseStats",
    [],
    {
      refetchInterval: 60_000,
    },
  );
  const { data: gcStats } = useCurioRpc<StorageGCStatsEntry[]>(
    "StorageGCStats",
    [],
    {
      refetchInterval: 60_000,
    },
  );
  const [gcPage] = useState(0);
  const { data: gcMarks, isLoading: gcMarksLoading } =
    useCurioRpc<StorageGCMarksResponse>(
      "StorageGCMarks",
      [null, null, 100, gcPage * 100],
      {
        refetchInterval: 30_000,
      },
    );
  const { data: storagePaths, isLoading: pathsLoading } = useCurioRpc<
    StoragePathInfo[]
  >("StoragePathList", [], { refetchInterval: 60_000 });
  const { data: storeTypeStats } = useCurioRpc<StorageStoreStats[]>(
    "StorageStoreTypeStats",
    [],
    { refetchInterval: 120_000 },
  );

  const approveAllMutation = useCurioRpcMutation("StorageGCApproveAll", {
    invalidateKeys: [
      ["curio", "StorageGCMarks"],
      ["curio", "StorageGCStats"],
    ],
  });
  const unapproveAllMutation = useCurioRpcMutation("StorageGCUnapproveAll", {
    invalidateKeys: [
      ["curio", "StorageGCMarks"],
      ["curio", "StorageGCStats"],
    ],
  });

  const [selectedPath, setSelectedPath] = useState<StoragePathInfo | null>(
    null,
  );
  const { data: pathDetail } = useCurioRpc<StoragePathDetailResult>(
    "StoragePathDetail",
    [selectedPath?.StorageID ?? ""],
    {
      enabled: !!selectedPath,
    },
  );

  const storageSummary = useMemo(() => {
    if (!useStats) return { totalCapacity: 0, totalAvailable: 0, count: 0 };
    return {
      totalCapacity: useStats.reduce((s, u) => s + u.Capacity, 0),
      totalAvailable: useStats.reduce((s, u) => s + u.Available, 0),
      count: useStats.length,
    };
  }, [useStats]);

  const gcSummary = useMemo(() => {
    if (!gcStats) return { total: 0 };
    return {
      total: gcStats.reduce((s, g) => s + g.Count, 0),
    };
  }, [gcStats]);

  const usedPct =
    storageSummary.totalCapacity > 0
      ? (
          ((storageSummary.totalCapacity - storageSummary.totalAvailable) /
            storageSummary.totalCapacity) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <HardDrive className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Storage Paths" value={storageSummary.count} />
        <KPICard
          label="Total Capacity"
          value={formatBytes(storageSummary.totalCapacity)}
        />
        <KPICard
          label="Available"
          value={formatBytes(storageSummary.totalAvailable)}
        />
        <KPICard label="Used" value={`${usedPct}%`} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as StorageTab)}
      >
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="paths">
            Paths ({storagePaths?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="gc">GC ({gcSummary.total})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Usage Tab */}
      {activeTab === "usage" && useStats && useStats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useStats.map((s, i) => {
            const used = s.Capacity - s.Available;
            const pct = s.Capacity > 0 ? (used / s.Capacity) * 100 : 0;
            return (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {s.Type || "Unknown"}
                    </span>
                    <div className="flex gap-1">
                      {s.CanSeal && (
                        <Badge variant="outline" className="text-xs">
                          Seal
                        </Badge>
                      )}
                      {s.CanStore && (
                        <Badge variant="outline" className="text-xs">
                          Store
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{s.UseStr || formatBytes(used)}</span>
                    <span>{s.CapStr || formatBytes(s.Capacity)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Store Type Stats */}
      {activeTab === "usage" && storeTypeStats && storeTypeStats.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="mb-3 text-sm font-medium">Store Type Stats</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {storeTypeStats.map((s) => (
                <div
                  key={s.type}
                  className="rounded border border-border p-2 text-center"
                >
                  <p className="text-xs text-muted-foreground">{s.type}</p>
                  <p className="text-sm font-medium">{s.use_str}</p>
                  <p className="text-xs text-muted-foreground">
                    of {s.cap_str}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.avail_str} avail
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paths Tab */}
      {activeTab === "paths" && (
        <SectionCard title="Storage Paths" icon={FolderOpen}>
          <DataTable
            columns={pathColumns}
            data={storagePaths ?? []}
            loading={pathsLoading}
            searchable
            searchPlaceholder="Search paths..."
            searchColumn="StorageID"
            emptyMessage="No storage paths"
            onRowClick={(row) => setSelectedPath(row)}
          />
        </SectionCard>
      )}

      {/* GC Tab */}
      {activeTab === "gc" && (
        <SectionCard title="Garbage Collection" icon={Trash2}>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <KPICard label="Total GC Marks" value={gcSummary.total} />
            <KPICard label="Actors" value={gcStats?.length ?? 0} />
          </div>
          <div className="mb-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => approveAllMutation.mutate([])}
              disabled={approveAllMutation.isPending}
            >
              <CheckCircle className="mr-1 size-4" />
              {approveAllMutation.isPending ? "Approving..." : "Approve All"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => unapproveAllMutation.mutate([])}
              disabled={unapproveAllMutation.isPending}
            >
              {unapproveAllMutation.isPending
                ? "Unapproving..."
                : "Unapprove All"}
            </Button>
          </div>
          <DataTable
            columns={gcMarkColumns}
            data={gcMarks?.Marks ?? []}
            loading={gcMarksLoading}
            emptyMessage="No GC marks"
          />
        </SectionCard>
      )}

      {/* Path Detail Dialog */}
      {selectedPath && (
        <PathDetailDialog
          path={selectedPath}
          detail={pathDetail}
          onClose={() => setSelectedPath(null)}
        />
      )}
    </div>
  );
}

function PathDetailDialog({
  path,
  detail,
  onClose,
}: {
  path: StoragePathInfo;
  detail?: StoragePathDetailResult | null;
  onClose: () => void;
}) {
  const { data: sectors, isLoading } = useCurioRpc<StoragePathSectorsResult>(
    "StoragePathSectors",
    [path.StorageID, 100, 0],
    { refetchInterval: 30_000 },
  );

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="size-5" />
            Storage Path Detail
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Storage ID</div>
              <div className="font-mono text-xs">{path.StorageID}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Type</div>
              <div>{path.PathType}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Capacity</div>
              <div>{path.CapacityStr}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Available</div>
              <div>{path.AvailableStr}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Used</div>
              <div>
                {path.UsedStr} ({path.UsedPercent.toFixed(1)}%)
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Health</div>
              <StatusBadge
                status={path.HealthOK ? "done" : "failed"}
                label={path.HealthStatus || (path.HealthOK ? "OK" : "Error")}
              />
            </div>
            <div>
              <div className="text-muted-foreground">Weight</div>
              <div>{path.Weight ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Storage</div>
              <div>{path.MaxStorageStr || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">FS Available</div>
              <div>{path.FSAvailableStr || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Reserved</div>
              <div>
                {path.ReservedStr
                  ? `${path.ReservedStr} (${path.ReservedPercent?.toFixed(1) ?? 0}%)`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Heartbeat</div>
              <div>{path.LastHeartbeat || "—"}</div>
            </div>
            {path.HeartbeatErr && (
              <div>
                <div className="text-muted-foreground">Heartbeat Error</div>
                <div className="text-destructive">{path.HeartbeatErr}</div>
              </div>
            )}
          </div>

          {path.HostList && path.HostList.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground">Hosts</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {path.HostList.map((h) => (
                  <Badge key={h} variant="outline">
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {path.GroupList && path.GroupList.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground">Groups</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {path.GroupList.map((g) => (
                  <Badge key={g} variant="outline">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {path.AllowToList && path.AllowToList.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground">Allow To</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {path.AllowToList.map((v) => (
                  <Badge key={v} variant="outline">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {((path.AllowTypesList && path.AllowTypesList.length > 0) ||
            (path.DenyTypesList && path.DenyTypesList.length > 0)) && (
            <div>
              <div className="text-sm text-muted-foreground">Type Rules</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {path.AllowTypesList?.map((t) => (
                  <Badge
                    key={`a-${t}`}
                    variant="outline"
                    className="text-success"
                  >
                    +{t}
                  </Badge>
                ))}
                {path.DenyTypesList?.map((t) => (
                  <Badge key={`d-${t}`} variant="destructive">
                    −{t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {((path.AllowMinersList && path.AllowMinersList.length > 0) ||
            (path.DenyMinersList && path.DenyMinersList.length > 0)) && (
            <div>
              <div className="text-sm text-muted-foreground">Miner Rules</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {path.AllowMinersList?.map((m) => (
                  <Badge
                    key={`a-${m}`}
                    variant="outline"
                    className="text-success"
                  >
                    +{m}
                  </Badge>
                ))}
                {path.DenyMinersList?.map((m) => (
                  <Badge key={`d-${m}`} variant="destructive">
                    −{m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-muted-foreground">Total Sectors</div>
                  <div>{detail.TotalSectorEntries}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Primary</div>
                  <div>{detail.PrimaryEntries}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Secondary</div>
                  <div>{detail.SecondaryEntries}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Pending GC</div>
                  <div>{detail.PendingGC}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Approved GC</div>
                  <div>{detail.ApprovedGC}</div>
                </div>
              </div>

              {detail.URLs && detail.URLs.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">URLs</div>
                  <div className="mt-1 space-y-1">
                    {detail.URLs.map((u) => (
                      <div key={u.URL} className="flex items-center gap-2">
                        <StatusBadge
                          status={u.IsLive ? "done" : "failed"}
                          label={u.IsLive ? "Live" : "Dead"}
                        />
                        <span className="truncate font-mono text-xs">
                          {u.URL}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          checked {u.LastCheckedStr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.ByType && detail.ByType.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">By Type</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {detail.ByType.map((t) => (
                      <Badge key={t.FileType} variant="outline">
                        {t.FileType}: {t.Count} ({t.Primary} primary)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {detail.ByMiner && detail.ByMiner.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">By Miner</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {detail.ByMiner.map((m) => (
                      <Badge key={m.Miner} variant="outline">
                        {m.Miner}: {m.Count} ({m.Primary} primary)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-medium">
              Sectors ({sectors?.Total ?? 0})
            </h4>
            <DataTable
              columns={pathSectorColumns}
              data={sectors?.Sectors ?? []}
              loading={isLoading}
              emptyMessage="No sectors on this path"
              pageSize={10}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
