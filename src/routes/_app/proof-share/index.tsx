import { createFileRoute } from "@tanstack/react-router";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/composed/status-badge";
import { KPICard } from "@/components/composed/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield, Settings, Plus, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";

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
  wallet: string;
  balance: string;
  locked: string;
}

interface PSPaymentSummary {
  provider_id: number;
  provider_address: string;
  total_paid: string;
  last_payment: string;
}

function extractNullStr(v: { Valid: boolean; String: string } | null | undefined): string | null {
  if (!v) return null;
  return v.Valid ? v.String : null;
}

function extractNullInt(v: { Valid: boolean; Int64: number } | null | undefined): number | null {
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

      <Tabs>
        <TabsList>
          <TabsTrigger active={tab === "provider"} onClick={() => setTab("provider")}>Provider</TabsTrigger>
          <TabsTrigger active={tab === "client"} onClick={() => setTab("client")}>Client</TabsTrigger>
        </TabsList>
        <TabsContent>
          {tab === "provider" && <ProviderTab />}
          {tab === "client" && <ClientTab />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderTab() {
  const { data: meta } = useCurioRpc<PSMeta>("PSGetMeta", [], { refetchInterval: 30_000 });
  const { data: queue, isLoading: queueLoading } = useCurioRpc<PSQueueItem[]>("PSListQueue", [], { refetchInterval: 15_000 });
  const { data: payments } = useCurioRpc<PSPaymentSummary[]>("PSProviderLastPaymentsSummary", [], { refetchInterval: 60_000 });

  const setMetaMutation = useCurioRpcMutation("PSSetMeta", {
    invalidateKeys: [["curio", "PSGetMeta"]],
  });

  const [showSettings, setShowSettings] = useState(false);
  const [metaForm, setMetaForm] = useState({ enabled: false, wallet: "", price: "0" });

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
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.service_id.slice(0, 12)}…</span>,
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
          status={row.original.compute_done ? "done" : extractNullInt(row.original.compute_task_id) ? "running" : "pending"}
          label={row.original.compute_done ? "Done" : extractNullInt(row.original.compute_task_id) ? `Task #${extractNullInt(row.original.compute_task_id)}` : "Waiting"}
        />
      ),
    },
    {
      id: "submit",
      header: "Submit",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.submit_done ? "done" : extractNullInt(row.original.submit_task_id) ? "running" : "pending"}
          label={row.original.submit_done ? "Done" : extractNullInt(row.original.submit_task_id) ? `Task #${extractNullInt(row.original.submit_task_id)}` : "Waiting"}
        />
      ),
    },
    {
      id: "pow",
      header: "PoW",
      cell: ({ row }) => row.original.was_pow ? <StatusBadge status="info" label="Yes" /> : "—",
    },
    { accessorKey: "payment_amount", header: "Payment" },
  ];

  return (
    <div className="space-y-6">
      {meta && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KPICard label="Status" value={meta.enabled ? "Enabled" : "Disabled"} />
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
          <DataTable columns={queueColumns} data={queue ?? []} loading={queueLoading} emptyMessage="Queue empty" />
        </CardContent>
      </Card>

      {payments && payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.provider_id} className="flex items-center justify-between rounded border border-[hsl(var(--border))] p-2 text-sm">
                  <span className="font-mono text-xs">{p.provider_address}</span>
                  <div className="flex gap-4 text-[hsl(var(--muted-foreground))]">
                    <span>Total: {p.total_paid}</span>
                    <span>Last: {p.last_payment}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showSettings && (
        <Dialog open onOpenChange={() => setShowSettings(false)}>
          <DialogContent className="max-w-md" onClose={() => setShowSettings(false)}>
            <DialogHeader><DialogTitle>Provider Settings</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ps-enabled" checked={metaForm.enabled} onChange={(e) => setMetaForm((f) => ({ ...f, enabled: e.target.checked }))} />
                <label htmlFor="ps-enabled" className="text-sm">Enabled</label>
              </div>
              <div>
                <label className="text-sm font-medium">Wallet</label>
                <Input value={metaForm.wallet} onChange={(e) => setMetaForm((f) => ({ ...f, wallet: e.target.value }))} placeholder="Wallet address" />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input value={metaForm.price} onChange={(e) => setMetaForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price in attoFIL" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={setMetaMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ClientTab() {
  const { data: clients, isLoading: clientsLoading } = useCurioRpc<PSClientSettings[]>("PSClientGet", [], { refetchInterval: 30_000 });
  const { data: wallets, isLoading: walletsLoading } = useCurioRpc<PSClientWallet[]>("PSClientWallets", [], { refetchInterval: 30_000 });

  const clientSetMutation = useCurioRpcMutation("PSClientSet", { invalidateKeys: [["curio", "PSClientGet"]] });
  const clientRemoveMutation = useCurioRpcMutation("PSClientRemove", { invalidateKeys: [["curio", "PSClientGet"]] });
  const addWalletMutation = useCurioRpcMutation("PSClientAddWallet", { invalidateKeys: [["curio", "PSClientWallets"]] });

  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({ address: "", wallet: "", minimumPending: "300", doPoRep: true, doSnap: true, price: "0" });
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const handleAddClient = useCallback(() => {
    if (!clientForm.address.trim()) return;
    clientSetMutation.mutate([{
      address: clientForm.address.trim(),
      enabled: true,
      wallet: { Valid: !!clientForm.wallet, String: clientForm.wallet },
      minimum_pending_seconds: parseInt(clientForm.minimumPending) || 300,
      do_porep: clientForm.doPoRep,
      do_snap: clientForm.doSnap,
      price: clientForm.price,
    }]);
    setShowAddClient(false);
    setClientForm({ address: "", wallet: "", minimumPending: "300", doPoRep: true, doSnap: true, price: "0" });
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
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.address}</span>,
    },
    {
      id: "enabled",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.enabled ? "done" : "warning"} label={row.original.enabled ? "Enabled" : "Disabled"} />,
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
              <Button size="sm" variant="destructive" onClick={() => { clientRemoveMutation.mutate([spId]); setConfirmRemove(null); }}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>×</Button>
            </div>
          );
        }
        return <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(spId)}><Trash2 className="size-3.5" /></Button>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Settings</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddClient(true)}>
            <Plus className="mr-1 size-4" /> Add Client
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={clientColumns} data={clients ?? []} loading={clientsLoading} emptyMessage="No client settings" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Wallets</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddWallet(true)}>
            <Plus className="mr-1 size-4" /> Add Wallet
          </Button>
        </CardHeader>
        <CardContent>
          {walletsLoading ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
          ) : wallets && wallets.length > 0 ? (
            <div className="space-y-2">
              {wallets.map((w) => (
                <div key={w.wallet} className="flex items-center justify-between rounded border border-[hsl(var(--border))] p-2 text-sm">
                  <span className="font-mono text-xs">{w.wallet}</span>
                  <div className="flex gap-4 text-[hsl(var(--muted-foreground))]">
                    <span>Balance: {w.balance}</span>
                    <span>Locked: {w.locked}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No wallets configured</p>
          )}
        </CardContent>
      </Card>

      {showAddClient && (
        <Dialog open onOpenChange={() => setShowAddClient(false)}>
          <DialogContent className="max-w-md" onClose={() => setShowAddClient(false)}>
            <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">SP Address *</label>
                <Input value={clientForm.address} onChange={(e) => setClientForm((f) => ({ ...f, address: e.target.value }))} placeholder="f01234..." />
              </div>
              <div>
                <label className="text-sm font-medium">Wallet</label>
                <Input value={clientForm.wallet} onChange={(e) => setClientForm((f) => ({ ...f, wallet: e.target.value }))} placeholder="Payment wallet" />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input value={clientForm.price} onChange={(e) => setClientForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price" />
              </div>
              <div>
                <label className="text-sm font-medium">Min Pending (seconds)</label>
                <Input type="number" value={clientForm.minimumPending} onChange={(e) => setClientForm((f) => ({ ...f, minimumPending: e.target.value }))} />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="do-porep" checked={clientForm.doPoRep} onChange={(e) => setClientForm((f) => ({ ...f, doPoRep: e.target.checked }))} />
                  <label htmlFor="do-porep" className="text-sm">PoRep</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="do-snap" checked={clientForm.doSnap} onChange={(e) => setClientForm((f) => ({ ...f, doSnap: e.target.checked }))} />
                  <label htmlFor="do-snap" className="text-sm">Snap</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddClient(false)}>Cancel</Button>
              <Button onClick={handleAddClient} disabled={clientSetMutation.isPending || !clientForm.address.trim()}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showAddWallet && (
        <Dialog open onOpenChange={() => setShowAddWallet(false)}>
          <DialogContent className="max-w-sm" onClose={() => setShowAddWallet(false)}>
            <DialogHeader><DialogTitle>Add Wallet</DialogTitle></DialogHeader>
            <div>
              <label className="text-sm font-medium">Wallet Address *</label>
              <Input value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="Wallet address" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddWallet(false)}>Cancel</Button>
              <Button onClick={handleAddWallet} disabled={addWalletMutation.isPending || !newWallet.trim()}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
