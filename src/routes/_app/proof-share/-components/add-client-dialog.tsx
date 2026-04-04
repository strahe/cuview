import { useForm } from "@tanstack/react-form";
import {
  AppFormActions,
  CheckboxField,
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
import { useWalletNames } from "@/routes/_app/wallets/-module/queries";
import { usePsClientSet } from "../-module/queries";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const { data: walletNames } = useWalletNames();
  const clientSetMutation = usePsClientSet();
  const form = useForm({
    defaultValues: {
      address: "",
      wallet: "",
      minimumPending: "300",
      doPoRep: true,
      doSnap: true,
      price: "0",
    },
    onSubmit: ({ value }) => {
      const address = value.address.trim();
      const wallet = value.wallet.trim();
      const parsedMinimumPending = Number.parseInt(value.minimumPending, 10);

      clientSetMutation.mutate(
        [
          {
            address,
            enabled: true,
            wallet: { Valid: wallet.length > 0, String: wallet },
            minimum_pending_seconds: Number.isNaN(parsedMinimumPending)
              ? 300
              : parsedMinimumPending,
            do_porep: value.doPoRep,
            do_snap: value.doSnap,
            price: value.price.trim() || "0",
          },
        ],
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        },
      );
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
      clientSetMutation.reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="address"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "SP address is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="SP Address"
                placeholder="f01234..."
                required
              />
            )}
          </form.Field>

          <form.Field name="wallet">
            {(field) => (
              <WalletComboboxField
                field={field}
                label="Wallet"
                placeholder="Select or enter wallet…"
                wallets={walletNames}
              />
            )}
          </form.Field>

          <form.Field name="price">
            {(field) => (
              <TextField
                description="Curio parses this value as FIL per proof."
                field={field}
                label="Price (FIL/p)"
                min="0"
                placeholder="0.005"
                step="any"
                type="number"
              />
            )}
          </form.Field>

          <form.Field name="minimumPending">
            {(field) => (
              <TextField
                field={field}
                label="Min Pending (seconds)"
                type="number"
              />
            )}
          </form.Field>

          <div className="flex gap-4">
            <form.Field name="doPoRep">
              {(field) => (
                <CheckboxField field={field} id="do-porep" label="PoRep" />
              )}
            </form.Field>
            <form.Field name="doSnap">
              {(field) => (
                <CheckboxField field={field} id="do-snap" label="Snap" />
              )}
            </form.Field>
          </div>

          <AppFormActions className="pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.values.address}>
              {(address) => (
                <Button
                  type="submit"
                  disabled={clientSetMutation.isPending || !address.trim()}
                >
                  Add
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
