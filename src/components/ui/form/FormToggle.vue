<script setup lang="ts">
import { computed, type Component } from "vue";
import FormFieldWrapper from "./FormFieldWrapper.vue";

type FormLike = {
  Field: Component;
};

interface Props {
  form: FormLike;
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  onLabel?: string;
  offLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  disabled: false,
  required: false,
  onLabel: "Enabled",
  offLabel: "Disabled",
});

const FieldComponent = computed(() => props.form.Field);
</script>

<template>
  <component :is="FieldComponent" :name="name">
    <template #default="{ field }">
      <FormFieldWrapper
        :label="label"
        :description="description"
        :required="required"
        :disabled="disabled"
      >
        <label class="flex items-center gap-2">
          <input
            class="toggle toggle-sm toggle-success"
            type="checkbox"
            :checked="Boolean(field.state.value)"
            :disabled="disabled"
            @change="() => field.handleChange(!field.state.value)"
            @blur="field.handleBlur"
          />
          <span class="text-base-content/80 text-sm">
            {{ field.state.value ? onLabel : offLabel }}
          </span>
        </label>
      </FormFieldWrapper>
    </template>
  </component>
</template>
