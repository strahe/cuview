import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Key, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
import { useCurioRpc, useCurioRpcMutation } from "@/hooks/use-curio-query";
import { usePageTitle } from "@/hooks/use-page-title";
import type { PdpPipeline, PdpService } from "@/types/pdp";

export const Route = createFileRoute("/_app/pdp/")({
  component: PdpPage,
});

const pipelineColumns: ColumnDef<PdpPipeline>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.id.slice(0, 8)}…</span>
    ),
  },
  {
    accessorKey: "miner",
    header: "Miner",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.miner}</span>
    ),
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.client.slice(0, 12)}…
      </span>
    ),
  },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const p = row.original;
      if (p.complete) return <StatusBadge status="done" label="Complete" />;
      if (p.indexed) return <StatusBadge status="running" label="Indexed" />;
      if (p.after_save_cache)
        return <StatusBadge status="running" label="SaveCache" />;
      if (p.after_add_piece_msg)
        return <StatusBadge status="running" label="AddPieceMsg" />;
      if (p.after_add_piece)
        return <StatusBadge status="running" label="AddPiece" />;
      if (p.aggregated)
        return <StatusBadge status="running" label="Aggregated" />;
      if (p.after_commp) return <StatusBadge status="running" label="CommP" />;
      if (p.downloaded)
        return <StatusBadge status="running" label="Downloaded" />;
      return <StatusBadge status="pending" label="Pending" />;
    },
  },
  { accessorKey: "created_at", header: "Created" },
];

