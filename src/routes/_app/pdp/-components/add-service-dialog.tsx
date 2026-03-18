import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAddPdpService } from "../-module/queries";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddServiceDialog({
  open,
  onOpenChange,
}: AddServiceDialogProps) {
  const [form, setForm] = useState({ name: "", pubKey: "" });
  const addMutation = useAddPdpService();

  const handleSubmit = useCallback(() => {
    if (!form.name.trim() || !form.pubKey.trim()) return;
    addMutation.mutate([form.name.trim(), form.pubKey.trim()], {
      onSuccess: () => {
        setForm({ name: "", pubKey: "" });
        onOpenChange(false);
      },
    });
  }, [form, addMutation, onOpenChange]);

  const handleClose = useCallback(() => {
    setForm({ name: "", pubKey: "" });
    addMutation.reset();
    onOpenChange(false);
  }, [onOpenChange, addMutation]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add PDP Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Service Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Service name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Public Key (PEM format) *
            </label>
            <Textarea
              value={form.pubKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, pubKey: e.target.value }))
              }
              placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
              className="font-mono text-xs"
              rows={5}
            />
          </div>
        </div>
        {addMutation.isError && (
          <p className="text-sm text-destructive">
            {(addMutation.error as Error)?.message ?? "Failed to add service"}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              addMutation.isPending || !form.name.trim() || !form.pubKey.trim()
            }
          >
            {addMutation.isPending ? "Adding..." : "Add Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
