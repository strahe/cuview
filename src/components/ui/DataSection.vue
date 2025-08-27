<script setup lang="ts">
import { computed } from "vue";
import ErrorOverlay from "./ErrorOverlay.vue";

interface Props {
  loading?: boolean;
  error?: Error | null;
  hasData?: boolean;
  onRetry?: () => void;
  errorTitle?: string;
  emptyTitle?: string;
  emptyIcon?: string;
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  hasData: false,
  onRetry: undefined,
  errorTitle: "Connection Error",
  emptyTitle: "No Data Available",
  emptyIcon: "📊",
  emptyMessage: "No data available",
});

const isInitialLoading = computed(() => props.loading && !props.hasData);
const shouldShowContent = computed(() => props.hasData || props.loading);
</script>

<template>
  <div class="relative min-h-[200px]">
    <!-- Main content area -->
    <div v-if="shouldShowContent">
      <slot />
    </div>

    <!-- Initial loading state -->
    <div
      v-else-if="isInitialLoading"
      class="text-base-content/60 py-12 text-center"
    >
      <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
      <slot name="loading">Loading...</slot>
    </div>

    <!-- Empty state -->
    <div v-else-if="!error" class="text-base-content/60 py-12 text-center">
      <div class="mb-2 text-4xl">{{ emptyIcon }}</div>
      <div>{{ emptyMessage }}</div>
    </div>

    <!-- Error overlay - positioned relative to this container -->
    <ErrorOverlay
      :error="error"
      :loading="loading"
      :title="errorTitle"
      :on-retry="onRetry"
    />
  </div>
</template>
