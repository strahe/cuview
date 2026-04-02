import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { AppFormActions, TextField } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateBalanceRule } from "../-module/queries";

interface EditRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId: number;
  currentLow: string;
  currentHigh: string;
}

interface EditRuleDialogFormProps {
  currentHigh: string;
  currentLow: string;
  mutationPending: boolean;
  onCancel: () => void;
  onSubmit: (values: { highWatermark: string; lowWatermark: string }) => void;
}

function EditRuleDialogForm({
  currentHigh,
  currentLow,
  mutationPending,
  onCancel,
  onSubmit,
}: EditRuleDialogFormProps) {
  const form = useForm({
    defaultValues: {
      lowWatermark: currentLow,
      highWatermark: currentHigh,
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
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="lowWatermark">
          {(field) => <TextField field={field} label="Low Watermark (FIL)" />}
        </form.Field>
        <form.Field name="highWatermark">
          {(field) => <TextField field={field} label="High Watermark (FIL)" />}
        </form.Field>
      </div>
      <AppFormActions>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" type="submit" disabled={mutationPending}>
          {mutationPending ? "Saving..." : "Save"}
        </Button>
      </AppFormActions>
    </form>
  );
}

export function EditRuleDialog({
  open,
  onOpenChange,
  ruleId,
  currentLow,
  currentHigh,
}: EditRuleDialogProps) {
  const formSignature = `${ruleId}\u0000${currentLow}\u0000${currentHigh}`;
  const activeSignatureRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  const sessionKeyRef = useRef(0);
  const mutation = useUpdateBalanceRule();
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Rule #{ruleId}</DialogTitle>
        </DialogHeader>
        {open ? (
          <EditRuleDialogForm
            key={sessionKeyRef.current}
            currentHigh={currentHigh}
            currentLow={currentLow}
            mutationPending={mutation.isPending}
            onCancel={() => handleClose(false)}
            onSubmit={(value) => {
              mutation.mutate(
                [ruleId, value.lowWatermark.trim(), value.highWatermark.trim()],
                {
                  onSuccess: () => onOpenChange(false),
                },
              );
            }}
          />
        ) : null}
        {mutation.isError && (
          <p className="text-xs text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to update"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
