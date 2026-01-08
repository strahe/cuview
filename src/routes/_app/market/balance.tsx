import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatFilecoin } from "@/utils/filecoin";

export const Route = createFileRoute("/_app/market/balance")({
  component: MarketBalancePage,
});

interface MarketBalanceEntry {
  Miner: string;
  Balance: string;
  Available: string;
  Locked: string;
}

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
  const { data, isLoading } = useCurioRpc<MarketBalanceEntry[]>(
    "MarketBalance",
    [],
    { refetchInterval: 60_000 },
  );

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      loading={isLoading}
      emptyMessage="No market balance data"
    />
  );
}
