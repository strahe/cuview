import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Field, FieldLabel } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatFilecoin } from "@/utils/filecoin";
import { usePsClientAddWallet } from "../-module/queries";
import type { PsClientWallet } from "../-module/types";

interface ClientWalletsCardProps {
  wallets: PsClientWallet[];
  loading: boolean;
}

export function ClientWalletsCard({
  wallets,
  loading,
}: ClientWalletsCardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const addMutation = usePsClientAddWallet();

  const handleAdd = useCallback(() => {
    const wallet = newWallet.trim();

    if (!wallet) return;

    addMutation.mutate([wallet], {
      onSuccess: () => {
        setShowAdd(false);
        setNewWallet("");
      },
    });
  }, [newWallet, addMutation]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Wallets</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus data-icon="inline-start" /> Add Wallet
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : wallets.length > 0 ? (
            <div className="space-y-2">
              {wallets.map((w) => (
                <div
                  key={w.wallet}
                  className="flex flex-col gap-1 rounded border border-border p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{w.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Chain: {formatFilecoin(w.chain_balance)}</span>
                    <span>
                      Available: {formatFilecoin(w.available_balance)}
                    </span>
                    <span>
                      Router Avail: {formatFilecoin(w.router_avail_balance)}
                    </span>
                    <span>
                      Router Unsettled:{" "}
                      {formatFilecoin(w.router_unsettled_balance)}
                    </span>
                    <span>
                      Unlocked: {formatFilecoin(w.router_unlocked_balance)}
                    </span>
                    {w.withdraw_timestamp && (
                      <span>Withdraw At: {w.withdraw_timestamp}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="border-0 py-4">
              <EmptyHeader>
                <EmptyTitle>No wallets configured</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Wallet</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel>Wallet Address *</FieldLabel>
            <Input
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              placeholder="Wallet address"
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !newWallet.trim()}
            >
              {addMutation.isPending && (
                <Spinner data-icon="inline-start" className="size-3" />
              )}
              {addMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
