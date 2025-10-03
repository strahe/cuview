<script setup lang="ts">
import { ref, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormLayout,
  FormSection,
  FormFieldWrapper,
  FormActions,
  FormCheckbox,
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

// Form fields
const wallet = ref("");
const status = ref(true); // true = allow, false = deny

// Validation errors
const walletError = ref("");

// Validate Filecoin wallet address
const isValidFilecoinAddress = (address: string): boolean => {
  // Basic validation: must start with f or t followed by 0-3
  return /^[ft][0-3]/.test(address);
};

// Initialize form when dialog opens
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      wallet.value = "";
      status.value = true;
      walletError.value = "";
    }
  },
  { immediate: true },
);

const validateForm = (): boolean => {
  let isValid = true;

  // Validate wallet address
  if (!wallet.value || !wallet.value.trim()) {
    walletError.value = "Wallet address cannot be empty";
    isValid = false;
  } else if (!isValidFilecoinAddress(wallet.value.trim())) {
    walletError.value =
      "Invalid wallet address format (must be f0-f3 or t0-t3)";
    isValid = false;
  } else {
    walletError.value = "";
  }

  return isValid;
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }

  emit("save", {
    wallet: wallet.value.trim(),
    status: status.value,
  });

  emit("update:visible", false);
};

const handleClose = () => {
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
    @close="handleClose"
  >
    <FormLayout>
      <FormSection>
        <FormFieldWrapper
          label="Wallet Address"
          :errors="walletError ? [walletError] : []"
        >
          <input
            v-model="wallet"
            type="text"
            placeholder="e.g., f01234 or t01234"
            class="input input-bordered input-sm font-mono"
            :class="{ 'input-error': walletError }"
          />
        </FormFieldWrapper>

        <FormCheckbox
          v-model="status"
          label="Action"
          on-label="Allow deals"
          off-label="Deny deals"
        />
      </FormSection>
    </FormLayout>

    <template #footer>
      <FormActions>
        <button class="btn btn-sm btn-outline" @click="handleClose">
          Cancel
        </button>
        <button class="btn btn-sm btn-primary" @click="handleSave">Add</button>
      </FormActions>
    </template>
  </BaseModal>
</template>
