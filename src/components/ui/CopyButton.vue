<script setup lang="ts">
import { computed } from "vue";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/vue/24/outline";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";

const props = withDefaults(
  defineProps<{
    value?: string | null;
    label?: string;
    variant?:
      | "ghost"
      | "link"
      | "outline"
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "info"
      | "error";
    size?: "xs" | "sm" | "md";
    disabled?: boolean;
    iconOnly?: boolean;
    extraClass?: string;
    ariaLabel?: string;
  }>(),
  {
    value: "",
    label: "Copy",
    variant: "ghost",
    size: "xs",
    disabled: false,
    iconOnly: false,
    extraClass: "",
    ariaLabel: "Copy value",
  },
);

const emit = defineEmits<{ (event: "copied"): void }>();

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "btn-sm";
    case "md":
      return "btn-md";
    default:
      return "btn-xs";
  }
});

const variantClass = computed(() => `btn-${props.variant}`);

const { copy, copied } = useCopyToClipboard({ resetDelay: 1500 });

const handleCopy = async () => {
  if (!props.value || props.disabled) return;
  const success = await copy(props.value);
  if (success) {
    emit("copied");
  }
};
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    :disabled="disabled || !value"
    :class="[
      'btn flex items-center no-underline',
      props.iconOnly ? 'px-1' : 'gap-1',
      variantClass,
      sizeClass,
      props.extraClass,
    ]"
    @click="handleCopy"
  >
    <component
      :is="copied ? CheckIcon : ClipboardDocumentIcon"
      :class="size === 'md' ? 'size-5' : 'size-4'"
    />
    <span v-if="!props.iconOnly" class="text-xs font-semibold">
      {{ copied ? "Copied" : label }}
    </span>
  </button>
</template>
