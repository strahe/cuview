import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { AppFormActions, TextField } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddWallet } from "../-module/queries";

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWalletDialog({ open, onOpenChange }: AddWalletDialogProps) {
  const mutation = useAddWallet();
  const form = useForm({
    defaultValues: {
      address: "",
      name: "",
    },
    onSubmit: ({ value }) => {
      const addr = value.address.trim();
      const name = value.name.trim();
      mutation.mutate([addr, name], {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    },
  });

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
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
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="address"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Wallet address is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                inputClassName="font-mono text-xs"
                label="Wallet Address"
                placeholder="f1... or f3..."
                required
              />
            )}
          </form.Field>
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Friendly name is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="Friendly Name"
                placeholder="e.g. Main Wallet"
                required
              />
            )}
          </form.Field>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to add wallet"}
            </p>
          )}
          <AppFormActions>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <Button
                  size="sm"
                  type="submit"
                  disabled={
                    mutation.isPending ||
                    !values.address.trim() ||
                    !values.name.trim()
                  }
                >
                  {mutation.isPending && (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  )}
                  {mutation.isPending ? "Adding..." : "Add"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
