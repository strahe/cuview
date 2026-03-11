import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AllowDenyEntry,
  ClientFilter,
  PricingFilter,
} from "@/types/market";
import {
  useAddAllowDeny,
  useAddClientFilter,
  useAddPricingFilter,
  useAllowDenyList,
  useClientFilters,
  useDefaultFilterBehaviour,
  usePricingFilters,
  useRemoveAllow,
  useRemoveClientFilter,
  useRemovePricingFilter,
} from "../-module/queries";

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
  const { data: defaultBehaviour } = useDefaultFilterBehaviour();

  const { data: pricing, isLoading: pricingLoading } = usePricingFilters();
  const { data: clients, isLoading: clientsLoading } = useClientFilters();
  const { data: allowDeny, isLoading: allowDenyLoading } = useAllowDenyList();

  const addPricingMutation = useAddPricingFilter();
  const removePricingMutation = useRemovePricingFilter();

  const addClientMutation = useAddClientFilter();
  const removeClientMutation = useRemoveClientFilter();

  const addAllowDenyMutation = useAddAllowDeny();
  const removeAllowMutation = useRemoveAllow();

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

  const pricingColumnsWithActions = useMemo<ColumnDef<PricingFilter>[]>(
    () => [
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
    ],
    [removePricingMutation],
  );

  const clientColumnsWithActions = useMemo<ColumnDef<ClientFilter>[]>(
    () => [
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
    ],
    [removeClientMutation],
  );

  const allowDenyColumnsWithActions = useMemo<ColumnDef<AllowDenyEntry>[]>(
    () => [
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
    ],
    [removeAllowMutation],
  );

  return (
    <div className="space-y-6">
      {defaultBehaviour && (
        <Card>
          <CardHeader>
            <CardTitle>Default Filter Behaviour</CardTitle>
            <CardDescription>
              How unmatched deals are handled when no filter rule applies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Unknown clients:</span>
                <span
                  className={
                    defaultBehaviour.allow_deals_from_unknown_clients
                      ? "font-medium text-success"
                      : "font-medium text-destructive"
                  }
                >
                  {defaultBehaviour.allow_deals_from_unknown_clients
                    ? "Allowed"
                    : "Denied"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  CID Gravity unreachable:
                </span>
                <span
                  className={
                    defaultBehaviour.is_deal_rejected_when_cid_gravity_not_reachable
                      ? "font-medium text-destructive"
                      : "font-medium text-success"
                  }
                >
                  {defaultBehaviour.is_deal_rejected_when_cid_gravity_not_reachable
                    ? "Reject deals"
                    : "Accept deals"}
                </span>
              </div>
              {defaultBehaviour.cid_gravity_status &&
                Object.keys(defaultBehaviour.cid_gravity_status).length > 0 && (
                  <div className="mt-1">
                    <span className="text-muted-foreground">
                      CID Gravity status:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {Object.entries(defaultBehaviour.cid_gravity_status).map(
                        ([key, ok]) => (
                          <span
                            key={key}
                            className={`rounded-md border px-2 py-0.5 text-xs ${ok ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
                          >
                            {key}: {ok ? "OK" : "Error"}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

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
                <Checkbox
                  checked={pricingForm.verified}
                  onCheckedChange={(checked) =>
                    setPricingForm((f) => ({
                      ...f,
                      verified: !!checked,
                    }))
                  }
                  id="verified"
                />
                <label htmlFor="verified" className="text-sm font-medium">
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
                  addPricingMutation.isPending || !pricingForm.name.trim()
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
                <Checkbox
                  checked={clientForm.active}
                  onCheckedChange={(checked) =>
                    setClientForm((f) => ({
                      ...f,
                      active: !!checked,
                    }))
                  }
                  id="clientActive"
                />
                <label htmlFor="clientActive" className="text-sm font-medium">
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
                  <label className="text-sm font-medium">Max Deals/Hour</label>
                  <Input
                    type="number"
                    value={clientForm.maxDealsPerHour}
                    onChange={(e) =>
                      setClientForm((f) => ({
                        ...f,
                        maxDealsPerHour: parseInt(e.target.value, 10) || 0,
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
                        maxDealSizePerHour: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Additional Info</label>
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
              <Button variant="outline" onClick={() => setShowAddClient(false)}>
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
                <label className="text-sm font-medium">Wallet Address *</label>
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
                <Select
                  value={allowDenyForm.status ? "allow" : "deny"}
                  onValueChange={(value) =>
                    setAllowDenyForm((f) => ({
                      ...f,
                      status: value === "allow",
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
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
                  addAllowDenyMutation.isPending || !allowDenyForm.wallet.trim()
                }
              >
                {addAllowDenyMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
