<script setup lang="ts">
import { computed, useAttrs, useId, type Component } from "vue";
import { useFormFieldState } from "@/composables/useFormFieldState";
import {
  selectClasses,
  type FormControlSize,
  type FormControlTone,
} from "@/utils/formControl";
import FormFieldWrapper from "./FormFieldWrapper.vue";

type OptionValue = string | number;

type NormalizeFn = (value: OptionValue) => OptionValue;

defineOptions({ inheritAttrs: false });

type FormLike = {
  Field: Component;
};

interface Option {
  label: string;
  value: OptionValue;
}

interface Props {
  form: FormLike;
  name: string;
  options: Option[];
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  normalize?: NormalizeFn;
  size?: FormControlSize;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  placeholder: "",
  disabled: false,
  required: false,
  normalize: undefined,
  size: "sm" as FormControlSize,
});

const attrs = useAttrs();
const generatedId = useId();

const FieldComponent = computed(() => props.form.Field);
const normaliseValue = computed<NormalizeFn>(
  () => props.normalize ?? ((value: OptionValue) => value),
);

const attrId = computed(() => attrs.id as string | undefined);
const externalClass = computed(() => attrs.class as string | undefined);

const fieldBindings = computed(() => {
  const bindings: Record<string, unknown> = {};
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class" || key === "id") return;
    if (key.startsWith("on")) return;
    bindings[key] = value;
  });
  return bindings;
});

const inputListeners = computed(() => {
  const listeners: Record<string, unknown> = {};
  Object.entries(attrs).forEach(([key, value]) => {
    if (key.startsWith("on")) {
      listeners[key] = value;
    }
  });
  return listeners;
});

const dataAttrs = computed(() => {
  const extracted: Record<string, unknown> = {};
  Object.entries(attrs).forEach(([key, value]) => {
    if (key.startsWith("data-") || key.startsWith("aria-")) {
      extracted[key] = value;
    }
  });
  return extracted;
});

const controlId = computed(
  () => attrId.value ?? `${props.name}-${generatedId}`,
);

const { shouldShowErrors, extractErrors } = useFormFieldState();

const resolveErrors = (meta: unknown) => {
  const typed = meta as Record<string, unknown> | null | undefined;
  return shouldShowErrors(typed) ? extractErrors(typed) : [];
};

const resolveTone = (meta: unknown): FormControlTone =>
  resolveErrors(meta).length > 0 ? "error" : "default";

const resolveOptionValue = (rawValue: string): OptionValue => {
  const match = props.options.find(
    (option) => String(option.value) === rawValue,
  );
  return match ? match.value : rawValue;
};

const toDomValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const applyNormalize = (value: OptionValue) => normaliseValue.value(value);
</script>

<template>
  <component :is="FieldComponent" :name="name" v-bind="fieldBindings">
    <template #default="{ field }">
      <FormFieldWrapper
        :label="label"
        :description="description"
        :required="required"
        :disabled="disabled"
        :errors="resolveErrors(field.state.meta)"
        :tone="resolveTone(field.state.meta)"
        :control-id="controlId"
      >
        <select
          v-bind="dataAttrs"
          :id="controlId"
          :name="field.name"
          :value="toDomValue(field.state.value)"
          :disabled="disabled"
          :aria-invalid="
            resolveTone(field.state.meta) === 'error' ? 'true' : undefined
          "
          :class="[
            selectClasses({
              size,
              tone: resolveTone(field.state.meta),
              disabled,
            }),
            externalClass,
          ]"
          v-on="inputListeners"
          @change="
            (event) =>
              field.handleChange(
                applyNormalize(
                  resolveOptionValue((event.target as HTMLSelectElement).value),
                ),
              )
          "
          @blur="field.handleBlur"
        >
          <option v-if="placeholder" disabled value="">
            {{ placeholder }}
          </option>
          <option
            v-for="option in options"
            :key="option.value"
            :value="String(option.value)"
          >
            {{ option.label }}
          </option>
        </select>
      </FormFieldWrapper>
    </template>
  </component>
</template>
