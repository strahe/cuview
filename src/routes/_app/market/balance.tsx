import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { formatFilecoin } from "@/utils/filecoin";
import { MoveToEscrowDialog } from "./-components/move-to-escrow-dialog";
import { PieceSummaryCard } from "./-components/piece-summary-card";
import { useMarketBalance, usePieceSummary } from "./-module/queries";
import type { MarketBalanceEntry } from "./-module/types";

export const Route = createFileRoute("/_app/market/balance")({
  component: MarketBalancePage,
});

const columns: ColumnDef<MarketBalanceEntry>[] = [
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.miner}</span>
    ),
  },
  {
    accessorKey: "marketBalance",
    header: "Market Balance",
    cell: ({ row }) => formatFilecoin(row.original.marketBalance),
  },
  {
    id: "wallets",
    header: "Deal Publish Wallets",
    cell: ({ row }) => {
      const wallets = row.original.wallets;
      if (!wallets || wallets.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="space-y-1">
          {wallets.map((w) => (
            <div key={w.address} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-muted-foreground">
                {w.address}
              </span>
              <span>{formatFilecoin(w.balance)}</span>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | { onMoveToEscrow?: (miner: string) => void }
        | undefined;
      return (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground hover:text-primary"
          onClick={() => meta?.onMoveToEscrow?.(row.original.miner)}
          aria-label="Move to Escrow"
          title="Move to Escrow"
        >
          <ArrowRightLeft className="size-3" />
        </Button>
      );
    },
  },
];

function MarketBalancePage() {
  const { data, isLoading } = useMarketBalance();
  const { data: pieceSummary, isLoading: pieceSummaryLoading } =
    usePieceSummary();
  const [escrowMiner, setEscrowMiner] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PieceSummaryCard data={pieceSummary} isLoading={pieceSummaryLoading} />
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        emptyMessage="No market balance data"
        meta={{ onMoveToEscrow: (miner: string) => setEscrowMiner(miner) }}
      />
      <MoveToEscrowDialog
        open={escrowMiner !== null}
        onOpenChange={(open) => {
          if (!open) setEscrowMiner(null);
        }}
        miner={escrowMiner ?? ""}
      />
    </div>
  );
}
