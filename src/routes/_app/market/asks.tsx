import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import type { StorageAsk } from "@/types/market";
import { formatFilecoin } from "@/utils/filecoin";
import { formatBytes } from "@/utils/format";
import { SetAskForm } from "./-components/set-ask-form";
import { useStorageAsks } from "./-module/queries";

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
  const { data, isLoading } = useStorageAsks();

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        emptyMessage="No storage asks"
      />
      <SetAskForm currentAsk={data?.[0]} />
    </div>
  );
}
