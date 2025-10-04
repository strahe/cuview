<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useForm } from "@tanstack/vue-form";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormLayout,
  FormSection,
  FormGrid,
  FormFieldWrapper,
  FormInput,
  FormSelect,
  FormActions,
} from "@/components/ui/form";
import {
  attoFilToFilPerTiBPerMonth,
  filToAttoFilPerGiBPerEpoch,
  generateSizeOptions,
  DEFAULT_PIECE_SIZE_BYTES,
} from "@/utils/market";
import type { StorageAsk } from "@/types/market";

interface Props {
  visible: boolean;
  spId: number;
  initialAsk?: StorageAsk | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialAsk: null,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [ask: Partial<StorageAsk>];
  cancel: [];
}>();

const sizeOptions = generateSizeOptions();

type StorageAskFormValues = {
  priceFilPerTiB: string;
  verifiedPriceFilPerTiB: string;
  minSize: number;
  maxSize: number;
};

const createDefaultValues = (): StorageAskFormValues => ({
  priceFilPerTiB: "",
  verifiedPriceFilPerTiB: "",
  minSize: DEFAULT_PIECE_SIZE_BYTES,
  maxSize: DEFAULT_PIECE_SIZE_BYTES,
});

const submissionError = ref<string | null>(null);

const storageAskForm = useForm({
  defaultValues: createDefaultValues(),
  onSubmit: async ({ value }) => {
    submissionError.value = null;

    if (props.spId <= 0) {
      submissionError.value = "Storage provider ID is required.";
      return;
    }

    const price = Number.parseFloat(value.priceFilPerTiB);
    const verifiedPrice = Number.parseFloat(value.verifiedPriceFilPerTiB);

    if (Number.isNaN(price) || Number.isNaN(verifiedPrice)) {
      submissionError.value = "Please enter valid price values.";
      return;
    }

    emit("save", {
      SpID: props.spId,
      Price: filToAttoFilPerGiBPerEpoch(price),
      VerifiedPrice: filToAttoFilPerGiBPerEpoch(verifiedPrice),
      MinSize: value.minSize,
      MaxSize: value.maxSize,
      Sequence: props.initialAsk?.Sequence,
      Miner: props.initialAsk?.Miner,
    });

    emit("update:visible", false);
  },
});

const isSubmitting = storageAskForm.useStore((state) => state.isSubmitting);
const canSubmit = storageAskForm.useStore((state) => state.canSubmit);
const priceValue = storageAskForm.useStore(
  (state) => state.values.priceFilPerTiB,
);
const verifiedPriceValue = storageAskForm.useStore(
  (state) => state.values.verifiedPriceFilPerTiB,
);
const minSizeValue = storageAskForm.useStore((state) => state.values.minSize);
const maxSizeValue = storageAskForm.useStore((state) => state.values.maxSize);

const priceAttoFil = computed(() => {
  const parsed = Number.parseFloat(priceValue.value);
  if (Number.isNaN(parsed)) return "0";
  return filToAttoFilPerGiBPerEpoch(parsed).toString();
});

const verifiedPriceAttoFil = computed(() => {
  const parsed = Number.parseFloat(verifiedPriceValue.value);
  if (Number.isNaN(parsed)) return "0";
  return filToAttoFilPerGiBPerEpoch(parsed).toString();
});

const isSpIdValid = computed(() => props.spId > 0);

const modalTitle = computed(() => {
  const action = props.initialAsk ? "Update" : "Set";
  return props.spId > 0
    ? `${action} Storage Ask - SP f0${props.spId}`
    : `${action} Storage Ask`;
});

const toNumber = (value: string | number) => {
  if (value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const priceValidators = {
  onChange: ({ value }: { value: string }) => {
    if (!value) return "Price is required";
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return "Enter a valid number";
    if (parsed < 0) return "Price cannot be negative";
    return undefined;
  },
};

const verifiedPriceValidators = {
  onChange: ({ value }: { value: string }) => {
    if (!value) return "Verified price is required";
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return "Enter a valid number";
    if (parsed < 0) return "Verified price cannot be negative";
    return undefined;
  },
};

const minSizeValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value <= 0) {
      return "Min size must be greater than zero";
    }
    if (value > maxSizeValue.value) {
      return "Min size cannot exceed max size";
    }
    return undefined;
  },
};

const maxSizeValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value <= 0) {
      return "Max size must be greater than zero";
    }
    if (value < minSizeValue.value) {
      return "Max size cannot be less than min size";
    }
    return undefined;
  },
};

watch(
  () => [props.visible, props.initialAsk, props.spId],
  ([visible]) => {
    if (!visible) return;

    submissionError.value = null;

    const defaults = createDefaultValues();

    const nextValues: StorageAskFormValues = props.initialAsk
      ? {
          priceFilPerTiB: props.initialAsk.Price
            ? attoFilToFilPerTiBPerMonth(props.initialAsk.Price)
            : defaults.priceFilPerTiB,
          verifiedPriceFilPerTiB: props.initialAsk.VerifiedPrice
            ? attoFilToFilPerTiBPerMonth(props.initialAsk.VerifiedPrice)
            : defaults.verifiedPriceFilPerTiB,
          minSize:
            props.initialAsk.MinSize && props.initialAsk.MinSize > 0
              ? props.initialAsk.MinSize
              : defaults.minSize,
          maxSize:
            props.initialAsk.MaxSize && props.initialAsk.MaxSize > 0
              ? props.initialAsk.MaxSize
              : defaults.maxSize,
        }
      : defaults;

    storageAskForm.reset(nextValues);
  },
  { immediate: true },
);

const handleClose = () => {
  submissionError.value = null;
  emit("cancel");
  emit("update:visible", false);
};
</script>

<template>
  <BaseModal
    :open="visible"
    :title="modalTitle"
    size="lg"
    :modal="true"
    :show-close-button="!isSubmitting"
    @close="handleClose"
  >
    <FormLayout>
      <FormSection title="Storage Provider">
        <FormFieldWrapper label="Provider">
          <template v-if="isSpIdValid">
            <p class="font-mono text-sm">f0{{ props.spId }}</p>
          </template>
          <template v-else>
            <p class="text-error text-sm">
              Select a storage provider before configuring the ask.
            </p>
          </template>
        </FormFieldWrapper>
      </FormSection>

      <FormSection title="Pricing">
        <FormGrid :columns="2">
          <FormInput
            :form="storageAskForm"
            name="priceFilPerTiB"
            type="number"
            label="Price (FIL/TiB/Month)"
            placeholder="0.00000000"
            input-class="font-mono"
            :disabled="isSubmitting"
            :validators="priceValidators"
          >
            <template #hint>
              <p class="text-base-content/60 text-xs">
                ≈ {{ priceAttoFil }} attoFIL/GiB/Epoch
              </p>
            </template>
          </FormInput>

          <FormInput
            :form="storageAskForm"
            name="verifiedPriceFilPerTiB"
            type="number"
            label="Verified Price (FIL/TiB/Month)"
            placeholder="0.00000000"
            input-class="font-mono"
            :disabled="isSubmitting"
            :validators="verifiedPriceValidators"
          >
            <template #hint>
              <p class="text-base-content/60 text-xs">
                ≈ {{ verifiedPriceAttoFil }} attoFIL/GiB/Epoch
              </p>
            </template>
          </FormInput>
        </FormGrid>
      </FormSection>

      <FormSection title="Piece Size">
        <FormGrid :columns="2">
          <FormSelect
            :form="storageAskForm"
            name="minSize"
            label="Min Piece Size"
            :options="sizeOptions"
            :disabled="isSubmitting"
            :normalize="toNumber"
            :validators="minSizeValidators"
          />
          <FormSelect
            :form="storageAskForm"
            name="maxSize"
            label="Max Piece Size"
            :options="sizeOptions"
            :disabled="isSubmitting"
            :normalize="toNumber"
            :validators="maxSizeValidators"
          />
        </FormGrid>
      </FormSection>

      <p v-if="submissionError" class="text-error text-sm">
        {{ submissionError }}
      </p>
    </FormLayout>

    <template #footer>
      <FormActions>
        <button
          class="btn btn-sm btn-outline"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          class="btn btn-sm btn-primary"
          :disabled="isSubmitting || !canSubmit || !isSpIdValid"
          @click="storageAskForm.handleSubmit"
        >
          <span
            v-if="isSubmitting"
            class="loading loading-spinner loading-xs"
          ></span>
          Save
        </button>
      </FormActions>
    </template>
  </BaseModal>
</template>
