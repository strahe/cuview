import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionCard } from "@/components/composed/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WalletInfo } from "@/types/wallet";

interface WalletSummaryProps {
  data: WalletInfo[];
  loading: boolean;
}

export function WalletSummary({ data, loading }: WalletSummaryProps) {
  const [stableData, setStableData] = useState<WalletInfo[]>(data);

  useEffect(() => {
    if (data.length > 0 || !loading) {
      setStableData(data);
    }
  }, [data, loading]);

  const displayData = loading && stableData.length > 0 ? stableData : data;

  if (loading && stableData.length === 0) {
    return (
      <SectionCard title="Wallets" icon={Wallet}>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!displayData.length) {
    return (
      <SectionCard title="Wallets" icon={Wallet}>
        <p className="text-sm text-muted-foreground">No wallets configured</p>
      </SectionCard>
    );
  }

  // Sort by balance descending
  const sorted = [...displayData].sort((a, b) => {
    const balA = Number.parseFloat(a.Balance || "0");
    const balB = Number.parseFloat(b.Balance || "0");
    return balB - balA;
  });

  return (
    <SectionCard
      title="Wallets"
      icon={Wallet}
      action={
        <Link
          to="/wallets"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View all →
        </Link>
      }
    >
      <div className="space-y-1.5">
        {sorted.slice(0, 6).map((wallet) => {
          const balance = Number.parseFloat(wallet.Balance || "0");
          const isLow = balance < 1 && balance >= 0;

          return (
            <div
              key={wallet.Address}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isLow && (
                  <div
                    className="size-1.5 shrink-0 rounded-full bg-warning"
                    title="Low balance"
                  />
                )}
                <span className="truncate font-mono text-xs">
                  {wallet.Name || truncateAddress(wallet.Address)}
                </span>
                {wallet.Name && (
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                    {truncateAddress(wallet.Address)}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  isLow ? "text-warning" : "text-foreground",
                )}
              >
                {formatFILCompact(balance)}
              </span>
            </div>
          );
        })}
        {displayData.length > 6 && (
          <p className="text-center text-xs text-muted-foreground">
            +{displayData.length - 6} more
          </p>
        )}
      </div>
    </SectionCard>
  );
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatFILCompact(num: number): string {
  if (Number.isNaN(num) || num === 0) return "0 FIL";
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K FIL`;
  if (num >= 1) return `${num.toFixed(2)} FIL`;
  if (num >= 0.001) return `${num.toFixed(4)} FIL`;
  return `${(num * 1000).toFixed(4)} mFIL`;
}
