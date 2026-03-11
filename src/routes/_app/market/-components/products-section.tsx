import { Edit2, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAddContract,
  useContracts,
  useDataSources,
  useDisableDataSource,
  useDisableProduct,
  useEnableDataSource,
  useEnableProduct,
  useProducts,
  useRemoveContract,
  useUpdateContract,
} from "../-module/queries";

export function ProductsSection() {
  const { data: products } = useProducts();
  const enableProductMutation = useEnableProduct();
  const disableProductMutation = useDisableProduct();
  const { data: dataSources } = useDataSources();
  const enableDSMutation = useEnableDataSource();
  const disableDSMutation = useDisableDataSource();
  const { data: contracts } = useContracts();
  const addContractMutation = useAddContract();
  const updateContractMutation = useUpdateContract();
  const removeContractMutation = useRemoveContract();

  const [showAddContract, setShowAddContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    address: "",
    abi: "",
  });

  // Edit ABI dialog state
  const [editAbi, setEditAbi] = useState<{
    address: string;
    abi: string;
  } | null>(null);

  const handleAddContract = useCallback(() => {
    if (!contractForm.address.trim()) return;
    addContractMutation.mutate(
      [contractForm.address.trim(), contractForm.abi.trim()],
      {
        onSuccess: () => {
          setContractForm({ address: "", abi: "" });
          setShowAddContract(false);
        },
      },
    );
  }, [contractForm, addContractMutation]);

  const handleUpdateAbi = useCallback(() => {
    if (!editAbi) return;
    updateContractMutation.mutate([editAbi.address, editAbi.abi], {
      onSuccess: () => setEditAbi(null),
    });
  }, [editAbi, updateContractMutation]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Products</CardTitle>
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
          <CardTitle className="text-sm">Data Sources</CardTitle>
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
                      enableDSMutation.isPending || disableDSMutation.isPending
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Contracts</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddContract(true)}
          >
            <Plus className="mr-1 size-4" /> Add
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
                      onClick={() => setEditAbi({ address: addr, abi })}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeContractMutation.mutate([addr])}
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

      {/* Add Contract Dialog */}
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
                <Textarea
                  className="min-h-[80px] font-mono text-xs"
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
                  addContractMutation.isPending || !contractForm.address.trim()
                }
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit ABI Dialog */}
      {editAbi && (
        <Dialog open onOpenChange={() => setEditAbi(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Contract ABI</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Contract Address</label>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {editAbi.address}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">ABI JSON</label>
                <Textarea
                  className="min-h-[120px] font-mono text-xs"
                  value={editAbi.abi}
                  onChange={(e) =>
                    setEditAbi((prev) =>
                      prev ? { ...prev, abi: e.target.value } : null,
                    )
                  }
                  placeholder="[{...}]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAbi(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAbi}
                disabled={updateContractMutation.isPending}
              >
                {updateContractMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
