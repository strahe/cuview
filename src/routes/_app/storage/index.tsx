import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  StorageUseStat,
  StorageGCStatsEntry,
  StorageGCMark,
  StorageGCMarksResponse,
  StoragePathInfo,
  StoragePathSector,
  StoragePathSectorsResult,
} from "@/types/storage";
import type { ColumnDef } from "@tanstack/react-table";
import { HardDrive, Trash2, CheckCircle, FolderOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/storage/")({
  component: StoragePage,
});

type StorageTab = "usage" | "paths" | "gc";

const gcMarkColumns: ColumnDef<StorageGCMark>[] = [
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.miner}</span>
    ),
  },
  { accessorKey: "sector_num", header: "Sector" },
  {
    accessorKey: "file_type",
    header: "File Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.file_type}</Badge>,
  },
  {
    accessorKey: "storage_id",
    header: "Storage",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.storage_id.slice(0, 12)}…</span>
    ),
  },
  {
    accessorKey: "approved",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.approved ? "done" : "warning"}
        label={row.original.approved ? "Approved" : "Pending"}
      />
    ),
  },
  { accessorKey: "created_at", header: "Created" },
];

const pathColumns: ColumnDef<StoragePathInfo>[] = [
  {
    accessorKey: "StorageID",
    header: "Storage ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.StorageID.slice(0, 16)}…</span>
    ),
  },
  { accessorKey: "PathType", header: "Type" },
  {
    id: "capabilities",
    header: "Capabilities",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.CanSeal && <Badge variant="outline" className="text-xs">Seal</Badge>}
        {row.original.CanStore && <Badge variant="outline" className="text-xs">Store</Badge>}
      </div>
    ),
  },
  { accessorKey: "CapacityStr", header: "Capacity" },
  { accessorKey: "UsedStr", header: "Used" },
  { accessorKey: "AvailableStr", header: "Available" },
  {
    accessorKey: "UsedPercent",
    header: "Usage",
    cell: ({ row }) => {
      const pct = row.original.UsedPercent;
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div
              className={`h-full rounded-full ${pct > 90 ? "bg-[hsl(var(--destructive))]" : pct > 70 ? "bg-[hsl(var(--warning,40_96%_40%))]" : "bg-[hsl(var(--primary))]"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs">{pct.toFixed(1)}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "HealthStatus",
    header: "Health",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.HealthOK ? "done" : "failed"}
        label={row.original.HealthStatus || (row.original.HealthOK ? "OK" : "Error")}
      />
    ),
  },
  {
    id: "hosts",
    header: "Hosts",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.HostList?.join(", ") || "—"}</span>
    ),
  },
];

const pathSectorColumns: ColumnDef<StoragePathSector>[] = [
  { accessorKey: "MinerStr", header: "Miner" },
  { accessorKey: "SectorNum", header: "Sector" },
  { accessorKey: "FileTypeStr", header: "File Type" },
  {
    accessorKey: "IsPrimary",
    header: "Primary",
    cell: ({ row }) => row.original.IsPrimary ? "Yes" : "No",
  },
  { accessorKey: "ReadRefs", header: "Read Refs" },
  {
    accessorKey: "HasWriteLock",
    header: "Write Lock",
    cell: ({ row }) => row.original.HasWriteLock ? <Badge variant="destructive">Locked</Badge> : "No",
  },
];

function StoragePage() {
  usePageTitle("Storage");

  const [activeTab, setActiveTab] = useState<StorageTab>("usage");

  const { data: useStats } = useCurioRpc<StorageUseStat[]>("StorageUseStats", [], {
    refetchInterval: 60_000,
  });
  const { data: gcStats } = useCurioRpc<StorageGCStatsEntry[]>("StorageGCStats", [], {
    refetchInterval: 60_000,
  });
  const [gcPage] = useState(0);
  const { data: gcMarks, isLoading: gcMarksLoading } =
    useCurioRpc<StorageGCMarksResponse>("StorageGCMarks", [null, null, 100, gcPage * 100], {
      refetchInterval: 30_000,
    });
  const { data: storagePaths, isLoading: pathsLoading } = useCurioRpc<StoragePathInfo[]>(
    "StoragePathList",
    [],
    { refetchInterval: 60_000 },
  );

  const approveAllMutation = useCurioRpcMutation("StorageGCApproveAll", {
    invalidateKeys: [["curio", "StorageGCMarks"], ["curio", "StorageGCStats"]],
  });
  const unapproveAllMutation = useCurioRpcMutation("StorageGCUnapproveAll", {
    invalidateKeys: [["curio", "StorageGCMarks"], ["curio", "StorageGCStats"]],
  });

  const [selectedPath, setSelectedPath] = useState<StoragePathInfo | null>(null);

  const storageSummary = useMemo(() => {
    if (!useStats) return { totalCapacity: 0, totalAvailable: 0, count: 0 };
    return {
      totalCapacity: useStats.reduce((s, u) => s + u.Capacity, 0),
      totalAvailable: useStats.reduce((s, u) => s + u.Available, 0),
      count: useStats.length,
    };
  }, [useStats]);

  const gcSummary = useMemo(() => {
    if (!gcStats) return { total: 0, approved: 0, unapproved: 0 };
    return {
      total: gcStats.reduce((s, g) => s + g.sector_count, 0),
      approved: gcStats.reduce((s, g) => s + g.approved_count, 0),
      unapproved: gcStats.reduce((s, g) => s + g.unapproved_count, 0),
    };
  }, [gcStats]);

  const usedPct =
    storageSummary.totalCapacity > 0
      ? (((storageSummary.totalCapacity - storageSummary.totalAvailable) / storageSummary.totalCapacity) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <HardDrive className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Storage Paths" value={storageSummary.count} />
        <KPICard label="Total Capacity" value={formatBytes(storageSummary.totalCapacity)} />
        <KPICard label="Available" value={formatBytes(storageSummary.totalAvailable)} />
        <KPICard label="Used" value={`${usedPct}%`} />
      </div>

      <TabsList>
        <TabsTrigger active={activeTab === "usage"} onClick={() => setActiveTab("usage")}>
          Usage
        </TabsTrigger>
        <TabsTrigger active={activeTab === "paths"} onClick={() => setActiveTab("paths")}>
          Paths ({storagePaths?.length ?? 0})
        </TabsTrigger>
        <TabsTrigger active={activeTab === "gc"} onClick={() => setActiveTab("gc")}>
          GC ({gcSummary.total})
        </TabsTrigger>
      </TabsList>

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
                    <span className="text-sm font-medium">{s.Type || "Unknown"}</span>
                    <div className="flex gap-1">
                      {s.can_seal && <Badge variant="outline" className="text-xs">Seal</Badge>}
                      {s.can_store && <Badge variant="outline" className="text-xs">Store</Badge>}
                    </div>
                  </div>
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <div
                      className={`h-full rounded-full ${pct > 90 ? "bg-[hsl(var(--destructive))]" : pct > 70 ? "bg-[hsl(var(--warning,40_96%_40%))]" : "bg-[hsl(var(--primary))]"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{s.UseStr || formatBytes(used)}</span>
                    <span>{s.CapStr || formatBytes(s.Capacity)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
          <div className="mb-4 grid grid-cols-3 gap-4">
            <KPICard label="GC Marks" value={gcSummary.total} />
            <KPICard label="Approved" value={gcSummary.approved} />
            <KPICard label="Pending" value={gcSummary.unapproved} />
          </div>
          <div className="mb-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => approveAllMutation.mutate([])}
              disabled={approveAllMutation.isPending || gcSummary.unapproved === 0}
            >
              <CheckCircle className="mr-1 size-4" />
              {approveAllMutation.isPending ? "Approving..." : "Approve All"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => unapproveAllMutation.mutate([])}
              disabled={unapproveAllMutation.isPending || gcSummary.approved === 0}
            >
              {unapproveAllMutation.isPending ? "Unapproving..." : "Unapprove All"}
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
        <PathDetailDialog path={selectedPath} onClose={() => setSelectedPath(null)} />
      )}
    </div>
  );
}

function PathDetailDialog({ path, onClose }: { path: StoragePathInfo; onClose: () => void }) {
  const { data: sectors, isLoading } = useCurioRpc<StoragePathSectorsResult>(
    "StoragePathSectors",
    [path.StorageID, 100, 0],
    { refetchInterval: 30_000 },
  );

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="size-5" />
            Storage Path Detail
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[hsl(var(--muted-foreground))]">Storage ID</div>
              <div className="font-mono text-xs">{path.StorageID}</div>
            </div>
            <div>
              <div className="text-[hsl(var(--muted-foreground))]">Type</div>
              <div>{path.PathType}</div>
            </div>
            <div>
              <div className="text-[hsl(var(--muted-foreground))]">Capacity</div>
              <div>{path.CapacityStr}</div>
            </div>
            <div>
              <div className="text-[hsl(var(--muted-foreground))]">Available</div>
              <div>{path.AvailableStr}</div>
            </div>
            <div>
              <div className="text-[hsl(var(--muted-foreground))]">Used</div>
              <div>{path.UsedStr} ({path.UsedPercent.toFixed(1)}%)</div>
            </div>
            <div>
              <div className="text-[hsl(var(--muted-foreground))]">Health</div>
              <StatusBadge
                status={path.HealthOK ? "done" : "failed"}
                label={path.HealthStatus || (path.HealthOK ? "OK" : "Error")}
              />
            </div>
          </div>

          {path.HostList && path.HostList.length > 0 && (
            <div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Hosts</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {path.HostList.map((h) => <Badge key={h} variant="outline">{h}</Badge>)}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-medium">Sectors ({sectors?.Total ?? 0})</h4>
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
