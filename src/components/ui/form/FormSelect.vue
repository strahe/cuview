<script setup lang="ts">
import { computed, useAttrs, type Component } from "vue";
import { useFormFieldState } from "@/composables/useFormFieldState";
import FormFieldWrapper from "./FormFieldWrapper.vue";

type OptionValue = string | number;

type NormalizeFn = (value: OptionValue) => OptionValue;

defineOptions({ inheritAttrs: false });

interface Option {
  label: string;
  value: OptionValue;
}

type FormLike = {
  Field: Component;
};

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
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  placeholder: "",
  disabled: false,
  required: false,
  normalize: undefined,
});

const attrs = useAttrs();
const FieldComponent = computed(() => props.form.Field);
const normaliseValue = computed<NormalizeFn>(
  () => props.normalize ?? ((value: OptionValue) => value),
);

const resolveOptionValue = (rawValue: string): OptionValue => {
  const match = props.options.find(
    (option) => String(option.value) === rawValue,
  );
  return match ? match.value : rawValue;
};

const toDomValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const applyNormalize = (value: OptionValue) => normaliseValue.value(value);

const { shouldShowErrors, extractErrors } = useFormFieldState();
</script>

<template>
  <component :is="FieldComponent" :name="name" v-bind="attrs">
    <template #default="{ field }">
      <FormFieldWrapper
        :label="label"
        :description="description"
        :required="required"
        :disabled="disabled"
        :errors="
          shouldShowErrors(field.state.meta)
            ? extractErrors(field.state.meta)
            : []
        "
      >
        <select
          :id="field.name"
          :name="field.name"
          :value="toDomValue(field.state.value)"
          class="select select-bordered select-sm w-full"
          :disabled="disabled"
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
