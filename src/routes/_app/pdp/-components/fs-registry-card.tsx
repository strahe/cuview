import { Globe, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useResetMutationOnOpen } from "@/hooks/use-reset-mutation-on-open";
import { useFsDeregister } from "../-module/queries";
import type { FSRegistryStatus } from "../-module/types";
import { FsRegisterDialog } from "./fs-register-dialog";
import { FsUpdatePdpDialog } from "./fs-update-pdp-dialog";
import { FsUpdateProviderDialog } from "./fs-update-provider-dialog";

interface FsRegistryCardProps {
  fsStatus: FSRegistryStatus | null | undefined;
}

export function FsRegistryCard({ fsStatus }: FsRegistryCardProps) {
  const [showRegister, setShowRegister] = useState(false);
  const [showUpdateProvider, setShowUpdateProvider] = useState(false);
  const [showUpdatePdp, setShowUpdatePdp] = useState(false);
  const [showDeregister, setShowDeregister] = useState(false);

  const isProviderActive = Boolean(fsStatus?.status);
  const [prevIsProviderActive, setPrevIsProviderActive] =
    useState(isProviderActive);

  if (isProviderActive !== prevIsProviderActive) {
    setPrevIsProviderActive(isProviderActive);
    if (!isProviderActive) {
      setShowUpdateProvider(false);
      setShowUpdatePdp(false);
      setShowDeregister(false);
    } else {
      setShowRegister(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4" /> FS Registry
          </CardTitle>
          {!isProviderActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRegister(true)}
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
                    status={fsStatus.status ? "done" : "pending"}
                    label={fsStatus.status ? "Active" : "Inactive"}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground">ID</div>
                  <div className="truncate font-mono text-xs">
                    {fsStatus.id ?? "—"}
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
                    PDP Service Offering
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
                      <div className="text-muted-foreground">
                        Price (per TiB/day)
                      </div>
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
                    {fsStatus.pdp_service.ipni_peer_id && (
                      <div>
                        <div className="text-muted-foreground">
                          IPNI Peer ID
                        </div>
                        <div className="truncate font-mono text-xs">
                          {fsStatus.pdp_service.ipni_peer_id}
                        </div>
                      </div>
                    )}
                    {fsStatus.pdp_service.payment_token_address && (
                      <div>
                        <div className="text-muted-foreground">
                          Payment Token
                        </div>
                        <div className="truncate font-mono text-xs">
                          {fsStatus.pdp_service.payment_token_address}
                        </div>
                      </div>
                    )}
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

              {isProviderActive && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpdateProvider(true)}
                  >
                    Update Provider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpdatePdp(true)}
                  >
                    Update PDP
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeregister(true)}
                  >
                    Deregister
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

      <FsRegisterDialog open={showRegister} onOpenChange={setShowRegister} />

      {fsStatus && isProviderActive && (
        <FsUpdateProviderDialog
          open={showUpdateProvider}
          onOpenChange={setShowUpdateProvider}
          currentName={fsStatus.name}
          currentDescription={fsStatus.description}
        />
      )}

      {fsStatus && isProviderActive && (
        <FsUpdatePdpDialog
          open={showUpdatePdp}
          onOpenChange={setShowUpdatePdp}
          current={fsStatus.pdp_service}
        />
      )}

      <FsDeregisterDialog
        open={isProviderActive && showDeregister}
        onOpenChange={setShowDeregister}
      />
    </>
  );
}

interface FsDeregisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FsDeregisterDialog({ open, onOpenChange }: FsDeregisterDialogProps) {
  const deregisterMutation = useFsDeregister();
  useResetMutationOnOpen(open, deregisterMutation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <FsDeregisterDialogContent
          deregisterMutation={deregisterMutation}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

type FsDeregisterMutation = ReturnType<typeof useFsDeregister>;

function FsDeregisterDialogContent({
  deregisterMutation,
  onOpenChange,
}: Pick<FsDeregisterDialogProps, "onOpenChange"> & {
  deregisterMutation: FsDeregisterMutation;
}) {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Deregister Provider</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to deregister this storage provider? This action
        will remove your provider from the FS registry.
      </p>
      {deregisterMutation.isError && (
        <p className="text-sm text-destructive">
          {(deregisterMutation.error as Error)?.message ??
            "Failed to deregister"}
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={deregisterMutation.isPending}
          onClick={() => {
            if (deregisterMutation.isPending) return;

            deregisterMutation.mutate([], {
              onSuccess: () => {
                if (mountedRef.current) {
                  onOpenChange(false);
                }
              },
            });
          }}
        >
          {deregisterMutation.isPending ? "Deregistering…" : "Deregister"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
