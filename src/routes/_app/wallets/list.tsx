import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { SectionCard } from "@/components/composed/section-card";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { AddWalletDialog } from "./-components/add-wallet-dialog";
import { RenameWalletDialog } from "./-components/rename-wallet-dialog";
import { walletColumns } from "./-components/wallet-columns";
import { computeWalletStats } from "./-module/adapters";
import { useRemoveWallet, useWalletList } from "./-module/queries";
import type { WalletView } from "./-module/types";

export const Route = createFileRoute("/_app/wallets/list")({
  component: WalletListPage,
});

interface RenamingWallet {
  address: string;
  currentName: string;
}

export function WalletListPage() {
  const walletQuery = useWalletList();
  const removeWallet = useRemoveWallet();
  const [addingWallet, setAddingWallet] = useState(false);
  const [renamingWallet, setRenamingWallet] = useState<RenamingWallet | null>(
    null,
  );

  const wallets = walletQuery.data ?? [];
  const stats = useMemo(() => computeWalletStats(wallets), [wallets]);

  const columns = useMemo<ColumnDef<WalletView>[]>(
    () => [
      ...walletColumns,
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Rename wallet"
              onClick={() =>
                setRenamingWallet({
                  address: row.original.address,
                  currentName: row.original.name,
                })
              }
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              title="Remove wallet"
              disabled={removeWallet.isPending}
              onClick={() => removeWallet.mutate([row.original.address])}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [removeWallet],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KPICard label="Total Wallets" value={stats.totalWallets} />
        <KPICard
          label="Wallets with Balance"
          value={stats.walletsWithBalance}
        />
        <KPICard label="Pending Messages" value={stats.totalPendingMessages} />
      </div>

      <SectionCard
        title="Wallet Directory"
        action={
          <Button size="sm" onClick={() => setAddingWallet(true)}>
            <Plus className="mr-1 size-4" />
            Add Wallet
          </Button>
        }
      >
        {walletQuery.isError ? (
          <p className="text-sm text-destructive">
            {(walletQuery.error as Error)?.message ??
              "Failed to load wallet list."}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={wallets}
            loading={walletQuery.isLoading}
            searchable
            emptyMessage="No wallets found."
          />
        )}
      </SectionCard>

      <AddWalletDialog open={addingWallet} onOpenChange={setAddingWallet} />
      {renamingWallet ? (
        <RenameWalletDialog
          open
          address={renamingWallet.address}
          currentName={renamingWallet.currentName}
          onOpenChange={(open) => {
            if (!open) {
              setRenamingWallet(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
