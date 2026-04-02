import { useForm } from "@tanstack/react-form";
import { TextField } from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMoveToEscrow } from "../-module/queries";

export function MoveToEscrowForm() {
  const mutation = useMoveToEscrow();
  const form = useForm({
    defaultValues: {
      amount: "",
      miner: "",
      wallet: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(
        [
          value.miner.trim(),
          value.amount.trim(),
          value.wallet.trim() || undefined,
        ],
        {
          onSuccess: () => {
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Move Balance to Escrow</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <form.Field
              name="miner"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Miner is required.",
              }}
            >
              {(field) => (
                <TextField
                  field={field}
                  inputClassName="font-mono text-xs"
                  label="Miner"
                  placeholder="f0..."
                  required
                />
              )}
            </form.Field>
            <form.Field
              name="amount"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Amount is required.",
              }}
            >
              {(field) => (
                <TextField
                  field={field}
                  label="Amount (FIL)"
                  placeholder="0.1"
                  required
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
          </div>
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <Button
                size="sm"
                type="submit"
                disabled={
                  mutation.isPending ||
                  !values.miner.trim() ||
                  !values.amount.trim()
                }
              >
                {mutation.isPending ? "Sending..." : "Transfer"}
              </Button>
            )}
          </form.Subscribe>
        </form>
        {mutation.isError && (
          <p className="mt-2 text-xs text-destructive">
            {(mutation.error as Error)?.message ?? "Transfer failed"}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="mt-2 text-xs text-success">Transfer submitted</p>
        )}
      </CardContent>
    </Card>
  );
}
