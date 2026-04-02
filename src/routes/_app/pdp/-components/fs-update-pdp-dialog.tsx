import { useCallback, useEffect, useState } from "react";
import { SizeSelect } from "@/components/composed/size-select";
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
import { Label } from "@/components/ui/label";
import { useFsUpdatePdp } from "../-module/queries";
import type { FSPDPOffering } from "../-module/types";

interface FsUpdatePdpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: FSPDPOffering | null;
}

const defaultOffering: FSPDPOffering = {
  service_url: "",
  min_size: 127,
  max_size: 34359738368, // 32 GiB
  ipni_piece: true,
  ipni_ipfs: false,
  ipni_peer_id: "",
  price: 0,
  min_proving_period: 0,
  location: "",
  payment_token_address: "",
};

export function FsUpdatePdpDialog({
  open,
  onOpenChange,
  current,
}: FsUpdatePdpDialogProps) {
  const [form, setForm] = useState<FSPDPOffering>(defaultOffering);
  const mutation = useFsUpdatePdp();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only reset form when dialog opens, not on polled data changes
  useEffect(() => {
    if (open) {
      setForm(current ?? defaultOffering);
      mutation.reset();
    }
  }, [open]);

  const updateField = useCallback(
    <K extends keyof FSPDPOffering>(key: K, value: FSPDPOffering[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!form.service_url.trim()) return;
    mutation.mutate([form, null], {
      onSuccess: () => onOpenChange(false),
    });
  }, [form, mutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update PDP Offering</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Service URL *</Label>
            <Input
              value={form.service_url}
              onChange={(e) => updateField("service_url", e.target.value)}
              placeholder="https://example.com/pdp"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Min Piece Size</Label>
              <SizeSelect
                value={form.min_size}
                onChange={(v) => updateField("min_size", v)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Max Piece Size</Label>
              <SizeSelect
                value={form.max_size}
                onChange={(v) => updateField("max_size", v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Price (per TiB/day)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">
                Min Proving Period (epochs)
              </Label>
              <Input
                type="number"
                value={form.min_proving_period}
                onChange={(e) =>
                  updateField("min_proving_period", Number(e.target.value))
                }
                min={0}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Geographic location"
              maxLength={128}
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.ipni_piece}
                onCheckedChange={(v) => updateField("ipni_piece", !!v)}
              />
              IPNI Piece
            </Label>
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.ipni_ipfs}
                onCheckedChange={(v) => updateField("ipni_ipfs", !!v)}
              />
              IPNI IPFS
            </Label>
          </div>

          <div>
            <Label className="text-sm font-medium">Payment Token Address</Label>
            <Input
              value={form.payment_token_address}
              onChange={(e) =>
                updateField("payment_token_address", e.target.value)
              }
              placeholder="0x... (defaults to USDFC)"
              className="font-mono text-xs"
            />
          </div>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to update PDP"}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !form.service_url.trim()}
          >
            {mutation.isPending ? "Updating..." : "Update PDP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
