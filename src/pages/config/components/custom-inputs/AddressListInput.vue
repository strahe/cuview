<template>
  <div class="address-list-input-wrapper">
    <div class="space-y-2">
      <!-- Address input field -->
      <div class="join w-full">
        <input
          ref="addressInput"
          v-model="newAddress"
          type="text"
          :placeholder="placeholder"
          :disabled="context.disabled"
          class="input input-bordered join-item flex-1"
          :class="{
            'input-error': newAddressError,
          }"
          @keyup.enter="addAddress"
          @blur="validateNewAddress"
          @input="clearNewAddressError"
        />
        <button
          type="button"
          :disabled="context.disabled || !newAddress.trim() || !!newAddressError"
          class="btn btn-primary join-item"
          @click="addAddress"
        >
          Add
        </button>
      </div>
      
      <!-- New address validation error -->
      <div v-if="newAddressError" class="text-sm text-error">
        {{ newAddressError }}
      </div>
    </div>
    
    <!-- Address list -->
    <div v-if="addresses.length > 0" class="mt-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-base-content">
          Addresses ({{ addresses.length }}{{ maxItems ? `/${maxItems}` : '' }})
        </span>
        <button
          v-if="addresses.length > 1"
          type="button"
          :disabled="context.disabled"
          class="btn btn-ghost btn-xs"
          @click="clearAllAddresses"
        >
          Clear All
        </button>
      </div>
      
      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="(address, index) in addresses"
          :key="index"
          class="flex items-center gap-2 p-2 bg-base-50 border border-base-300 rounded-lg"
        >
          <div class="flex-1 font-mono text-sm break-all">
            {{ address }}
          </div>
          <button
            type="button"
            :disabled="context.disabled"
            class="btn btn-ghost btn-xs text-error hover:bg-error/10"
            @click="removeAddress(index)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
    
    <!-- Help text -->
    <div v-if="!addresses.length && !context.disabled" class="mt-1 text-xs text-base-content/50">
      {{ helpText }}
    </div>
    
    <!-- Validation message -->
    <div
      v-if="context.state.validationVisible && !context.state.valid"
      class="mt-1 text-sm text-error"
    >
      {{ context.state.validationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface Props {
  context: any; // FormKit context
}

const props = defineProps<Props>();

const addresses = ref<string[]>([]);
const newAddress = ref<string>("");
const newAddressError = ref<string>("");
const addressInput = ref<HTMLInputElement>();

const maxItems = computed(() => {
  return props.context.maxItems || null;
});

const validationType = computed(() => {
  return props.context.validation || "ethereum";
});

const placeholder = computed(() => {
  return props.context.placeholder || getPlaceholderByType(validationType.value);
});

const helpText = computed(() => {
  return `Enter ${validationType.value} addresses one at a time`;
});

const getPlaceholderByType = (type: string): string => {
  switch (type) {
    case "filecoin":
      return "f1... or f3... address";
    case "ethereum":
      return "0x... address";
    default:
      return "Enter address";
  }
};

// Parse initial value
const parseInitialValue = (value: string[] | string | null | undefined) => {
  if (!value) {
    addresses.value = [];
    return;
  }
  
  if (Array.isArray(value)) {
    addresses.value = value.filter(addr => typeof addr === "string" && addr.trim());
  } else if (typeof value === "string") {
    // Handle string input (comma-separated or line-separated)
    const parsed = value
      .split(/[,\n\r]+/)
      .map(addr => addr.trim())
      .filter(addr => addr);
    addresses.value = parsed;
  } else {
    addresses.value = [];
  }
};

// Validate address format
const validateAddress = (address: string): string | null => {
  const trimmed = address.trim();
  
  if (!trimmed) {
    return "Address cannot be empty";
  }
  
  // Check for duplicates
  if (addresses.value.includes(trimmed)) {
    return "Address already added";
  }
  
  // Type-specific validation
  switch (validationType.value) {
    case "ethereum":
      return validateEthereumAddress(trimmed);
    case "filecoin":
      return validateFilecoinAddress(trimmed);
    default:
      return validateGenericAddress(trimmed);
  }
};

const validateEthereumAddress = (address: string): string | null => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return "Invalid Ethereum address format";
  }
  return null;
};

const validateFilecoinAddress = (address: string): string | null => {
  // Filecoin addresses start with f followed by protocol indicator
  if (!/^f[0-4][a-zA-Z0-9]+$/.test(address)) {
    return "Invalid Filecoin address format";
  }
  return null;
};

const validateGenericAddress = (address: string): string | null => {
  // Basic validation for generic addresses
  if (address.length < 10) {
    return "Address too short";
  }
  if (address.length > 100) {
    return "Address too long";
  }
  return null;
};

const validateNewAddress = () => {
  if (!newAddress.value.trim()) {
    newAddressError.value = "";
    return;
  }
  
  const error = validateAddress(newAddress.value);
  newAddressError.value = error || "";
};

const clearNewAddressError = () => {
  newAddressError.value = "";
};

const addAddress = () => {
  const trimmed = newAddress.value.trim();
  if (!trimmed) return;
  
  const error = validateAddress(trimmed);
  if (error) {
    newAddressError.value = error;
    return;
  }
  
  // Check max items limit
  if (maxItems.value && addresses.value.length >= maxItems.value) {
    newAddressError.value = `Maximum ${maxItems.value} addresses allowed`;
    return;
  }
  
  addresses.value.push(trimmed);
  newAddress.value = "";
  newAddressError.value = "";
  updateValue();
  
  // Focus back to input
  addressInput.value?.focus();
};

const removeAddress = (index: number) => {
  addresses.value.splice(index, 1);
  updateValue();
};

const clearAllAddresses = () => {
  addresses.value = [];
  updateValue();
};

// Update FormKit value
const updateValue = () => {
  props.context.node.input([...addresses.value]);
};

// Watch for external value changes
watch(
  () => props.context.value,
  (newValue) => {
    parseInitialValue(newValue);
  },
  { immediate: true }
);
</script>

<style scoped>
.address-list-input-wrapper {
  @apply w-full;
}

.join-item:first-child {
  @apply rounded-l-btn;
}

.join-item:last-child {
  @apply rounded-r-btn;
}

.join-item:not(:first-child):not(:last-child) {
  @apply rounded-none;
}

/* Custom scrollbar for address list */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: theme(colors.base.300) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: theme(colors.base.300);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: theme(colors.base.400);
}
</style>