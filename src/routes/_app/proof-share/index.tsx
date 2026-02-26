import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Settings, Shield, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { KPICard } from "@/components/composed/kpi-card";
import { StatusBadge } from "@/components/composed/status-badge";
import { DataTable } from "@/components/table/data-table";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";

export const Route = createFileRoute("/_app/proof-share/")({
  component: ProofSharePage,
});

interface PSMeta {
  enabled: boolean;
  wallet: { Valid: boolean; String: string } | null;
  request_task_id: { Valid: boolean; Int64: number } | null;
  price: string;
}

interface PSQueueItem {
  service_id: string;
  obtained_at: string;
  compute_task_id: { Valid: boolean; Int64: number } | null;
  compute_done: boolean;
  submit_task_id: { Valid: boolean; Int64: number } | null;
  submit_done: boolean;
  was_pow: boolean;
  payment_amount: string;
}

interface PSClientSettings {
  sp_id: number;
  enabled: boolean;
  wallet: { Valid: boolean; String: string } | null;
  minimum_pending_seconds: number;
  do_porep: boolean;
  do_snap: boolean;
  address: string;
  price: string;
}

interface PSClientWallet {
  wallet: number;
  address: string;
  chain_balance: string;
  router_avail_balance: string;
  router_unsettled_balance: string;
  router_unlocked_balance: string;
  available_balance: string;
  withdraw_timestamp?: string;
}

interface PSPaymentSummary {
  wallet_id: number;
  last_payment_nonce: number;
  address: string;
  unsettled_amount_fil?: string;
  last_settled_amount_fil?: string;
  time_since_last_settlement?: string;
  last_settled_at?: string;
  contract_settled_fil?: string;
  contract_last_nonce?: number;
}

interface PSWorkAsk {
  id: number;
  min_price_nfil: number;
  created_at: string;
  min_price_fil: string;
}

interface PSSettlement {
  provider_id: number;
  payment_nonce: number;
  settled_at: string;
  settle_message_cid: string;
  address: string;
  amount_for_this_settlement_fil: string;
}

interface PSClientRequest {
  task_id: number;
  sp_id: string;
  sector_num: number;
  request_cid?: string;
  request_uploaded: boolean;
  request_sent: boolean;
  done: boolean;
  created_at: string;
  done_at?: string;
  payment_amount?: string;
}

interface PSClientMessage {
  started_at: string;
  signed_cid: string;
  wallet: number;
  action: string;
  success?: boolean;
  completed_at?: string;
  address: string;
}

interface PSTos {
  provider: string;
  client: string;
}

function extractNullStr(
  v: { Valid: boolean; String: string } | null | undefined,
): string | null {
  if (!v) return null;
  return v.Valid ? v.String : null;
}

function extractNullInt(
  v: { Valid: boolean; Int64: number } | null | undefined,
): number | null {
  if (!v) return null;
  return v.Valid ? v.Int64 : null;
}

function ProofSharePage() {
  usePageTitle("Proof Share");
  const [tab, setTab] = useState("provider");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Shield className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">Proof Share</h1>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "provider" | "client")}
      >
        <TabsList>
          <TabsTrigger value="provider">Provider</TabsTrigger>
          <TabsTrigger value="client">Client</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          {tab === "provider" && <ProviderTab />}
          {tab === "client" && <ClientTab />}
        </div>
      </Tabs>
    </div>
  );
}

