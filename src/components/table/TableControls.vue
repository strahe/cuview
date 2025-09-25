<template>
  <div class="mb-4 space-y-3">
    <div
      class="border-base-300 bg-base-100 flex flex-wrap items-center gap-3 rounded-lg border p-3 shadow-sm"
    >
      <!-- Search -->
      <div class="form-control">
        <input
          :value="searchInput"
          type="text"
          :placeholder="searchPlaceholder"
          class="input input-bordered input-sm w-56"
          @input="
            $emit(
              'update:searchInput',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>

      <!-- Custom controls slot -->
      <slot />

      <!-- Refresh button -->
      <div class="border-base-300 border-l pl-3">
        <button
          class="btn btn-outline btn-sm"
          :disabled="loading"
          @click="$emit('refresh')"
        >
          <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </div>

      <!-- Actions -->
      <div class="border-base-300 border-l pl-3">
        <slot name="actions" />
      </div>

      <!-- Statistics -->
      <div class="text-base-content/60 ml-auto text-xs">
        <slot name="stats" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon } from "@heroicons/vue/24/outline";

defineProps<{
  searchInput: string;
  searchPlaceholder?: string;
  loading?: boolean;
}>();

defineEmits<{
  "update:searchInput": [value: string];
  refresh: [];
}>();
</script>
