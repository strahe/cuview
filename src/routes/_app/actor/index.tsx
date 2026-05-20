import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { DataTable } from "@/components/table/data-table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePageTitle } from "@/hooks/use-page-title";
import { actorColumns } from "./-components/actor-columns";
import { useActorSummary } from "./-module/queries";

export const Route = createFileRoute("/_app/actor/")({
  component: ActorListPage,
});

function ActorListPage() {
  usePageTitle("Actors");
  const navigate = useNavigate();

  const { data, isLoading } = useActorSummary();
  const actors = data ?? [];

  const stats = useMemo(() => {
    const total = actors.length;
    let totalWins1d = 0;
    let totalWins7d = 0;
    let totalWins30d = 0;

    for (const actor of actors) {
      totalWins1d += actor.Win1 || 0;
      totalWins7d += actor.Win7 || 0;
      totalWins30d += actor.Win30 || 0;
    }

    return { total, totalWins1d, totalWins7d, totalWins30d };
  }, [actors]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {actors.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard label="Total Actors" value={stats.total} />
            <KPICard label="Wins (1d)" value={stats.totalWins1d} />
            <KPICard label="Wins (7d)" value={stats.totalWins7d} />
            <KPICard label="Wins (30d)" value={stats.totalWins30d} />
          </div>
        )}

        <DataTable
          columns={actorColumns}
          data={actors}
          loading={isLoading}
          searchable
          searchPlaceholder="Search actors..."
          searchColumn="Address"
          emptyMessage="No actors found"
          onRowClick={(row) =>
            navigate({ to: "/actor/$id", params: { id: row.Address } })
          }
        />
      </div>
    </TooltipProvider>
  );
}
