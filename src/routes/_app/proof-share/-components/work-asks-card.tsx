import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePsAskWithdraw } from "../-module/queries";
import type { PsWorkAsk } from "../-module/types";

interface WorkAsksCardProps {
  asks: PsWorkAsk[];
}

export function WorkAsksCard({ asks }: WorkAsksCardProps) {
  const withdrawMutation = usePsAskWithdraw();

  if (asks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Asks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {asks.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded border border-border p-2 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs">#{a.id}</span>
                <span>Min Price: {a.min_price_fil}</span>
                <span className="text-xs text-muted-foreground">
                  {a.created_at}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => withdrawMutation.mutate([a.id])}
                disabled={withdrawMutation.isPending}
              >
                Withdraw
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
