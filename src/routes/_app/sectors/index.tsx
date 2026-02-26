import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRightLeft,
  BarChart3,
  Clock,
  Database,
  HardDrive,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/composed/dialog";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCurioRest,
  useCurioRpc,
  useCurioRpcMutation,
} from "@/hooks/use-curio-query";
import type {
  DeadlineStats,
  SectorDetail,
  SectorFileTypeStatsEntry,
  SectorListItem,
  SectorPipelineStatsEntry,
  SPSectorStats,
} from "@/types/sectors";

export const Route = createFileRoute("/_app/sectors/")({
  component: SectorsPage,
});

// Deadline/Partition detail types
interface DeadlinePartitionInfo {
  partition: number;
  all_sectors: number;
  faulty_sectors: number;
  recovering_sectors: number;
  live_sectors: number;
  active_sectors: number;
}

interface DeadlineDetailData {
  sp_id: number;
  sp_address: string;
  deadline: number;
  post_submissions: string;
  disputable_proof_count: number;
  partitions: DeadlinePartitionInfo[];
}

interface PartitionSectorInfo {
  sector_number: number;
  is_faulty: boolean;
  is_recovering: boolean;
  is_live: boolean;
  is_active: boolean;
}

interface PartitionDetailData {
  sp_id: number;
  sp_address: string;
  deadline: number;
  partition: number;
  all_sectors_count: number;
  faulty_sectors_count: number;
  recovering_sectors_count: number;
  live_sectors_count: number;
  active_sectors_count: number;
  sectors: PartitionSectorInfo[] | null;
}

const columns: ColumnDef<SectorListItem>[] = [
  { accessorKey: "SectorNum", header: "Sector #" },
  {
    accessorKey: "MinerAddress",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.MinerAddress}</span>
    ),
  },
  {
    id: "storage",
    header: "Storage",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex gap-1">
          {s.HasSealed && <StatusBadge status="done" label="Sealed" />}
          {s.HasUnsealed && <StatusBadge status="info" label="Unsealed" />}
          {s.HasSnap && <StatusBadge status="info" label="Snap" />}
        </div>
      );
    },
  },
  {
    id: "onChain",
    header: "On-Chain",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.IsOnChain ? "done" : "warning"}
        label={row.original.IsOnChain ? "Yes" : "No"}
      />
    ),
  },
  {
    id: "filPlus",
    header: "Fil+",
    cell: ({ row }) =>
      row.original.IsFilPlus ? <StatusBadge status="done" label="Yes" /> : "—",
  },
  {
    id: "proving",
    header: "Proving",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.Proving ? "done" : "warning"}
        label={row.original.Proving ? "Yes" : "No"}
      />
    ),
  },
  {
    id: "flag",
    header: "Flag",
    cell: ({ row }) =>
      row.original.Flag ? <StatusBadge status="failed" label="Flagged" /> : "—",
  },
  { accessorKey: "ExpiresAt", header: "Expires" },
  { accessorKey: "Deals", header: "Deals" },
];

