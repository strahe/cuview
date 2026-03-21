import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PsPaymentSummary } from "../-module/types";

interface PaymentSummaryCardProps {
  payments: PsPaymentSummary[];
}

export function PaymentSummaryCard({ payments }: PaymentSummaryCardProps) {
  if (payments.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {payments.map((p) => (
            <div
              key={p.wallet_id}
              className="flex flex-col gap-1 rounded border border-border p-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{p.address}</span>
                <span className="text-xs text-muted-foreground">
                  Nonce: {p.last_payment_nonce}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {p.unsettled_amount_fil && (
                  <span>Unsettled: {p.unsettled_amount_fil}</span>
                )}
                {p.last_settled_amount_fil && (
                  <span>Last Settled: {p.last_settled_amount_fil}</span>
                )}
                {p.time_since_last_settlement && (
                  <span>Since Settlement: {p.time_since_last_settlement}</span>
                )}
                {p.last_settled_at && (
                  <span>Settled At: {p.last_settled_at}</span>
                )}
                {p.contract_settled_fil && (
                  <span>Contract Settled: {p.contract_settled_fil}</span>
                )}
                {p.contract_last_nonce !== undefined && (
                  <span>Contract Nonce: {p.contract_last_nonce}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
