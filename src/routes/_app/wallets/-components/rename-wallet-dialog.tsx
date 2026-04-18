import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { AppFormActions, TextField } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  mutationPending: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

function RenameWalletDialogForm({
  address,
  currentName,
  mutationPending,
  onCancel,
  onSubmit,
}: RenameWalletDialogFormProps) {
  const form = useForm({
    defaultValues: {
      name: currentName,
    },
    onSubmit: ({ value }) => {
      onSubmit(value.name.trim());
    },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="font-mono text-xs text-muted-foreground">{address}</div>
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
      <AppFormActions>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.values.name}>
          {(name) => (
            <Button
              size="sm"
              type="submit"
              disabled={mutationPending || !name.trim()}
            >
              {mutationPending && (
                <Loader2 className="mr-1 size-3 animate-spin" />
              )}
              {mutationPending ? "Saving..." : "Save"}
            </Button>
          )}
        </form.Subscribe>
      </AppFormActions>
    </form>
  );
}

export function RenameWalletDialog({
  open,
  address,
  currentName,
  onOpenChange,
}: RenameWalletDialogProps) {
  const formSignature = `${address}\u0000${currentName}`;
  const activeSignatureRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  const sessionKeyRef = useRef(0);
  const mutation = useRenameWallet();
  if (open) {
    if (!wasOpenRef.current || activeSignatureRef.current !== formSignature) {
      wasOpenRef.current = true;
      activeSignatureRef.current = formSignature;
      sessionKeyRef.current += 1;
    }
  } else if (wasOpenRef.current) {
    wasOpenRef.current = false;
    activeSignatureRef.current = null;
  }

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
        {open ? (
          <RenameWalletDialogForm
            key={sessionKeyRef.current}
            address={address}
            currentName={currentName}
            mutationPending={mutation.isPending}
            onCancel={() => handleClose(false)}
            onSubmit={(name) => {
              mutation.mutate([address, name], {
                onSuccess: () => onOpenChange(false),
              });
            }}
          />
        ) : null}
        {mutation.isError && (
          <p className="text-xs text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to rename"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
