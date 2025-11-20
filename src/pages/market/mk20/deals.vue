<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "MK20 Deals"
  }
}
</route>

<script setup lang="ts">
import { ref } from "vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import MarketLayout from "../components/MarketLayout.vue";
import Mk20DealSearch from "./components/Mk20DealSearch.vue";
import Mk20DealPipelinesCard from "./components/Mk20DealPipelinesCard.vue";
import Mk20DealListSection from "./components/Mk20DealListSection.vue";
import Mk20DealDetailsModal from "./components/Mk20DealDetailsModal.vue";
import Mk20SettingsCard from "./components/Mk20SettingsCard.vue";
import { useLazyQuery } from "@/composables/useLazyQuery";
import type { Mk20DealDetail } from "@/types/market";

const detailModalOpen = ref(false);
const detailError = ref<string | null>(null);
const dealDetailQuery = useLazyQuery<Mk20DealDetail>("MK20DDOStorageDeal");

const openDealDetails = async (id: string) => {
  detailError.value = null;
  try {
    await dealDetailQuery.execute(id);
    detailModalOpen.value = true;
  } catch (err) {
    detailError.value =
      err instanceof Error ? err.message : "Failed to load deal details";
    detailModalOpen.value = false;
  }
};

const handleSearch = (id: string) => {
  void openDealDetails(id);
};

const handleCloseDetail = () => {
  detailModalOpen.value = false;
};
</script>

<template>
  <MarketLayout current-tab="mk20-deals">
    <div class="space-y-6">
      <SectionCard
        title="Deal Search"
        :icon="InformationCircleIcon"
        tooltip="Find an MK20 deal by ID."
      >
        <Mk20DealSearch @search="handleSearch" />
        <p v-if="detailError" class="text-error mt-3 text-sm font-medium">
          {{ detailError }}
        </p>
      </SectionCard>

      <Mk20SettingsCard />

      <Mk20DealPipelinesCard />

      <Mk20DealListSection @view-deal="openDealDetails" />

      <Mk20DealDetailsModal
        :open="detailModalOpen"
        :loading="dealDetailQuery.loading.value"
        :error="dealDetailQuery.error.value?.message ?? null"
        :deal="dealDetailQuery.data.value"
        @close="handleCloseDetail"
      />
    </div>
  </MarketLayout>
</template>
