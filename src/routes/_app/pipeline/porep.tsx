import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActorSummaryTable } from "./-components/actor-summary-table";
import {
  createPorepColumns,
  type PorepColumnMeta,
} from "./-components/porep-columns";
import { RestartConfirmButton } from "./-components/restart-confirm-button";
import { SectorSubRow } from "./-components/sector-sub-row";
import {
  usePorepRestartAll,
  usePorepSectorAction,
  usePorepSectors,
  usePorepSummary,
} from "./-module/queries";
import type { PorepSectorActionType } from "./-module/types";

export const Route = createFileRoute("/_app/pipeline/porep")({
  component: PoRepPage,
});

const sectorColumns = createPorepColumns({ expandable: true });

function PoRepPage() {
  const { data: sectors, isLoading: sectorsLoading } = usePorepSectors();
  const {
    isLoading: summaryLoading,
    data: summaryData,
    totals,
    actorRows,
  } = usePorepSummary();
  const restartAllMutation = usePorepRestartAll();

  const resumeMutation = usePorepSectorAction("SectorResume");
  const removeMutation = usePorepSectorAction("SectorRemove");
  const restartMutation = usePorepSectorAction("SectorRestart");

  const handleSectorAction = useMemo(() => {
    const mutations = {
      resume: resumeMutation,
      remove: removeMutation,
      restart: restartMutation,
    };
    return (spId: number, sectorNum: number, type: PorepSectorActionType) => {
      mutations[type].mutate([spId, sectorNum]);
    };
  }, [resumeMutation, removeMutation, restartMutation]);

  const tableMeta: PorepColumnMeta = useMemo(
    () => ({ onAction: handleSectorAction }),
    [handleSectorAction],
  );

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">PoRep Pipeline</h2>
        <RestartConfirmButton
          label="Restart All Failed"
          confirmMessage="Restart all failed PoRep tasks?"
          onConfirm={() => restartAllMutation.mutate([])}
          isPending={restartAllMutation.isPending}
        />
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
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

      <ActorSummaryTable
        title="Pipeline by Actor"
        data={actorRows}
        variant="porep"
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Sectors</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={sectorColumns}
            data={sectors}
            loading={sectorsLoading}
            searchable
            searchPlaceholder="Search sectors..."
            searchColumn="address"
            emptyMessage="No active pipeline sectors"
            getRowCanExpand={() => true}
            renderSubComponent={({ row }) => (
              <SectorSubRow row={row.original} />
            )}
            meta={tableMeta}
          />
        </CardContent>
      </Card>
    </div>
  );
}
