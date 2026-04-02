import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import {
  AppFormActions,
  CheckboxField,
  TextField,
} from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { unwrapSqlNullableString } from "@/utils/sql";
import { usePsSetMeta } from "../-module/queries";
import type { PsMeta } from "../-module/types";

interface ProviderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: PsMeta | undefined;
}

interface ProviderSettingsDialogFormProps {
  meta: PsMeta | undefined;
  mutationPending: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    enabled: boolean;
    price: string;
    wallet: string;
  }) => void;
}

function ProviderSettingsDialogForm({
  meta,
  mutationPending,
  onCancel,
  onSubmit,
}: ProviderSettingsDialogFormProps) {
  const form = useForm({
    defaultValues: {
      enabled: meta?.enabled ?? false,
      wallet: unwrapSqlNullableString(meta?.wallet) || "",
      price: meta?.price || "0",
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
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
      <form.Field name="enabled">
        {(field) => (
          <CheckboxField field={field} id="ps-enabled" label="Enabled" />
        )}
      </form.Field>

      <form.Field name="wallet">
        {(field) => (
          <TextField
            field={field}
            label="Wallet"
            placeholder="Wallet address"
          />
        )}
      </form.Field>

      <form.Field name="price">
        {(field) => (
          <TextField
            description="Curio stores this value as a FIL amount per proof."
            field={field}
            label="Price (FIL/p)"
            min="0"
            placeholder="0.005"
            step="any"
            type="number"
          />
        )}
      </form.Field>

      <AppFormActions className="pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutationPending}>
          Save
        </Button>
      </AppFormActions>
    </form>
  );
}

export function ProviderSettingsDialog({
  open,
  onOpenChange,
  meta,
}: ProviderSettingsDialogProps) {
  const wasOpenRef = useRef(false);
  const sessionKeyRef = useRef(0);

  const setMetaMutation = usePsSetMeta();

  if (open && !wasOpenRef.current) {
    wasOpenRef.current = true;
    sessionKeyRef.current += 1;
  } else if (!open && wasOpenRef.current) {
    wasOpenRef.current = false;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provider Settings</DialogTitle>
        </DialogHeader>
        {open ? (
          <ProviderSettingsDialogForm
            key={sessionKeyRef.current}
            meta={meta}
            mutationPending={setMetaMutation.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={(value) => {
              setMetaMutation.mutate(
                [value.enabled, value.wallet.trim(), value.price.trim() || "0"],
                {
                  onSuccess: () => {
                    onOpenChange(false);
                  },
                },
              );
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
