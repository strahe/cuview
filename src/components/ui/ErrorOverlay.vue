<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import {
  ArrowPathIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

interface Props {
  error?: Error | null;
  loading?: boolean;
  onRetry?: () => void;
  title?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  loading: false,
  onRetry: undefined,
  title: "Connection Error",
  autoClose: true,
  autoCloseDelay: 5000, // 5 seconds
});

const show = ref(false);
let timeoutId: number | null = null;

const dismiss = () => {
  show.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const handleRetry = () => {
  dismiss();
  props.onRetry?.();
};

// Watch for error changes
watch(
  () => props.error,
  (newError) => {
    if (newError && !props.loading) {
      show.value = true;

      // Auto dismiss if enabled
      if (props.autoClose) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          dismiss();
        }, props.autoCloseDelay);
      }
    } else {
      dismiss();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 transform -translate-y-2"
    enter-to-class="opacity-100 transform translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 transform translate-y-0"
    leave-to-class="opacity-0 transform -translate-y-2"
  >
    <div
      v-if="show"
      class="absolute top-4 left-1/2 z-30 mx-4 max-w-md -translate-x-1/2 transform"
    >
      <div class="alert alert-error shadow-lg">
        <ExclamationTriangleIcon class="h-6 w-6" />
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ title }}</div>
          <div class="text-xs opacity-90">{{ error?.message }}</div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="props.onRetry"
            class="btn btn-ghost btn-xs"
            title="Retry"
            @click="handleRetry"
          >
            <ArrowPathIcon class="size-3" />
          </button>
          <button class="btn btn-ghost btn-xs" title="Close" @click="dismiss">
            <XMarkIcon class="size-3" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
