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
import { useFsRegister } from "../-module/queries";

interface FsRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FsRegisterDialog({
  open,
  onOpenChange,
}: FsRegisterDialogProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
  });
  const mutation = useFsRegister();

  const handleSubmit = useCallback(() => {
    if (!form.name.trim() || !form.description.trim() || !form.location.trim())
      return;
    mutation.mutate(
      [form.name.trim(), form.description.trim(), form.location.trim()],
      {
        onSuccess: () => {
          setForm({ name: "", description: "", location: "" });
          onOpenChange(false);
        },
      },
    );
  }, [form, mutation, onOpenChange]);

  const handleClose = useCallback(() => {
    setForm({ name: "", description: "", location: "" });
    mutation.reset();
    onOpenChange(false);
  }, [onOpenChange, mutation]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Storage Provider</DialogTitle>
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
          <div>
            <label className="text-sm font-medium">Location *</label>
            <Input
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Geographic location"
            />
          </div>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to register"}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !form.name.trim() ||
              !form.description.trim() ||
              !form.location.trim()
            }
          >
            {mutation.isPending ? "Registering..." : "Register"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
