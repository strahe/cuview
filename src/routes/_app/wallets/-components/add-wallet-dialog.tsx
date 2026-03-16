import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAddWallet } from "../-module/queries";

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWalletDialog({ open, onOpenChange }: AddWalletDialogProps) {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const mutation = useAddWallet();

  const handleSubmit = () => {
    const addr = address.trim();
    const n = name.trim();
    if (!addr || !n) return;
    mutation.mutate([addr, n], {
      onSuccess: () => {
        setAddress("");
        setName("");
        onOpenChange(false);
      },
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAddress("");
      setName("");
      mutation.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Wallet Address *
            </label>
            <Input
              placeholder="f1... or f3..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Friendly Name *
            </label>
            <Input
              placeholder="e.g. Main Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to add wallet"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={mutation.isPending || !address.trim() || !name.trim()}
          >
            {mutation.isPending ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
