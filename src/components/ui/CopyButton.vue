<script setup lang="ts">
import { computed } from "vue";
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
} from "@heroicons/vue/24/outline";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";

interface Props {
  text: string;
  title?: string;
  size?: "xs" | "sm" | "md";
  variant?: "ghost" | "outline" | "primary";
}

const props = withDefaults(defineProps<Props>(), {
  title: "Copy",
  size: "xs",
  variant: "ghost",
});

const { copy, copied } = useCopyToClipboard({
  resetDelay: 2000,
});

const buttonClass = computed(() => {
  const classes = ["btn"];

  classes.push(`btn-${props.variant}`);
  classes.push(`btn-${props.size}`);

  if (copied.value) {
    classes.push("text-success");
  }

  return classes.join(" ");
});

const currentTitle = computed(() => {
  return copied.value ? "Copied!" : props.title;
});

const iconClass = computed(() => {
  const baseClass = "transition-colors duration-150";

  switch (props.size) {
    case "sm":
      return `${baseClass} size-4`;
    case "md":
      return `${baseClass} size-5`;
    default:
      return `${baseClass} size-4`;
  }
});

const handleCopy = () => {
  copy(props.text);
};
</script>

<template>
  <button :class="buttonClass" :title="currentTitle" @click="handleCopy">
    <CheckCircleIcon v-if="copied" :class="iconClass" />
    <ClipboardDocumentIcon v-else :class="iconClass" />
  </button>
</template>
