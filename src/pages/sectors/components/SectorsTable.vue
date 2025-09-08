<template>
  <div class="sectors-table">
    <!-- Table Controls -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <!-- Search -->
      <div class="max-w-md flex-1">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search sectors..."
          class="input input-bordered w-full"
        />
      </div>

      <!-- Filter Controls -->
      <div class="flex flex-wrap gap-2">
        <select
          :value="filters.minerAddress || ''"
          class="select select-bordered select-sm"
          @change="updateFilter('minerAddress', $event.target.value)"
        >
          <option value="">All Miners</option>
          <option
            v-for="addr in uniqueMinerAddresses"
            :key="addr"
            :value="addr"
          >
            {{ addr }}
          </option>
        </select>

        <select
          :value="filters.sealInfo || ''"
          class="select select-bordered select-sm"
          @change="updateFilter('sealInfo', $event.target.value)"
        >
          <option value="">All Sizes</option>
          <option v-for="size in uniqueSealInfo" :key="size" :value="size">
            {{ size }}
          </option>
        </select>

        <div class="flex gap-1">
          <button
            class="btn btn-sm"
            :class="filters.isOnChain === true ? 'btn-active' : 'btn-outline'"
            @click="toggleFilter('isOnChain', true)"
          >
            On-Chain
          </button>
          <button
            class="btn btn-sm"
            :class="filters.isFilPlus === true ? 'btn-active' : 'btn-outline'"
            @click="toggleFilter('isFilPlus', true)"
          >
            Fil+
          </button>
          <button
            class="btn btn-sm"
            :class="filters.proving === true ? 'btn-active' : 'btn-outline'"
            @click="toggleFilter('proving', true)"
          >
            Proving
          </button>
        </div>

        <button class="btn btn-sm btn-ghost" @click="clearFilters">
          Clear
        </button>
      </div>

      <!-- Refresh Button -->
      <button
        :disabled="loading || isRefreshing"
        class="btn btn-sm btn-outline"
        @click="onRefresh"
      >
        <span
          v-if="loading || isRefreshing"
          class="loading loading-spinner loading-sm"
        ></span>
        Refresh
      </button>
    </div>

    <!-- Stats -->
    <div class="text-base-content/70 mb-4 flex gap-4 text-sm">
      <span>Total: {{ filteredSectors.length }}</span>
      <span>On-Chain: {{ onChainCount }}</span>
      <span>Fil+: {{ filPlusCount }}</span>
      <span>Proving: {{ provingCount }}</span>
    </div>

    <!-- Virtualized Table Container -->
    <div
      ref="scrollElement"
      class="overflow-auto rounded-lg border"
      :style="{ height: tableHeight }"
    >
      <!-- Table Header -->
      <div class="bg-base-100 sticky top-0 z-10 border-b">
        <div
          class="text-base-content/70 grid min-w-fit grid-cols-12 gap-2 p-2 text-sm font-medium"
        >
          <div class="col-span-1">Miner</div>
          <div class="col-span-1">Sector</div>
          <div class="col-span-1">Expiry</div>
          <div class="col-span-1">🔗</div>
          <div class="col-span-1">Proving</div>
          <div class="col-span-1">Sealed</div>
          <div class="col-span-1">Unsealed</div>
          <div class="col-span-1">DealWeight</div>
          <div class="col-span-2">Deals</div>
          <div class="col-span-1">Fil+</div>
          <div class="col-span-1">Size</div>
        </div>
      </div>

      <!-- Virtual List Container -->
      <div
        :style="{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualItem in virtualItems"
          :key="virtualItem.key"
          :data-index="virtualItem.index"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }"
        >
          <SectorRow
            :sector="filteredSectors[virtualItem.index]"
            :index="virtualItem.index"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !filteredSectors.length" class="py-8 text-center">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="text-base-content/70 mt-2">Loading sectors...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading && !filteredSectors.length"
      class="py-8 text-center"
    >
      <p class="text-base-content/70">No sectors found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import SectorRow from "./SectorRow.vue";
import type { SectorItem, SectorFilters } from "@/types/sector";

interface Props {
  sectors: SectorItem[];
  loading: boolean;
  isRefreshing: boolean;
  filters: SectorFilters;
  uniqueMinerAddresses: string[];
  uniqueSealInfo: string[];
  onRefresh: () => void;
  clearFilters: () => void;
  updateFilter: (key: keyof SectorFilters, value: unknown) => void;
}

const props = defineProps<Props>();

// Search functionality
const searchTerm = ref("");

const filteredSectors = computed(() => {
  let result = props.sectors;

  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase();
    result = result.filter((sector) => {
      const searchable = [
        sector.MinerAddress,
        sector.SectorNum.toString(),
        sector.DealWeight,
        sector.Deals,
        sector.SealInfo,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }

  return result;
});

// Stats
const onChainCount = computed(
  () => filteredSectors.value.filter((s) => s.IsOnChain).length,
);
const filPlusCount = computed(
  () => filteredSectors.value.filter((s) => s.IsFilPlus).length,
);
const provingCount = computed(
  () => filteredSectors.value.filter((s) => s.Proving).length,
);

// Virtual scrolling setup
const scrollElement = ref<HTMLElement>();
const tableHeight = ref("600px");

const virtualizer = useVirtualizer({
  count: () => filteredSectors.value.length,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => 45, // Row height in pixels
  overscan: 10,
});

const virtualItems = computed(() => virtualizer.value.getVirtualItems());

// Toggle filter helper
const toggleFilter = (key: keyof SectorFilters, value: unknown) => {
  const currentValue = props.filters[key];
  props.updateFilter(key, currentValue === value ? undefined : value);
};

// Auto-adjust table height based on viewport
const updateTableHeight = () => {
  const vh = window.innerHeight;
  // Reserve space for header, controls, etc.
  tableHeight.value = `${Math.max(400, vh - 300)}px`;
};

onMounted(() => {
  updateTableHeight();
  window.addEventListener("resize", updateTableHeight);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateTableHeight);
});
</script>

<style scoped>
.sectors-table {
  .grid {
    min-width: 1000px; /* Ensure horizontal scroll for narrow screens */
  }
}
</style>
