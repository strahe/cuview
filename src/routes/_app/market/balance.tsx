import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { formatFilecoin } from "@/utils/filecoin";
import { MoveToEscrowForm } from "./-components/move-to-escrow-form";
import { PieceSummaryCard } from "./-components/piece-summary-card";
import { useMarketBalance, usePieceSummary } from "./-module/queries";
import type { MarketBalanceEntry } from "./-module/types";

export const Route = createFileRoute("/_app/market/balance")({
  component: MarketBalancePage,
});

const columns: ColumnDef<MarketBalanceEntry>[] = [
  {
    accessorKey: "Miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.Miner}</span>
    ),
  },
  {
    accessorKey: "Balance",
    header: "Balance",
    cell: ({ row }) => formatFilecoin(row.original.Balance),
  },
  {
    accessorKey: "Available",
    header: "Available",
    cell: ({ row }) => formatFilecoin(row.original.Available),
  },
  {
    accessorKey: "Locked",
    header: "Locked",
    cell: ({ row }) => formatFilecoin(row.original.Locked),
  },
];

function MarketBalancePage() {
  const { data, isLoading } = useMarketBalance();
  const { data: pieceSummary, isLoading: pieceSummaryLoading } =
    usePieceSummary();

  return (
    <div className="space-y-4">
      <PieceSummaryCard data={pieceSummary} isLoading={pieceSummaryLoading} />
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        emptyMessage="No market balance data"
      />
      <MoveToEscrowForm />
    </div>
  );
}
