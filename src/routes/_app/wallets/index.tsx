import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Edit2, Plus, Trash2, Wallet } from "lucide-react";
import { type MouseEvent, useCallback, useState } from "react";
import { DataTable } from "@/components/table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type {
  BalanceManagerRule,
  PendingMessage,
  PendingMessages,
  WalletInfo,
} from "@/types/wallet";
import { formatFilecoin } from "@/utils/filecoin";
import { formatDateTime } from "@/utils/format";

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
    accessorKey: "message",
    header: "Message CID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.message.slice(0, 20)}…
      </span>
    ),
  },
  {
    accessorKey: "added_at",
    header: "Added",
    cell: ({ row }) => (
      <span className="text-xs">{formatDateTime(row.original.added_at)}</span>
    ),
  },
];

const balanceRuleColumns: ColumnDef<BalanceManagerRule>[] = [
  {
    accessorKey: "subject_address",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.subject_address}</span>
    ),
  },
  {
    accessorKey: "second_address",
    header: "Second Address",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.second_address}</span>
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

  const { data: pendingMsgsData, isLoading: msgsLoading } =
    useCurioRpc<PendingMessages>("PendingMessages", [], {
      refetchInterval: 20_000,
    });
  const pendingMsgs = pendingMsgsData?.messages;

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
  const [renaming, setRenaming] = useState<{
    addr: string;
    name: string;
  } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    subject: "",
    second: "",
    actionType: "requester",
    lowWatermark: "",
    highWatermark: "",
    subjectType: "wallet",
  });
  const [editingRule, setEditingRule] = useState<{
    id: number;
    lowWatermark: string;
    highWatermark: string;
  } | null>(null);
  const [msgCidQuery, setMsgCidQuery] = useState("");
  const [msgCidSearch, setMsgCidSearch] = useState<string | null>(null);

  const { data: messageDetail } = useCurioRpc<{
    from_key: string;
    to_addr: string;
    send_reason: string;
    send_task_id: number;
    unsigned_cid: string;
    signed_cid: string;
    nonce: number;
    send_time: string;
    send_success: boolean;
    send_error: string;
    executed_tsk_epoch: number;
    executed_msg_cid: string;
    executed_rcpt_exitcode: number;
    executed_rcpt_gas_used: number;
    value_str: string;
    fee_str: string;
  }>("MessageByCid", [msgCidSearch!], { enabled: !!msgCidSearch });

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
    setRuleForm({
      subject: "",
      second: "",
      actionType: "requester",
      lowWatermark: "",
      highWatermark: "",
      subjectType: "wallet",
    });
    setShowAddRule(false);
  }, [ruleForm, addRuleMutation]);

  const handleUpdateRule = useCallback(() => {
    if (!editingRule) return;
    updateRuleMutation.mutate([
      editingRule.id,
      editingRule.lowWatermark,
      editingRule.highWatermark,
    ]);
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
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              setRenaming({
                addr: row.original.Address,
                name: row.original.Name || "",
              });
            }}
          >
            <Edit2 className="size-3" />
          </Button>
          {confirmRemove === row.original.Address ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
            onClick={() =>
              setEditingRule({
                id: row.original.id,
                lowWatermark: row.original.low_watermark,
                highWatermark: row.original.high_watermark,
              })
            }
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
            <Button
              size="sm"
              onClick={handleAddWallet}
              disabled={addWalletMutation.isPending}
            >
              {addWalletMutation.isPending ? "Adding..." : "Add"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddWallet(false)}
            >
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddRule(true)}
          >
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="font-mono text-xs text-muted-foreground">
                {renaming.addr}
              </div>
              <Input
                placeholder="Wallet name"
                value={renaming.name}
                onChange={(e) =>
                  setRenaming({ ...renaming, name: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRenaming(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRename}
                disabled={renameWalletMutation.isPending}
              >
                {renameWalletMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Rule Dialog */}
      {showAddRule && (
        <Dialog open onOpenChange={() => setShowAddRule(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Balance Manager Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Subject Address *</label>
                <Input
                  value={ruleForm.subject}
                  onChange={(e) =>
                    setRuleForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="f0... or f1... or f3..."
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Second Address *</label>
                <Input
                  value={ruleForm.second}
                  onChange={(e) =>
                    setRuleForm((f) => ({ ...f, second: e.target.value }))
                  }
                  placeholder="f0... or f1... or f3..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Action Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={ruleForm.actionType}
                    onChange={(e) =>
                      setRuleForm((f) => ({ ...f, actionType: e.target.value }))
                    }
                  >
                    <option value="requester">Requester</option>
                    <option value="active-provider">Active Provider</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={ruleForm.subjectType}
                    onChange={(e) =>
                      setRuleForm((f) => ({
                        ...f,
                        subjectType: e.target.value,
                      }))
                    }
                  >
                    <option value="wallet">Wallet</option>
                    <option value="proofshare">Proof Share</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Low Watermark (FIL)
                  </label>
                  <Input
                    value={ruleForm.lowWatermark}
                    onChange={(e) =>
                      setRuleForm((f) => ({
                        ...f,
                        lowWatermark: e.target.value,
                      }))
                    }
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    High Watermark (FIL)
                  </label>
                  <Input
                    value={ruleForm.highWatermark}
                    onChange={(e) =>
                      setRuleForm((f) => ({
                        ...f,
                        highWatermark: e.target.value,
                      }))
                    }
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddRule(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddRule}
                disabled={
                  addRuleMutation.isPending ||
                  !ruleForm.subject.trim() ||
                  !ruleForm.second.trim()
                }
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
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Rule #{editingRule.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">
                  Low Watermark (FIL)
                </label>
                <Input
                  value={editingRule.lowWatermark}
                  onChange={(e) =>
                    setEditingRule((r) =>
                      r ? { ...r, lowWatermark: e.target.value } : r,
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  High Watermark (FIL)
                </label>
                <Input
                  value={editingRule.highWatermark}
                  onChange={(e) =>
                    setEditingRule((r) =>
                      r ? { ...r, highWatermark: e.target.value } : r,
                    )
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRule}
                disabled={updateRuleMutation.isPending}
              >
                {updateRuleMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Message Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter message CID..."
              value={msgCidQuery}
              onChange={(e) => setMsgCidQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && msgCidQuery.trim())
                  setMsgCidSearch(msgCidQuery.trim());
              }}
              className="max-w-lg font-mono text-xs"
            />
            <Button
              onClick={() => setMsgCidSearch(msgCidQuery.trim())}
              disabled={!msgCidQuery.trim()}
              size="sm"
            >
              Search
            </Button>
          </div>
          {messageDetail && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                  Message Info
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">From</span>
                    <div className="truncate font-mono text-xs">
                      {messageDetail.from_key}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To</span>
                    <div className="truncate font-mono text-xs">
                      {messageDetail.to_addr}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <div className="text-xs">{messageDetail.send_reason}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value</span>
                    <div>{messageDetail.value_str || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nonce</span>
                    <div>{messageDetail.nonce}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fee</span>
                    <div>{messageDetail.fee_str || "—"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                  CIDs
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {messageDetail.signed_cid && (
                    <div>
                      <span className="text-muted-foreground">Signed CID</span>
                      <div className="truncate font-mono text-xs">
                        {messageDetail.signed_cid}
                      </div>
                    </div>
                  )}
                  {messageDetail.unsigned_cid && (
                    <div>
                      <span className="text-muted-foreground">
                        Unsigned CID
                      </span>
                      <div className="truncate font-mono text-xs">
                        {messageDetail.unsigned_cid}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                  Send Status
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Send Time</span>
                    <div className="text-xs">
                      {messageDetail.send_time
                        ? new Date(messageDetail.send_time).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Send Success</span>
                    <div>
                      <Badge
                        variant={
                          messageDetail.send_success ? "default" : "destructive"
                        }
                      >
                        {messageDetail.send_success ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  {messageDetail.send_error && (
                    <div>
                      <span className="text-muted-foreground">Send Error</span>
                      <div className="text-xs text-destructive">
                        {messageDetail.send_error}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                  Execution
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {messageDetail.executed_tsk_epoch > 0 && (
                    <div>
                      <span className="text-muted-foreground">Epoch</span>
                      <div>{messageDetail.executed_tsk_epoch}</div>
                    </div>
                  )}
                  {messageDetail.executed_msg_cid && (
                    <div>
                      <span className="text-muted-foreground">
                        Executed Msg CID
                      </span>
                      <div className="truncate font-mono text-xs">
                        {messageDetail.executed_msg_cid}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Exit Code</span>
                    <div>
                      <Badge
                        variant={
                          messageDetail.executed_rcpt_exitcode === 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {messageDetail.executed_rcpt_exitcode}
                      </Badge>
                    </div>
                  </div>
                  {messageDetail.executed_rcpt_gas_used > 0 && (
                    <div>
                      <span className="text-muted-foreground">Gas Used</span>
                      <div>
                        {messageDetail.executed_rcpt_gas_used.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
