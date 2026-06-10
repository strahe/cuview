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
import { useRenameWallet } from "../-module/queries";

interface RenameWalletDialogProps {
  open: boolean;
  address: string;
  currentName: string;
  onOpenChange: (open: boolean) => void;
}

interface RenameWalletDialogFormProps {
  address: string;
  currentName: string;
  onOpenChange: (open: boolean) => void;
}

function RenameWalletDialogForm({
  address,
  currentName,
  onOpenChange,
}: RenameWalletDialogFormProps) {
  const mutation = useRenameWallet();
  const form = useForm({
    defaultValues: {
      name: currentName,
    },
    onSubmit: ({ value }) => {
      mutation.mutate([address, value.name.trim()], {
        onSuccess: () => onOpenChange(false),
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
        <DialogTitle>Rename Wallet</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <AppFieldGroup>
          <div className="font-mono text-xs text-muted-foreground">
            {address}
          </div>
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "New name is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="New Name"
                placeholder="Wallet name"
                required
              />
            )}
          </form.Field>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {getErrorMessage(mutation.error, "Failed to rename")}
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
            <form.Subscribe selector={(state) => state.values.name}>
              {(name) => (
                <Button
                  size="sm"
                  type="submit"
                  disabled={mutation.isPending || !name.trim()}
                >
                  {mutation.isPending && (
                    <Spinner
                      aria-hidden="true"
                      data-icon="inline-start"
                      className="size-3"
                    />
                  )}
                  {mutation.isPending ? "Saving..." : "Save"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </AppFieldGroup>
      </form>
    </DialogContent>
  );
}

export function RenameWalletDialog({
  open,
  address,
  currentName,
  onOpenChange,
}: RenameWalletDialogProps) {
  const formSignature = `${address}\u0000${currentName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <RenameWalletDialogForm
          key={formSignature}
          address={address}
          currentName={currentName}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}
