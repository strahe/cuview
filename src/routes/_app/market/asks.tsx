import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import type { StorageAskTableEntry } from "@/types/market";
import { formatBytes } from "@/utils/format";
import { attoFilToFilPerTiBPerMonth } from "@/utils/market";
import { SetAskDialog } from "./-components/set-ask-dialog";
import { useStorageAsks } from "./-module/queries";

export const Route = createFileRoute("/_app/market/asks")({
  component: MarketAsksPage,
});

function formatPrice(value: number | undefined) {
  if (value == null) return "—";
  return `${attoFilToFilPerTiBPerMonth(value)} FIL/TiB/Month`;
}

function formatTimestamp(ts: number | undefined) {
  if (ts == null) return "—";
  return new Date(ts * 1000).toLocaleString();
}

const columns: ColumnDef<StorageAskTableEntry>[] = [
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
    cell: ({ row }) =>
      row.original.hasAsk ? (
        formatPrice(row.original.Price)
      ) : (
        <span className="text-xs text-muted-foreground">Not Set</span>
      ),
  },
  {
    accessorKey: "VerifiedPrice",
    header: "Verified Price",
    cell: ({ row }) =>
      row.original.hasAsk ? (
        formatPrice(row.original.VerifiedPrice)
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "MinSize",
    header: "Min Size",
    cell: ({ row }) =>
      row.original.hasAsk && row.original.MinSize != null ? (
        formatBytes(row.original.MinSize)
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "MaxSize",
    header: "Max Size",
    cell: ({ row }) =>
      row.original.hasAsk && row.original.MaxSize != null ? (
        formatBytes(row.original.MaxSize)
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "CreatedAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-xs">{formatTimestamp(row.original.CreatedAt)}</span>
    ),
  },
  {
    accessorKey: "Expiry",
    header: "Expiry",
    cell: ({ row }) => (
      <span className="text-xs">{formatTimestamp(row.original.Expiry)}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | { onEditAsk?: (entry: StorageAskTableEntry) => void }
        | undefined;
      const isActionDisabled = row.original.SpID === null;
      return (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground hover:text-primary"
          disabled={isActionDisabled}
          onClick={() => meta?.onEditAsk?.(row.original)}
          aria-label={
            isActionDisabled
              ? "Set Ask unavailable for invalid actor address"
              : row.original.hasAsk
                ? "Edit Ask"
                : "Set Ask"
          }
          title={
            isActionDisabled
              ? "Set Ask unavailable for invalid actor address"
              : row.original.hasAsk
                ? "Edit Ask"
                : "Set Ask"
          }
        >
          <Edit2 className="size-3" />
        </Button>
      );
    },
  },
];

function MarketAsksPage() {
  const { data, isLoading } = useStorageAsks();
  const [editEntry, setEditEntry] = useState<StorageAskTableEntry | null>(null);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data ?? []}
        loading={isLoading}
        emptyMessage="No storage providers found"
        meta={{
          onEditAsk: (entry: StorageAskTableEntry) => setEditEntry(entry),
        }}
      />
      <SetAskDialog
        key={editEntry?.id}
        open={editEntry !== null}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null);
        }}
        entry={editEntry}
      />
    </div>
  );
}
