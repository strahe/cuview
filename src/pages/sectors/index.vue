<script setup lang="ts">
import { computed } from "vue";
import { formatDistanceToNow } from "date-fns";
import {
  CircleStackIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import KPICard from "@/components/ui/KPICard.vue";
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

const getPercentage = (count: number) => {
  if (!totalSectors.value) return "—";
  return `${((count / totalSectors.value) * 100).toFixed(1)}%`;
};

const lastUpdatedLabel = computed(() => {
  if (isInitialLoading.value) return "Loading sectors...";
  if (isRefreshing.value) return "Refreshing...";
  if (!sectorsData.lastUpdated.value) return "Not yet refreshed";
  return `Updated ${formatDistanceToNow(sectorsData.lastUpdated.value, {
    addSuffix: true,
  })}`;
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
  <div class="space-y-6 p-6">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KPICard
        :value="totalSectors.toLocaleString()"
        label="Total Sectors"
        :subtitle="lastUpdatedLabel"
        :icon="CircleStackIcon"
        icon-color="primary"
      />

      <KPICard
        :value="filPlusCount.toLocaleString()"
        label="Fil+ Coverage"
        :subtitle="getPercentage(filPlusCount)"
        :icon="SparklesIcon"
        icon-color="accent"
        trend="up"
      />

      <KPICard
        :value="provingCount.toLocaleString()"
        label="Proving"
        :subtitle="getPercentage(provingCount)"
        :icon="ShieldCheckIcon"
        icon-color="success"
        trend="neutral"
      />

      <KPICard
        :value="flaggedCount.toLocaleString()"
        label="Flagged"
        :subtitle="
          snapCount ? `${snapCount.toLocaleString()} Snap` : 'No Snap sectors'
        "
        :icon="ExclamationTriangleIcon"
        icon-color="warning"
        trend="down"
      />
    </div>

    <SectionCard
      title="Sectors"
      tooltip="Review sector inventory, storage availability, and deal coverage"
      :icon="CircleStackIcon"
    >
      <template #actions>
        <div class="text-base-content/70 flex items-center gap-3 text-sm">
          <span>{{ lastUpdatedLabel }}</span>
          <button
            class="btn btn-outline btn-sm"
            :disabled="sectorsData.loading.value"
            @click="sectorsData.refresh"
          >
            <span
              v-if="sectorsData.loading.value"
              class="loading loading-spinner loading-xs"
            />
            Refresh
          </button>
        </div>
      </template>

      <SectorsTable
        :sectors="sectorsData.sectors.value"
        :loading="sectorsData.loading.value"
        :error="sectorsData.error.value"
        :on-refresh="sectorsData.refresh"
      />
    </SectionCard>
  </div>
</template>
