<script setup lang="ts">
import { computed } from "vue";
import { formatDistanceToNow } from "date-fns";
import { CircleStackIcon } from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
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
  <div class="flex min-h-screen flex-col p-6">
    <SectionCard
      title="Sectors"
      tooltip="Review sector inventory, storage availability, and deal coverage"
      :icon="CircleStackIcon"
      class="flex flex-1 flex-col"
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

      <div class="flex min-h-0 flex-1 flex-col">
        <SectorsTable
          :sectors="sectorsData.sectors.value"
          :loading="sectorsData.loading.value"
          :error="sectorsData.error.value"
          :on-refresh="sectorsData.refresh"
          :summary="summaryStats"
        />
      </div>
    </SectionCard>
  </div>
</template>
