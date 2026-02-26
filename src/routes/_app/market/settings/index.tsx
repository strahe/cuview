import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
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
import type {
  AllowDenyEntry,
  ClientFilter,
  PricingFilter,
} from "@/types/market";

export const Route = createFileRoute("/_app/market/settings/")({
  component: MarketSettingsPage,
});

const pricingColumns: ColumnDef<PricingFilter>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "min_dur", header: "Min Duration" },
  { accessorKey: "max_dur", header: "Max Duration" },
  { accessorKey: "min_size", header: "Min Size" },
  { accessorKey: "max_size", header: "Max Size" },
  { accessorKey: "price", header: "Price" },
  {
    id: "verified",
    header: "Verified",
    cell: ({ row }) => (row.original.verified ? "Yes" : "No"),
  },
];

const clientColumns: ColumnDef<ClientFilter>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "active",
    header: "Active",
    cell: ({ row }) => (row.original.active ? "Yes" : "No"),
  },
  {
    id: "wallets",
    header: "Wallets",
    cell: ({ row }) => row.original.wallets?.length ?? 0,
  },
  { accessorKey: "max_deals_per_hour", header: "Max Deals/h" },
];

const allowDenyColumns: ColumnDef<AllowDenyEntry>[] = [
  {
    accessorKey: "wallet",
    header: "Wallet",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.wallet}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={row.original.status ? "text-success" : "text-destructive"}
      >
        {row.original.status ? "Allow" : "Deny"}
      </span>
    ),
  },
];

