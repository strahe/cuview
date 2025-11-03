<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { CircleStackIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import type { StorageUseStat, StorageBreakdown } from "@/types/storage";
import { formatPercentage } from "@/utils/format";
import {
  getProgressColor,
  getStorageTypeLabel,
  getTableRowClasses,
} from "@/utils/ui";

const {
  data: summary,
  loading: summaryLoading,
  error: summaryError,
  hasData: summaryHasData,
  refresh: refreshSummary,
} = useCachedQuery<StorageUseStat[]>("StorageUseStats", [], {
  pollingInterval: 30000,
});

const {
  data: storeBreakdown,
  loading: breakdownLoading,
  error: breakdownError,
  hasData: breakdownHasData,
  refresh: refreshBreakdown,
} = useCachedQuery<StorageBreakdown[]>("StorageStoreTypeStats", [], {
  pollingInterval: 30000,
});

const loading = computed(() => summaryLoading.value || breakdownLoading.value);
const error = computed(() => summaryError.value || breakdownError.value);
const hasData = computed(() => summaryHasData.value || breakdownHasData.value);

const refresh = () => {
  refreshSummary();
  refreshBreakdown();
};
const data = computed(() => {
  if (summary.value && summary.value.length > 0) {
    const breakdownEntries = storeBreakdown.value ?? [];
    const hasDetailedBreakdown =
      breakdownEntries.length > 1 ||
      (breakdownEntries.length === 1 && breakdownEntries[0]?.type !== "Other");

    const processedSummary = [...summary.value];

    if (hasDetailedBreakdown) {
      processedSummary.forEach((row: StorageUseStat) => {
        if (row.Type === "Store") {
          row.subEntries = breakdownEntries;
        }
      });
    }

    return processedSummary;
  }

  return [];
});

const getUsagePercentage = (capacity: number, available: number): number => {
  return capacity > 0 ? 100 - (100 * available) / capacity : 0;
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Storage Error"
    :empty-icon="CircleStackIcon"
    empty-message="No storage data available"
  >
    <template #loading>Loading storage statistics...</template>

    <DataTable>
      <thead>
        <tr>
          <th>Type</th>
          <th>Storage Usage</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in data" :key="row.Type">
          <tr :class="getTableRowClasses()">
            <td class="font-medium">{{ getStorageTypeLabel(row) }}</td>
            <td>
              <div class="text-sm font-medium">
                {{ row.UseStr || row.Capacity - row.Available }} /
                {{ row.CapStr || row.Capacity }}
              </div>
            </td>
            <td>
              <div class="flex items-center gap-3">
                <progress
                  class="progress flex-1"
                  :class="
                    getProgressColor(
                      getUsagePercentage(row.Capacity, row.Available),
                    )
                  "
                  :value="getUsagePercentage(row.Capacity, row.Available)"
                  max="100"
                ></progress>
                <span
                  class="text-base-content/70 min-w-[3rem] text-xs font-medium"
                >
                  {{
                    formatPercentage(
                      getUsagePercentage(row.Capacity, row.Available),
                    )
                  }}
                </span>
              </div>
            </td>
          </tr>

          <!-- Sub-entries for detailed breakdown -->
          <tr
            v-for="sub in row.subEntries"
            :key="`${row.Type}-${sub.type}`"
            :class="[getTableRowClasses(), 'bg-base-200']"
          >
            <td class="pl-8 text-sm">└ {{ sub.type }}</td>
            <td class="text-sm">
              <div class="font-medium">Available: {{ sub.avail_str }}</div>
            </td>
            <td>
              <div class="flex items-center gap-3">
                <progress
                  class="progress flex-1"
                  :class="
                    getProgressColor(
                      getUsagePercentage(sub.capacity, sub.available),
                    )
                  "
                  :value="getUsagePercentage(sub.capacity, sub.available)"
                  max="100"
                ></progress>
                <span
                  class="text-base-content/70 min-w-[3rem] text-xs font-medium"
                >
                  {{
                    formatPercentage(
                      getUsagePercentage(sub.capacity, sub.available),
                    )
                  }}
                </span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </DataTable>
  </DataSection>
</template>
