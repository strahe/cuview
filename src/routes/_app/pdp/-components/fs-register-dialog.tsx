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
import { useFsRegister } from "../-module/queries";

interface FsRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FsRegisterDialog({
  open,
  onOpenChange,
}: FsRegisterDialogProps) {
  const mutation = useFsRegister();
  const form = useForm({
    defaultValues: {
      description: "",
      location: "",
      name: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(
        [value.name.trim(), value.description.trim(), value.location.trim()],
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Storage Provider</DialogTitle>
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
                value.trim() ? undefined : "Name is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="Name"
                placeholder="Provider name"
                required
              />
            )}
          </form.Field>
          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Description is required.",
            }}
          >
            {(field) => (
              <TextareaField
                field={field}
                label="Description"
                placeholder="Provider description"
                required
                rows={3}
              />
            )}
          </form.Field>
          <form.Field
            name="location"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Location is required.",
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label="Location"
                placeholder="Geographic location"
                required
              />
            )}
          </form.Field>
          {mutation.isError && (
            <p className="text-sm text-destructive">
              {(mutation.error as Error)?.message ?? "Failed to register"}
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
                    mutation.isPending ||
                    !values.name.trim() ||
                    !values.description.trim() ||
                    !values.location.trim()
                  }
                >
                  {mutation.isPending ? "Registering..." : "Register"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
