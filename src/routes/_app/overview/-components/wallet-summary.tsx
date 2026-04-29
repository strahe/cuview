import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WalletView } from "@/routes/_app/wallets/-module/types";
import {
  OverviewEmpty,
  OverviewList,
  OverviewSection,
  overviewActionClassName,
} from "./overview-section";

interface WalletSummaryProps {
  data: WalletView[];
  loading: boolean;
}

export function WalletSummary({ data, loading }: WalletSummaryProps) {
  const [stableData, setStableData] = useState(data);

  if ((data.length > 0 || !loading) && data !== stableData) {
    setStableData(data);
  }

  const displayData = loading && stableData.length > 0 ? stableData : data;

  if (loading && stableData.length === 0) {
    return (
      <OverviewSection title="Wallets" icon={Wallet}>
        <OverviewList className="gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </OverviewList>
      </OverviewSection>
    );
  }

  if (!displayData.length) {
    return (
      <OverviewSection title="Wallets" icon={Wallet}>
        <OverviewEmpty>No wallets configured</OverviewEmpty>
      </OverviewSection>
    );
  }

  // Sort by balance descending
  const sorted = [...displayData].sort((a, b) => {
    const balA = getWalletBalanceValue(a);
    const balB = getWalletBalanceValue(b);
    if (balA == null && balB == null) return 0;
    if (balA == null) return 1;
    if (balB == null) return -1;
    return balB - balA;
  });

  return (
    <OverviewSection
      title="Wallets"
      icon={Wallet}
      action={
        <Link to="/wallets" className={overviewActionClassName}>
          View all
        </Link>
      }
    >
      <OverviewList>
        {sorted.slice(0, 6).map((wallet) => {
          const balance = getWalletBalanceValue(wallet);
          const isPendingBalance = balance == null;
          const isLow = balance != null && balance < 1 && balance >= 0;

          return (
            <div
              key={wallet.address}
              className="flex items-center justify-between gap-3 rounded-md bg-background/40 px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-2">
                {isLow && (
                  <div
                    className="size-1.5 shrink-0 rounded-full bg-warning"
                    title="Low balance"
                  />
                )}
                <span className="truncate font-mono text-xs">
                  {wallet.name || truncateAddress(wallet.address)}
                </span>
                {wallet.name && (
                  <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                    {truncateAddress(wallet.address)}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  isLow ? "text-warning" : "text-foreground",
                )}
              >
                {isPendingBalance ? "—" : formatFILCompact(balance)}
              </span>
            </div>
          );
        })}
        {displayData.length > 6 && (
          <p className="text-center text-xs text-muted-foreground">
            +{displayData.length - 6} more
          </p>
        )}
      </OverviewList>
    </OverviewSection>
  );
}

function getWalletBalanceValue(wallet: WalletView): number | null {
  if (wallet.isLoadingBalance || wallet.balance == null) {
    return null;
  }

  const parsed = Number.parseFloat(wallet.balance);
  return Number.isNaN(parsed) ? null : parsed;
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
