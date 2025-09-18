<script setup lang="ts">
import { computed } from "vue";
import { CircleStackIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { formatPercentage, formatBytes } from "@/utils/format";
import { getProgressColor } from "@/utils/ui";
import DataTable from "@/components/ui/DataTable.vue";
import type { StorageUseStat, StorageBreakdown } from "@/types/storage";

const {
  data: storageStats,
  loading: statsLoading,
  error: statsError,
  refresh: refreshStats,
} = useCachedQuery<StorageUseStat[]>("StorageUseStats", [], {
  pollingInterval: 30000,
});

const {
  data: storeBreakdown,
  loading: breakdownLoading,
  error: breakdownError,
  refresh: refreshBreakdown,
} = useCachedQuery<StorageBreakdown[]>("StorageStoreTypeStats", [], {
  pollingInterval: 30000,
});

const loading = computed(() => statsLoading.value || breakdownLoading.value);
const error = computed(() => statsError.value || breakdownError.value);
const hasData = computed(
  () =>
    (storageStats.value && storageStats.value.length > 0) ||
    (storeBreakdown.value && storeBreakdown.value.length > 0),
);

const refresh = () => {
  refreshStats();
  refreshBreakdown();
};

const enhancedStorageStats = computed(() => {
  if (!storageStats.value || storageStats.value.length === 0) {
    return [];
  }

  const hasDetailedBreakdown =
    storeBreakdown.value &&
    (storeBreakdown.value.length > 1 ||
      (storeBreakdown.value.length === 1 &&
        storeBreakdown.value[0].type !== "Other"));

  const processedStats = [...storageStats.value];

  if (hasDetailedBreakdown) {
    processedStats.forEach((row: StorageUseStat) => {
      if (row.Type === "Store") {
        row.subEntries = storeBreakdown.value || undefined;
      }
    });
  }

  return processedStats;
});

const getUsagePercentage = (capacity: number, available: number): number => {
  return capacity > 0 ? 100 - (100 * available) / capacity : 0;
};

const totalStorageSummary = computed(() => {
  if (!enhancedStorageStats.value || enhancedStorageStats.value.length === 0) {
    return {
      totalCapacity: 0,
      totalUsed: 0,
      totalAvailable: 0,
      usagePercentage: 0,
    };
  }

  let totalCapacity = 0;
  let totalAvailable = 0;

  enhancedStorageStats.value.forEach((stat) => {
    totalCapacity += stat.Capacity;
    totalAvailable += stat.Available;
  });

  const totalUsed = totalCapacity - totalAvailable;
  const usagePercentage =
    totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  return {
    totalCapacity,
    totalUsed,
    totalAvailable,
    usagePercentage,
  };
});

const fileTypeBreakdown = computed(() => {
  if (!storeBreakdown.value || storeBreakdown.value.length === 0) {
    return [];
  }

  return storeBreakdown.value.map((breakdown) => ({
    type: breakdown.type,
    capacity: breakdown.capacity,
    available: breakdown.available,
    used: breakdown.capacity - breakdown.available,
    usagePercent:
      breakdown.capacity > 0
        ? ((breakdown.capacity - breakdown.available) / breakdown.capacity) *
          100
        : 0,
  }));
});
</script>

<template>
  <div class="space-y-6">
    <template v-if="error">
      <div class="py-8 text-center">
        <div
          class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
        >
          <div class="text-error text-2xl">⚠️</div>
        </div>
        <h3 class="text-base-content mb-2 text-lg font-semibold">
          Storage Error
        </h3>
        <p class="text-base-content/70 mb-4 text-sm">{{ error.message }}</p>
        <button
          class="btn btn-outline btn-sm"
          :disabled="loading"
          @click="refresh"
        >
          <span
            v-if="loading"
            class="loading loading-spinner loading-xs"
          ></span>
          <span class="ml-2">{{ loading ? "Retrying..." : "Retry" }}</span>
        </button>
      </div>
    </template>

    <template v-else-if="loading && !hasData">
      <div class="py-8 text-center">
        <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
        <div class="text-base-content/60">Loading storage statistics...</div>
      </div>
    </template>

    <template v-else-if="!hasData">
      <div class="py-8 text-center">
        <div class="mb-2 text-4xl">💾</div>
        <div class="text-base-content/60">No storage data available</div>
      </div>
    </template>

    <template v-else>
      <!-- Summary Cards -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card bg-base-200/50">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <CircleStackIcon class="text-primary h-6 w-6" />
              <div>
                <div class="text-lg font-bold">
                  {{ formatBytes(totalStorageSummary.totalCapacity) }}
                </div>
                <div class="text-base-content/60 text-xs">Total Capacity</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200/50">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <div class="bg-info/20 rounded-full p-2">
                <div class="bg-info h-2 w-2 rounded-full"></div>
              </div>
              <div>
                <div class="text-lg font-bold">
                  {{ formatBytes(totalStorageSummary.totalUsed) }}
                </div>
                <div class="text-base-content/60 text-xs">Used Space</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200/50">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <div class="bg-success/20 rounded-full p-2">
                <div class="bg-success h-2 w-2 rounded-full"></div>
              </div>
              <div>
                <div class="text-lg font-bold">
                  {{ formatBytes(totalStorageSummary.totalAvailable) }}
                </div>
                <div class="text-base-content/60 text-xs">Available</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200/50">
          <div class="card-body p-4">
            <div class="flex items-center gap-3">
              <div class="bg-warning/20 rounded-full p-2">
                <div class="bg-warning h-2 w-2 rounded-full"></div>
              </div>
              <div>
                <div class="text-lg font-bold">
                  {{ formatPercentage(totalStorageSummary.usagePercentage) }}
                </div>
                <div class="text-base-content/60 text-xs">Usage Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Storage Breakdown Table -->
      <DataTable>
        <thead>
          <tr>
            <th>Type</th>
            <th>Capacity</th>
            <th>Used</th>
            <th>Available</th>
            <th>Usage</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in enhancedStorageStats" :key="row.Type">
            <tr>
              <td class="font-medium">{{ row.Type }}</td>
              <td>
                <div class="font-medium">
                  {{ row.CapStr || formatBytes(row.Capacity) }}
                </div>
              </td>
              <td>
                <div class="font-medium">
                  {{ row.UseStr || formatBytes(row.Capacity - row.Available) }}
                </div>
              </td>
              <td>
                <div class="font-medium">
                  {{ formatBytes(row.Available) }}
                </div>
              </td>
              <td>
                <div class="font-semibold">
                  {{
                    formatPercentage(
                      getUsagePercentage(row.Capacity, row.Available),
                    )
                  }}
                </div>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <progress
                    class="progress w-32"
                    :class="
                      getProgressColor(
                        getUsagePercentage(row.Capacity, row.Available),
                      )
                    "
                    :value="getUsagePercentage(row.Capacity, row.Available)"
                    max="100"
                  ></progress>
                  <span class="text-sm font-medium">
                    {{
                      Math.round(
                        getUsagePercentage(row.Capacity, row.Available),
                      )
                    }}%
                  </span>
                </div>
              </td>
            </tr>

            <!-- Sub-entries for detailed breakdown -->
            <tr
              v-for="sub in row.subEntries"
              :key="`${row.Type}-${sub.type}`"
              class="bg-base-200/30"
            >
              <td class="text-base-content/80 pl-8 text-sm">
                └ {{ sub.type }}
              </td>
              <td class="text-sm">
                {{ formatBytes(sub.capacity) }}
              </td>
              <td class="text-sm">
                {{ formatBytes(sub.capacity - sub.available) }}
              </td>
              <td class="text-sm">
                {{ sub.avail_str }}
              </td>
              <td class="text-sm">
                {{
                  formatPercentage(
                    getUsagePercentage(sub.capacity, sub.available),
                  )
                }}
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <progress
                    class="progress w-24"
                    :class="
                      getProgressColor(
                        getUsagePercentage(sub.capacity, sub.available),
                      )
                    "
                    :value="getUsagePercentage(sub.capacity, sub.available)"
                    max="100"
                  ></progress>
                  <span class="text-sm">
                    {{
                      Math.round(
                        getUsagePercentage(sub.capacity, sub.available),
                      )
                    }}%
                  </span>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </DataTable>

      <!-- File Type Breakdown -->
      <div v-if="fileTypeBreakdown.length > 0" class="mt-6">
        <DataTable>
          <thead>
            <tr>
              <th>File Type</th>
              <th>Capacity</th>
              <th>Used</th>
              <th>Available</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="breakdown in fileTypeBreakdown" :key="breakdown.type">
              <td>
                <span class="badge badge-outline">{{ breakdown.type }}</span>
              </td>
              <td class="font-medium">
                {{ formatBytes(breakdown.capacity) }}
              </td>
              <td class="font-medium">{{ formatBytes(breakdown.used) }}</td>
              <td class="font-medium">
                {{ formatBytes(breakdown.available) }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <progress
                    class="progress progress-sm w-20"
                    :class="getProgressColor(breakdown.usagePercent)"
                    :value="breakdown.usagePercent"
                    max="100"
                  ></progress>
                  <span class="text-sm"
                    >{{ Math.round(breakdown.usagePercent) }}%</span
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </DataTable>
      </div>
    </template>
  </div>
</template>
