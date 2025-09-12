<template>
  <div class="fil-amount-input-wrapper">
    <div class="join w-full">
      <input
        :id="context.id"
        v-model="amount"
        type="number"
        step="0.000001"
        min="0"
        :placeholder="placeholder"
        :disabled="context.disabled"
        class="input input-bordered join-item flex-1"
        :class="{
          'input-error': context.state.validationVisible && !context.state.valid,
        }"
        @blur="updateValue"
        @input="updateValue"
      />
      <select
        v-model="unit"
        :disabled="context.disabled"
        class="select select-bordered join-item w-28"
        :class="{
          'select-error': context.state.validationVisible && !context.state.valid,
        }"
        @change="updateValue"
      >
        <option value="fil">FIL</option>
        <option value="attofil">attofil</option>
      </select>
    </div>
    
    <!-- Conversion helper -->
    <div v-if="amount && !context.disabled" class="mt-1 text-xs text-base-content/60">
      <span v-if="unit === 'fil'">
        ≈ {{ formatAttofil(convertToAttofil(amount)) }} attofil
      </span>
      <span v-else-if="unit === 'attofil'">
        ≈ {{ formatFil(convertToFil(amount)) }} FIL
      </span>
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

const amount = ref<string>("");
const unit = ref<"fil" | "attofil">("fil");

const placeholder = computed(() => {
  return props.context.placeholder || (unit.value === "fil" ? "0.000000" : "0");
});

// Parse initial value
const parseInitialValue = (value: string | null | undefined) => {
  if (!value || typeof value !== "string") {
    amount.value = "";
    unit.value = "fil";
    return;
  }
  
  const trimmed = value.trim();
  const filMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(fil|FIL)$/);
  const attofilMatch = trimmed.match(/^(\d+)\s*(attofil|ATTOFIL)$/);
  
  if (filMatch) {
    amount.value = filMatch[1];
    unit.value = "fil";
  } else if (attofilMatch) {
    amount.value = attofilMatch[1];
    unit.value = "attofil";
  } else {
    // Try to parse as plain number (assume FIL)
    const numberMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
    if (numberMatch) {
      amount.value = numberMatch[1];
      unit.value = "fil";
    } else {
      amount.value = "";
      unit.value = "fil";
    }
  }
};

// Update FormKit value
const updateValue = () => {
  if (!amount.value || amount.value === "0") {
    props.context.node.input("");
    return;
  }
  
  const numericAmount = parseFloat(amount.value);
  if (isNaN(numericAmount)) {
    props.context.node.input("");
    return;
  }
  
  // Format the value according to the unit
  if (unit.value === "fil") {
    const formatted = numericAmount.toString();
    props.context.node.input(`${formatted} FIL`);
  } else {
    // For attofil, ensure it's an integer
    const intAmount = Math.floor(numericAmount);
    props.context.node.input(`${intAmount} attofil`);
  }
};

// Conversion utilities
const convertToAttofil = (filAmount: string | number): string => {
  const fil = typeof filAmount === "string" ? parseFloat(filAmount) : filAmount;
  if (isNaN(fil)) return "0";
  
  // 1 FIL = 10^18 attofil
  const attofil = fil * Math.pow(10, 18);
  return Math.floor(attofil).toString();
};

const convertToFil = (attofilAmount: string | number): string => {
  const attofil = typeof attofilAmount === "string" ? parseFloat(attofilAmount) : attofilAmount;
  if (isNaN(attofil)) return "0";
  
  // 10^18 attofil = 1 FIL
  const fil = attofil / Math.pow(10, 18);
  return fil.toFixed(6);
};

const formatAttofil = (attofil: string): string => {
  const num = parseFloat(attofil);
  if (isNaN(num)) return "0";
  
  // Add thousand separators
  return num.toLocaleString();
};

const formatFil = (fil: string): string => {
  const num = parseFloat(fil);
  if (isNaN(num)) return "0";
  
  // Remove trailing zeros after decimal
  return parseFloat(num.toFixed(6)).toString();
};

// Watch for external value changes
watch(
  () => props.context.value,
  (newValue) => {
    parseInitialValue(newValue);
  },
  { immediate: true }
);

// Watch unit changes to update display format
watch(unit, () => {
  if (amount.value) {
    updateValue();
  }
});
</script>

<style scoped>
.fil-amount-input-wrapper {
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
</style>