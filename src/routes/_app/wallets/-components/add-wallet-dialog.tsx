import { useForm } from "@tanstack/react-form";
import {
  AppFieldGroup,
  AppFormActions,
  TextField,
} from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/utils/error-log";
import { useAddWallet } from "../-module/queries";

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWalletDialog({ open, onOpenChange }: AddWalletDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <AddWalletDialogContent onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function AddWalletDialogContent({
  onOpenChange,
}: Pick<AddWalletDialogProps, "onOpenChange">) {
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
          onOpenChange(false);
        },
      });
    },
  });

  const handleClose = () => {
    form.reset();
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Wallet</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <AppFieldGroup>
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
              {getErrorMessage(mutation.error, "Failed to add wallet")}
            </p>
          )}
          <AppFormActions>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleClose}
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
                    <Spinner
                      aria-hidden="true"
                      data-icon="inline-start"
                      className="size-3"
                    />
                  )}
                  {mutation.isPending ? "Adding..." : "Add"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </AppFieldGroup>
      </form>
    </DialogContent>
  );
}
