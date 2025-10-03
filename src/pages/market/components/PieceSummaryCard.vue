<script setup lang="ts">
import { computed } from "vue";
import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { formatDateTime } from "@/utils/format";
import type { PieceSummary } from "@/types/market";

const {
  data: summary,
  loading,
  error,
  refresh,
} = useCachedQuery<PieceSummary>("PieceSummary", [], {
  pollingInterval: 30000,
});

// Calculate percentages
const indexedPercentage = computed(() => {
  if (!summary.value || summary.value.total === 0) return 0;
  return ((summary.value.indexed / summary.value.total) * 100).toFixed(1);
});

const announcedPercentage = computed(() => {
  if (!summary.value || summary.value.total === 0) return 0;
  return ((summary.value.announced / summary.value.total) * 100).toFixed(1);
});

// Format last updated time
const lastUpdated = computed(() => {
  if (!summary.value || !summary.value.last_updated) return "Unknown";
  return formatDateTime(summary.value.last_updated);
});
</script>

<template>
  <div
    class="stats bg-base-100 border-base-300 w-full rounded-xl border shadow-md"
  >
    <!-- Loading State -->
    <template v-if="loading && !summary">
      <div class="stat">
        <div class="py-8 text-center">
          <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
          <div class="text-base-content/60">Loading piece summary...</div>
        </div>
      </div>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <div class="stat">
        <div class="py-8 text-center">
          <div
            class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
          >
            <ExclamationTriangleIcon class="text-error h-8 w-8" />
          </div>
          <h3 class="text-base-content mb-2 text-lg font-semibold">
            Connection Error
          </h3>
          <p class="text-base-content/70 mb-4 text-sm">
            {{ error.message }}
          </p>
          <button class="btn btn-outline btn-sm" @click="refresh">
            Retry Connection
          </button>
        </div>
      </div>
    </template>

    <!-- Data State -->
    <template v-else-if="summary">
      <!-- Total Pieces -->
      <div class="stat">
        <div class="stat-figure text-primary">
          <div class="bg-primary/10 rounded-lg p-2.5">
            <ArchiveBoxIcon class="size-6" />
          </div>
        </div>
        <div class="stat-title">Total Pieces</div>
        <div class="stat-value text-primary">
          {{ summary.total.toLocaleString() }}
        </div>
        <div class="stat-desc">Updated at {{ lastUpdated }}</div>
      </div>

      <!-- Indexed Pieces -->
      <div class="stat">
        <div class="stat-figure text-success">
          <div
            class="radial-progress text-success"
            :style="`--value: ${indexedPercentage}; --size: 3rem; --thickness: 4px;`"
          >
            {{ indexedPercentage }}%
          </div>
        </div>
        <div class="stat-title">Indexed</div>
        <div class="stat-value text-success">
          {{ summary.indexed.toLocaleString() }}
        </div>
        <div class="stat-desc text-success">
          <CheckCircleIcon class="inline-block size-4" />
          {{ indexedPercentage }}% indexed
        </div>
      </div>

      <!-- Announced Pieces -->
      <div class="stat">
        <div class="stat-figure text-info">
          <div
            class="radial-progress text-info"
            :style="`--value: ${announcedPercentage}; --size: 3rem; --thickness: 4px;`"
          >
            {{ announcedPercentage }}%
          </div>
        </div>
        <div class="stat-title">Announced</div>
        <div class="stat-value text-info">
          {{ summary.announced.toLocaleString() }}
        </div>
        <div class="stat-desc text-info">
          <BellAlertIcon class="inline-block size-4" />
          {{ announcedPercentage }}% announced to network
        </div>
      </div>
    </template>
  </div>
</template>
