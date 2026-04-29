import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, User } from "lucide-react";
import { KPICard } from "@/components/composed/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatFilecoin } from "@/utils/filecoin";
import { ActorCharts } from "./-components/actor-charts";
import { ActorFinancialsCard } from "./-components/actor-financials-card";
import { ActorIdentityCard } from "./-components/actor-identity-card";
import { ActorWalletsCard } from "./-components/actor-wallets-card";
import { ActorWinsCard } from "./-components/actor-wins-card";
import { DeadlineGrid } from "./-components/deadline-grid";
import { formatPowerShort, formatSectorSize } from "./-module/adapters";
import { useActorDetailBundle } from "./-module/queries";

export const Route = createFileRoute("/_app/actor/$id")({
  component: ActorDetailPage,
});

function ActorDetailPage() {
  const { id } = Route.useParams();
  const { info, charts, actorWins, isLoading } = useActorDetailBundle(id);

  usePageTitle(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const data = info.data;
  if (!data) {
    return (
      <div className="py-2">
        <p className="text-muted-foreground">Actor not found.</p>
      </div>
    );
  }

  const summary = data.Summary;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/actor">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" /> Back
            </Button>
          </Link>
          <User className="size-5" />
          <h1 className="text-2xl font-bold tracking-tight">{id}</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard
            label="Balance"
            value={formatFilecoin(summary.ActorBalance)}
          />
          <KPICard
            label="Available"
            value={formatFilecoin(summary.ActorAvailable)}
          />
          <KPICard
            label="QaP"
            value={formatPowerShort(summary.QualityAdjustedPower)}
          />
          <KPICard
            label="Raw Power"
            value={formatPowerShort(summary.RawBytePower)}
          />
          <KPICard
            label="Sector Size"
            value={formatSectorSize(data.SectorSize)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KPICard label="Wins (1d)" value={summary.Win1} />
          <KPICard label="Wins (7d)" value={summary.Win7} />
          <KPICard label="Wins (30d)" value={summary.Win30} />
        </div>

        <ActorFinancialsCard data={data} />

        {charts.data && <ActorCharts buckets={charts.data} />}

        <div className="grid gap-6 xl:grid-cols-2">
          <ActorIdentityCard data={data} />

          <Card>
            <CardHeader>
              <CardTitle>Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <DeadlineGrid deadlines={summary.Deadlines ?? []} />
            </CardContent>
          </Card>
        </div>

        <ActorWalletsCard wallets={data.Wallets} />

        <ActorWinsCard wins={actorWins} />
      </div>
    </TooltipProvider>
  );
}
