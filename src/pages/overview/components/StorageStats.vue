<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import DataTable from "@/components/ui/DataTable.vue";
import type { StorageUseStat, StorageBreakdown } from "@/types/storage";

const {
  data: summary,
  loading: summaryLoading,
  error: summaryError,
  hasData: summaryHasData,
} = useCachedQuery<StorageUseStat[]>("StorageUseStats", [], {
  pollingInterval: 30000,
});

const {
  data: storeBreakdown,
  loading: breakdownLoading,
  error: breakdownError,
  hasData: breakdownHasData,
} = useCachedQuery<StorageBreakdown[]>("StorageStoreTypeStats", [], {
  pollingInterval: 30000,
});

const loading = computed(() => summaryLoading.value || breakdownLoading.value);
const error = computed(() => summaryError.value || breakdownError.value);
const hasData = computed(() => summaryHasData.value || breakdownHasData.value);
const isInitialLoading = computed(() => loading.value && !hasData.value);
const data = computed(() => {
  if (summary.value && summary.value.length > 0) {
    const hasDetailedBreakdown =
      storeBreakdown.value &&
      (storeBreakdown.value.length > 1 ||
        (storeBreakdown.value.length === 1 &&
          storeBreakdown.value[0].type !== "Other"));

    const processedSummary = [...summary.value];

    if (hasDetailedBreakdown) {
      processedSummary.forEach((row: StorageUseStat) => {
        if (row.Type === "Store") {
          row.subEntries = storeBreakdown.value || undefined;
        }
      });
    }

    return processedSummary;
  }

  return [];
});

const getUsagePercentage = (capacity: number, available: number): string => {
  return capacity > 0 ? (100 - (100 * available) / capacity).toFixed(2) : "0";
};

const getAvailablePercentage = (
  capacity: number,
  available: number,
): string => {
  return capacity > 0 ? ((100 * available) / capacity).toFixed(2) : "0";
};

const getProgressColor = (percentage: number): string => {
  if (percentage < 50) return "progress-success";
  if (percentage < 80) return "progress-warning";
  return "progress-error";
};
</script>

<template>
  <div class="space-y-4">
    <DataTable :zebra="false">
      <thead>
        <tr>
          <th>Type</th>
          <th>Storage Usage</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in data" :key="row.Type">
          <tr>
            <td class="font-medium">{{ row.Type }}</td>
            <td>
              <div class="space-y-1">
                <div class="text-sm">
                  {{ row.UseStr || row.Capacity - row.Available }} /
                  {{ row.CapStr || row.Capacity }}
                </div>
                <div class="text-base-content/70 text-xs">
                  {{ getUsagePercentage(row.Capacity, row.Available) }}% used
                </div>
              </div>
            </td>
            <td>
              <progress
                class="progress w-56"
                :class="
                  getProgressColor(
                    parseFloat(getUsagePercentage(row.Capacity, row.Available)),
                  )
                "
                :value="getUsagePercentage(row.Capacity, row.Available)"
                max="100"
              ></progress>
            </td>
          </tr>

          <!-- Sub-entries for detailed breakdown -->
          <tr
            v-for="sub in row.subEntries"
            :key="`${row.Type}-${sub.type}`"
            class="bg-base-200/30"
          >
            <td class="text-base-content/80 pl-8 text-sm">└ {{ sub.type }}</td>
            <td class="text-sm">
              <div class="space-y-1">
                <div>Available: {{ sub.avail_str }}</div>
                <div class="text-base-content/70 text-xs">
                  {{ getAvailablePercentage(sub.capacity, sub.available) }}%
                  available
                </div>
              </div>
            </td>
            <td>
              <progress
                class="progress w-48"
                :class="
                  getProgressColor(
                    parseFloat(getUsagePercentage(sub.capacity, sub.available)),
                  )
                "
                :value="getUsagePercentage(sub.capacity, sub.available)"
                max="100"
              ></progress>
            </td>
          </tr>
        </template>
      </tbody>
    </DataTable>

    <div v-if="isInitialLoading" class="text-base-content/60 py-8 text-center">
      <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
      Loading storage statistics...
    </div>

    <div v-else-if="error" class="text-error py-8 text-center">
      <div class="mb-2 text-lg">💾 Storage Error</div>
      <div class="text-sm">{{ error.message }}</div>
    </div>

    <div
      v-else-if="data.length === 0 && !loading"
      class="text-base-content/60 py-8 text-center"
    >
      <div class="mb-2 text-4xl">💾</div>
      <div>No storage data available</div>
    </div>
  </div>
</template>
