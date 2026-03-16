import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRenameWallet } from "../-module/queries";

interface RenameWalletDialogProps {
  open: boolean;
  address: string;
  currentName: string;
  onOpenChange: (open: boolean) => void;
}

export function RenameWalletDialog({
  open,
  address,
  currentName,
  onOpenChange,
}: RenameWalletDialogProps) {
  const [name, setName] = useState(currentName);
  const mutation = useRenameWallet();
  const walletSnapshot = useMemo(
    () => ({ address, name: currentName }),
    [address, currentName],
  );

  useEffect(() => {
    if (!open) return;
    setName(walletSnapshot.name);
  }, [open, walletSnapshot]);

  const handleSubmit = () => {
    const n = name.trim();
    if (!n) return;
    mutation.mutate([address, n], {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      mutation.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="font-mono text-xs text-muted-foreground">
            {address}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              New Name
            </label>
            <Input
              placeholder="Wallet name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to rename"}
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
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
