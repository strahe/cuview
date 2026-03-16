import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WalletView } from "../-module/types";

export const walletColumns: ColumnDef<WalletView>[] = [
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.address}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name || "—"}</span>
    ),
  },
  {
    id: "idAddress",
    header: "ID Address",
    cell: ({ row }) =>
      row.original.idAddress ? (
        <span className="font-mono text-xs">{row.original.idAddress}</span>
      ) : row.original.isLoadingBalance ? (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "balance",
    header: "Balance",
    cell: ({ row }) => {
      if (row.original.balanceError) {
        return <span className="text-xs text-destructive">Error</span>;
      }
      if (row.original.isLoadingBalance) {
        return (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        );
      }
      return <span className="text-xs">{row.original.balance ?? "—"}</span>;
    },
  },
  {
    id: "pendingMessages",
    header: "Pending Msgs",
    cell: ({ row }) => {
      const count = row.original.pendingMessages;
      if (count == null) return "—";
      if (count > 0) {
        return <Badge variant="outline">{count}</Badge>;
      }
      return <span className="text-xs text-muted-foreground">0</span>;
    },
  },
];