function ProviderTab() {
  const { data: meta } = useCurioRpc<PSMeta>("PSGetMeta", [], {
    refetchInterval: 30_000,
  });
  const { data: queue, isLoading: queueLoading } = useCurioRpc<PSQueueItem[]>(
    "PSListQueue",
    [],
    { refetchInterval: 15_000 },
  );
  const { data: payments } = useCurioRpc<PSPaymentSummary[]>(
    "PSProviderLastPaymentsSummary",
    [],
    { refetchInterval: 60_000 },
  );
  const { data: asks } = useCurioRpc<PSWorkAsk[]>("PSListAsks", [], {
    refetchInterval: 30_000,
  });
  const { data: settlements } = useCurioRpc<PSSettlement[]>(
    "PSListSettlements",
    [],
    { refetchInterval: 60_000 },
  );

  const setMetaMutation = useCurioRpcMutation("PSSetMeta", {
    invalidateKeys: [["curio", "PSGetMeta"]],
  });
  const withdrawAskMutation = useCurioRpcMutation("PSAskWithdraw", {
    invalidateKeys: [["curio", "PSListAsks"]],
  });
  const settleMutation = useCurioRpcMutation<string>("PSProviderSettle");

  const [showSettings, setShowSettings] = useState(false);
  const [metaForm, setMetaForm] = useState({
    enabled: false,
    wallet: "",
    price: "0",
  });

  const openSettings = useCallback(() => {
    if (meta) {
      setMetaForm({
        enabled: meta.enabled,
        wallet: extractNullStr(meta.wallet) || "",
        price: meta.price || "0",
      });
    }
    setShowSettings(true);
  }, [meta]);

  const handleSaveSettings = useCallback(() => {
    setMetaMutation.mutate([metaForm.enabled, metaForm.wallet, metaForm.price]);
    setShowSettings(false);
  }, [metaForm, setMetaMutation]);

  const queueColumns: ColumnDef<PSQueueItem>[] = [
    {
      accessorKey: "service_id",
      header: "Service",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.service_id.slice(0, 12)}…
        </span>
      ),
    },
    {
      accessorKey: "obtained_at",
      header: "Obtained",
    },
    {
      id: "compute",
      header: "Compute",
      cell: ({ row }) => (
        <StatusBadge
          status={
            row.original.compute_done
              ? "done"
              : extractNullInt(row.original.compute_task_id)
                ? "running"
                : "pending"
          }
          label={
            row.original.compute_done
              ? "Done"
              : extractNullInt(row.original.compute_task_id)
                ? `Task #${extractNullInt(row.original.compute_task_id)}`
                : "Waiting"
          }
        />
      ),
    },
    {
      id: "submit",
      header: "Submit",
      cell: ({ row }) => (
        <StatusBadge
          status={
            row.original.submit_done
              ? "done"
              : extractNullInt(row.original.submit_task_id)
                ? "running"
                : "pending"
          }
          label={
            row.original.submit_done
              ? "Done"
              : extractNullInt(row.original.submit_task_id)
                ? `Task #${extractNullInt(row.original.submit_task_id)}`
                : "Waiting"
          }
        />
      ),
    },
    {
      id: "pow",
      header: "PoW",
      cell: ({ row }) =>
        row.original.was_pow ? <StatusBadge status="info" label="Yes" /> : "—",
    },
    { accessorKey: "payment_amount", header: "Payment" },
  ];

  return (
    <div className="space-y-6">
      {meta && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard
            label="Status"
            value={meta.enabled ? "Enabled" : "Disabled"}
          />
          <KPICard label="Wallet" value={extractNullStr(meta.wallet) || "—"} />
          <KPICard label="Price" value={meta.price || "0"} />
          <KPICard label="Queue" value={queue?.length ?? 0} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Provider Queue</CardTitle>
          <Button size="sm" variant="outline" onClick={openSettings}>
            <Settings className="mr-1 size-4" /> Settings
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={queueColumns}
            data={queue ?? []}
            loading={queueLoading}
            emptyMessage="Queue empty"
          />
        </CardContent>
      </Card>

      {payments && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.wallet_id}
                  className="flex flex-col gap-1 rounded border border-border p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{p.address}</span>
                    <span className="text-xs text-muted-foreground">
                      Nonce: {p.last_payment_nonce}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {p.unsettled_amount_fil && (
                      <span>Unsettled: {p.unsettled_amount_fil}</span>
                    )}
                    {p.last_settled_amount_fil && (
                      <span>Last Settled: {p.last_settled_amount_fil}</span>
                    )}
                    {p.time_since_last_settlement && (
                      <span>
                        Since Settlement: {p.time_since_last_settlement}
                      </span>
                    )}
                    {p.last_settled_at && (
                      <span>Settled At: {p.last_settled_at}</span>
                    )}
                    {p.contract_settled_fil && (
                      <span>Contract Settled: {p.contract_settled_fil}</span>
                    )}
                    {p.contract_last_nonce !== undefined && (
                      <span>Contract Nonce: {p.contract_last_nonce}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {asks && asks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Work Asks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {asks.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded border border-border p-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">#{a.id}</span>
                    <span>Min Price: {a.min_price_fil}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.created_at}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => withdrawAskMutation.mutate([a.id])}
                    disabled={withdrawAskMutation.isPending}
                  >
                    Withdraw
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {settlements && settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settlements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border border-border p-2 text-sm"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs">{s.address}</span>
                    <span className="text-xs text-muted-foreground">
                      Nonce: {s.payment_nonce} | CID:{" "}
                      {s.settle_message_cid.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {s.amount_for_this_settlement_fil}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.settled_at}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => settleMutation.mutate([s.provider_id])}
                      disabled={settleMutation.isPending}
                    >
                      Settle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showSettings && (
        <Dialog open onOpenChange={() => setShowSettings(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Provider Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ps-enabled"
                  checked={metaForm.enabled}
                  onChange={(e) =>
                    setMetaForm((f) => ({ ...f, enabled: e.target.checked }))
                  }
                />
                <label htmlFor="ps-enabled" className="text-sm">
                  Enabled
                </label>
              </div>
              <div>
                <label className="text-sm font-medium">Wallet</label>
                <Input
                  value={metaForm.wallet}
                  onChange={(e) =>
                    setMetaForm((f) => ({ ...f, wallet: e.target.value }))
                  }
                  placeholder="Wallet address"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  value={metaForm.price}
                  onChange={(e) =>
                    setMetaForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="Price in attoFIL"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={setMetaMutation.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ClientTab() {
  const { data: clients, isLoading: clientsLoading } = useCurioRpc<
    PSClientSettings[]
  >("PSClientGet", [], { refetchInterval: 30_000 });
  const { data: wallets, isLoading: walletsLoading } = useCurioRpc<
    PSClientWallet[]
  >("PSClientWallets", [], { refetchInterval: 30_000 });

  const clientSetMutation = useCurioRpcMutation("PSClientSet", {
    invalidateKeys: [["curio", "PSClientGet"]],
  });
  const clientRemoveMutation = useCurioRpcMutation("PSClientRemove", {
    invalidateKeys: [["curio", "PSClientGet"]],
  });
  const addWalletMutation = useCurioRpcMutation("PSClientAddWallet", {
    invalidateKeys: [["curio", "PSClientWallets"]],
  });

  const { data: tos } = useCurioRpc<PSTos>("PSGetTos", [], {
    refetchInterval: 300_000,
  });
  const { data: messages } = useCurioRpc<PSClientMessage[]>(
    "PSClientListMessages",
    [],
    { refetchInterval: 30_000 },
  );

  const routerAddBalance = useCurioRpcMutation<string>(
    "PSClientRouterAddBalance",
    { invalidateKeys: [["curio", "PSClientWallets"]] },
  );
  const routerRequestWithdraw = useCurioRpcMutation<string>(
    "PSClientRouterRequestWithdrawal",
  );
  const routerCancelWithdraw = useCurioRpcMutation<string>(
    "PSClientRouterCancelWithdrawal",
  );
  const routerCompleteWithdraw = useCurioRpcMutation<string>(
    "PSClientRouterCompleteWithdrawal",
    { invalidateKeys: [["curio", "PSClientWallets"]] },
  );

  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    address: "",
    wallet: "",
    minimumPending: "300",
    doPoRep: true,
    doSnap: true,
    price: "0",
  });
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [requestSpId, setRequestSpId] = useState("");
  const [routerWallet, setRouterWallet] = useState("");
  const [routerAmount, setRouterAmount] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const requestsQuery = useCurioRpc<PSClientRequest[]>(
    "PSClientRequests",
    [Number.parseInt(requestSpId, 10)],
    { enabled: showRequests && !!requestSpId.trim() },
  );

  const handleAddClient = useCallback(() => {
    if (!clientForm.address.trim()) return;
    clientSetMutation.mutate([
      {
        address: clientForm.address.trim(),
        enabled: true,
        wallet: { Valid: !!clientForm.wallet, String: clientForm.wallet },
        minimum_pending_seconds: parseInt(clientForm.minimumPending, 10) || 300,
        do_porep: clientForm.doPoRep,
        do_snap: clientForm.doSnap,
        price: clientForm.price,
      },
    ]);
    setShowAddClient(false);
    setClientForm({
      address: "",
      wallet: "",
      minimumPending: "300",
      doPoRep: true,
      doSnap: true,
      price: "0",
    });
  }, [clientForm, clientSetMutation]);

  const handleAddWallet = useCallback(() => {
    if (!newWallet.trim()) return;
    addWalletMutation.mutate([newWallet.trim()]);
    setShowAddWallet(false);
    setNewWallet("");
  }, [newWallet, addWalletMutation]);

  const clientColumns: ColumnDef<PSClientSettings>[] = [
    {
      accessorKey: "address",
      header: "SP",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.address}</span>
      ),
    },
    {
      id: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.enabled ? "done" : "warning"}
          label={row.original.enabled ? "Enabled" : "Disabled"}
        />
      ),
    },
    {
      id: "types",
      header: "Types",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.do_porep && <StatusBadge status="info" label="PoRep" />}
          {row.original.do_snap && <StatusBadge status="info" label="Snap" />}
        </div>
      ),
    },
    { accessorKey: "price", header: "Price" },
    {
      accessorKey: "minimum_pending_seconds",
      header: "Min Pending (s)",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const spId = row.original.sp_id;
        if (confirmRemove === spId) {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  clientRemoveMutation.mutate([spId]);
                  setConfirmRemove(null);
                }}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmRemove(null)}
              >
                ×
              </Button>
            </div>
          );
        }
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmRemove(spId)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Settings</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddClient(true)}
          >
            <Plus className="mr-1 size-4" /> Add Client
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={clientColumns}
            data={clients ?? []}
            loading={clientsLoading}
            emptyMessage="No client settings"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Wallets</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddWallet(true)}
          >
            <Plus className="mr-1 size-4" /> Add Wallet
          </Button>
        </CardHeader>
        <CardContent>
          {walletsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : wallets && wallets.length > 0 ? (
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
                    <span>Chain: {w.chain_balance}</span>
                    <span>Available: {w.available_balance}</span>
                    <span>Router Avail: {w.router_avail_balance}</span>
                    <span>Router Unsettled: {w.router_unsettled_balance}</span>
                    <span>Unlocked: {w.router_unlocked_balance}</span>
                    {w.withdraw_timestamp && (
                      <span>Withdraw At: {w.withdraw_timestamp}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No wallets configured
            </p>
          )}
        </CardContent>
      </Card>

      {showAddClient && (
        <Dialog open onOpenChange={() => setShowAddClient(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">SP Address *</label>
                <Input
                  value={clientForm.address}
                  onChange={(e) =>
                    setClientForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="f01234..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Wallet</label>
                <Input
                  value={clientForm.wallet}
                  onChange={(e) =>
                    setClientForm((f) => ({ ...f, wallet: e.target.value }))
                  }
                  placeholder="Payment wallet"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  value={clientForm.price}
                  onChange={(e) =>
                    setClientForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="Price"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Min Pending (seconds)
                </label>
                <Input
                  type="number"
                  value={clientForm.minimumPending}
                  onChange={(e) =>
                    setClientForm((f) => ({
                      ...f,
                      minimumPending: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="do-porep"
                    checked={clientForm.doPoRep}
                    onChange={(e) =>
                      setClientForm((f) => ({
                        ...f,
                        doPoRep: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="do-porep" className="text-sm">
                    PoRep
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="do-snap"
                    checked={clientForm.doSnap}
                    onChange={(e) =>
                      setClientForm((f) => ({ ...f, doSnap: e.target.checked }))
                    }
                  />
                  <label htmlFor="do-snap" className="text-sm">
                    Snap
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddClient(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddClient}
                disabled={
                  clientSetMutation.isPending || !clientForm.address.trim()
                }
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showAddWallet && (
        <Dialog open onOpenChange={() => setShowAddWallet(false)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Wallet</DialogTitle>
            </DialogHeader>
            <div>
              <label className="text-sm font-medium">Wallet Address *</label>
              <Input
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                placeholder="Wallet address"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddWallet(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddWallet}
                disabled={addWalletMutation.isPending || !newWallet.trim()}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Client Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Client Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                SP ID
              </label>
              <Input
                placeholder="SP ID"
                value={requestSpId}
                onChange={(e) => setRequestSpId(e.target.value)}
                className="w-32 font-mono text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setShowRequests(true)}
              disabled={!requestSpId.trim()}
            >
              Load Requests
            </Button>
          </div>
          {showRequests &&
            requestsQuery.data &&
            requestsQuery.data.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {requestsQuery.data.map((r) => (
                  <div
                    key={r.task_id}
                    className="flex items-center justify-between rounded border border-border p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono">#{r.task_id}</span>
                      {r.sp_id && <span className="font-mono">{r.sp_id}</span>}
                      <span>Sector: {r.sector_num}</span>
                      <StatusBadge
                        status={
                          r.done ? "done" : r.request_sent ? "info" : "pending"
                        }
                        label={
                          r.done ? "Done" : r.request_sent ? "Sent" : "Pending"
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {r.request_cid && (
                        <span className="font-mono">
                          {r.request_cid.slice(0, 12)}…
                        </span>
                      )}
                      <span>{r.created_at}</span>
                      {r.done_at && <span>Done: {r.done_at}</span>}
                      {r.payment_amount && <span>{r.payment_amount}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Router Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Router Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Wallet
              </label>
              <Input
                placeholder="Wallet address"
                value={routerWallet}
                onChange={(e) => setRouterWallet(e.target.value)}
                className="w-40 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Amount (FIL)
              </label>
              <Input
                placeholder="0"
                value={routerAmount}
                onChange={(e) => setRouterAmount(e.target.value)}
                className="w-28 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={() =>
                routerAddBalance.mutate([routerWallet, routerAmount])
              }
              disabled={
                !routerWallet.trim() ||
                !routerAmount.trim() ||
                routerAddBalance.isPending
              }
            >
              Add Balance
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                routerRequestWithdraw.mutate([routerWallet, routerAmount])
              }
              disabled={
                !routerWallet.trim() ||
                !routerAmount.trim() ||
                routerRequestWithdraw.isPending
              }
            >
              Request Withdraw
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => routerCancelWithdraw.mutate([routerWallet])}
              disabled={!routerWallet.trim() || routerCancelWithdraw.isPending}
            >
              Cancel Withdraw
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => routerCompleteWithdraw.mutate([routerWallet])}
              disabled={
                !routerWallet.trim() || routerCompleteWithdraw.isPending
              }
            >
              Complete Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {messages && messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border border-border p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{m.action}</span>
                    <span className="text-muted-foreground">
                      {m.started_at}
                    </span>
                    {m.success !== undefined && (
                      <StatusBadge
                        status={m.success ? "done" : "error"}
                        label={m.success ? "OK" : "Failed"}
                      />
                    )}
                  </div>
                  <span className="truncate font-mono text-muted-foreground">
                    {m.signed_cid.slice(0, 16)}...
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms of Service */}
      {tos && (
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-1 text-sm font-medium">Provider ToS</h4>
                <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {tos.provider}
                </pre>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-medium">Client ToS</h4>
                <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {tos.client}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
