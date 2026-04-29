import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRightLeft,
  BarChart3,
  Clock,
  Database,
  HardDrive,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCurioRest,
  useCurioRpc,
  useCurioRpcMutation,
} from "@/hooks/use-curio-query";
import { DEFAULT_STORAGE_PATH_DETAIL_SEARCH } from "@/routes/_app/storage/-module/search-state";
import type {
  DeadlineStats,
  PartitionDetailData,
  SectorDetail,
  SectorFileTypeStatsEntry,
  SectorListItem,
  SectorPipelineStatsEntry,
  SPSectorStats,
} from "@/types/sectors";
import type { StorageGCStatsEntry } from "@/types/storage";

export const Route = createFileRoute("/_app/sectors/")({
  component: SectorsPage,
});

const quickLinkClass =
  "inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

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
  const { data: gcStats } = useCurioRpc<StorageGCStatsEntry[]>(
    "StorageGCStats",
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
    let filPlus = 0;
    let proving = 0;
    let flagged = 0;
    let snap = 0;
    for (const s of sectors) {
      if (s.IsFilPlus) filPlus++;
      if (s.Proving) proving++;
      if (s.Flag) flagged++;
      if (s.HasSnap) snap++;
    }
    return { total: sectors.length, filPlus, proving, flagged, snap };
  }, [sectors]);

  const pct = (count: number) =>
    stats.total ? `${((count / stats.total) * 100).toFixed(1)}%` : "—";

  const gcTotalMarked = useMemo(
    () => gcStats?.reduce((sum, item) => sum + item.Count, 0) ?? 0,
    [gcStats],
  );

  const gcTopMiners = useMemo(
    () => [...(gcStats ?? [])].sort((a, b) => b.Count - a.Count).slice(0, 6),
    [gcStats],
  );

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
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelineStats.map((ps, i) => (
                <TableRow key={i}>
                  <TableCell>{ps.pipeline_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ps.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {ps.count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      {deadlineStats && deadlineStats.length > 0 && (
        <SectionCard title="Deadline Statistics" icon={Clock}>
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>SP</TableHead>
                <TableHead className="text-right">Deadline</TableHead>
                <TableHead className="text-right">All</TableHead>
                <TableHead className="text-right">Live</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Faulty</TableHead>
                <TableHead className="text-right">Recovering</TableHead>
                <TableHead>PoSt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deadlineStats.map((ds, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedDeadline({
                      sp: ds.sp_address,
                      deadline: ds.deadline,
                    })
                  }
                >
                  <TableCell className="font-mono text-xs">
                    {ds.sp_address}
                  </TableCell>
                  <TableCell className="text-right">{ds.deadline}</TableCell>
                  <TableCell className="text-right font-mono">
                    {ds.all_sectors}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {ds.live_sectors}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {ds.active_sectors}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {ds.faulty_sectors > 0 ? (
                      <span className="text-destructive">
                        {ds.faulty_sectors}
                      </span>
                    ) : (
                      ds.faulty_sectors
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {ds.recovering_sectors}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {ds.post_submissions || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {gcStats && gcStats.length > 0 && (
        <SectionCard
          title="Storage GC Snapshot"
          icon={HardDrive}
          action={
            <Link to="/storage" className={quickLinkClass}>
              Open Storage Page
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard label="Marked Sectors" value={gcTotalMarked} />
            <KPICard label="Miners" value={gcStats.length} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {gcTopMiners.map((item) => (
              <Card key={item.Actor}>
                <CardContent className="py-3">
                  <div className="text-xs text-muted-foreground">Miner</div>
                  <div className="font-mono text-sm">{item.Miner}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Marked sectors
                  </div>
                  <div className="text-lg font-semibold">{item.Count}</div>
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Sector {sectorNum}{" "}
            <span className="font-mono text-sm font-normal text-muted-foreground">
              ({sp})
            </span>
          </DialogTitle>
          <DialogDescription>Sector details and operations</DialogDescription>
        </DialogHeader>

        <div className="mb-3 flex flex-wrap gap-2">
          {data?.HasSealed && (
            <Link
              to="/sectors/diagnostics"
              search={{ tab: "commr", sp, sector: sectorNum }}
              className={quickLinkClass}
            >
              CommR Check
            </Link>
          )}
          {data?.HasUnsealed && (
            <Link
              to="/sectors/diagnostics"
              search={{ tab: "unsealed", sp, sector: sectorNum }}
              className={quickLinkClass}
            >
              Unsealed Check
            </Link>
          )}
        </div>

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
                  {data.PartitionState.in_live_sectors && (
                    <StatusBadge status="done" label="Live" />
                  )}
                  {data.PartitionState.in_active_sectors && (
                    <StatusBadge status="done" label="Active" />
                  )}
                  {data.PartitionState.in_faulty_sectors && (
                    <StatusBadge status="failed" label="Faulty" />
                  )}
                  {data.PartitionState.in_recovering_sectors && (
                    <StatusBadge status="warning" label="Recovering" />
                  )}
                  {data.PartitionState.in_unproven_sectors && (
                    <StatusBadge status="warning" label="Unproven" />
                  )}
                  {data.PartitionState.partition_post_submitted && (
                    <StatusBadge status="done" label="PoSt Submitted" />
                  )}
                  {data.PartitionState.is_current_deadline && (
                    <StatusBadge status="info" label="Current Deadline" />
                  )}
                  {data.PartitionState.hours_until_proof && (
                    <Badge variant="outline" className="text-xs">
                      Proof in {data.PartitionState.hours_until_proof}
                    </Badge>
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
                      <span className="truncate font-mono">{p.PieceCid}</span>
                      <span className="ml-2 text-muted-foreground">
                        {p.StrPieceSize || p.PieceSize}
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
                      {l.PathType && (
                        <Badge variant="outline" className="text-xs">
                          {l.PathType}
                        </Badge>
                      )}
                      {l.FileType && (
                        <Badge variant="secondary" className="text-xs">
                          {l.FileType}
                        </Badge>
                      )}
                      <span className="truncate font-mono text-muted-foreground">
                        {l.Locations?.map((loc, index) => (
                          <span key={`${loc.StorageID}-${index}`}>
                            {index > 0 ? ", " : null}
                            <Link
                              to="/storage/paths/$storageId"
                              params={{ storageId: loc.StorageID }}
                              search={DEFAULT_STORAGE_PATH_DETAIL_SEARCH}
                              className="text-primary hover:underline"
                            >
                              {loc.StorageID}
                            </Link>
                          </span>
                        ))}
                      </span>
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
                      key={t.PipelineTaskID}
                      className="flex items-center justify-between rounded-sm border border-border px-2 py-1"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={
                            t.Result.Valid
                              ? t.Result.Bool
                                ? "done"
                                : "failed"
                              : "warning"
                          }
                          label={
                            t.Result.Valid
                              ? t.Result.Bool
                                ? "OK"
                                : "Fail"
                              : "?"
                          }
                        />
                        <span>{t.Name.Valid ? t.Name.String : "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.CompletedBy.Valid && (
                          <span className="text-muted-foreground">
                            {t.CompletedBy.String}
                          </span>
                        )}
                        <span className="text-muted-foreground">{t.Took}</span>
                      </div>
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
                    {resumeMutation.isPending && (
                      <Spinner data-icon="inline-start" className="size-3" />
                    )}
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
                    {restartMutation.isPending && (
                      <Spinner data-icon="inline-start" className="size-3" />
                    )}
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Deadline {deadline} — {sp}
          </DialogTitle>
          <DialogDescription>
            Partitions and sector distribution
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-32" />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partition</TableHead>
                    <TableHead className="text-right">All</TableHead>
                    <TableHead className="text-right">Live</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Faulty</TableHead>
                    <TableHead className="text-right">Recovering</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.partitions.map((p) => (
                    <TableRow
                      key={p.partition}
                      className="cursor-pointer"
                      onClick={() => onPartitionClick(p.partition)}
                    >
                      <TableCell className="font-mono">
                        #{p.partition}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.all_sectors}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.live_sectors}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.active_sectors}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.faulty_sectors > 0 ? (
                          <span className="text-destructive">
                            {p.faulty_sectors}
                          </span>
                        ) : (
                          p.faulty_sectors
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.recovering_sectors}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyHeader>
              <EmptyTitle>Deadline not found</EmptyTitle>
              <EmptyDescription>
                No partition data is available for this deadline.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Partition #{partition} — Deadline {deadline}
          </DialogTitle>
          <DialogDescription>{sp}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-32" />
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
            <div className="flex flex-wrap gap-2">
              <Link
                to="/sectors/diagnostics"
                search={{ tab: "wdpost", sp, deadline, partition }}
                className={quickLinkClass}
              >
                WdPost Test
              </Link>
              <Link
                to="/sectors/diagnostics"
                search={{ tab: "vanilla", sp, deadline, partition }}
                className={quickLinkClass}
              >
                Partition Vanilla Test
              </Link>
            </div>

            {data.sectors && data.sectors.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-center">Live</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      <TableHead className="text-center">Faulty</TableHead>
                      <TableHead className="text-center">Recovering</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sectors.map((s) => (
                      <TableRow key={s.sector_number}>
                        <TableCell className="font-mono">
                          #{s.sector_number}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.is_live ? "✓" : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.is_active ? "✓" : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.is_faulty ? (
                            <span className="text-destructive">✗</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.is_recovering ? "↻" : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {data.faulty_storage_paths &&
              data.faulty_storage_paths.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Faulty Storage Paths ({data.faulty_storage_paths.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Storage ID</TableHead>
                          <TableHead>Path Role</TableHead>
                          <TableHead>Hosts</TableHead>
                          <TableHead className="text-right">
                            Faulty Sectors
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.faulty_storage_paths.map((path) => (
                          <TableRow
                            key={`${path.storage_id}-${path.path_type}`}
                          >
                            <TableCell className="font-mono">
                              <Link
                                to="/storage/paths/$storageId"
                                params={{ storageId: path.storage_id }}
                                search={DEFAULT_STORAGE_PATH_DETAIL_SEARCH}
                                className="text-primary hover:underline"
                              >
                                {path.storage_id}
                              </Link>
                            </TableCell>
                            <TableCell>{path.path_type || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {path.urls?.length ? path.urls.join(", ") : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {path.count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <Empty className="border-0 py-4">
            <EmptyHeader>
              <EmptyTitle>Partition not found</EmptyTitle>
              <EmptyDescription>
                No sector data is available for this partition.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </DialogContent>
    </Dialog>
  );
}
