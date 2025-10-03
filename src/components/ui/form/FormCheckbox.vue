<script setup lang="ts">
import { computed } from "vue";
import FormFieldWrapper from "./FormFieldWrapper.vue";

interface Props {
  modelValue: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  onLabel?: string;
  offLabel?: string;
  errors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  disabled: false,
  required: false,
  onLabel: "Enabled",
  offLabel: "Disabled",
  errors: () => [],
});

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const stateLabel = computed(() =>
  props.modelValue ? props.onLabel : props.offLabel,
);

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
};
</script>

<template>
  <FormFieldWrapper
    :label="label"
    :description="description"
    :required="required"
    :disabled="disabled"
    :errors="errors"
  >
    <label class="flex cursor-pointer items-center gap-2">
      <input
        class="toggle toggle-sm toggle-success"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleChange"
      />
      <span class="text-base-content/80 text-sm">
        {{ stateLabel }}
      </span>
    </label>
  </FormFieldWrapper>
</template>
