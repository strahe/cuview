<script setup lang="ts">
import { computed, useAttrs, type Component } from "vue";
import { useFormFieldState } from "@/composables/useFormFieldState";
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
}

const props = withDefaults(defineProps<Props>(), {
  label: "",
  description: "",
  placeholder: "",
  rows: 3,
  disabled: false,
  required: false,
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
        <textarea
          :id="field.name"
          :name="field.name"
          :value="field.state.value"
          :placeholder="placeholder"
          :rows="rows"
          :disabled="disabled"
          class="textarea textarea-bordered textarea-sm w-full"
          :class="{
            'input-error': shouldShowErrors(field.state.meta),
          }"
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
