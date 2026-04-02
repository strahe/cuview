import { useForm } from "@tanstack/react-form";
import {
  AppFormActions,
  TextareaField,
  TextField,
} from "@/components/composed/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddPdpService } from "../-module/queries";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddServiceDialog({
  open,
  onOpenChange,
}: AddServiceDialogProps) {
  const addMutation = useAddPdpService();
  const form = useForm({
    defaultValues: {
      name: "",
      pubKey: "",
    },
    onSubmit: ({ value }) => {
      addMutation.mutate([value.name.trim(), value.pubKey.trim()], {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    },
  });

  const handleClose = () => {
    form.reset();
    addMutation.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add PDP Service</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Service name is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="Service Name"
                placeholder="Service name"
                required
              />
            )}
          </form.Field>
          <form.Field
            name="pubKey"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Public key is required.",
            }}
          >
            {(field) => (
              <TextareaField
                field={field}
                label="Public Key (PEM format)"
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                required
                rows={5}
                textareaClassName="font-mono text-xs"
              />
            )}
          </form.Field>
          {addMutation.isError && (
            <p className="text-sm text-destructive">
              {(addMutation.error as Error)?.message ?? "Failed to add service"}
            </p>
          )}
          <AppFormActions>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <Button
                  type="submit"
                  disabled={
                    addMutation.isPending ||
                    !values.name.trim() ||
                    !values.pubKey.trim()
                  }
                >
                  {addMutation.isPending ? "Adding..." : "Add Service"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
