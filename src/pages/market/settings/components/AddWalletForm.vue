<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "@tanstack/vue-form";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormLayout,
  FormSection,
  FormInput,
  FormToggle,
  FormActions,
} from "@/components/ui/form";

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [data: { wallet: string; status: boolean }];
  cancel: [];
}>();

type AddWalletFormValues = {
  wallet: string;
  status: boolean;
};

const submissionError = ref<string | null>(null);

// Validate Filecoin wallet address
const isValidFilecoinAddress = (address: string): boolean => {
  // Basic validation: must start with f or t followed by 0-3
  return /^[ft][0-3]/.test(address);
};

const addWalletForm = useForm({
  defaultValues: {
    wallet: "",
    status: true,
  } as AddWalletFormValues,
  onSubmit: async ({ value }) => {
    submissionError.value = null;

    emit("save", {
      wallet: value.wallet.trim(),
      status: value.status,
    });

    emit("update:visible", false);
  },
});

const isSubmitting = addWalletForm.useStore((state) => state.isSubmitting);
const canSubmit = addWalletForm.useStore((state) => state.canSubmit);

const walletValidators = {
  onChange: ({ value }: { value: string }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Wallet address cannot be empty";
    }
    if (!isValidFilecoinAddress(trimmed)) {
      return "Invalid wallet address format (must be f0-f3 or t0-t3)";
    }
    return undefined;
  },
};

const trimInput = (value: string) => value.trim();

// Initialize form when dialog opens
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      addWalletForm.reset({ wallet: "", status: true });
      submissionError.value = null;
    }
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
    title="Add Wallet Address"
    size="sm"
    :modal="true"
    :show-close-button="!isSubmitting"
    @close="handleClose"
  >
    <FormLayout>
      <FormSection>
        <FormInput
          :form="addWalletForm"
          name="wallet"
          label="Wallet Address"
          placeholder="e.g., f01234 or t01234"
          input-class="font-mono"
          :disabled="isSubmitting"
          :normalize="trimInput"
          :validators="walletValidators"
        />

        <FormToggle
          :form="addWalletForm"
          name="status"
          label="Action"
          on-label="Allow deals"
          off-label="Deny deals"
          :disabled="isSubmitting"
        />

        <p v-if="submissionError" class="text-error text-sm">
          {{ submissionError }}
        </p>
      </FormSection>
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
          :disabled="isSubmitting || !canSubmit"
          @click="addWalletForm.handleSubmit"
        >
          <span
            v-if="isSubmitting"
            class="loading loading-spinner loading-xs"
          ></span>
          Add
        </button>
      </FormActions>
    </template>
  </BaseModal>
</template>
