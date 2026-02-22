import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Coins, Trophy, User } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPICard } from "@/components/composed/kpi-card";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type {
  ActorDetail,
  Deadline,
  SectorBucket,
  SectorBuckets,
} from "@/types/actor";
import type { WinStat } from "@/types/win";
import { formatFilecoin } from "@/utils/filecoin";

export const Route = createFileRoute("/_app/actor/$id")({
  component: ActorDetailPage,
});

const winColumns: ColumnDef<WinStat>[] = [
  { accessorKey: "Epoch", header: "Epoch" },
  {
    accessorKey: "Block",
    header: "Block",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.Block?.slice(0, 16)}…
      </span>
    ),
  },
  { accessorKey: "SubmittedAtStr", header: "Submitted" },
  { accessorKey: "IncludedStr", header: "Included" },
  { accessorKey: "ComputeTime", header: "Compute Time" },
  { accessorKey: "TaskSuccess", header: "Status" },
];

function ActorDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useCurioRpc<ActorDetail>("ActorInfo", [id], {
    refetchInterval: 30_000,
  });

  const { data: charts } = useCurioRpc<SectorBuckets>("ActorCharts", [id], {
    refetchInterval: 60_000,
  });

  const { data: winStats } = useCurioRpc<WinStat[]>("WinStats", [], {
    refetchInterval: 60_000,
  });

  usePageTitle(id);

  // Filter wins for this actor
  const actorWins = winStats?.filter((w) => w.Miner === id) ?? [];

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
        <KPICard
          label="Available"
          value={formatFilecoin(summary.ActorAvailable)}
        />
        <KPICard label="QaP" value={summary.QualityAdjustedPower} />
        <KPICard label="Raw Power" value={summary.RawBytePower} />
        <KPICard label="Sector Size" value={data.SectorSize} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard label="Wins (1d)" value={summary.Win1} />
        <KPICard label="Wins (7d)" value={summary.Win7} />
        <KPICard label="Wins (30d)" value={summary.Win30} />
      </div>

      {/* Financials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="size-4" />
            Financials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <InfoRow
              label="Vesting Funds"
              value={formatFilecoin(summary.VestingFunds)}
            />
            <InfoRow
              label="Initial Pledge"
              value={formatFilecoin(summary.InitialPledgeRequirement)}
            />
            <InfoRow
              label="PreCommit Deposits"
              value={formatFilecoin(summary.PreCommitDeposits)}
            />
            <InfoRow
              label="Worker Balance"
              value={formatFilecoin(data.WorkerBalance)}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Sector Expiration Chart */}
      {charts?.All && charts.All.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sector Expiration Buckets</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatBucketData(charts)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="all"
                  name="All Sectors"
                  fill="hsl(var(--primary))"
                />
                <Bar
                  dataKey="cc"
                  name="CC Sectors"
                  fill="hsl(var(--muted-foreground))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
              <InfoRow
                label="Worker Balance"
                value={formatFilecoin(data.WorkerBalance)}
              />
              {data.PendingOwnerAddress && (
                <InfoRow
                  label="Pending Owner"
                  value={data.PendingOwnerAddress}
                  mono
                />
              )}
              <InfoRow label="Peer ID" value={data.PeerID} mono />
              <InfoRow
                label="Config Layers"
                value={summary.CLayers?.join(", ") || "—"}
              />
              {data.BeneficiaryTerm && (
                <>
                  <InfoRow
                    label="Beneficiary Quota"
                    value={formatFilecoin(data.BeneficiaryTerm.Quota)}
                  />
                  <InfoRow
                    label="Beneficiary Used Quota"
                    value={formatFilecoin(data.BeneficiaryTerm.UsedQuota)}
                  />
                  <InfoRow
                    label="Beneficiary Expiration"
                    value={String(data.BeneficiaryTerm.Expiration)}
                  />
                </>
              )}
              {data.PendingBeneficiaryTerm && (
                <>
                  <InfoRow
                    label="Pending Beneficiary"
                    value={data.PendingBeneficiaryTerm.NewBeneficiary}
                    mono
                  />
                  <InfoRow
                    label="Pending Quota"
                    value={formatFilecoin(
                      data.PendingBeneficiaryTerm.NewQuota,
                    )}
                  />
                  <InfoRow
                    label="Pending Expiration"
                    value={String(data.PendingBeneficiaryTerm.NewExpiration)}
                  />
                  <InfoRow
                    label="Approved by Beneficiary"
                    value={
                      data.PendingBeneficiaryTerm.ApprovedByBeneficiary
                        ? "Yes"
                        : "No"
                    }
                  />
                  <InfoRow
                    label="Approved by Nominee"
                    value={
                      data.PendingBeneficiaryTerm.ApprovedByNominee
                        ? "Yes"
                        : "No"
                    }
                  />
                </>
              )}
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

      {/* Win Stats Table */}
      {actorWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4" />
              Recent Wins ({actorWins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={winColumns}
              data={actorWins.slice(0, 50)}
              emptyMessage="No wins recorded"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatBucketData(buckets: SectorBuckets) {
  const allMap = new Map<number, SectorBucket>();
  const ccMap = new Map<number, SectorBucket>();

  for (const b of buckets.All ?? []) allMap.set(b.BucketEpoch, b);
  for (const b of buckets.CC ?? []) ccMap.set(b.BucketEpoch, b);

  const allEpochs = new Set([...allMap.keys(), ...ccMap.keys()]);
  return Array.from(allEpochs)
    .sort((a, b) => a - b)
    .map((epoch) => ({
      label: `${allMap.get(epoch)?.Days ?? ccMap.get(epoch)?.Days ?? 0}d`,
      all: allMap.get(epoch)?.Count ?? 0,
      cc: ccMap.get(epoch)?.Count ?? 0,
    }));
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
        else if (d.PartFaulty) color = "bg-[hsl(var(--warning,40_96%_40%))]";
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
