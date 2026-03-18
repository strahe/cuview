import { useCallback, useEffect, useState } from "react";
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
import { useFsUpdateProvider } from "../-module/queries";

interface FsUpdateProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentDescription: string;
}

export function FsUpdateProviderDialog({
  open,
  onOpenChange,
  currentName,
  currentDescription,
}: FsUpdateProviderDialogProps) {
  const [form, setForm] = useState({
    name: currentName,
    description: currentDescription,
  });
  const mutation = useFsUpdateProvider();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only reset form when dialog opens, not on polled data changes
  useEffect(() => {
    if (open) {
      setForm({ name: currentName, description: currentDescription });
      mutation.reset();
    }
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim() || !form.description.trim()) return;
    mutation.mutate([form.name.trim(), form.description.trim()], {
      onSuccess: () => onOpenChange(false),
    });
  }, [form, mutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Provider Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Provider name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Provider description"
              rows={3}
            />
          </div>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to update provider"}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !form.name.trim() ||
              !form.description.trim()
            }
          >
            {mutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
