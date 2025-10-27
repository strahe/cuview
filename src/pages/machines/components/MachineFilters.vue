<script setup lang="ts">
import { computed } from "vue";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/vue/24/outline";
import type { MachineFilters } from "@/types/machine";

interface Props {
  filters: MachineFilters;
  availableTaskTypes: string[];
  statusDistribution: {
    online: number;
    offline: number;
    unschedulable: number;
  };
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:filters": [filters: MachineFilters];
  reset: [];
  refresh: [];
}>();

const updateFilter = (key: keyof MachineFilters, value: string) => {
  emit("update:filters", {
    ...props.filters,
    [key]: value,
  });
};

const hasActiveFilters = computed(() => {
  return (
    props.filters.search !== "" ||
    props.filters.status !== "all" ||
    props.filters.taskFilter !== ""
  );
});
</script>

<template>
  <div
    class="bg-base-200 border-base-300 mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
  >
    <!-- Left: Search + Refresh -->
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <div class="relative min-w-64">
        <input
          :value="filters.search"
          type="text"
          placeholder="Search by name or address..."
          class="input input-bordered input-sm w-full pl-8"
          @input="
            updateFilter('search', ($event.target as HTMLInputElement).value)
          "
        />
        <MagnifyingGlassIcon
          class="text-base-content/40 absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2"
        />
      </div>

      <!-- Refresh button -->
      <button
        class="btn btn-outline btn-sm"
        :disabled="loading"
        @click="$emit('refresh')"
      >
        <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Center: Filters -->
    <div class="flex min-w-0 items-center gap-3">
      <!-- Status Filter -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
            >Status:</span
          >
          <select
            :value="filters.status"
            class="select select-bordered select-sm min-w-32"
            @change="
              updateFilter('status', ($event.target as HTMLSelectElement).value)
            "
          >
            <option value="all">All</option>
            <option value="online">
              Online ({{ statusDistribution.online }})
            </option>
            <option value="offline">
              Offline ({{ statusDistribution.offline }})
            </option>
            <option value="unschedulable">
              Unschedulable ({{ statusDistribution.unschedulable }})
            </option>
          </select>
        </div>
      </div>

      <!-- Task Filter -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
            >Task:</span
          >
          <select
            :value="filters.taskFilter"
            class="select select-bordered select-sm min-w-32"
            @change="
              updateFilter(
                'taskFilter',
                ($event.target as HTMLSelectElement).value,
              )
            "
          >
            <option value="">All Types</option>
            <option
              v-for="task in availableTaskTypes"
              :key="task"
              :value="task"
            >
              {{ task }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Right: Clear Filters -->
    <div class="flex items-center">
      <div v-if="hasActiveFilters">
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-1"
          @click="$emit('reset')"
        >
          <XMarkIcon class="h-3 w-3" />
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>
