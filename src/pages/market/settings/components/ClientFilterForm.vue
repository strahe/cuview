<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useForm } from "@tanstack/vue-form";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormFieldWrapper,
  FormInput,
  FormTextarea,
  FormToggle,
  FormActions,
} from "@/components/ui/form";
import type { ClientFilter } from "@/types/market";
import { useFormFieldState } from "@/composables/useFormFieldState";

interface Props {
  visible: boolean;
  mode: "add" | "edit";
  initialFilter?: ClientFilter | null;
  availablePricingFilters: string[];
}

const props = withDefaults(defineProps<Props>(), {
  initialFilter: null,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [filter: ClientFilter];
  cancel: [];
}>();

const modalTitle = computed(() =>
  props.mode === "edit" ? "Edit Client Filter" : "Add Client Filter",
);

const GIB_BYTES = 1024 ** 3;

const toNumber = (value: string | number) => {
  if (value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

type ClientFilterFormValues = {
  name: string;
  active: boolean;
  walletsText: string;
  peerIdsText: string;
  selectedPricingFilters: string[];
  maxDealsPerHour: number;
  maxDealSizeGiB: number;
  additionalInfo: string;
};

const emptyFormValues: ClientFilterFormValues = {
  name: "",
  active: true,
  walletsText: "",
  peerIdsText: "",
  selectedPricingFilters: [],
  maxDealsPerHour: 0,
  maxDealSizeGiB: 1,
  additionalInfo: "",
};

const submissionError = ref<string | null>(null);

const clientFilterForm = useForm({
  defaultValues: emptyFormValues,
  onSubmit: async ({ value }) => {
    submissionError.value = null;
    const wallets = parseLines(value.walletsText);
    const peerIds = parseLines(value.peerIdsText);

    const payload: ClientFilter = {
      name: value.name.trim(),
      active: value.active,
      wallets,
      peer_ids: peerIds,
      pricing_filters: [...value.selectedPricingFilters],
      max_deals_per_hour: value.maxDealsPerHour,
      max_deal_size_per_hour: value.maxDealSizeGiB * GIB_BYTES,
      additional_info: value.additionalInfo.trim(),
    };

    emit("save", payload);
    emit("update:visible", false);
  },
});

const isSubmitting = clientFilterForm.useStore((state) => state.isSubmitting);
const canSubmit = clientFilterForm.useStore((state) => state.canSubmit);
const FieldComponent = clientFilterForm.Field;
const { shouldShowErrors, extractErrors } = useFormFieldState();

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

const walletsValidators = {
  onChangeListenTo: ["peerIdsText"],
  onChange: ({
    value,
    fieldApi,
  }: {
    value: string;
    fieldApi: { form: { state: { values: Record<string, unknown> } } };
  }) => {
    const wallets = parseLines(value);
    const peers = parseLines(fieldApi.form.state.values.peerIdsText as string);
    if (wallets.length === 0 && peers.length === 0) {
      return "Provide at least one wallet address or Peer ID";
    }
    for (const wallet of wallets) {
      if (!isValidFilecoinAddress(wallet)) {
        return `Invalid wallet address: ${wallet}`;
      }
    }
    return undefined;
  },
};

const peerValidators = {
  onChangeListenTo: ["walletsText"],
  onChange: ({
    value,
    fieldApi,
  }: {
    value: string;
    fieldApi: { form: { state: { values: Record<string, unknown> } } };
  }) => {
    const peers = parseLines(value);
    const wallets = parseLines(
      fieldApi.form.state.values.walletsText as string,
    );
    if (wallets.length === 0 && peers.length === 0) {
      return "Provide at least one wallet address or Peer ID";
    }
    return undefined;
  },
};

const pricingValidators = {
  onChange: ({ value }: { value: string[] }) => {
    if (!value || value.length === 0) {
      return "At least one pricing filter is required";
    }
    const invalidFilters = value.filter(
      (filter) => !props.availablePricingFilters.includes(filter),
    );
    if (invalidFilters.length > 0) {
      return `Invalid pricing filters: ${invalidFilters.join(", ")}`;
    }
    return undefined;
  },
};

const dealsValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value < 0) {
      return "Max deals per hour cannot be negative";
    }
    return undefined;
  },
};

const maxDealSizeValidators = {
  onChange: ({ value }: { value: number }) => {
    if (value < 0) {
      return "Max deal size per hour cannot be negative";
    }
    return undefined;
  },
};

const infoValidators = {
  onChange: ({ value }: { value: string }) => {
    if (value.length > 256) {
      return "Additional info cannot exceed 256 characters";
    }
    return undefined;
  },
};

