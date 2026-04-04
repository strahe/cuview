import { useForm } from "@tanstack/react-form";
import { AppFormActions, TextField } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMoveToEscrow } from "../-module/queries";

function getAmountValidationError(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Amount is required.";
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "Amount must be a positive number.";
  }

  return undefined;
}

interface MoveToEscrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  miner: string;
}

export function MoveToEscrowDialog({
  open,
  onOpenChange,
  miner,
}: MoveToEscrowDialogProps) {
  const mutation = useMoveToEscrow();
  const form = useForm({
    defaultValues: {
      amount: "",
      wallet: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(
        [miner, value.amount.trim(), value.wallet.trim() || undefined],
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
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
          <DialogTitle>Move Balance to Escrow</DialogTitle>
        </DialogHeader>
        <div className="mb-2 text-sm">
          <span className="text-muted-foreground">Miner: </span>
          <span className="font-mono text-xs">{miner}</span>
        </div>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="amount"
            validators={{
              onChange: ({ value }) => getAmountValidationError(value),
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="Amount (FIL)"
                placeholder="0.1"
                required
                min="0"
                step="any"
                type="number"
              />
            )}
          </form.Field>
          <form.Field name="wallet">
            {(field) => (
              <TextField
                field={field}
                inputClassName="font-mono text-xs"
                label="Wallet (optional)"
                placeholder="f1... or f3..."
              />
            )}
          </form.Field>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as Error)?.message ?? "Transfer failed"}
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
                    getAmountValidationError(values.amount) !== undefined
                  }
                >
                  {mutation.isPending ? "Sending..." : "Transfer"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
