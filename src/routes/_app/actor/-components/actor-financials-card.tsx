import { Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActorDetail } from "@/types/actor";
import { formatFilecoin } from "@/utils/filecoin";

export function ActorFinancialsCard({ data }: { data: ActorDetail }) {
  const summary = data.Summary;

  return (
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
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
