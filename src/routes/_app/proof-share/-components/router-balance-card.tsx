import { useState } from "react";
import { Field, FieldLabel } from "@/components/composed/form";
import { WalletCombobox } from "@/components/composed/form/wallet-combobox-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWalletNames } from "@/routes/_app/wallets/-module/queries";
import {
  usePsRouterAddBalance,
  usePsRouterCancelWithdrawal,
  usePsRouterCompleteWithdrawal,
  usePsRouterRequestWithdrawal,
} from "../-module/queries";

export function RouterBalanceCard() {
  const { data: walletNames } = useWalletNames();
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
          <Field className="w-auto gap-1">
            <FieldLabel
              htmlFor="router-wallet"
              className="text-xs text-muted-foreground"
            >
              Wallet
            </FieldLabel>
            <WalletCombobox
              id="router-wallet"
              placeholder="Select or enter wallet…"
              value={wallet}
              onChange={setWallet}
              className="w-56"
              wallets={walletNames}
            />
          </Field>
          <Field className="w-auto gap-1">
            <FieldLabel className="text-xs text-muted-foreground">
              Amount (FIL)
            </FieldLabel>
            <Input
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 text-xs"
            />
          </Field>
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
