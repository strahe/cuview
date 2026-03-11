import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMoveToEscrow } from "../-module/queries";

export function MoveToEscrowForm() {
  const [miner, setMiner] = useState("");
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");

  const mutation = useMoveToEscrow();

  const handleSubmit = () => {
    if (!miner || !amount) return;
    mutation.mutate([miner, amount, wallet || undefined], {
      onSuccess: () => {
        setMiner("");
        setAmount("");
        setWallet("");
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Move Balance to Escrow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Miner</label>
            <Input
              placeholder="f0..."
              value={miner}
              onChange={(e) => setMiner(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
