import { useCallback, useEffect, useRef, useState } from "react";
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
import { unwrapSqlNullableString } from "@/utils/sql";
import { usePsSetMeta } from "../-module/queries";
import type { PsMeta } from "../-module/types";

interface ProviderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: PsMeta | undefined;
}

export function ProviderSettingsDialog({
  open,
  onOpenChange,
  meta,
}: ProviderSettingsDialogProps) {
  const wasOpenRef = useRef(false);
  const [form, setForm] = useState({
    enabled: false,
    wallet: "",
    price: "0",
  });

  const setMetaMutation = usePsSetMeta();

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    if (wasOpenRef.current || !meta) return;

    wasOpenRef.current = true;
    setForm({
      enabled: meta.enabled,
      wallet: unwrapSqlNullableString(meta.wallet) || "",
      price: meta.price || "0",
    });
  }, [open, meta]);

  const handleSave = useCallback(() => {
    setMetaMutation.mutate(
      [form.enabled, form.wallet.trim(), form.price.trim() || "0"],
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }, [form, setMetaMutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provider Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="ps-enabled"
              checked={form.enabled}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, enabled: !!checked }))
              }
            />
            <label htmlFor="ps-enabled" className="text-sm">
              Enabled
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Wallet</label>
            <Input
              value={form.wallet}
              onChange={(e) =>
                setForm((f) => ({ ...f, wallet: e.target.value }))
              }
              placeholder="Wallet address"
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
              Curio stores this value as a FIL amount per proof.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={setMetaMutation.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
