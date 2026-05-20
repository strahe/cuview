import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useResetMutationOnOpen } from "@/hooks/use-reset-mutation-on-open";
import { useCreateLayerMutation } from "../-module/queries";

interface CreateLayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (name: string) => void;
}

export function CreateLayerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateLayerDialogProps) {
  const mutation = useCreateLayerMutation();
  useResetMutationOnOpen(open, mutation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateLayerDialogContent
          mutation={mutation}
          onCreated={onCreated}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

type CreateLayerMutation = ReturnType<typeof useCreateLayerMutation>;

function CreateLayerDialogContent({
  mutation,
  onOpenChange,
  onCreated,
}: Pick<CreateLayerDialogProps, "onOpenChange" | "onCreated"> & {
  mutation: CreateLayerMutation;
}) {
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<unknown>(null);
  const mountedRef = useRef(true);
  const { error: mutationError, isError, isPending, mutateAsync } = mutation;
  const visibleError = localError ?? (isError ? mutationError : null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed || isPending) return;

    setLocalError(null);
    void mutateAsync(trimmed).then(
      () => {
        if (!mountedRef.current) return;

        onOpenChange(false);
        onCreated?.(trimmed);
      },
      (err: unknown) => {
        if (mountedRef.current) {
          setLocalError(err);
        }
      },
    );
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Layer</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate();
        }}
      >
        <div className="space-y-4 py-2">
          <Input
            placeholder="Layer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {visibleError !== null && (
            <p className="text-sm text-destructive">{String(visibleError)}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isPending}>
            {isPending && (
              <Spinner data-icon="inline-start" className="size-3" />
            )}
            {isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
