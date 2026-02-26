import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
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

function MoveToEscrowForm() {
  const [miner, setMiner] = useState("");
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");

  const mutation = useCurioRpcMutation("MoveBalanceToEscrow", {
    invalidateKeys: [["curio", "MarketBalance"]],
  });

  const handleSubmit = () => {
    if (!miner || !amount) return;
    mutation.mutate([miner, amount, wallet || undefined]);
    setMiner("");
    setAmount("");
    setWallet("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Move Balance to Escrow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Miner</label>
            <Input
              placeholder="f0..."
              value={miner}
              onChange={(e) => setMiner(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Amount (FIL)
            </label>
            <Input
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Wallet (optional)
            </label>
            <Input
              placeholder="f1... or f3..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-48 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Transfer"}
          </Button>
        </div>
        {mutation.isError && (
          <p className="mt-2 text-xs text-destructive">
            {(mutation.error as Error)?.message ?? "Transfer failed"}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="mt-2 text-xs text-success">Transfer submitted</p>
        )}
      </CardContent>
    </Card>
  );
}

function MarketBalancePage() {
  const { data, isLoading } = useCurioRpc<MarketBalanceEntry[]>(
    "MarketBalance",
    [],
    { refetchInterval: 60_000 },
  );

  return (
    <div className="space-y-4">
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
