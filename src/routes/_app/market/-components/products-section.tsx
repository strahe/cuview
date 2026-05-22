import { Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/composed/form";
import { StatusBadge } from "@/components/composed/status-badge";
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
import { Spinner } from "@/components/ui/spinner";
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
  });

  const handleAddContract = useCallback(() => {
    if (!contractForm.address.trim()) return;
    addContractMutation.mutate([contractForm.address.trim(), true], {
      onSuccess: () => {
        setContractForm({ address: "" });
        setShowAddContract(false);
      },
    });
  }, [contractForm, addContractMutation]);

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
            <Empty className="border-0 py-4">
              <EmptyHeader>
                <EmptyTitle>No products</EmptyTitle>
              </EmptyHeader>
            </Empty>
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
            <Empty className="border-0 py-4">
              <EmptyHeader>
                <EmptyTitle>No data sources</EmptyTitle>
              </EmptyHeader>
            </Empty>
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
            <Plus data-icon="inline-start" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {contracts && Object.keys(contracts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(contracts).map(([addr, allowed]) => (
                <div
                  key={addr}
                  className="flex items-center justify-between rounded border border-border p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-mono text-xs">{addr}</span>
                    <StatusBadge
                      status={allowed ? "done" : "failed"}
                      label={allowed ? "Allowed" : "Blocked"}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={allowed ? "outline" : "default"}
                      onClick={() =>
                        updateContractMutation.mutate([addr, !allowed])
                      }
                      disabled={updateContractMutation.isPending}
                      aria-label={`${allowed ? "Block" : "Allow"} contract ${addr}`}
                    >
                      {allowed ? "Block" : "Allow"}
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remove contract ${addr}`}
                      onClick={() => removeContractMutation.mutate([addr])}
                      disabled={removeContractMutation.isPending}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty className="border-0 py-4">
              <EmptyHeader>
                <EmptyTitle>No market contracts</EmptyTitle>
              </EmptyHeader>
            </Empty>
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
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel>Contract Address *</FieldLabel>
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
              </Field>
            </FieldGroup>
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
                {addContractMutation.isPending && (
                  <Spinner data-icon="inline-start" className="size-3" />
                )}
                {addContractMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
