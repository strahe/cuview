import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePsClientSet } from "../-module/queries";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const [form, setForm] = useState({
    address: "",
    wallet: "",
    minimumPending: "300",
    doPoRep: true,
    doSnap: true,
    price: "0",
  });

  const clientSetMutation = usePsClientSet();

  const handleAdd = useCallback(() => {
    const address = form.address.trim();
    const wallet = form.wallet.trim();
    const parsedMinimumPending = Number.parseInt(form.minimumPending, 10);

    if (!address) return;

    clientSetMutation.mutate(
      [
        {
          address,
          enabled: true,
          wallet: { Valid: wallet.length > 0, String: wallet },
          minimum_pending_seconds: Number.isNaN(parsedMinimumPending)
            ? 300
            : parsedMinimumPending,
          do_porep: form.doPoRep,
          do_snap: form.doSnap,
          price: form.price.trim() || "0",
        },
      ],
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            address: "",
            wallet: "",
            minimumPending: "300",
            doPoRep: true,
            doSnap: true,
            price: "0",
          });
        },
      },
    );
  }, [form, clientSetMutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">SP Address *</label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="f01234..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Wallet</label>
            <Input
              value={form.wallet}
              onChange={(e) =>
                setForm((f) => ({ ...f, wallet: e.target.value }))
              }
              placeholder="Payment wallet"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price (FIL/p)</label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="0.005"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Curio parses this value as FIL per proof.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Min Pending (seconds)</label>
            <Input
              type="number"
              value={form.minimumPending}
              onChange={(e) =>
                setForm((f) => ({ ...f, minimumPending: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="do-porep"
                checked={form.doPoRep}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, doPoRep: !!checked }))
                }
              />
              <label htmlFor="do-porep" className="text-sm">
                PoRep
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="do-snap"
                checked={form.doSnap}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, doSnap: !!checked }))
                }
              />
              <label htmlFor="do-snap" className="text-sm">
                Snap
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={clientSetMutation.isPending || !form.address.trim()}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