function SectorsPage() {
  const { data, isLoading } = useCurioRest<SectorListItem[]>("/sectors", {
    refetchInterval: 60_000,
  });
  const { data: spStats } = useCurioRpc<SPSectorStats[]>("SectorSPStats", [], {
    refetchInterval: 60_000,
  });
  const { data: pipelineStats } = useCurioRpc<SectorPipelineStatsEntry[]>(
    "SectorPipelineStats",
    [],
    { refetchInterval: 60_000 },
  );
  const { data: deadlineStats } = useCurioRpc<DeadlineStats[]>(
    "SectorDeadlineStats",
    [],
    { refetchInterval: 60_000 },
  );
  const { data: fileTypeStats } = useCurioRpc<SectorFileTypeStatsEntry[]>(
    "SectorFileTypeStats",
    [],
    { refetchInterval: 60_000 },
  );

  const [selectedSector, setSelectedSector] = useState<{
    sp: string;
    num: number;
  } | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<{
    sp: string;
    deadline: number;
  } | null>(null);
  const [selectedPartition, setSelectedPartition] = useState<{
    sp: string;
    deadline: number;
    partition: number;
  } | null>(null);

  const sectors = data ?? [];

  const stats = useMemo(() => {
    const total = sectors.length;
    const filPlus = sectors.filter((s) => s.IsFilPlus).length;
    const proving = sectors.filter((s) => s.Proving).length;
    const flagged = sectors.filter((s) => s.Flag).length;
    const snap = sectors.filter((s) => s.HasSnap).length;
    return { total, filPlus, proving, flagged, snap };
  }, [sectors]);

  const pct = (count: number) =>
    stats.total ? `${((count / stats.total) * 100).toFixed(1)}%` : "—";

  const handleRowClick = useCallback((row: SectorListItem) => {
    setSelectedSector({ sp: row.MinerAddress, num: row.SectorNum });
  }, []);

  return (
    <div className="space-y-6">
      {sectors.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <KPICard label="Total Sectors" value={stats.total} />
          <KPICard
            label="Fil+"
            value={stats.filPlus}
            subtitle={pct(stats.filPlus)}
          />
          <KPICard
            label="Proving"
            value={stats.proving}
            subtitle={pct(stats.proving)}
          />
          <KPICard
            label="Flagged"
            value={stats.flagged}
            subtitle={pct(stats.flagged)}
          />
          <KPICard label="Snap" value={stats.snap} subtitle={pct(stats.snap)} />
        </div>
      )}

      {spStats && spStats.length > 0 && (
        <SectionCard title="SP Sector Statistics" icon={BarChart3}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spStats.map((sp) => (
              <Card key={sp.sp_id}>
                <CardContent className="pt-4">
                  <div className="mb-2 font-mono text-sm font-medium">
                    {sp.sp_address}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-semibold">{sp.total_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CC</div>
                      <div className="font-semibold">{sp.cc_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Non-CC</div>
                      <div className="font-semibold">{sp.non_cc_count}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>
      )}

      {pipelineStats && pipelineStats.length > 0 && (
        <SectionCard title="Pipeline Statistics" icon={ArrowRightLeft}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium">Pipeline</th>
                  <th className="py-2 text-left font-medium">Stage</th>
                  <th className="py-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {pipelineStats.map((ps, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2">{ps.pipeline_type}</td>
                    <td className="py-2">
                      <Badge variant="outline">{ps.stage}</Badge>
                    </td>
                    <td className="py-2 text-right font-mono">{ps.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {deadlineStats && deadlineStats.length > 0 && (
        <SectionCard title="Deadline Statistics" icon={Clock}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium">SP</th>
                  <th className="py-2 text-right font-medium">Deadline</th>
                  <th className="py-2 text-right font-medium">All</th>
                  <th className="py-2 text-right font-medium">Live</th>
                  <th className="py-2 text-right font-medium">Active</th>
                  <th className="py-2 text-right font-medium">Faulty</th>
                  <th className="py-2 text-right font-medium">Recovering</th>
                  <th className="py-2 text-left font-medium">PoSt</th>
                </tr>
              </thead>
              <tbody>
                {deadlineStats.map((ds, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/[0.5]"
                    onClick={() =>
                      setSelectedDeadline({
                        sp: ds.sp_address,
                        deadline: ds.deadline,
                      })
                    }
                  >
                    <td className="py-2 font-mono text-xs">{ds.sp_address}</td>
                    <td className="py-2 text-right">{ds.deadline}</td>
                    <td className="py-2 text-right font-mono">
                      {ds.all_sectors}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {ds.live_sectors}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {ds.active_sectors}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {ds.faulty_sectors > 0 ? (
                        <span className="text-destructive">
                          {ds.faulty_sectors}
                        </span>
                      ) : (
                        ds.faulty_sectors
                      )}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {ds.recovering_sectors}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {ds.post_submissions || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {fileTypeStats && fileTypeStats.length > 0 && (
        <SectionCard title="File Type Distribution" icon={HardDrive}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {fileTypeStats.map((ft) => (
              <Card key={ft.file_type}>
                <CardContent className="pt-4 text-center">
                  <div className="text-sm text-muted-foreground">
                    {ft.file_type}
                  </div>
                  <div className="text-2xl font-bold">{ft.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Sector Inventory" icon={Database}>
        <DataTable
          columns={columns}
          data={sectors}
          loading={isLoading}
          searchable
          searchPlaceholder="Search sectors..."
          searchColumn="MinerAddress"
          emptyMessage="No sectors found"
          onRowClick={handleRowClick}
        />
      </SectionCard>

      {selectedSector && (
        <SectorDetailDialog
          sp={selectedSector.sp}
          sectorNum={selectedSector.num}
          onClose={() => setSelectedSector(null)}
        />
      )}
      {selectedDeadline && (
        <DeadlineDetailDialog
          sp={selectedDeadline.sp}
          deadline={selectedDeadline.deadline}
          onClose={() => setSelectedDeadline(null)}
          onPartitionClick={(p) => {
            setSelectedPartition({
              sp: selectedDeadline.sp,
              deadline: selectedDeadline.deadline,
              partition: p,
            });
          }}
        />
      )}
      {selectedPartition && (
        <PartitionDetailDialog
          sp={selectedPartition.sp}
          deadline={selectedPartition.deadline}
          partition={selectedPartition.partition}
          onClose={() => setSelectedPartition(null)}
        />
      )}
    </div>
  );
}

function SectorDetailDialog({
  sp,
  sectorNum,
  onClose,
}: {
  sp: string;
  sectorNum: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useCurioRpc<SectorDetail>(
    "SectorInfo",
    [sp, sectorNum],
    { refetchInterval: 10_000 },
  );
  const resumeMutation = useCurioRpcMutation("SectorResume", {
    invalidateKeys: [["curio", "SectorInfo", sp, sectorNum]],
  });
  const removeMutation = useCurioRpcMutation("SectorRemove", {
    invalidateKeys: [["curio", "SectorInfo", sp, sectorNum]],
  });
  const restartMutation = useCurioRpcMutation("SectorRestart", {
    invalidateKeys: [["curio", "SectorInfo", sp, sectorNum]],
  });
  const [confirmAction, setConfirmAction] = useState<"remove" | null>(null);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onClose={onClose}
      >
        <DialogHeader>
          <DialogTitle>
            Sector {sectorNum}{" "}
            <span className="font-mono text-sm font-normal text-muted-foreground">
              ({sp})
            </span>
          </DialogTitle>
          <DialogDescription>Sector details and operations</DialogDescription>
        </DialogHeader>

        {isLoading && !data ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading sector info...
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem
                label="Activation Epoch"
                value={String(data.ActivationEpoch)}
              />
              <InfoItem
                label="Expiration Epoch"
                value={
                  data.ExpirationEpoch != null
                    ? String(data.ExpirationEpoch)
                    : "—"
                }
              />
              <InfoItem
                label="Deadline"
                value={data.Deadline != null ? String(data.Deadline) : "—"}
              />
              <InfoItem
                label="Partition"
                value={data.Partition != null ? String(data.Partition) : "—"}
              />
              <InfoItem label="Deal Weight" value={data.DealWeight || "—"} />
              <InfoItem label="Snap" value={data.IsSnap ? "Yes" : "No"} />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Storage</h4>
              <div className="flex gap-2">
                {data.HasSealed && <Badge>Sealed</Badge>}
                {data.HasUnsealed && <Badge variant="outline">Unsealed</Badge>}
                {data.HasUpdate && <Badge variant="outline">Updated</Badge>}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">CIDs</h4>
              <div className="space-y-1 text-xs">
                {data.SealedCid && (
                  <CidRow label="Sealed" value={data.SealedCid} />
                )}
                {data.UnsealedCid && (
                  <CidRow label="Unsealed" value={data.UnsealedCid} />
                )}
                {data.UpdatedSealedCid && (
                  <CidRow
                    label="Updated Sealed"
                    value={data.UpdatedSealedCid}
                  />
                )}
                {data.UpdatedUnsealedCid && (
                  <CidRow
                    label="Updated Unsealed"
                    value={data.UpdatedUnsealedCid}
                  />
                )}
              </div>
            </div>

            {(data.PreCommitMsg || data.CommitMsg || data.UpdateMsg) && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Messages</h4>
                <div className="space-y-1 text-xs">
                  {data.PreCommitMsg && (
                    <CidRow label="PreCommit" value={data.PreCommitMsg} />
                  )}
                  {data.CommitMsg && (
                    <CidRow label="Commit" value={data.CommitMsg} />
                  )}
                  {data.UpdateMsg && (
                    <CidRow label="Update" value={data.UpdateMsg} />
                  )}
                </div>
              </div>
            )}

            {data.PartitionState && (
              <div>
                <h4 className="mb-2 text-sm font-medium">On-Chain State</h4>
                <div className="flex flex-wrap gap-2">
                  {data.PartitionState.Live && (
                    <StatusBadge status="done" label="Live" />
                  )}
                  {data.PartitionState.Active && (
                    <StatusBadge status="done" label="Active" />
                  )}
                  {data.PartitionState.Faulty && (
                    <StatusBadge status="failed" label="Faulty" />
                  )}
                  {data.PartitionState.Recovering && (
                    <StatusBadge status="warning" label="Recovering" />
                  )}
                  {data.PartitionState.Terminated && (
                    <StatusBadge status="failed" label="Terminated" />
                  )}
                  {data.PartitionState.Unproven && (
                    <StatusBadge status="warning" label="Unproven" />
                  )}
                </div>
              </div>
            )}

            {data.Pieces && data.Pieces.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Pieces ({data.Pieces.length})
                </h4>
                <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
                  {data.Pieces.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-sm border border-border px-2 py-1"
                    >
                      <span className="truncate font-mono">{p.PieceCID}</span>
                      <span className="ml-2 text-muted-foreground">
                        {p.PieceSize}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.Locations && data.Locations.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Locations ({data.Locations.length})
                </h4>
                <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
                  {data.Locations.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-sm border border-border px-2 py-1"
                    >
                      <Badge variant="outline" className="text-xs">
                        {l.FileType}
                      </Badge>
                      <span className="truncate font-mono">{l.StorageID}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.TaskHistory && data.TaskHistory.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Recent Tasks ({data.TaskHistory.length})
                </h4>
                <div className="max-h-40 space-y-1 overflow-y-auto text-xs">
                  {data.TaskHistory.slice(0, 10).map((t) => (
                    <div
                      key={t.ID}
                      className="flex items-center justify-between rounded-sm border border-border px-2 py-1"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={t.Result ? "done" : "failed"}
                          label={t.Result ? "OK" : "Fail"}
                        />
                        <span>{t.Name}</span>
                      </div>
                      <span className="text-muted-foreground">{t.Took}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <div className="flex w-full gap-2">
                {data.Resumable && (
                  <Button
                    size="sm"
                    onClick={() => resumeMutation.mutate([sp, sectorNum])}
                    disabled={resumeMutation.isPending}
                  >
                    {resumeMutation.isPending ? "Resuming..." : "Resume"}
                  </Button>
                )}
                {data.Restart && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restartMutation.mutate([sp, sectorNum])}
                    disabled={restartMutation.isPending}
                  >
                    {restartMutation.isPending ? "Restarting..." : "Restart"}
                  </Button>
                )}
                {confirmAction === "remove" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-destructive">
                      Confirm remove?
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        removeMutation.mutate([sp, sectorNum]);
                        setConfirmAction(null);
                      }}
                      disabled={removeMutation.isPending}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmAction("remove")}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Sector not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function CidRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-[100px] text-muted-foreground">{label}:</span>
      <span className="truncate font-mono">{value}</span>
    </div>
  );
}

// --- Deadline Detail Dialog ---

function DeadlineDetailDialog({
  sp,
  deadline,
  onClose,
  onPartitionClick,
}: {
  sp: string;
  deadline: number;
  onClose: () => void;
  onPartitionClick: (partition: number) => void;
}) {
  const { data, isLoading } = useCurioRpc<DeadlineDetailData>(
    "DeadlineDetail",
    [sp, deadline],
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>
            Deadline {deadline} — {sp}
          </DialogTitle>
          <DialogDescription>
            Partitions and sector distribution
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-3 text-sm">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                Post Submissions:{" "}
                <strong className="text-foreground">
                  {data.post_submissions}
                </strong>
              </span>
              <span>
                Disputable Proofs:{" "}
                <strong className="text-foreground">
                  {data.disputable_proof_count}
                </strong>
              </span>
            </div>
            {data.partitions && data.partitions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-1 text-left">Partition</th>
                      <th className="py-1 text-right">All</th>
                      <th className="py-1 text-right">Live</th>
                      <th className="py-1 text-right">Active</th>
                      <th className="py-1 text-right">Faulty</th>
                      <th className="py-1 text-right">Recovering</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.partitions.map((p) => (
                      <tr
                        key={p.partition}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/[0.5]"
                        onClick={() => onPartitionClick(p.partition)}
                      >
                        <td className="py-1 font-mono">#{p.partition}</td>
                        <td className="py-1 text-right">{p.all_sectors}</td>
                        <td className="py-1 text-right">{p.live_sectors}</td>
                        <td className="py-1 text-right">{p.active_sectors}</td>
                        <td className="py-1 text-right">
                          {p.faulty_sectors > 0 ? (
                            <span className="text-destructive">
                              {p.faulty_sectors}
                            </span>
                          ) : (
                            p.faulty_sectors
                          )}
                        </td>
                        <td className="py-1 text-right">
                          {p.recovering_sectors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm">Not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Partition Detail Dialog ---

function PartitionDetailDialog({
  sp,
  deadline,
  partition,
  onClose,
}: {
  sp: string;
  deadline: number;
  partition: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useCurioRpc<PartitionDetailData>(
    "PartitionDetail",
    [sp, deadline, partition],
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>
            Partition #{partition} — Deadline {deadline}
          </DialogTitle>
          <DialogDescription>{sp}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-5">
              <div className="text-center">
                <div className="text-muted-foreground">All</div>
                <div className="font-bold">{data.all_sectors_count}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Live</div>
                <div className="font-bold">{data.live_sectors_count}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Active</div>
                <div className="font-bold">{data.active_sectors_count}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Faulty</div>
                <div className="font-bold text-destructive">
                  {data.faulty_sectors_count}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Recovering</div>
                <div className="font-bold">{data.recovering_sectors_count}</div>
              </div>
            </div>
            {data.sectors && data.sectors.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border">
                      <th className="py-1 text-left">Sector</th>
                      <th className="py-1 text-center">Live</th>
                      <th className="py-1 text-center">Active</th>
                      <th className="py-1 text-center">Faulty</th>
                      <th className="py-1 text-center">Recovering</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sectors.map((s) => (
                      <tr
                        key={s.sector_number}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-1 font-mono">#{s.sector_number}</td>
                        <td className="py-1 text-center">
                          {s.is_live ? "✓" : "—"}
                        </td>
                        <td className="py-1 text-center">
                          {s.is_active ? "✓" : "—"}
                        </td>
                        <td className="py-1 text-center">
                          {s.is_faulty ? (
                            <span className="text-destructive">✗</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-1 text-center">
                          {s.is_recovering ? "↻" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm">Not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
