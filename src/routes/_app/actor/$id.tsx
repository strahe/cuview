import { createFileRoute, Link } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/composed/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActorDetail, Deadline } from "@/types/actor";
import { ArrowLeft, User } from "lucide-react";
import { formatFilecoin } from "@/utils/filecoin";

export const Route = createFileRoute("/_app/actor/$id")({
  component: ActorDetailPage,
});

function ActorDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useCurioRpc<ActorDetail>("ActorInfo", [id], {
    refetchInterval: 30_000,
  });

  usePageTitle(id);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-[hsl(var(--muted-foreground))]">Actor not found.</p>
      </div>
    );
  }

  const summary = data.Summary;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link to="/actor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
        </Link>
        <User className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">{id}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Balance" value={formatFilecoin(summary.ActorBalance)} />
        <KPICard label="Available" value={formatFilecoin(summary.ActorAvailable)} />
        <KPICard label="QaP" value={summary.QualityAdjustedPower} />
        <KPICard label="Sector Size" value={data.SectorSize} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard label="Wins (1d)" value={summary.Win1} />
        <KPICard label="Wins (7d)" value={summary.Win7} />
        <KPICard label="Wins (30d)" value={summary.Win30} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Owner" value={data.OwnerAddress} mono />
              <InfoRow label="Beneficiary" value={data.Beneficiary} mono />
              <InfoRow label="Worker" value={data.WorkerAddress} mono />
              <InfoRow label="Worker Balance" value={formatFilecoin(data.WorkerBalance)} />
              <InfoRow label="Peer ID" value={data.PeerID} mono />
              <InfoRow
                label="Config Layers"
                value={summary.CLayers?.join(", ") || "—"}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <DeadlineGrid deadlines={summary.Deadlines ?? []} />
          </CardContent>
        </Card>
      </div>

      {data.Wallets && data.Wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.Wallets.map((w) => (
                <div
                  key={w.Address}
                  className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{w.Type}</Badge>
                    <span className="font-mono text-xs">{w.Address}</span>
                  </div>
                  <span>{formatFilecoin(w.Balance)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[hsl(var(--muted-foreground))]">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : ""}>
        {value || "—"}
      </dd>
    </div>
  );
}

function DeadlineGrid({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines.length) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        No deadline data
      </p>
    );
  }

  return (
    <div className="grid grid-cols-8 gap-1">
      {deadlines.map((d, i) => {
        let color = "bg-[hsl(var(--muted))]";
        if (d.Current) color = "bg-[hsl(var(--primary))]";
        else if (d.Faulty) color = "bg-[hsl(var(--destructive))]";
        else if (d.PartFaulty)
          color = "bg-[hsl(var(--warning,40_96%_40%))]";
        else if (d.Proven) color = "bg-[hsl(var(--success,142_76%_36%))]";

        return (
          <div
            key={i}
            className={`h-4 rounded-sm ${color}`}
            title={`Deadline ${i}${d.Current ? " (current)" : ""}${d.Faulty ? " (faulty)" : ""}${d.Proven ? " (proven)" : ""}`}
          />
        );
      })}
    </div>
  );
}
