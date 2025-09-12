<template>
  <div class="duration-input-wrapper">
    <div class="join w-full">
      <input
        :id="context.id"
        v-model="durationValue"
        type="text"
        :placeholder="placeholder"
        :disabled="context.disabled"
        class="input input-bordered join-item flex-1"
        :class="{
          'input-error': context.state.validationVisible && !context.state.valid,
        }"
        @blur="updateValue"
        @input="validateAndUpdate"
      />
      <div class="join-item bg-base-200 px-3 py-2 text-sm text-base-content/70 border border-base-300 border-l-0">
        TOML
      </div>
    </div>
    
    <!-- Duration breakdown -->
    <div v-if="durationValue && isValid && !context.disabled" class="mt-1 text-xs text-base-content/60">
      {{ formatDurationBreakdown(durationValue) }}
    </div>
    
    <!-- Format examples -->
    <div v-if="!durationValue && !context.disabled" class="mt-1 text-xs text-base-content/50">
      Examples: 1h, 30m, 1h30m, 2h15m30s
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

const durationValue = ref<string>("");

const placeholder = computed(() => {
  return props.context.placeholder || "1h30m0s";
});

const isValid = computed(() => {
  return validateDurationFormat(durationValue.value);
});

// Parse initial value
const parseInitialValue = (value: string | null | undefined) => {
  if (!value || typeof value !== "string") {
    durationValue.value = "";
    return;
  }
  
  durationValue.value = value.trim();
};

// Validate duration format
const validateDurationFormat = (value: string): boolean => {
  if (!value) return true; // Empty is valid
  
  // TOML duration format: combinations of numbers followed by unit
  // Valid units: h (hours), m (minutes), s (seconds)
  const durationPattern = /^(\d+h)?(\d+m)?(\d+s)?$/;
  const match = value.match(durationPattern);
  
  if (!match) return false;
  
  // At least one unit must be present
  const [, hours, minutes, seconds] = match;
  return !!(hours || minutes || seconds);
};

// Update FormKit value
const updateValue = () => {
  if (!durationValue.value) {
    props.context.node.input("");
    return;
  }
  
  if (validateDurationFormat(durationValue.value)) {
    props.context.node.input(durationValue.value);
  } else {
    // Invalid format, clear the value
    props.context.node.input("");
  }
};

const validateAndUpdate = () => {
  // Auto-format common inputs
  let value = durationValue.value;
  
  // Remove spaces
  value = value.replace(/\s+/g, "");
  
  // Auto-add units for plain numbers
  if (/^\d+$/.test(value)) {
    // Assume minutes for plain numbers
    value = value + "m";
  }
  
  // Handle decimal inputs (convert to appropriate units)
  const decimalMatch = value.match(/^(\d+\.?\d*)([hms]?)$/);
  if (decimalMatch) {
    const [, number, unit] = decimalMatch;
    const num = parseFloat(number);
    
    if (unit === "h" && num % 1 !== 0) {
      // Convert decimal hours to hours and minutes
      const hours = Math.floor(num);
      const minutes = Math.round((num - hours) * 60);
      value = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
    } else if (unit === "m" && num % 1 !== 0) {
      // Convert decimal minutes to minutes and seconds
      const minutes = Math.floor(num);
      const seconds = Math.round((num - minutes) * 60);
      value = minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
    }
  }
  
  durationValue.value = value;
  updateValue();
};

// Format duration breakdown for display
const formatDurationBreakdown = (duration: string): string => {
  const parts: string[] = [];
  
  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  const secondsMatch = duration.match(/(\d+)s/);
  
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  }
  
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1]);
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }
  
  if (secondsMatch) {
    const seconds = parseInt(secondsMatch[1]);
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
  }
  
  if (parts.length === 0) return "";
  
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(" and ");
  
  const last = parts.pop();
  return parts.join(", ") + ", and " + last;
};

// Convert duration to total seconds (for comparison/validation)
const durationToSeconds = (duration: string): number => {
  let totalSeconds = 0;
  
  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  const secondsMatch = duration.match(/(\d+)s/);
  
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1]) * 3600;
  }
  
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1]) * 60;
  }
  
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1]);
  }
  
  return totalSeconds;
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
.duration-input-wrapper {
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