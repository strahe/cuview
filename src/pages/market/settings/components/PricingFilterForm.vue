<script setup lang="ts">
import { computed, watch } from "vue";
import { useForm } from "@tanstack/vue-form";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormInput,
  FormToggle,
  FormActions,
  FormSelect,
} from "@/components/ui/form";
import {
  attoFilToFilPerTiBPerMonth,
  filToAttoFilPerGiBPerEpoch,
  generateSizeOptions,
  DEFAULT_PIECE_SIZE_BYTES,
  MIN_PIECE_SIZE_BYTES,
} from "@/utils/market";
import type { PricingFilter } from "@/types/market";

interface Props {
  visible: boolean;
  mode: "add" | "edit";
  initialFilter?: PricingFilter | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialFilter: null,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [filter: PricingFilter];
  cancel: [];
}>();

const modalTitle = computed(() =>
  props.mode === "edit" ? "Edit Pricing Filter" : "Add Pricing Filter",
);

const sizeOptions = generateSizeOptions();
const DEAL_MIN_DURATION = 180;
const DEAL_MAX_DURATION = 1278;

const toNumber = (value: string | number) => {
  if (value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

type PricingFilterFormValues = {
  name: string;
  minDuration: number;
  maxDuration: number;
  minSize: number;
  maxSize: number;
  priceFilPerTiB: string;
  verified: boolean;
};

const emptyValues: PricingFilterFormValues = {
  name: "",
  minDuration: DEAL_MIN_DURATION,
  maxDuration: 540,
  minSize: MIN_PIECE_SIZE_BYTES,
  maxSize: DEFAULT_PIECE_SIZE_BYTES,
  priceFilPerTiB: "",
  verified: false,
};

const pricingFilterForm = useForm({
  defaultValues: emptyValues,
  onSubmit: async ({ value }) => {
    const price = Number.parseFloat(value.priceFilPerTiB);

    const payload: PricingFilter = {
      name: value.name.trim(),
      min_dur: value.minDuration,
      max_dur: value.maxDuration,
      min_size: value.minSize,
      max_size: value.maxSize,
      price: filToAttoFilPerGiBPerEpoch(price),
      verified: value.verified,
    };

    emit("save", payload);
    emit("update:visible", false);
  },
});

const formValues = pricingFilterForm.useStore((state) => state.values);
const isSubmitting = pricingFilterForm.useStore((state) => state.isSubmitting);
const canSubmit = pricingFilterForm.useStore((state) => state.canSubmit);

const nameValidators = {
  onChange: ({ value }: { value: string }) => {
    if (!value) return "Name cannot be empty";
    if (value.length > 64) return "Name cannot exceed 64 characters";
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      return "Only letters, numbers, underscores and hyphens are allowed";
    }
    return undefined;
  },
};

const minDurationValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value < DEAL_MIN_DURATION) {
      return `Min duration cannot be less than ${DEAL_MIN_DURATION} days`;
    }
    if (value > formValues.value.maxDuration) {
      return "Min duration cannot exceed max duration";
    }
    return undefined;
  },
};

const maxDurationValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value > DEAL_MAX_DURATION) {
      return `Max duration cannot exceed ${DEAL_MAX_DURATION} days`;
    }
    if (value < formValues.value.minDuration) {
      return "Max duration cannot be less than min duration";
    }
    return undefined;
  },
};

const minSizeValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value <= 0) {
      return "Min size must be greater than zero";
    }
    if (value > formValues.value.maxSize) {
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
    if (value < formValues.value.minSize) {
      return "Max size cannot be less than min size";
    }
    return undefined;
  },
};

const priceValidators = {
  onChange: ({ value }: { value: string }) => {
    const price = Number.parseFloat(value);
    if (Number.isNaN(price)) {
      return "Please enter a valid price";
    }
    if (price < 0) {
      return "Price cannot be negative";
    }
    return undefined;
  },
};

const priceAttoFil = computed(() => {
  const price = Number.parseFloat(formValues.value.priceFilPerTiB);
  if (Number.isNaN(price)) return "0";
  return filToAttoFilPerGiBPerEpoch(price).toString();
});

watch(
  () => [props.visible, props.initialFilter, props.mode],
  ([visible]) => {
    if (!visible) return;

    const nextValues: PricingFilterFormValues = props.initialFilter
      ? {
          name: props.initialFilter.name,
          minDuration: props.initialFilter.min_dur,
          maxDuration: props.initialFilter.max_dur,
          minSize: props.initialFilter.min_size,
          maxSize: props.initialFilter.max_size,
          priceFilPerTiB: attoFilToFilPerTiBPerMonth(props.initialFilter.price),
          verified: props.initialFilter.verified,
        }
      : { ...emptyValues };

    pricingFilterForm.reset(nextValues);
  },
  { immediate: true },
);

const handleClose = () => {
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
    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <FormInput
          :form="pricingFilterForm"
          name="name"
          label="Filter Name"
          placeholder="e.g., premium_client (letters, numbers, _, - only)"
          :disabled="isSubmitting"
          :validators="nameValidators"
        />
        <FormToggle
          :form="pricingFilterForm"
          name="verified"
          label="Verified Deals Only"
          :disabled="isSubmitting"
          on-label="Verified"
          off-label="Standard"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormInput
          :form="pricingFilterForm"
          name="minDuration"
          type="number"
          label="Min Duration (days)"
          :disabled="isSubmitting"
          :normalize="toNumber"
          :validators="minDurationValidators"
        />
        <FormInput
          :form="pricingFilterForm"
          name="maxDuration"
          type="number"
          label="Max Duration (days)"
          :disabled="isSubmitting"
          :normalize="toNumber"
          :validators="maxDurationValidators"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormSelect
          :form="pricingFilterForm"
          name="minSize"
          label="Min Size"
          :options="sizeOptions"
          :disabled="isSubmitting"
          :normalize="toNumber"
          :validators="minSizeValidators"
        />
        <FormSelect
          :form="pricingFilterForm"
          name="maxSize"
          label="Max Size"
          :options="sizeOptions"
          :disabled="isSubmitting"
          :normalize="toNumber"
          :validators="maxSizeValidators"
        />
      </div>

      <FormInput
        :form="pricingFilterForm"
        name="priceFilPerTiB"
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
    </div>

    <template #footer>
      <FormActions>
        <button
          class="btn btn-ghost"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="isSubmitting || !canSubmit"
          @click="pricingFilterForm.handleSubmit"
        >
          <span
            v-if="isSubmitting"
            class="loading loading-spinner loading-sm"
          ></span>
          Save
        </button>
      </FormActions>
    </template>
  </BaseModal>
</template>
