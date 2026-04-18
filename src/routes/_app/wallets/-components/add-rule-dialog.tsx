import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import {
  AppField,
  AppFormActions,
  SelectField,
  TextField,
} from "@/components/composed/form";
import { WalletComboboxField } from "@/components/composed/form/wallet-combobox-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { useAddBalanceRule, useWalletNames } from "../-module/queries";

type SubjectType = "wallet" | "proofshare" | "f05";

interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected subject type from the trigger button */
  initialSubjectType?: SubjectType;
}

const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  wallet: "Wallet Rule",
  proofshare: "SnarkMarket Client Rule",
  f05: "F05 Rule",
};

export function AddRuleDialog({
  open,
  onOpenChange,
  initialSubjectType = "wallet",
}: AddRuleDialogProps) {
  const subjectType = initialSubjectType;
  const { data: walletNames } = useWalletNames();
  const mutation = useAddBalanceRule();
  const form = useForm({
    defaultValues: {
      actionType: "requester",
      highWatermark: "",
      lowWatermark: "",
      second: "",
      subject: "",
    },
    onSubmit: ({ value }) => {
      const subject = value.subject.trim();
      const effectiveActionType =
        subjectType === "wallet" ? value.actionType : "requester";
      const effectiveSecond =
        subjectType === "proofshare" ? subject : value.second.trim();

      mutation.mutate(
        [
          subject,
          effectiveSecond,
          effectiveActionType,
          value.lowWatermark.trim(),
          value.highWatermark.trim(),
          subjectType,
        ],
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    },
  });

  const showSecondField = subjectType === "wallet" || subjectType === "f05";
  const showActionSelect = subjectType === "wallet";

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
          <DialogTitle>Add {SUBJECT_TYPE_LABELS[subjectType]}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="subject"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Subject address is required.",
            }}
          >
            {(field) =>
              subjectType === "wallet" ? (
                <WalletComboboxField
                  field={field}
                  label="Subject Address"
                  placeholder="Select or enter wallet…"
                  required
                  wallets={walletNames}
                />
              ) : (
                <TextField
                  field={field}
                  inputClassName="font-mono text-xs"
                  label="Subject Address"
                  placeholder="f0... or f1... or f3..."
                  required
                />
              )
            }
          </form.Field>

          {showSecondField && (
            <form.Field
              name="second"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Second address is required.",
              }}
            >
              {(field) => (
                <WalletComboboxField
                  field={field}
                  label="Second Address"
                  placeholder="Select or enter wallet…"
                  required
                  wallets={walletNames}
                />
              )}
            </form.Field>
          )}

          {showActionSelect ? (
            <form.Field name="actionType">
              {(field) => (
                <SelectField
                  contentClassName="min-w-56"
                  field={field}
                  label="Action"
                  placeholder="Select action"
                  triggerClassName="text-xs"
                >
                  <SelectItem value="requester">
                    Keep Subject Above Low
                  </SelectItem>
                  <SelectItem value="active-provider">
                    Keep Subject Below High
                  </SelectItem>
                </SelectField>
              )}
            </form.Field>
          ) : (
            <AppField label="Action">
              <Input
                value="Keep Subject Above Low"
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </AppField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="lowWatermark">
              {(field) => (
                <TextField
                  field={field}
                  label="Low Watermark (FIL)"
                  placeholder="e.g. 5"
                />
              )}
            </form.Field>
            <form.Field name="highWatermark">
              {(field) => (
                <TextField
                  field={field}
                  label="High Watermark (FIL)"
                  placeholder="e.g. 10"
                />
              )}
            </form.Field>
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to add rule"}
            </p>
          )}
          <AppFormActions>
            <Button
              variant="outline"
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
                    !values.subject.trim() ||
                    (showSecondField && !values.second.trim())
                  }
                >
                  {mutation.isPending && (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  )}
                  {mutation.isPending ? "Adding..." : "Add Rule"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
