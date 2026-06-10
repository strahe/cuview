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
  onOpenChange: (open: boolean) => void;
  ruleId: number;
}

function EditRuleDialogForm({
  currentHigh,
  currentLow,
  onOpenChange,
  ruleId,
}: EditRuleDialogFormProps) {
  const mutation = useUpdateBalanceRule();
  const form = useForm({
    defaultValues: {
      lowWatermark: currentLow,
      highWatermark: currentHigh,
    },
    onSubmit: ({ value }) => {
      mutation.mutate(
        [ruleId, value.lowWatermark.trim(), value.highWatermark.trim()],
        {
          onSuccess: () => onOpenChange(false),
        },
      );
    },
  });

  const handleClose = () => {
    form.reset();
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Edit Rule #{ruleId}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <AppFieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="lowWatermark">
              {(field) => (
                <TextField field={field} label="Low Watermark (FIL)" />
              )}
            </form.Field>
            <form.Field name="highWatermark">
              {(field) => (
                <TextField field={field} label="High Watermark (FIL)" />
              )}
            </form.Field>
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {getErrorMessage(mutation.error, "Failed to update")}
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
            <Button size="sm" type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Spinner
                  aria-hidden="true"
                  data-icon="inline-start"
                  className="size-3"
                />
              )}
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </AppFormActions>
        </AppFieldGroup>
      </form>
    </DialogContent>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EditRuleDialogForm
          key={formSignature}
          currentHigh={currentHigh}
          currentLow={currentLow}
          onOpenChange={onOpenChange}
          ruleId={ruleId}
        />
      ) : null}
    </Dialog>
  );
}
