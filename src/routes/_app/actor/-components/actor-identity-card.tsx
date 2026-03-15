import { Globe, IdCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActorDetail } from "@/types/actor";
import { formatFilecoin } from "@/utils/filecoin";
import { CopyButton } from "./copy-button";
import { TruncatedValue } from "./truncated-value";

export function ActorIdentityCard({ data }: { data: ActorDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="size-4" />
          Identity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <AddressRow label="Owner" value={data.OwnerAddress} />
          <AddressRow label="Beneficiary" value={data.Beneficiary} />
          <AddressRow label="Worker" value={data.WorkerAddress} />
          <InfoRow
            label="Worker Balance"
            value={formatFilecoin(data.WorkerBalance)}
          />
          <AddressRow label="Peer ID" value={data.PeerID} />
          <InfoRow
            label="Config Layers"
            value={data.Summary.CLayers?.join(", ") || "—"}
          />
          {data.Address && data.Address.length > 0 && (
            <div className="border-t border-border pt-2">
              <dt className="mb-1 flex items-center gap-1 text-muted-foreground">
                <Globe className="size-3" />
                Network Addresses
              </dt>
              <dd className="space-y-1">
                {data.Address.map((addr) => (
                  <div key={addr} className="flex min-w-0 items-center gap-1">
                    <TruncatedValue value={addr} className="min-w-0 flex-1" />
                    <CopyButton value={addr} />
                  </div>
                ))}
              </dd>
            </div>
          )}
          {data.PendingOwnerAddress && (
            <PendingRow
              label="Pending Owner"
              value={data.PendingOwnerAddress}
            />
          )}
          {data.BeneficiaryTerm && (
            <div className="border-t border-border pt-2">
              <dt className="mb-1 text-muted-foreground">Beneficiary Term</dt>
              <dd className="space-y-1 pl-2 text-xs">
                <InfoRow
                  label="Quota"
                  value={formatFilecoin(data.BeneficiaryTerm.Quota)}
                />
                <InfoRow
                  label="Used Quota"
                  value={formatFilecoin(data.BeneficiaryTerm.UsedQuota)}
                />
                <InfoRow
                  label="Expiration"
                  value={String(data.BeneficiaryTerm.Expiration)}
                />
              </dd>
            </div>
          )}
          {data.PendingBeneficiaryTerm && (
            <div className="border-t border-border pt-2">
              <dt className="mb-1 text-muted-foreground">
                Pending Beneficiary Change
              </dt>
              <dd className="space-y-1 pl-2 text-xs">
                <AddressRow
                  label="New Beneficiary"
                  value={data.PendingBeneficiaryTerm.NewBeneficiary}
                />
                <InfoRow
                  label="New Quota"
                  value={formatFilecoin(data.PendingBeneficiaryTerm.NewQuota)}
                />
                <InfoRow
                  label="New Expiration"
                  value={String(data.PendingBeneficiaryTerm.NewExpiration)}
                />
                <div className="flex gap-2">
                  <Badge
                    variant={
                      data.PendingBeneficiaryTerm.ApprovedByBeneficiary
                        ? "default"
                        : "outline"
                    }
                  >
                    {data.PendingBeneficiaryTerm.ApprovedByBeneficiary
                      ? "✓ Beneficiary Approved"
                      : "⏳ Beneficiary Pending"}
                  </Badge>
                  <Badge
                    variant={
                      data.PendingBeneficiaryTerm.ApprovedByNominee
                        ? "default"
                        : "outline"
                    }
                  >
                    {data.PendingBeneficiaryTerm.ApprovedByNominee
                      ? "✓ Nominee Approved"
                      : "⏳ Nominee Pending"}
                  </Badge>
                </div>
              </dd>
            </div>
          )}
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

function AddressRow({ label, value }: { label: string; value: string }) {
  if (!value) {
    return <InfoRow label={label} value="—" />;
  }
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1">
        <TruncatedValue value={value} />
        <CopyButton value={value} />
      </dd>
    </div>
  );
}

function PendingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="flex items-center gap-1 text-warning">⏳ {label}</dt>
      <dd className="flex items-center gap-1">
        <TruncatedValue value={value} />
        <CopyButton value={value} />
      </dd>
    </div>
  );
}
