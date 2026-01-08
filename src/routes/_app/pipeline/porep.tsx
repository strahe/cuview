import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { KPICard } from "@/components/composed/kpi-card";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PorepPipelineSummary, SectorListEntry } from "@/types/pipeline";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/pipeline/porep")({
  component: PoRepPage,
});

const sectorColumns: ColumnDef<SectorListEntry>[] = [
  { accessorKey: "SectorNumber", header: "Sector" },
  { accessorKey: "Address", header: "Miner" },
  { accessorKey: "CreateTime", header: "Created" },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const s = row.original;
      if (s.Failed) return <StatusBadge status="failed" label="Failed" />;
      if (s.AfterCommitMsgSuccess) return <StatusBadge status="done" label="Done" />;
      if (s.AfterCommitMsg) return <StatusBadge status="running" label="CommitMsg" />;
      if (s.AfterPoRep) return <StatusBadge status="running" label="PoRep" />;
      if (s.AfterPrecommitMsgSuccess) return <StatusBadge status="running" label="WaitSeed" />;
      if (s.AfterPrecommitMsg) return <StatusBadge status="running" label="PreCommit" />;
      if (s.AfterTreeR) return <StatusBadge status="running" label="Trees" />;
      if (s.AfterSDR) return <StatusBadge status="running" label="SDR" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  {
    accessorKey: "FailedReason",
    header: "Error",
    cell: ({ row }) =>
      row.original.Failed ? (
        <span
          className="max-w-xs truncate text-xs text-[hsl(var(--destructive))]"
          title={row.original.FailedReason}
        >
          {row.original.FailedReason}
        </span>
      ) : (
        "—"
      ),
  },
];

function PoRepPage() {
  const { data: summaryData, isLoading: summaryLoading } = useCurioRpc<
    PorepPipelineSummary[]
  >("PipelinePorepSectors", [], { refetchInterval: 30_000 });

  const { data: sectorsData, isLoading: sectorsLoading } = useCurioRpc<
    SectorListEntry[]
  >("PipelineStatsSDR", [], { refetchInterval: 30_000 });

  const totals = useMemo(() => {
    if (!summaryData) return null;
    return summaryData.reduce(
      (acc, s) => ({
        sdr: acc.sdr + s.CountSDR,
        trees: acc.trees + s.CountTrees,
        precommit: acc.precommit + s.CountPrecommitMsg,
        waitSeed: acc.waitSeed + s.CountWaitSeed,
        porep: acc.porep + s.CountPoRep,
        commit: acc.commit + s.CountCommitMsg,
        done: acc.done + s.CountDone,
        failed: acc.failed + s.CountFailed,
      }),
      { sdr: 0, trees: 0, precommit: 0, waitSeed: 0, porep: 0, commit: 0, done: 0, failed: 0 },
    );
  }, [summaryData]);

  if (summaryLoading && !summaryData) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {totals && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <KPICard label="SDR" value={totals.sdr} />
          <KPICard label="Trees" value={totals.trees} />
          <KPICard label="PreCommit" value={totals.precommit} />
          <KPICard label="WaitSeed" value={totals.waitSeed} />
          <KPICard label="PoRep" value={totals.porep} />
          <KPICard label="Commit" value={totals.commit} />
          <KPICard label="Done" value={totals.done} />
          <KPICard label="Failed" value={totals.failed} />
        </div>
      )}

      {summaryData && summaryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Actor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">SDR</th>
                    <th className="px-3 py-2">Trees</th>
                    <th className="px-3 py-2">PreCommit</th>
                    <th className="px-3 py-2">WaitSeed</th>
                    <th className="px-3 py-2">PoRep</th>
                    <th className="px-3 py-2">Commit</th>
                    <th className="px-3 py-2">Done</th>
                    <th className="px-3 py-2">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((s) => (
                    <tr
                      key={s.Actor}
                      className="border-b border-[hsl(var(--border))] last:border-0"
                    >
                      <td className="px-3 py-2 font-mono">{s.Actor}</td>
                      <td className="px-3 py-2">{s.CountSDR}</td>
                      <td className="px-3 py-2">{s.CountTrees}</td>
                      <td className="px-3 py-2">{s.CountPrecommitMsg}</td>
                      <td className="px-3 py-2">{s.CountWaitSeed}</td>
                      <td className="px-3 py-2">{s.CountPoRep}</td>
                      <td className="px-3 py-2">{s.CountCommitMsg}</td>
                      <td className="px-3 py-2">{s.CountDone}</td>
                      <td className="px-3 py-2">{s.CountFailed || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Sectors</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={sectorColumns}
            data={sectorsData ?? []}
            loading={sectorsLoading}
            searchable
            searchPlaceholder="Search sectors..."
            searchColumn="Address"
            emptyMessage="No active pipeline sectors"
          />
        </CardContent>
      </Card>
    </div>
  );
}
