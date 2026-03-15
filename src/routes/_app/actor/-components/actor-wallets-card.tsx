import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WalletInfo } from "@/types/actor";
import { formatFilecoin } from "@/utils/filecoin";
import { CopyButton } from "./copy-button";
import { TruncatedValue } from "./truncated-value";

export function ActorWalletsCard({ wallets }: { wallets: WalletInfo[] }) {
  if (!wallets?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-4" />
          Wallets ({wallets.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {wallets.map((w) => (
            <div
              key={w.Address}
              className="flex items-center justify-between border-b border-border pb-2 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2 pr-4">
                <Badge variant="outline" className="shrink-0">
                  {w.Type}
                </Badge>
                <TruncatedValue value={w.Address} className="min-w-0 flex-1" />
                <CopyButton value={w.Address} className="shrink-0" />
              </div>
              <span className="shrink-0 text-sm">
                {formatFilecoin(w.Balance)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
