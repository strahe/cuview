<script setup lang="ts">
import { computed, useAttrs, type Component } from "vue";
import { useFormFieldState } from "@/composables/useFormFieldState";
import FormFieldWrapper from "./FormFieldWrapper.vue";

type NormalizeFn = (value: string) => string | number;

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
  type?: string;
  disabled?: boolean;
  required?: boolean;
  autofocus?: boolean;
  inputClass?: string;
  prefix?: string;
  suffix?: string;
  normalize?: NormalizeFn;
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  placeholder: "",
  type: "text",
  disabled: false,
  required: false,
  autofocus: false,
  inputClass: "",
  prefix: "",
  suffix: "",
  normalize: undefined,
});

const attrs = useAttrs();
const FieldComponent = computed(() => props.form.Field);
const normaliseValue = computed<NormalizeFn>(
  () => props.normalize ?? ((value: string) => value),
);

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
        <div class="relative flex w-full items-center">
          <span
            v-if="prefix"
            class="text-base-content/60 pointer-events-none absolute left-3 text-xs"
          >
            {{ prefix }}
          </span>

          <input
            :id="field.name"
            :name="field.name"
            :value="field.state.value"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :autofocus="autofocus"
            :class="[
              'input input-bordered input-sm w-full',
              inputClass,
              {
                'pl-10': prefix,
                'pr-10': suffix,
                'input-error': shouldShowErrors(field.state.meta),
              },
            ]"
            @input="
              (event) =>
                field.handleChange(
                  normaliseValue((event.target as HTMLInputElement).value),
                )
            "
            @blur="field.handleBlur"
          />

          <span
            v-if="suffix"
            class="text-base-content/60 pointer-events-none absolute right-3 text-xs"
          >
            {{ suffix }}
          </span>
        </div>

        <template v-if="$slots.hint" #hint>
          <slot name="hint" />
        </template>
      </FormFieldWrapper>
    </template>
  </component>
</template>
