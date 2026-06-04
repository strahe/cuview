import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { FilPriceInput } from "@/components/composed/fil-price-input";
import {
  AppField,
  AppFieldGroup,
  AppFormActions,
  getFormFieldErrors,
  isFormFieldInvalid,
} from "@/components/composed/form";
import { SizeSelect } from "@/components/composed/size-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { StorageAskTableEntry } from "@/types/market";
import { MAX_PIECE_SIZE_BYTES } from "@/utils/market";
import { useSetStorageAsk } from "../-module/queries";

const DEFAULT_MIN_SIZE = 4 * 1024 ** 3; // 4 GiB
const STORAGE_ASK_EXPIRY_SECONDS = 365 * 24 * 60 * 60;

interface SetAskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: StorageAskTableEntry | null;
}

type SetStorageAskMutation = ReturnType<typeof useSetStorageAsk>;

interface SetAskDialogFormProps {
  entry: StorageAskTableEntry | null;
  mutation: SetStorageAskMutation;
  onClose: () => void;
}

function getSetAskFormSignature(entry: StorageAskTableEntry | null) {
  return entry
    ? [
        entry.id,
        entry.SpID,
        entry.Price,
        entry.VerifiedPrice,
        entry.MinSize,
        entry.MaxSize,
      ].join("\u0000")
    : "empty";
}

function SetAskDialogForm({ entry, mutation, onClose }: SetAskDialogFormProps) {
  const form = useForm({
    defaultValues: {
      price: entry?.Price ?? 0,
      verifiedPrice: entry?.VerifiedPrice ?? 0,
      minSize: entry?.MinSize ?? DEFAULT_MIN_SIZE,
      maxSize: entry?.MaxSize ?? MAX_PIECE_SIZE_BYTES,
    },
    onSubmit: ({ value }) => {
      if (!entry || entry.SpID === null) return;
      const now = Math.floor(Date.now() / 1000);
      mutation.mutate(
        [
          {
            SpID: entry.SpID,
            Price: value.price,
            VerifiedPrice: value.verifiedPrice,
            MinSize: value.minSize ?? DEFAULT_MIN_SIZE,
            MaxSize: value.maxSize ?? MAX_PIECE_SIZE_BYTES,
            CreatedAt: now,
            Expiry: now + STORAGE_ASK_EXPIRY_SECONDS,
          },
        ],
        {
          onSuccess: () => {
            form.reset();
            onClose();
          },
        },
      );
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <AppFieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="minSize">
            {(field) => (
              <AppField
                errors={
                  isFormFieldInvalid(field)
                    ? getFormFieldErrors(field)
                    : undefined
                }
                htmlFor="set-ask-min-size"
                label="Min Size"
              >
                <SizeSelect
                  aria-invalid={isFormFieldInvalid(field) || undefined}
                  id="set-ask-min-size"
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              </AppField>
            )}
          </form.Field>
          <form.Field name="maxSize">
            {(field) => (
              <AppField
                errors={
                  isFormFieldInvalid(field)
                    ? getFormFieldErrors(field)
                    : undefined
                }
                htmlFor="set-ask-max-size"
                label="Max Size"
              >
                <SizeSelect
                  aria-invalid={isFormFieldInvalid(field) || undefined}
                  id="set-ask-max-size"
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              </AppField>
            )}
          </form.Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field name="price">
            {(field) => (
              <AppField
                errors={
                  isFormFieldInvalid(field)
                    ? getFormFieldErrors(field)
                    : undefined
                }
                htmlFor="set-ask-price"
                label="Price"
              >
                <FilPriceInput
                  aria-invalid={isFormFieldInvalid(field) || undefined}
                  id="set-ask-price"
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              </AppField>
            )}
          </form.Field>
          <form.Field name="verifiedPrice">
            {(field) => (
              <AppField
                errors={
                  isFormFieldInvalid(field)
                    ? getFormFieldErrors(field)
                    : undefined
                }
                htmlFor="set-ask-verified-price"
                label="Verified Price"
              >
                <FilPriceInput
                  aria-invalid={isFormFieldInvalid(field) || undefined}
                  id="set-ask-verified-price"
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              </AppField>
            )}
          </form.Field>
        </div>
        {mutation.isError && (
          <p className="text-xs text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to set ask"}
          </p>
        )}
        <AppFormActions>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Spinner data-icon="inline-start" className="size-3" />
            )}
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </AppFormActions>
      </AppFieldGroup>
    </form>
  );
}

export function SetAskDialog({ open, onOpenChange, entry }: SetAskDialogProps) {
  const activeSignatureRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  const sessionKeyRef = useRef(0);
  const mutation = useSetStorageAsk();
  const formSignature = getSetAskFormSignature(entry);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {entry?.hasAsk ? "Edit Storage Ask" : "Set Storage Ask"}
          </DialogTitle>
        </DialogHeader>
        {entry && (
          <div className="mb-2 text-sm">
            <span className="text-muted-foreground">Miner: </span>
            <span className="font-mono text-xs">{entry.Miner}</span>
          </div>
        )}
        <SetAskDialogForm
          key={sessionKeyRef.current}
          entry={entry}
          mutation={mutation}
          onClose={() => handleClose(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
