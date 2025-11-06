<script setup lang="ts">
import { computed } from "vue";
import {
  CircleStackIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";

import SectorsTable from "./components/SectorsTable.vue";
import { useSectorsData } from "@/composables/useSectorsData";
import { usePageTitle } from "@/composables/usePageTitle";

const { setTitle } = usePageTitle();
setTitle("Sectors");

const sectorsData = useSectorsData();

const totalSectors = computed(() => sectorsData.sectors.value.length);
const filPlusCount = computed(
  () => sectorsData.sectors.value.filter((sector) => sector.IsFilPlus).length,
);
const provingCount = computed(
  () => sectorsData.sectors.value.filter((sector) => sector.Proving).length,
);
const flaggedCount = computed(
  () => sectorsData.sectors.value.filter((sector) => sector.Flag).length,
);
const snapCount = computed(
  () => sectorsData.sectors.value.filter((sector) => sector.HasSnap).length,
);

const isInitialLoading = computed(
  () => sectorsData.loading.value && !sectorsData.hasData.value,
);
const isRefreshing = computed(
  () => sectorsData.loading.value && sectorsData.hasData.value,
);

const summaryStats = computed(() => ({
  total: totalSectors.value,
  filPlus: filPlusCount.value,
  proving: provingCount.value,
  flagged: flaggedCount.value,
  snap: snapCount.value,
}));

const tooltipMessage =
  "Review sector inventory, storage availability, and deal coverage";

const formatSummaryPercentage = (count: number) => {
  const total = summaryStats.value.total;
  if (!total) return "—";
  return `${((count / total) * 100).toFixed(1)}%`;
};

const lastUpdatedShortLabel = computed(() => {
  if (isInitialLoading.value) return "Pending";
  if (isRefreshing.value) return "Refreshing";
  const updatedAtRaw = sectorsData.lastUpdated.value;
  const updatedAt = typeof updatedAtRaw === "number" ? updatedAtRaw : 0;
  if (!updatedAt) return "Never";

  const diffMs = Date.now() - updatedAt;
  if (diffMs < 60_000) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diffMs / 86_400_000);
  return `${days}d ago`;
});
</script>

<route>
{
  "meta": {
    "title": "Sectors"
  }
}
</route>

<template>
  <div class="flex min-h-screen flex-col gap-5 p-6">
    <div
      class="border-base-300 bg-base-100 flex flex-col gap-4 rounded-xl border p-5 shadow-sm"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <CircleStackIcon class="text-primary h-9 w-9 shrink-0" />
          <div class="space-y-1">
            <div
              class="text-base-content flex items-center gap-2 text-lg font-semibold"
            >
              <h1>Sectors</h1>
              <div
                class="tooltip tooltip-bottom"
                :data-tip="tooltipMessage"
                role="tooltip"
              >
                <InformationCircleIcon
                  class="text-base-content/60 h-5 w-5"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-base-content/60 text-[11px] sm:text-xs">
            {{ lastUpdatedShortLabel }}
          </span>
          <button
            class="btn btn-outline btn-xs sm:btn-sm gap-2"
            :disabled="sectorsData.loading.value"
            @click="sectorsData.refresh"
          >
            <span
              v-if="sectorsData.loading.value"
              class="loading loading-spinner loading-xs"
            />
            <span>
              {{ sectorsData.loading.value ? "Refreshing..." : "Refresh" }}
            </span>
          </button>
        </div>
      </div>

      <div
        class="border-base-300 bg-base-200/40 flex flex-wrap items-center gap-4 rounded-lg px-4 py-2 text-xs sm:text-sm"
      >
        <div class="flex items-baseline gap-2">
          <span class="text-base-content/60 text-xs uppercase">Total</span>
          <span class="text-base-content text-lg font-semibold">
            {{ summaryStats.total.toLocaleString() }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="badge badge-accent badge-sm">Fil+</span>
          <span class="text-base-content font-medium">
            {{ summaryStats.filPlus.toLocaleString() }}
          </span>
          <span class="text-base-content/60 text-xs">
            ({{ formatSummaryPercentage(summaryStats.filPlus) }})
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="badge badge-success badge-sm">Proving</span>
          <span class="text-base-content font-medium">
            {{ summaryStats.proving.toLocaleString() }}
          </span>
          <span class="text-base-content/60 text-xs">
            ({{ formatSummaryPercentage(summaryStats.proving) }})
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="badge badge-warning badge-sm">Flagged</span>
          <span class="text-base-content font-medium">
            {{ summaryStats.flagged.toLocaleString() }}
          </span>
          <span
            v-if="summaryStats.snap > 0"
            class="text-base-content/60 text-xs"
          >
            ({{ summaryStats.snap.toLocaleString() }} Snap)
          </span>
        </div>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <SectorsTable
        class="flex-1"
        :sectors="sectorsData.sectors.value"
        :loading="sectorsData.loading.value"
        :error="sectorsData.error.value"
        :on-refresh="sectorsData.refresh"
      />
    </div>
  </div>
</template>
