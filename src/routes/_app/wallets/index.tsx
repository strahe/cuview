import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WalletInfo, PendingMessage, BalanceManagerRule } from "@/types/wallet";
import type { ColumnDef } from "@tanstack/react-table";
import { formatFilecoin } from "@/utils/filecoin";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/wallets/")({
  component: WalletsPage,
});

const walletColumns: ColumnDef<WalletInfo>[] = [
  {
    accessorKey: "Address",
    header: "Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.Address}</span>
    ),
  },
  {
    accessorKey: "Name",
    header: "Name",
  },
  {
    accessorKey: "Type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.Type}</Badge>,
  },
  {
    accessorKey: "Balance",
    header: "Balance",
    cell: ({ row }) => formatFilecoin(row.original.Balance),
  },
];

const pendingMsgColumns: ColumnDef<PendingMessage>[] = [
  {
    accessorKey: "Cid",
    header: "CID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.Cid.slice(0, 12)}…</span>
    ),
  },
  {
    accessorKey: "From",
    header: "From",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.From}</span>
    ),
  },
  {
    accessorKey: "To",
    header: "To",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.To}</span>
    ),
  },
  { accessorKey: "Method", header: "Method" },
  {
    accessorKey: "Value",
    header: "Value",
    cell: ({ row }) => formatFilecoin(row.original.Value),
  },
  {
    accessorKey: "State",
    header: "State",
    cell: ({ row }) => {
      const s = row.original.State;
      return (
        <Badge
          variant={
            s === "confirmed"
              ? "default"
              : s === "failed"
                ? "destructive"
                : "outline"
          }
        >
          {s}
        </Badge>
      );
    },
  },
];

const balanceRuleColumns: ColumnDef<BalanceManagerRule>[] = [
  { accessorKey: "id", header: "ID" },
  {
    accessorKey: "subject_address",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.subject_address}
      </span>
    ),
  },
  {
    accessorKey: "second_address",
    header: "Second Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.second_address}
      </span>
    ),
  },
  { accessorKey: "action_type", header: "Action" },
  { accessorKey: "subject_type", header: "Type" },
  {
    accessorKey: "low_watermark",
    header: "Low Mark",
    cell: ({ row }) => formatFilecoin(row.original.low_watermark),
  },
  {
    accessorKey: "high_watermark",
    header: "High Mark",
    cell: ({ row }) => formatFilecoin(row.original.high_watermark),
  },
];

function WalletsPage() {
  usePageTitle("Wallets");

  const { data: wallets, isLoading: walletsLoading } = useCurioRpc<
    WalletInfo[]
  >("Wallets", [], { refetchInterval: 30_000 });

  const { data: pendingMsgs, isLoading: msgsLoading } = useCurioRpc<
    PendingMessage[]
  >("PendingMessages", [], { refetchInterval: 20_000 });

  const { data: rules, isLoading: rulesLoading } = useCurioRpc<
    BalanceManagerRule[]
  >("BalanceMgrRules", [], { refetchInterval: 60_000 });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Wallet className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">Wallets</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={walletColumns}
            data={wallets ?? []}
            loading={walletsLoading}
            searchable
            searchPlaceholder="Search wallets..."
            searchColumn="Address"
            emptyMessage="No wallets found"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balance Manager Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={balanceRuleColumns}
            data={rules ?? []}
            loading={rulesLoading}
            emptyMessage="No balance manager rules"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={pendingMsgColumns}
            data={pendingMsgs ?? []}
            loading={msgsLoading}
            emptyMessage="No pending messages"
          />
        </CardContent>
      </Card>
    </div>
  );
}
