<script setup lang="ts">
import { computed } from "vue";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

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
</script>

<template>
  <div class="relative min-h-[200px]">
    <!-- Error state - displayed inline instead of overlay -->
    <div v-if="error" class="py-12 text-center">
      <div
        class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
      >
        <div class="text-error text-2xl">⚠️</div>
      </div>
      <h3 class="text-base-content mb-2 text-lg font-semibold">
        {{ errorTitle }}
      </h3>
      <p class="text-base-content/70 mb-4 text-sm">{{ error.message }}</p>
      <button
        v-if="onRetry"
        class="btn btn-outline btn-sm"
        :disabled="loading"
        @click="onRetry"
      >
        <span v-if="loading" class="loading loading-spinner loading-xs"></span>
        <ArrowPathIcon v-else class="size-4" />
        <span class="ml-2">{{
          loading ? "Retrying..." : "Retry Connection"
        }}</span>
      </button>
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
    <div v-else-if="!hasData" class="text-base-content/60 py-12 text-center">
      <div class="mb-2 text-4xl">{{ emptyIcon }}</div>
      <div>{{ emptyMessage }}</div>
    </div>

    <!-- Main content area -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>