function MarketSettingsPage() {
  const { data: pricing, isLoading: pricingLoading } = useCurioRpc<
    PricingFilter[]
  >("GetPriceFilters", [], { refetchInterval: 60_000 });

  const { data: clients, isLoading: clientsLoading } = useCurioRpc<
    ClientFilter[]
  >("GetClientFilters", [], { refetchInterval: 60_000 });

  const { data: allowDeny, isLoading: allowDenyLoading } = useCurioRpc<
    AllowDenyEntry[]
  >("GetAllowDenyList", [], { refetchInterval: 60_000 });

  // Pricing filter mutations
  const addPricingMutation = useCurioRpcMutation("AddPriceFilters", {
    invalidateKeys: [["curio", "GetPriceFilters"]],
  });
  const removePricingMutation = useCurioRpcMutation("RemovePricingFilter", {
    invalidateKeys: [["curio", "GetPriceFilters"]],
  });

  // Client filter mutations
  const addClientMutation = useCurioRpcMutation("AddClientFilters", {
    invalidateKeys: [["curio", "GetClientFilters"]],
  });
  const removeClientMutation = useCurioRpcMutation("RemoveClientFilter", {
    invalidateKeys: [["curio", "GetClientFilters"]],
  });

  // Allow/Deny mutations
  const addAllowDenyMutation = useCurioRpcMutation("AddAllowDenyList", {
    invalidateKeys: [["curio", "GetAllowDenyList"]],
  });
  const removeAllowMutation = useCurioRpcMutation("RemoveAllowFilter", {
    invalidateKeys: [["curio", "GetAllowDenyList"]],
  });

  // Set mutations (bulk update)
  // Note: SetPriceFilters, SetClientFilters, SetAllowDenyList are available
  // but we use individual Add/Remove operations for better UX

  // Market contracts
  const { data: contracts } = useCurioRpc<Record<string, string>>(
    "ListMarketContracts",
    [],
    { refetchInterval: 60_000 },
  );
  const addContractMutation = useCurioRpcMutation("AddMarketContract", {
    invalidateKeys: [["curio", "ListMarketContracts"]],
  });
  const updateContractMutation = useCurioRpcMutation("UpdateMarketContract", {
    invalidateKeys: [["curio", "ListMarketContracts"]],
  });
  const removeContractMutation = useCurioRpcMutation("RemoveMarketContract", {
    invalidateKeys: [["curio", "ListMarketContracts"]],
  });

  // Products & DataSources
  const { data: products } = useCurioRpc<Record<string, boolean>>(
    "ListProducts",
    [],
    { refetchInterval: 60_000 },
  );
  const enableProductMutation = useCurioRpcMutation("EnableProduct", {
    invalidateKeys: [["curio", "ListProducts"]],
  });
  const disableProductMutation = useCurioRpcMutation("DisableProduct", {
    invalidateKeys: [["curio", "ListProducts"]],
  });
  const { data: dataSources } = useCurioRpc<Record<string, boolean>>(
    "ListDataSources",
    [],
    { refetchInterval: 60_000 },
  );
  const enableDSMutation = useCurioRpcMutation("EnableDataSource", {
    invalidateKeys: [["curio", "ListDataSources"]],
  });
  const disableDSMutation = useCurioRpcMutation("DisableDataSource", {
    invalidateKeys: [["curio", "ListDataSources"]],
  });

  const [showAddPricing, setShowAddPricing] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    name: "",
    minDur: 0,
    maxDur: 0,
    minSize: 0,
    maxSize: 0,
    price: 0,
    verified: false,
  });
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    active: true,
    wallets: "",
    peers: "",
    filters: "",
    maxDealsPerHour: 0,
    maxDealSizePerHour: 0,
    info: "",
  });
  const [showAddAllowDeny, setShowAddAllowDeny] = useState(false);
  const [allowDenyForm, setAllowDenyForm] = useState({
    wallet: "",
    status: true,
  });
  const [tab, setTab] = useState("filters");
  const [showAddContract, setShowAddContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    address: "",
    abi: "",
  });

  const handleAddPricing = useCallback(() => {
    if (!pricingForm.name.trim()) return;
    addPricingMutation.mutate([
      pricingForm.name,
      pricingForm.minDur,
      pricingForm.maxDur,
      pricingForm.minSize,
      pricingForm.maxSize,
      pricingForm.price,
      pricingForm.verified,
    ]);
    setPricingForm({
      name: "",
      minDur: 0,
      maxDur: 0,
      minSize: 0,
      maxSize: 0,
      price: 0,
      verified: false,
    });
    setShowAddPricing(false);
  }, [pricingForm, addPricingMutation]);

  const handleAddClient = useCallback(() => {
    if (!clientForm.name.trim()) return;
    const wallets = clientForm.wallets
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const peers = clientForm.peers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const filters = clientForm.filters
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    addClientMutation.mutate([
      clientForm.name,
      clientForm.active,
      wallets,
      peers,
      filters,
      clientForm.maxDealsPerHour,
      clientForm.maxDealSizePerHour,
      clientForm.info,
    ]);
    setClientForm({
      name: "",
      active: true,
      wallets: "",
      peers: "",
      filters: "",
      maxDealsPerHour: 0,
      maxDealSizePerHour: 0,
      info: "",
    });
    setShowAddClient(false);
  }, [clientForm, addClientMutation]);

  const handleAddAllowDeny = useCallback(() => {
    if (!allowDenyForm.wallet.trim()) return;
    addAllowDenyMutation.mutate([
      allowDenyForm.wallet.trim(),
      allowDenyForm.status,
    ]);
    setAllowDenyForm({ wallet: "", status: true });
    setShowAddAllowDeny(false);
  }, [allowDenyForm, addAllowDenyMutation]);

  const handleAddContract = useCallback(() => {
    if (!contractForm.address.trim()) return;
    addContractMutation.mutate([
      contractForm.address.trim(),
      contractForm.abi.trim(),
    ]);
    setContractForm({ address: "", abi: "" });
    setShowAddContract(false);
  }, [contractForm, addContractMutation]);

  // Pricing columns with delete
  const pricingColumnsWithActions: ColumnDef<PricingFilter>[] = [
    ...pricingColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removePricingMutation.mutate([row.original.name])}
          disabled={removePricingMutation.isPending}
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      ),
    },
  ];

  // Client columns with delete
  const clientColumnsWithActions: ColumnDef<ClientFilter>[] = [
    ...clientColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeClientMutation.mutate([row.original.name])}
          disabled={removeClientMutation.isPending}
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      ),
    },
  ];

  // Allow/Deny columns with delete
  const allowDenyColumnsWithActions: ColumnDef<AllowDenyEntry>[] = [
    ...allowDenyColumns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeAllowMutation.mutate([row.original.wallet])}
          disabled={removeAllowMutation.isPending}
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "filters" | "contracts" | "products")}
      >
        <TabsList>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="products">Products & Data Sources</TabsTrigger>
        </TabsList>
        <div>
          {tab === "filters" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Pricing Filters</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddPricing(true)}
                  >
                    <Plus className="mr-1 size-4" /> Add Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={pricingColumnsWithActions}
                    data={pricing ?? []}
                    loading={pricingLoading}
                    emptyMessage="No pricing filters"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Client Filters</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddClient(true)}
                  >
                    <Plus className="mr-1 size-4" /> Add Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={clientColumnsWithActions}
                    data={clients ?? []}
                    loading={clientsLoading}
                    emptyMessage="No client filters"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Allow / Deny List</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddAllowDeny(true)}
                  >
                    <Plus className="mr-1 size-4" /> Add Entry
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={allowDenyColumnsWithActions}
                    data={allowDeny ?? []}
                    loading={allowDenyLoading}
                    emptyMessage="No allow/deny entries"
                  />
                </CardContent>
              </Card>

              {/* Add Pricing Filter Dialog */}
              {showAddPricing && (
                <Dialog open onOpenChange={() => setShowAddPricing(false)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Pricing Filter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          value={pricingForm.name}
                          onChange={(e) =>
                            setPricingForm((f) => ({
                              ...f,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Filter name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">
                            Min Duration (days)
                          </label>
                          <Input
                            type="number"
                            value={pricingForm.minDur}
                            onChange={(e) =>
                              setPricingForm((f) => ({
                                ...f,
                                minDur: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Max Duration (days)
                          </label>
                          <Input
                            type="number"
                            value={pricingForm.maxDur}
                            onChange={(e) =>
                              setPricingForm((f) => ({
                                ...f,
                                maxDur: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">
                            Min Size (bytes)
                          </label>
                          <Input
                            type="number"
                            value={pricingForm.minSize}
                            onChange={(e) =>
                              setPricingForm((f) => ({
                                ...f,
                                minSize: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Max Size (bytes)
                          </label>
                          <Input
                            type="number"
                            value={pricingForm.maxSize}
                            onChange={(e) =>
                              setPricingForm((f) => ({
                                ...f,
                                maxSize: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Price (attoFIL/GiB/Epoch)
                        </label>
                        <Input
                          type="number"
                          value={pricingForm.price}
                          onChange={(e) =>
                            setPricingForm((f) => ({
                              ...f,
                              price: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pricingForm.verified}
                          onChange={(e) =>
                            setPricingForm((f) => ({
                              ...f,
                              verified: e.target.checked,
                            }))
                          }
                          id="verified"
                        />
                        <label
                          htmlFor="verified"
                          className="text-sm font-medium"
                        >
                          Verified deals only
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddPricing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddPricing}
                        disabled={
                          addPricingMutation.isPending ||
                          !pricingForm.name.trim()
                        }
                      >
                        {addPricingMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Add Client Filter Dialog */}
              {showAddClient && (
                <Dialog open onOpenChange={() => setShowAddClient(false)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Client Filter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          value={clientForm.name}
                          onChange={(e) =>
                            setClientForm((f) => ({
                              ...f,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Filter name"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={clientForm.active}
                          onChange={(e) =>
                            setClientForm((f) => ({
                              ...f,
                              active: e.target.checked,
                            }))
                          }
                          id="clientActive"
                        />
                        <label
                          htmlFor="clientActive"
                          className="text-sm font-medium"
                        >
                          Active
                        </label>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Wallets (comma-separated)
                        </label>
                        <Input
                          value={clientForm.wallets}
                          onChange={(e) =>
                            setClientForm((f) => ({
                              ...f,
                              wallets: e.target.value,
                            }))
                          }
                          placeholder="f1..., f3..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Peer IDs (comma-separated)
                        </label>
                        <Input
                          value={clientForm.peers}
                          onChange={(e) =>
                            setClientForm((f) => ({
                              ...f,
                              peers: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Pricing Filters (comma-separated)
                        </label>
                        <Input
                          value={clientForm.filters}
                          onChange={(e) =>
                            setClientForm((f) => ({
                              ...f,
                              filters: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">
                            Max Deals/Hour
                          </label>
                          <Input
                            type="number"
                            value={clientForm.maxDealsPerHour}
                            onChange={(e) =>
                              setClientForm((f) => ({
                                ...f,
                                maxDealsPerHour:
                                  parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Max Deal Size/Hour
                          </label>
                          <Input
                            type="number"
                            value={clientForm.maxDealSizePerHour}
                            onChange={(e) =>
                              setClientForm((f) => ({
                                ...f,
                                maxDealSizePerHour:
                                  parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Additional Info
                        </label>
                        <Input
                          value={clientForm.info}
                          onChange={(e) =>
                            setClientForm((f) => ({
                              ...f,
                              info: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddClient(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddClient}
                        disabled={
                          addClientMutation.isPending || !clientForm.name.trim()
                        }
                      >
                        {addClientMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Add Allow/Deny Dialog */}
              {showAddAllowDeny && (
                <Dialog open onOpenChange={() => setShowAddAllowDeny(false)}>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Add Allow/Deny Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">
                          Wallet Address *
                        </label>
                        <Input
                          value={allowDenyForm.wallet}
                          onChange={(e) =>
                            setAllowDenyForm((f) => ({
                              ...f,
                              wallet: e.target.value,
                            }))
                          }
                          placeholder="f0... or f1..."
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Action</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={allowDenyForm.status ? "allow" : "deny"}
                          onChange={(e) =>
                            setAllowDenyForm((f) => ({
                              ...f,
                              status: e.target.value === "allow",
                            }))
                          }
                        >
                          <option value="allow">Allow</option>
                          <option value="deny">Deny</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddAllowDeny(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddAllowDeny}
                        disabled={
                          addAllowDenyMutation.isPending ||
                          !allowDenyForm.wallet.trim()
                        }
                      >
                        {addAllowDenyMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {tab === "contracts" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Market Contracts</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddContract(true)}
                  >
                    <Plus className="mr-1 size-4" /> Add Contract
                  </Button>
                </CardHeader>
                <CardContent>
                  {contracts && Object.keys(contracts).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(contracts).map(([addr, abi]) => (
                        <div
                          key={addr}
                          className="flex items-center justify-between rounded border border-border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs">{addr}</span>
                            {abi && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                ABI: {abi.slice(0, 60)}…
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateContractMutation.mutate([
                                  addr,
                                  prompt("Update ABI:", abi) ?? abi,
                                ])
                              }
                            >
                              <Save className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeContractMutation.mutate([addr])
                              }
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No market contracts
                    </p>
                  )}
                </CardContent>
              </Card>

              {showAddContract && (
                <Dialog open onOpenChange={() => setShowAddContract(false)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Market Contract</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">
                          Contract Address *
                        </label>
                        <Input
                          value={contractForm.address}
                          onChange={(e) =>
                            setContractForm((f) => ({
                              ...f,
                              address: e.target.value,
                            }))
                          }
                          placeholder="0x..."
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">ABI JSON</label>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
                          value={contractForm.abi}
                          onChange={(e) =>
                            setContractForm((f) => ({
                              ...f,
                              abi: e.target.value,
                            }))
                          }
                          placeholder="[{...}]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddContract(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddContract}
                        disabled={
                          addContractMutation.isPending ||
                          !contractForm.address.trim()
                        }
                      >
                        Add
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {tab === "products" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {products && Object.keys(products).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(products).map(([name, enabled]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded border border-border p-2"
                        >
                          <span className="text-sm">{name}</span>
                          <Button
                            size="sm"
                            variant={enabled ? "destructive" : "outline"}
                            onClick={() =>
                              enabled
                                ? disableProductMutation.mutate([name])
                                : enableProductMutation.mutate([name])
                            }
                            disabled={
                              enableProductMutation.isPending ||
                              disableProductMutation.isPending
                            }
                          >
                            {enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No products
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  {dataSources && Object.keys(dataSources).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(dataSources).map(([name, enabled]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded border border-border p-2"
                        >
                          <span className="text-sm">{name}</span>
                          <Button
                            size="sm"
                            variant={enabled ? "destructive" : "outline"}
                            onClick={() =>
                              enabled
                                ? disableDSMutation.mutate([name])
                                : enableDSMutation.mutate([name])
                            }
                            disabled={
                              enableDSMutation.isPending ||
                              disableDSMutation.isPending
                            }
                          >
                            {enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No data sources
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
