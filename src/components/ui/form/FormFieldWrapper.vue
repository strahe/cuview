<script setup lang="ts">
import { computed } from "vue";
import type { FormControlTone } from "@/utils/formControl";

interface Props {
  label?: string;
  description?: string;
  errors?: string[];
  required?: boolean;
  disabled?: boolean;
  controlId?: string;
  tone?: FormControlTone;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  errors: () => [],
  required: false,
  disabled: false,
  controlId: undefined,
  tone: "default" as FormControlTone,
});

const errorMessages = computed(() => props.errors?.filter(Boolean) ?? []);

const descriptionClass = computed(() => {
  if (props.tone === "error") return "text-error";
  if (props.tone === "success") return "text-success";
  return "text-base-content/60";
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-if="label || $slots.label || $slots.actions"
      class="flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <label
          v-if="label"
          class="text-base-content text-sm font-medium"
          :class="{ 'opacity-70': disabled }"
          :for="controlId"
        >
          {{ label }}
          <span v-if="required" class="text-error">*</span>
        </label>
        <slot name="label" />
      </div>

      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <p v-if="description" :class="[descriptionClass, 'text-xs']">
      {{ description }}
    </p>

    <div class="flex flex-col gap-2">
      <slot />
    </div>

    <slot name="hint" />

    <ul v-if="errorMessages.length" class="text-error space-y-1 text-xs">
      <li v-for="message in errorMessages" :key="message" class="flex gap-2">
        <span>{{ message }}</span>
      </li>
    </ul>
  </div>
</template>
