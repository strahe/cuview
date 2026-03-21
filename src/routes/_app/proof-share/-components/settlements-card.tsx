import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePsProviderSettle } from "../-module/queries";
import type { PsSettlement } from "../-module/types";

interface SettlementsCardProps {
  settlements: PsSettlement[];
}

export function SettlementsCard({ settlements }: SettlementsCardProps) {
  const settleMutation = usePsProviderSettle();

  if (settlements.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {settlements.map((s) => (
            <div
              key={`${s.provider_id}-${s.payment_nonce}`}
              className="flex items-center justify-between rounded border border-border p-2 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-xs">{s.address}</span>
                <span className="text-xs text-muted-foreground">
                  Nonce: {s.payment_nonce} | CID:{" "}
                  {s.settle_message_cid.slice(0, 16)}...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {s.amount_for_this_settlement_fil}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.settled_at}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => settleMutation.mutate([s.provider_id])}
                  disabled={settleMutation.isPending}
                >
                  Settle
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