function PdpPage() {
  usePageTitle("PDP");

  const { data: services, isLoading: servicesLoading } = useCurioRpc<
    PdpService[]
  >("PDPServices", [], { refetchInterval: 60_000 });
  const { data: keys, isLoading: keysLoading } = useCurioRpc<string[]>(
    "ListPDPKeys",
    [],
    { refetchInterval: 60_000 },
  );
  const { data: pipelines, isLoading: pipelinesLoading } = useCurioRpc<
    PdpPipeline[]
  >("MK20PDPPipelines", [100, 0], { refetchInterval: 30_000 });

  // Mutations
  const addServiceMutation = useCurioRpcMutation("AddPDPService", {
    invalidateKeys: [["curio", "PDPServices"]],
  });
  const removeServiceMutation = useCurioRpcMutation("RemovePDPService", {
    invalidateKeys: [["curio", "PDPServices"]],
  });
  const importKeyMutation = useCurioRpcMutation<string>("ImportPDPKey", {
    invalidateKeys: [["curio", "ListPDPKeys"]],
  });
  const removeKeyMutation = useCurioRpcMutation("RemovePDPKey", {
    invalidateKeys: [["curio", "ListPDPKeys"]],
  });

  // FS Registry
  const { data: fsStatus } = useCurioRpc<{
    address: string;
    id: string;
    active: boolean;
    name: string;
    description: string;
    payee: string;
    pdp_service: {
      service_url: string;
      min_size: number;
      max_size: number;
      ipni_piece: boolean;
      ipni_ipfs: boolean;
      price: number;
      min_proving_period: number;
      location: string;
    } | null;
    capabilities: Record<string, string>;
  }>("FSRegistryStatus", [], { refetchInterval: 120_000 });
  const registerFSMutation = useCurioRpcMutation("FSRegister", {
    invalidateKeys: [["curio", "FSRegistryStatus"]],
  });
  const updateProviderMutation = useCurioRpcMutation("FSUpdateProvider", {
    invalidateKeys: [["curio", "FSRegistryStatus"]],
  });
  const updatePDPMutation = useCurioRpcMutation("FSUpdatePDP", {
    invalidateKeys: [["curio", "FSRegistryStatus"]],
  });

  // Form state
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", pubKey: "" });
  const [showImportKey, setShowImportKey] = useState(false);
  const [keyHex, setKeyHex] = useState("");
  const [confirmRemoveService, setConfirmRemoveService] = useState<
    number | null
  >(null);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState<string | null>(null);

  const handleAddService = useCallback(() => {
    if (!serviceForm.name.trim() || !serviceForm.pubKey.trim()) return;
    addServiceMutation.mutate([
      serviceForm.name.trim(),
      serviceForm.pubKey.trim(),
    ]);
    setServiceForm({ name: "", pubKey: "" });
    setShowAddService(false);
  }, [serviceForm, addServiceMutation]);

  const handleImportKey = useCallback(() => {
    if (!keyHex.trim()) return;
    importKeyMutation.mutate([keyHex.trim()]);
    setKeyHex("");
    setShowImportKey(false);
  }, [keyHex, importKeyMutation]);

  const stats = useMemo(() => {
    const list = pipelines ?? [];
    return {
      total: list.length,
      active: list.filter((p) => !p.complete).length,
      complete: list.filter((p) => p.complete).length,
    };
  }, [pipelines]);

  // Service columns with actions
  const serviceColumns: ColumnDef<PdpService>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "pubkey",
      header: "Public Key",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.pubkey.slice(0, 24)}…
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const id = row.original.id;
        if (confirmRemoveService === id) {
          return (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  removeServiceMutation.mutate([id]);
                  setConfirmRemoveService(null);
                }}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmRemoveService(null)}
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
            onClick={() => setConfirmRemoveService(id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-5" />
        <h1 className="text-2xl font-bold tracking-tight">PDP</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Services" value={services?.length ?? 0} />
        <KPICard label="Keys" value={keys?.length ?? 0} />
        <KPICard label="Pipelines" value={stats.total} />
        <KPICard label="Active" value={stats.active} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> PDP Services
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddService(true)}
          >
            <Plus className="mr-1 size-4" /> Add Service
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={serviceColumns}
            data={services ?? []}
            loading={servicesLoading}
            emptyMessage="No PDP services"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="size-4" /> PDP Keys
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportKey(true)}
          >
            <Plus className="mr-1 size-4" /> Import Key
          </Button>
        </CardHeader>
        <CardContent>
          {keysLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : keys && keys.length > 0 ? (
            <ul className="space-y-2">
              {keys.map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-md border border-border p-2"
                >
                  <span className="font-mono text-xs">{key}</span>
                  {confirmRemoveKey === key ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          removeKeyMutation.mutate([key]);
                          setConfirmRemoveKey(null);
                        }}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmRemoveKey(null)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmRemoveKey(key)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No PDP keys configured
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PDP Pipelines</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={pipelineColumns}
            data={pipelines ?? []}
            loading={pipelinesLoading}
            searchable
            searchPlaceholder="Search pipelines..."
            searchColumn="client"
            emptyMessage="No PDP pipelines"
          />
        </CardContent>
      </Card>

      {/* Add Service Dialog */}
      {showAddService && (
        <Dialog open onOpenChange={() => setShowAddService(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add PDP Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Service Name *</label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Service name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Public Key *</label>
                <Input
                  value={serviceForm.pubKey}
                  onChange={(e) =>
                    setServiceForm((f) => ({ ...f, pubKey: e.target.value }))
                  }
                  placeholder="Public key (hex)"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddService(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddService}
                disabled={
                  addServiceMutation.isPending ||
                  !serviceForm.name.trim() ||
                  !serviceForm.pubKey.trim()
                }
              >
                {addServiceMutation.isPending ? "Adding..." : "Add Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Key Dialog */}
      {showImportKey && (
        <Dialog open onOpenChange={() => setShowImportKey(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import PDP Key</DialogTitle>
            </DialogHeader>
            <div>
              <label className="text-sm font-medium">Private Key (hex) *</label>
              <Input
                value={keyHex}
                onChange={(e) => setKeyHex(e.target.value)}
                placeholder="Hex-encoded private key"
                className="font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportKey(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImportKey}
                disabled={importKeyMutation.isPending || !keyHex.trim()}
              >
                {importKeyMutation.isPending ? "Importing..." : "Import Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* FS Registry */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>FS Registry</CardTitle>
          {!fsStatus?.active && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const name = prompt("Registry name:");
                const desc = prompt("Description:");
                const loc = prompt("Location:");
                if (name && desc && loc)
                  registerFSMutation.mutate([name, desc, loc]);
              }}
            >
              <Plus className="mr-1 size-4" /> Register
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {fsStatus ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-muted-foreground">Name</div>
                  <div>{fsStatus.name || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <StatusBadge
                    status={fsStatus.active ? "done" : "pending"}
                    label={fsStatus.active ? "Active" : "Inactive"}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground">ID</div>
                  <div className="truncate font-mono text-xs">
                    {fsStatus.id || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Address</div>
                  <div className="truncate font-mono text-xs">
                    {fsStatus.address || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Description</div>
                  <div className="text-xs">{fsStatus.description || "—"}</div>
                </div>
                {fsStatus.payee && (
                  <div>
                    <div className="text-muted-foreground">Payee</div>
                    <div className="truncate font-mono text-xs">
                      {fsStatus.payee}
                    </div>
                  </div>
                )}
              </div>
              {fsStatus.pdp_service && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    PDP Service
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-muted-foreground">Service URL</div>
                      <div className="truncate text-xs">
                        {fsStatus.pdp_service.service_url || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min Size</div>
                      <div className="font-mono text-xs">
                        {fsStatus.pdp_service.min_size}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Max Size</div>
                      <div className="font-mono text-xs">
                        {fsStatus.pdp_service.max_size}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-mono text-xs">
                        {fsStatus.pdp_service.price}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Min Proving Period
                      </div>
                      <div className="font-mono text-xs">
                        {fsStatus.pdp_service.min_proving_period}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Location</div>
                      <div className="text-xs">
                        {fsStatus.pdp_service.location || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">IPNI Piece</div>
                      <StatusBadge
                        status={
                          fsStatus.pdp_service.ipni_piece ? "done" : "pending"
                        }
                        label={fsStatus.pdp_service.ipni_piece ? "Yes" : "No"}
                      />
                    </div>
                    <div>
                      <div className="text-muted-foreground">IPNI IPFS</div>
                      <StatusBadge
                        status={
                          fsStatus.pdp_service.ipni_ipfs ? "done" : "pending"
                        }
                        label={fsStatus.pdp_service.ipni_ipfs ? "Yes" : "No"}
                      />
                    </div>
                  </div>
                </div>
              )}
              {fsStatus.capabilities &&
                Object.keys(fsStatus.capabilities).length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Capabilities
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(fsStatus.capabilities).map(([k, v]) => (
                        <span
                          key={k}
                          className="rounded bg-muted px-2 py-0.5 text-xs"
                        >
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {fsStatus.active && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const name = prompt("New name:", fsStatus.name);
                      const desc = prompt(
                        "New description:",
                        fsStatus.description,
                      );
                      if (name && desc)
                        updateProviderMutation.mutate([name, desc]);
                    }}
                  >
                    Update Provider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePDPMutation.mutate([null, null])}
                    disabled={updatePDPMutation.isPending}
                  >
                    Update PDP
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              FS Registry not available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
