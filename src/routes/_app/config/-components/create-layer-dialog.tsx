import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateLayerMutation } from "../-module/queries";

interface CreateLayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (name: string) => void;
}

export function CreateLayerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateLayerDialogProps) {
  const [name, setName] = useState("");
  const { error, isPending, mutate, reset } = useCreateLayerMutation();

  useEffect(() => {
    if (!open) return;

    setName("");
    reset();
  }, [open, reset]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed || isPending) return;

    mutate(trimmed, {
      onSuccess: () => {
        setName("");
        onOpenChange(false);
        onCreated?.(trimmed);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Layer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="Layer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{String(error)}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isPending}>
            {isPending && <Loader2 className="mr-1 size-3 animate-spin" />}
            {isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
