import { createFileRoute } from "@tanstack/react-router";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import type { StorageAsk } from "@/types/market";
import type { ColumnDef } from "@tanstack/react-table";
import { formatFilecoin } from "@/utils/filecoin";
import { formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_app/market/asks")({
  component: MarketAsksPage,
});

const columns: ColumnDef<StorageAsk>[] = [
  {
    accessorKey: "Miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.Miner}</span>
    ),
  },
  {
    accessorKey: "Price",
    header: "Price",
    cell: ({ row }) => formatFilecoin(String(row.original.Price)),
  },
  {
    accessorKey: "VerifiedPrice",
    header: "Verified Price",
    cell: ({ row }) => formatFilecoin(String(row.original.VerifiedPrice)),
  },
  {
    accessorKey: "MinSize",
    header: "Min Size",
    cell: ({ row }) => formatBytes(row.original.MinSize),
  },
  {
    accessorKey: "MaxSize",
    header: "Max Size",
    cell: ({ row }) => formatBytes(row.original.MaxSize),
  },
  {
    accessorKey: "Sequence",
    header: "Sequence",
  },
];

function MarketAsksPage() {
  const { data, isLoading } = useCurioRpc<StorageAsk[]>(
    "StorageStoreTypeStats",
    [],
    { refetchInterval: 60_000 },
  );

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      loading={isLoading}
      emptyMessage="No storage asks"
    />
  );
}
