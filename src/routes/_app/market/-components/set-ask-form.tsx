import { useForm } from "@tanstack/react-form";
import { Edit2 } from "lucide-react";
import { FilPriceInput } from "@/components/composed/fil-price-input";
import {
  AppField,
  getFormFieldErrors,
  isFormFieldInvalid,
  TextField,
} from "@/components/composed/form";
import { SizeSelect } from "@/components/composed/size-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StorageAsk } from "@/types/market";
import { DEFAULT_PIECE_SIZE_BYTES, MAX_PIECE_SIZE_BYTES } from "@/utils/market";
import { useSetStorageAsk } from "../-module/queries";

const DEFAULT_MIN_SIZE = 4 * 1024 ** 3; // 4 GiB

interface SetAskFormProps {
  currentAsk?: StorageAsk;
}

interface SetAskFormFieldsProps {
  currentAsk?: StorageAsk;
  mutationPending: boolean;
  onSubmit: (values: {
    maxSize: number;
    minSize: number;
    miner: string;
    price: number;
    verifiedPrice: number;
  }) => void;
}

function SetAskFormFields({
  currentAsk,
  mutationPending,
  onSubmit,
}: SetAskFormFieldsProps) {
  const form = useForm({
    defaultValues: {
      maxSize: currentAsk?.MaxSize ?? MAX_PIECE_SIZE_BYTES,
      minSize: currentAsk?.MinSize ?? DEFAULT_MIN_SIZE,
      miner: currentAsk?.Miner ?? "",
      price: currentAsk?.Price ?? 0,
      verifiedPrice: currentAsk?.VerifiedPrice ?? 0,
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
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
        <form.Field name="minSize">
          {(field) => (
            <AppField
              errors={
                isFormFieldInvalid(field)
                  ? getFormFieldErrors(field)
                  : undefined
              }
              htmlFor="set-ask-min-size"
              label="Min Size"
            >
              <SizeSelect
                aria-invalid={isFormFieldInvalid(field) || undefined}
                id="set-ask-min-size"
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            </AppField>
          )}
        </form.Field>
        <form.Field name="maxSize">
          {(field) => (
            <AppField
              errors={
                isFormFieldInvalid(field)
                  ? getFormFieldErrors(field)
                  : undefined
              }
              htmlFor="set-ask-max-size"
              label="Max Size"
            >
              <SizeSelect
                aria-invalid={isFormFieldInvalid(field) || undefined}
                id="set-ask-max-size"
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            </AppField>
          )}
        </form.Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="price">
          {(field) => (
            <AppField
              errors={
                isFormFieldInvalid(field)
                  ? getFormFieldErrors(field)
                  : undefined
              }
              htmlFor="set-ask-price"
              label="Price"
            >
              <FilPriceInput
                aria-invalid={isFormFieldInvalid(field) || undefined}
                id="set-ask-price"
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            </AppField>
          )}
        </form.Field>
        <form.Field name="verifiedPrice">
          {(field) => (
            <AppField
              errors={
                isFormFieldInvalid(field)
                  ? getFormFieldErrors(field)
                  : undefined
              }
              htmlFor="set-ask-verified-price"
              label="Verified Price"
            >
              <FilPriceInput
                aria-invalid={isFormFieldInvalid(field) || undefined}
                id="set-ask-verified-price"
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            </AppField>
          )}
        </form.Field>
      </div>
      <form.Subscribe selector={(state) => state.values.miner}>
        {(miner) => (
          <Button
            size="sm"
            type="submit"
            disabled={mutationPending || !miner.trim()}
          >
            {mutationPending ? "Saving..." : "Set Ask"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export function SetAskForm({ currentAsk }: SetAskFormProps) {
  const mutation = useSetStorageAsk();
  const currentAskKey = [
    currentAsk?.MaxSize ?? MAX_PIECE_SIZE_BYTES,
    currentAsk?.MinSize ?? DEFAULT_MIN_SIZE,
    currentAsk?.Miner ?? "",
    currentAsk?.Price ?? 0,
    currentAsk?.VerifiedPrice ?? 0,
  ].join(":");

  const handleSubmit = (values: {
    maxSize: number;
    minSize: number;
    miner: string;
    price: number;
    verifiedPrice: number;
  }) => {
    const spID = Number.parseInt(values.miner.replace(/^[ftFT]0*/, ""), 10);
    if (Number.isNaN(spID)) return;
    const now = Math.floor(Date.now() / 1000);
    mutation.mutate([
      {
        SpID: spID,
        Price: values.price,
        VerifiedPrice: values.verifiedPrice,
        MinSize: values.minSize || DEFAULT_MIN_SIZE,
        MaxSize: values.maxSize || DEFAULT_PIECE_SIZE_BYTES,
        CreatedAt: now,
        Expiry: now + 365 * 24 * 60 * 60,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Edit2 className="size-4" /> Set Storage Ask
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SetAskFormFields
          key={currentAskKey}
          currentAsk={currentAsk}
          mutationPending={mutation.isPending}
          onSubmit={handleSubmit}
        />
        {mutation.isError && (
          <p className="mt-2 text-sm text-destructive">
            {(mutation.error as Error)?.message ?? "Failed to set ask"}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="mt-2 text-sm text-success">Ask updated</p>
        )}
      </CardContent>
    </Card>
  );
}
