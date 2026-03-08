import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActorSummaryTable } from "./-components/actor-summary-table";
import { RestartConfirmButton } from "./-components/restart-confirm-button";
import {
  type SnapColumnMeta,
  snapSectorColumns,
} from "./-components/snap-columns";
import {
  useSnapDelete,
  useSnapResetTasks,
  useSnapRestartAll,
  useSnapSectors,
  useSnapStats,
  useSnapSummary,
} from "./-module/queries";

export const Route = createFileRoute("/_app/pipeline/snap")({
  component: SnapPage,
});

function SnapPage() {
  const { data: sectors, isLoading: sectorsLoading } = useSnapSectors();
  const { data: statsData, isLoading: statsLoading } = useSnapStats();
  const { totals, actorRows } = useSnapSummary(statsData, sectors);
  const restartAllMutation = useSnapRestartAll();
  const deleteMutation = useSnapDelete();
  const resetTasksMutation = useSnapResetTasks();

  const tableMeta: SnapColumnMeta = useMemo(
    () => ({
      onDelete: (spId: number, sectorNum: number) =>
        deleteMutation.mutate([spId, sectorNum]),
      onResetTasks: (spId: number, sectorNum: number) =>
        resetTasksMutation.mutate([spId, sectorNum]),
    }),
    [deleteMutation, resetTasksMutation],
  );

  if (statsLoading && !statsData) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Snap Pipeline</h2>
        <RestartConfirmButton
          label="Restart All Failed"
          confirmMessage="Restart all failed Snap tasks?"
          onConfirm={() => restartAllMutation.mutate([])}
          isPending={restartAllMutation.isPending}
        />
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard label="Encode" value={totals.encode} />
          <KPICard label="Prove" value={totals.prove} />
          <KPICard label="Submit" value={totals.submit} />
          <KPICard label="Move Storage" value={totals.moveStorage} />
          <KPICard label="Done" value={totals.done} />
          <KPICard label="Failed" value={totals.failed} />
        </div>
      )}

      <ActorSummaryTable
        title="Pipeline by Actor"
        data={actorRows}
        variant="snap"
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Snap Upgrades</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={snapSectorColumns}
            data={sectors}
            loading={sectorsLoading}
            searchable
            searchPlaceholder="Search sectors..."
            searchColumn="address"
            emptyMessage="No active snap upgrades"
            meta={tableMeta}
          />
        </CardContent>
      </Card>
    </div>
  );
}
