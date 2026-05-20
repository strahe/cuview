import { useForm } from "@tanstack/react-form";
import { useEffect, useRef } from "react";
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
import { useResetMutationOnOpen } from "@/hooks/use-reset-mutation-on-open";
import { useFsUpdateProvider } from "../-module/queries";

interface FsUpdateProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentDescription: string;
}

interface FsUpdateProviderDialogFormProps {
  currentDescription: string;
  currentName: string;
  mutationError: unknown;
  mutationIsError: boolean;
  mutationPending: boolean;
  onCancel: () => void;
  onSubmit: (values: { description: string; name: string }) => void;
}

function FsUpdateProviderDialogForm({
  currentDescription,
  currentName,
  mutationError,
  mutationIsError,
  mutationPending,
  onCancel,
  onSubmit,
}: FsUpdateProviderDialogFormProps) {
  const form = useForm({
    defaultValues: {
      description: currentDescription,
      name: currentName,
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
            disabled={mutationPending}
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
            disabled={mutationPending}
          />
        )}
      </form.Field>
      {mutationIsError && (
        <p className="text-sm text-destructive">
          {(mutationError as Error)?.message ?? "Failed to update provider"}
        </p>
      )}
      <AppFormActions>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutationPending}>
          {mutationPending ? "Updating…" : "Update"}
        </Button>
      </AppFormActions>
    </form>
  );
}

export function FsUpdateProviderDialog({
  open,
  onOpenChange,
  currentName,
  currentDescription,
}: FsUpdateProviderDialogProps) {
  const mutation = useFsUpdateProvider();
  useResetMutationOnOpen(open, mutation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <FsUpdateProviderDialogContent
          currentDescription={currentDescription}
          currentName={currentName}
          mutation={mutation}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

type FsUpdateProviderMutation = ReturnType<typeof useFsUpdateProvider>;

function FsUpdateProviderDialogContent({
  mutation,
  onOpenChange,
  currentName,
  currentDescription,
}: Omit<FsUpdateProviderDialogProps, "open"> & {
  mutation: FsUpdateProviderMutation;
}) {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Update Provider Info</DialogTitle>
      </DialogHeader>
      <FsUpdateProviderDialogForm
        currentDescription={currentDescription}
        currentName={currentName}
        mutationError={mutation.error}
        mutationIsError={mutation.isError}
        mutationPending={mutation.isPending}
        onCancel={() => onOpenChange(false)}
        onSubmit={(value) => {
          if (mutation.isPending) return;

          mutation.mutate([value.name.trim(), value.description.trim()], {
            onSuccess: () => {
              if (mountedRef.current) {
                onOpenChange(false);
              }
            },
          });
        }}
      />
    </DialogContent>
  );
}
