import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePsRouterAddBalance,
  usePsRouterCancelWithdrawal,
  usePsRouterCompleteWithdrawal,
  usePsRouterRequestWithdrawal,
} from "../-module/queries";

export function RouterBalanceCard() {
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");

  const addBalance = usePsRouterAddBalance();
  const requestWithdraw = usePsRouterRequestWithdrawal();
  const cancelWithdraw = usePsRouterCancelWithdrawal();
  const completeWithdraw = usePsRouterCompleteWithdrawal();

  const trimmedWallet = wallet.trim();
  const trimmedAmount = amount.trim();
  const hasWallet = trimmedWallet.length > 0;
  const hasAmount = trimmedAmount.length > 0;
  const isAnyPending =
    addBalance.isPending ||
    requestWithdraw.isPending ||
    cancelWithdraw.isPending ||
    completeWithdraw.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Router Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              Wallet
            </Label>
            <Input
              placeholder="Wallet address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-40 font-mono text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">
              Amount (FIL)
            </Label>
            <Input
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={() => addBalance.mutate([trimmedWallet, trimmedAmount])}
            disabled={!hasWallet || !hasAmount || isAnyPending}
          >
            Add Balance
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              requestWithdraw.mutate([trimmedWallet, trimmedAmount])
            }
            disabled={!hasWallet || !hasAmount || isAnyPending}
          >
            Request Withdraw
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => cancelWithdraw.mutate([trimmedWallet])}
            disabled={!hasWallet || isAnyPending}
          >
            Cancel Withdraw
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => completeWithdraw.mutate([trimmedWallet])}
            disabled={!hasWallet || isAnyPending}
          >
            Complete Withdraw
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
