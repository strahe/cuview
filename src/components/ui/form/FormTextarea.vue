<script setup lang="ts">
import { computed, useAttrs, useId, type Component } from "vue";
import { useFormFieldState } from "@/composables/useFormFieldState";
import {
  textareaClasses,
  type FormControlSize,
  type FormControlTone,
} from "@/utils/formControl";
import FormFieldWrapper from "./FormFieldWrapper.vue";

type NormalizeFn = (value: string) => string;

defineOptions({ inheritAttrs: false });

type FormLike = {
  Field: Component;
};

interface Props {
  form: FormLike;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  normalize?: NormalizeFn;
  size?: FormControlSize;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  placeholder: "",
  rows: 3,
  disabled: false,
  required: false,
  normalize: undefined,
  size: "sm" as FormControlSize,
});

const attrs = useAttrs();
const generatedId = useId();

const FieldComponent = computed(() => props.form.Field);
const normaliseValue = computed<NormalizeFn>(
  () => props.normalize ?? ((value: string) => value),
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

const toTextareaValue = (value: unknown): string =>
  value == null ? "" : String(value);
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
        <textarea
          v-bind="dataAttrs"
          :id="controlId"
          :name="field.name"
          :value="toTextareaValue(field.state.value)"
          :placeholder="placeholder"
          :rows="rows"
          :disabled="disabled"
          :aria-invalid="
            resolveTone(field.state.meta) === 'error' ? 'true' : undefined
          "
          :class="[
            textareaClasses({
              size,
              tone: resolveTone(field.state.meta),
              disabled,
            }),
            externalClass,
          ]"
          v-on="inputListeners"
          @input="
            (event) =>
              field.handleChange(
                normaliseValue((event.target as HTMLTextAreaElement).value),
              )
          "
          @blur="field.handleBlur"
        ></textarea>

        <template v-if="$slots.hint" #hint>
          <slot name="hint" />
        </template>
      </FormFieldWrapper>
    </template>
  </component>
</template>
