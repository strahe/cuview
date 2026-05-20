import { useCallback, useEffect, useRef, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/composed/form";
import { SizeSelect } from "@/components/composed/size-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useFsUpdatePdp } from "../-module/queries";
import type { FSPDPOffering } from "../-module/types";

interface FsUpdatePdpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: FSPDPOffering | null;
}

const defaultOffering: FSPDPOffering = {
  service_url: "",
  min_size: 127,
  max_size: 34359738368, // 32 GiB
  ipni_piece: true,
  ipni_ipfs: false,
  ipni_peer_id: "",
  price: 0,
  min_proving_period: 0,
  location: "",
  payment_token_address: "",
};

export function FsUpdatePdpDialog({
  open,
  onOpenChange,
  current,
}: FsUpdatePdpDialogProps) {
  const mutation = useFsUpdatePdp();
  useResetMutationOnOpen(open, mutation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <FsUpdatePdpDialogContent
          current={current}
          mutation={mutation}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

type FsUpdatePdpMutation = ReturnType<typeof useFsUpdatePdp>;

function FsUpdatePdpDialogContent({
  mutation,
  onOpenChange,
  current,
}: Pick<FsUpdatePdpDialogProps, "current" | "onOpenChange"> & {
  mutation: FsUpdatePdpMutation;
}) {
  const [form, setForm] = useState<FSPDPOffering>(current ?? defaultOffering);
  const mountedRef = useRef(true);
  const { error, isError, isPending, mutate } = mutation;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof FSPDPOffering>(key: K, value: FSPDPOffering[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!form.service_url.trim() || isPending) return;
    mutate([form, null], {
      onSuccess: () => {
        if (mountedRef.current) {
          onOpenChange(false);
        }
      },
    });
  }, [form, isPending, mutate, onOpenChange]);

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Update PDP Offering</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Service URL *</FieldLabel>
            <Input
              value={form.service_url}
              onChange={(e) => updateField("service_url", e.target.value)}
              placeholder="https://example.com/pdp"
              disabled={isPending}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Min Piece Size</FieldLabel>
              <SizeSelect
                value={form.min_size}
                onChange={(v) => updateField("min_size", v)}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel>Max Piece Size</FieldLabel>
              <SizeSelect
                value={form.max_size}
                onChange={(v) => updateField("max_size", v)}
                disabled={isPending}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Price (per TiB/day)</FieldLabel>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                min={0}
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel>Min Proving Period (epochs)</FieldLabel>
              <Input
                type="number"
                value={form.min_proving_period}
                onChange={(e) =>
                  updateField("min_proving_period", Number(e.target.value))
                }
                min={0}
                disabled={isPending}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Location</FieldLabel>
            <Input
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Geographic location"
              maxLength={128}
              disabled={isPending}
            />
          </Field>

          <div className="flex items-center gap-4">
            <FieldLabel className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.ipni_piece}
                onCheckedChange={(v) => updateField("ipni_piece", !!v)}
                disabled={isPending}
              />
              IPNI Piece
            </FieldLabel>
            <FieldLabel className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.ipni_ipfs}
                onCheckedChange={(v) => updateField("ipni_ipfs", !!v)}
                disabled={isPending}
              />
              IPNI IPFS
            </FieldLabel>
          </div>

          <Field>
            <FieldLabel>Payment Token Address</FieldLabel>
            <Input
              value={form.payment_token_address}
              onChange={(e) =>
                updateField("payment_token_address", e.target.value)
              }
              placeholder="0x… (defaults to USDFC)"
              className="font-mono text-xs"
              disabled={isPending}
            />
          </Field>
        </FieldGroup>
        {isError && (
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to update PDP"}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || !form.service_url.trim()}
          >
            {isPending && (
              <Spinner data-icon="inline-start" className="size-3" />
            )}
            {isPending ? "Updating…" : "Update PDP"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
