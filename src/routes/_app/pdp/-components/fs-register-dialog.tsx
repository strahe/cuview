import { useForm } from "@tanstack/react-form";
import { useEffect, useRef } from "react";
import {
  AppFieldGroup,
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
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/utils/error-log";
import { useFsRegister } from "../-module/queries";

interface FsRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FsRegisterDialog({
  open,
  onOpenChange,
}: FsRegisterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <FsRegisterDialogContent onOpenChange={onOpenChange} /> : null}
    </Dialog>
  );
}

function FsRegisterDialogContent({
  onOpenChange,
}: Pick<FsRegisterDialogProps, "onOpenChange">) {
  const mountedRef = useRef(true);
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
            if (mountedRef.current) {
              form.reset();
              onOpenChange(false);
            }
          },
        },
      );
    },
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleClose = () => {
    form.reset();
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Register Storage Provider</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <AppFieldGroup>
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
              {getErrorMessage(mutation.error, "Failed to register")}
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
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <Button
                  size="sm"
                  type="submit"
                  disabled={
                    mutation.isPending ||
                    !values.name.trim() ||
                    !values.description.trim() ||
                    !values.location.trim()
                  }
                >
                  {mutation.isPending && (
                    <Spinner
                      aria-hidden="true"
                      data-icon="inline-start"
                      className="size-3"
                    />
                  )}
                  {mutation.isPending ? "Registering..." : "Register"}
                </Button>
              )}
            </form.Subscribe>
          </AppFormActions>
        </AppFieldGroup>
      </form>
    </DialogContent>
  );
}