watch(
  () => [props.visible, props.initialFilter, props.mode],
  ([visible]) => {
    if (!visible) return;

    const nextValues: ClientFilterFormValues = props.initialFilter
      ? {
          name: props.initialFilter.name,
          active: props.initialFilter.active,
          walletsText: (props.initialFilter.wallets || []).join("\n"),
          peerIdsText: (props.initialFilter.peer_ids || []).join("\n"),
          selectedPricingFilters: [
            ...(props.initialFilter.pricing_filters || []),
          ],
          maxDealsPerHour: props.initialFilter.max_deals_per_hour || 0,
          maxDealSizeGiB: deriveMaxDealSizeGiB(
            props.initialFilter.max_deal_size_per_hour || 0,
          ),
          additionalInfo: props.initialFilter.additional_info || "",
        }
      : { ...emptyFormValues };

    clientFilterForm.reset(nextValues);
    submissionError.value = null;
  },
  { immediate: true },
);

const handleClose = () => {
  submissionError.value = null;
  emit("cancel");
  emit("update:visible", false);
};

const handlePricingChipToggle = (current: string[], filter: string) => {
  const next = [...current];
  const index = next.indexOf(filter);
  if (index === -1) {
    next.push(filter);
  } else {
    next.splice(index, 1);
  }
  clientFilterForm.setFieldValue("selectedPricingFilters", next);
};

const parseLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const isValidFilecoinAddress = (address: string) => /^[ft][0-3]/.test(address);

const deriveMaxDealSizeGiB = (sizeBytes: number) => {
  if (sizeBytes <= 0) return emptyFormValues.maxDealSizeGiB;
  return Math.max(sizeBytes / GIB_BYTES, 0.01);
};
</script>

<template>
  <BaseModal
    :open="visible"
    :title="modalTitle"
    size="xl"
    :modal="true"
    :show-close-button="!isSubmitting"
    @close="handleClose"
  >
    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <FormInput
          :form="clientFilterForm"
          name="name"
          label="Filter Name"
          placeholder="e.g., premium_client (letters, numbers, _, - only)"
          :disabled="isSubmitting"
          :validators="nameValidators"
        />
        <FormToggle
          :form="clientFilterForm"
          name="active"
          label="Status"
          :disabled="isSubmitting"
          on-label="Enabled"
          off-label="Disabled"
        />
      </div>

      <div>
        <p class="text-base-content/60 mb-2 text-xs">
          Provide wallet addresses or Peer IDs (one per line)
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormTextarea
            :form="clientFilterForm"
            name="walletsText"
            label="Wallet Addresses"
            placeholder="f01234\nf05678\n..."
            :rows="4"
            :disabled="isSubmitting"
            :validators="walletsValidators"
          />
          <FormTextarea
            :form="clientFilterForm"
            name="peerIdsText"
            label="Peer IDs"
            placeholder="12D3KooW...\n12D3KooW...\n..."
            :rows="4"
            :disabled="isSubmitting"
            :validators="peerValidators"
          />
        </div>
      </div>

      <component
        :is="FieldComponent"
        name="selectedPricingFilters"
        :validators="pricingValidators"
      >
        <template #default="{ field }">
          <FormFieldWrapper
            label="Pricing Filters"
            :description="`Selected: ${field.state.value.length}`"
            :errors="
              shouldShowErrors(field.state.meta)
                ? extractErrors(field.state.meta)
                : []
            "
          >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="filter in props.availablePricingFilters"
                :key="filter"
                type="button"
                class="btn btn-xs"
                :class="
                  field.state.value.includes(filter)
                    ? 'btn-primary'
                    : 'btn-outline'
                "
                @click="handlePricingChipToggle(field.state.value, filter)"
              >
                {{ filter }}
              </button>
            </div>
            <p
              v-if="!field.state.value.length"
              class="text-warning mt-2 text-xs font-medium"
            >
              Select at least one pricing filter.
            </p>
          </FormFieldWrapper>
        </template>
      </component>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormInput
          :form="clientFilterForm"
          name="maxDealsPerHour"
          type="number"
          label="Max Deals per Hour"
          placeholder="0 = unlimited"
          :disabled="isSubmitting"
          :normalize="toNumber"
          :validators="dealsValidators"
        />
        <FormInput
          :form="clientFilterForm"
          name="maxDealSizeGiB"
          type="number"
          label="Max Deal Size (GiB)"
          placeholder="0 = unlimited"
          :disabled="isSubmitting"
          :normalize="toNumber"
          :validators="maxDealSizeValidators"
        />
      </div>

      <FormTextarea
        :form="clientFilterForm"
        name="additionalInfo"
        label="Additional Info (optional)"
        placeholder="Notes or description (optional, max 256 chars)"
        :rows="3"
        :disabled="isSubmitting"
        :validators="infoValidators"
      />

      <p v-if="submissionError" class="text-error text-sm">
        {{ submissionError }}
      </p>
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
          @click="clientFilterForm.handleSubmit"
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
