import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { WalletInfo, PendingMessage, BalanceManagerRule } from "@/types/wallet";
import type { ColumnDef } from "@tanstack/react-table";
import { formatFilecoin } from "@/utils/filecoin";
import { Wallet, Plus, Trash2, Edit2, Check } from "lucide-react";
import { useState, useCallback } from "react";

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

  // Wallet CRUD mutations
  const addWalletMutation = useCurioRpcMutation("WalletAdd", {
    invalidateKeys: [["curio", "Wallets"]],
  });
  const removeWalletMutation = useCurioRpcMutation("WalletRemove", {
    invalidateKeys: [["curio", "Wallets"]],
  });
  const renameWalletMutation = useCurioRpcMutation("WalletNameChange", {
    invalidateKeys: [["curio", "Wallets"]],
  });

  // Balance rule CRUD mutations
  const removeRuleMutation = useCurioRpcMutation("BalanceMgrRuleRemove", {
    invalidateKeys: [["curio", "BalanceMgrRules"]],
  });
  const addRuleMutation = useCurioRpcMutation("BalanceMgrRuleAdd", {
    invalidateKeys: [["curio", "BalanceMgrRules"]],
  });
  const updateRuleMutation = useCurioRpcMutation("BalanceMgrRuleUpdate", {
    invalidateKeys: [["curio", "BalanceMgrRules"]],
  });

  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddr, setNewWalletAddr] = useState("");
  const [renaming, setRenaming] = useState<{ addr: string; name: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({ subject: "", second: "", actionType: "requester", lowWatermark: "", highWatermark: "", subjectType: "wallet" });
  const [editingRule, setEditingRule] = useState<{ id: number; lowWatermark: string; highWatermark: string } | null>(null);

  const handleAddWallet = useCallback(() => {
    if (!newWalletAddr.trim()) return;
    addWalletMutation.mutate([newWalletAddr.trim()]);
    setNewWalletAddr("");
    setShowAddWallet(false);
  }, [newWalletAddr, addWalletMutation]);

  const handleRename = useCallback(() => {
    if (!renaming) return;
    renameWalletMutation.mutate([renaming.addr, renaming.name]);
    setRenaming(null);
  }, [renaming, renameWalletMutation]);

  const handleAddRule = useCallback(() => {
    if (!ruleForm.subject.trim() || !ruleForm.second.trim()) return;
    addRuleMutation.mutate([
      ruleForm.subject.trim(),
      ruleForm.second.trim(),
      ruleForm.actionType,
      ruleForm.lowWatermark.trim(),
      ruleForm.highWatermark.trim(),
      ruleForm.subjectType,
    ]);
    setRuleForm({ subject: "", second: "", actionType: "requester", lowWatermark: "", highWatermark: "", subjectType: "wallet" });
    setShowAddRule(false);
  }, [ruleForm, addRuleMutation]);

  const handleUpdateRule = useCallback(() => {
    if (!editingRule) return;
    updateRuleMutation.mutate([editingRule.id, editingRule.lowWatermark, editingRule.highWatermark]);
    setEditingRule(null);
  }, [editingRule, updateRuleMutation]);

  // Enhanced wallet columns with actions
  const walletColumnsWithActions: ColumnDef<WalletInfo>[] = [
    ...walletColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setRenaming({ addr: row.original.Address, name: row.original.Name || "" });
            }}
          >
            <Edit2 className="size-3" />
          </Button>
          {confirmRemove === row.original.Address ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWalletMutation.mutate([row.original.Address]);
                  setConfirmRemove(null);
                }}
              >
                <Check className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmRemove(null);
                }}
              >
                ×
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmRemove(row.original.Address);
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Balance rule columns with edit/delete actions
  const ruleColumnsWithActions: ColumnDef<BalanceManagerRule>[] = [
    ...balanceRuleColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingRule({
              id: row.original.id,
              lowWatermark: row.original.low_watermark,
              highWatermark: row.original.high_watermark,
            })}
          >
            <Edit2 className="size-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeRuleMutation.mutate([row.original.id])}
            disabled={removeRuleMutation.isPending}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="size-5" />
          <h1 className="text-2xl font-bold tracking-tight">Wallets</h1>
        </div>
        <Button size="sm" onClick={() => setShowAddWallet(true)}>
          <Plus className="mr-1 size-4" /> Add Wallet
        </Button>
      </div>

      {/* Add Wallet Form */}
      {showAddWallet && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Input
              placeholder="Wallet address (f1... or f3...)"
              value={newWalletAddr}
              onChange={(e) => setNewWalletAddr(e.target.value)}
              className="max-w-md font-mono text-xs"
            />
            <Button size="sm" onClick={handleAddWallet} disabled={addWalletMutation.isPending}>
              {addWalletMutation.isPending ? "Adding..." : "Add"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddWallet(false)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Wallet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={walletColumnsWithActions}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance Manager Rules</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddRule(true)}>
            <Plus className="mr-1 size-4" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={ruleColumnsWithActions}
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

      {/* Rename Dialog */}
      {renaming && (
        <Dialog open onOpenChange={() => setRenaming(null)}>
          <DialogContent onClose={() => setRenaming(null)}>
            <DialogHeader>
              <DialogTitle>Rename Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                {renaming.addr}
              </div>
              <Input
                placeholder="Wallet name"
                value={renaming.name}
                onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleRename} disabled={renameWalletMutation.isPending}>
                {renameWalletMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Rule Dialog */}
      {showAddRule && (
        <Dialog open onOpenChange={() => setShowAddRule(false)}>
          <DialogContent className="max-w-md" onClose={() => setShowAddRule(false)}>
            <DialogHeader>
              <DialogTitle>Add Balance Manager Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Subject Address *</label>
                <Input
                  value={ruleForm.subject}
                  onChange={(e) => setRuleForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="f0... or f1... or f3..."
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Second Address *</label>
                <Input
                  value={ruleForm.second}
                  onChange={(e) => setRuleForm((f) => ({ ...f, second: e.target.value }))}
                  placeholder="f0... or f1... or f3..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Action Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm"
                    value={ruleForm.actionType}
                    onChange={(e) => setRuleForm((f) => ({ ...f, actionType: e.target.value }))}
                  >
                    <option value="requester">Requester</option>
                    <option value="active-provider">Active Provider</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm"
                    value={ruleForm.subjectType}
                    onChange={(e) => setRuleForm((f) => ({ ...f, subjectType: e.target.value }))}
                  >
                    <option value="wallet">Wallet</option>
                    <option value="proofshare">Proof Share</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Low Watermark (FIL)</label>
                  <Input
                    value={ruleForm.lowWatermark}
                    onChange={(e) => setRuleForm((f) => ({ ...f, lowWatermark: e.target.value }))}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">High Watermark (FIL)</label>
                  <Input
                    value={ruleForm.highWatermark}
                    onChange={(e) => setRuleForm((f) => ({ ...f, highWatermark: e.target.value }))}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddRule(false)}>Cancel</Button>
              <Button
                onClick={handleAddRule}
                disabled={addRuleMutation.isPending || !ruleForm.subject.trim() || !ruleForm.second.trim()}
              >
                {addRuleMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Rule Dialog */}
      {editingRule && (
        <Dialog open onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-sm" onClose={() => setEditingRule(null)}>
            <DialogHeader>
              <DialogTitle>Edit Rule #{editingRule.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Low Watermark (FIL)</label>
                <Input
                  value={editingRule.lowWatermark}
                  onChange={(e) => setEditingRule((r) => r ? { ...r, lowWatermark: e.target.value } : r)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">High Watermark (FIL)</label>
                <Input
                  value={editingRule.highWatermark}
                  onChange={(e) => setEditingRule((r) => r ? { ...r, highWatermark: e.target.value } : r)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRule(null)}>Cancel</Button>
              <Button onClick={handleUpdateRule} disabled={updateRuleMutation.isPending}>
                {updateRuleMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
