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
import type {
  StorageUseStat,
  StorageGCStatsEntry,
  StorageGCMark,
  StorageGCMarksResponse,
} from "@/types/storage";
import type { ColumnDef } from "@tanstack/react-table";
import { HardDrive, Trash2, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/storage/")({
  component: StoragePage,
});

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

function StoragePage() {
  usePageTitle("Storage");

  const { data: useStats } = useCurioRpc<
    StorageUseStat[]
  >("StorageUseStats", [], { refetchInterval: 60_000 });

  const { data: gcStats } = useCurioRpc<StorageGCStatsEntry[]>(
    "StorageGCStats",
    [],
    { refetchInterval: 60_000 },
  );

  const [gcPage] = useState(0);
  const { data: gcMarks, isLoading: gcMarksLoading } =
    useCurioRpc<StorageGCMarksResponse>("StorageGCMarks", [null, null, 100, gcPage * 100], {
      refetchInterval: 30_000,
    });

  const approveAllMutation = useCurioRpcMutation("StorageGCApproveAll", {
    invalidateKeys: [["curio", "StorageGCMarks"], ["curio", "StorageGCStats"]],
  });
  const unapproveAllMutation = useCurioRpcMutation("StorageGCUnapproveAll", {
    invalidateKeys: [["curio", "StorageGCMarks"], ["curio", "StorageGCStats"]],
  });

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

      {/* Storage Usage KPIs */}
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

      {/* Storage Usage Details */}
      {useStats && useStats.length > 0 && (
        <SectionCard title="Storage Usage" icon={HardDrive}>
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
        </SectionCard>
      )}

      {/* GC Section */}
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
    </div>
  );
}
