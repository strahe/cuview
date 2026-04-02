import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
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
  mutationPending: boolean;
  onCancel: () => void;
  onSubmit: (values: { description: string; name: string }) => void;
}

function FsUpdateProviderDialogForm({
  currentDescription,
  currentName,
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
      <AppFormActions>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutationPending}>
          {mutationPending ? "Updating..." : "Update"}
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
  const wasOpenRef = useRef(false);
  const sessionKeyRef = useRef(0);
  const mutation = useFsUpdateProvider();
  if (open && !wasOpenRef.current) {
    wasOpenRef.current = true;
    sessionKeyRef.current += 1;
    mutation.reset();
  } else if (!open && wasOpenRef.current) {
    wasOpenRef.current = false;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Provider Info</DialogTitle>
        </DialogHeader>
        {open ? (
          <FsUpdateProviderDialogForm
            key={sessionKeyRef.current}
            currentDescription={currentDescription}
            currentName={currentName}
            mutationPending={mutation.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={(value) => {
              mutation.mutate([value.name.trim(), value.description.trim()], {
                onSuccess: () => onOpenChange(false),
              });
            }}
          />
        ) : null}
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to update provider"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
