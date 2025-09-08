<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold">All Sectors</h1>

    <Card>
      <DataSection
        :loading="loading"
        :error="error"
        :has-data="hasData"
        :on-retry="refresh"
        error-title="Failed to Load Sectors"
        empty-title="No Sectors"
        empty-message="No sectors found in the cluster"
        empty-icon="🗄️"
      >
        <SectorsTable
          :sectors="filteredSectors"
          :loading="loading"
          :is-refreshing="isRefreshing"
          :filters="filters"
          :unique-miner-addresses="uniqueMinerAddresses"
          :unique-seal-info="uniqueSealInfo"
          :on-refresh="refresh"
          :clear-filters="clearFilters"
          :update-filter="updateFilter"
        />
      </DataSection>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DataSection from "@/components/ui/DataSection.vue";
import Card from "@/components/ui/Card.vue";
import SectorsTable from "./components/SectorsTable.vue";
import { useSectorsData } from "./composables/useSectorsData";
import { useSectorFilters } from "./composables/useSectorFilters";

const { sectors, loading, error, refresh, isRefreshing } = useSectorsData();

const {
  filters,
  filteredSectors,
  uniqueMinerAddresses,
  uniqueSealInfo,
  clearFilters,
  updateFilter,
} = useSectorFilters(sectors);

const hasData = computed(() =>
  Boolean(sectors.value && sectors.value.length > 0),
);
</script>
