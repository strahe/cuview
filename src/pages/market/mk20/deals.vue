<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "MK20 Deals"
  }
}
</route>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router";
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
const selectedDealId = ref<string | null>(null);
const activeRequestId = ref(0);
const lastResolvedDeal = ref<Mk20DealDetail | null>(null);

const route = useRoute();
const router = useRouter();

const dealParam = computed(() => {
  const raw = route.query.deal;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
});

let suppressQueryWatcher = false;

const updateDealQuery = async (dealId: string | null) => {
  const current = dealParam.value;
  if (dealId === current || (!dealId && !current)) return;

  const nextQuery = { ...route.query } as LocationQueryRaw;

  if (dealId) {
    nextQuery.deal = dealId;
  } else {
    delete nextQuery.deal;
  }

  await router.replace({ query: nextQuery });
};

const loadDealDetails = async (id: string) => {
  const requestId = ++activeRequestId.value;
  detailError.value = null;
  selectedDealId.value = id;
  try {
    await dealDetailQuery.execute(id);
    if (requestId !== activeRequestId.value) {
      if (lastResolvedDeal.value) {
        dealDetailQuery.data.value = lastResolvedDeal.value;
      }
      return;
    }
    lastResolvedDeal.value = dealDetailQuery.data.value;
    detailModalOpen.value = true;
  } catch (err) {
    if (requestId !== activeRequestId.value) return;
    detailError.value =
      err instanceof Error ? err.message : "Failed to load deal details";
    detailModalOpen.value = false;
  }
};

const handleDeepLink = async (id: string) => {
  await loadDealDetails(id);
};

const openDealDetails = async (id: string) => {
  suppressQueryWatcher = true;
  await updateDealQuery(id);
  await loadDealDetails(id);
};

const handleSearch = (id: string) => {
  void openDealDetails(id);
};

const handleCloseDetail = async () => {
  detailModalOpen.value = false;
  selectedDealId.value = null;
  lastResolvedDeal.value = null;
  suppressQueryWatcher = true;
  await updateDealQuery(null);
};

watch(
  dealParam,
  (id) => {
    if (suppressQueryWatcher) {
      suppressQueryWatcher = false;
      return;
    }

    if (!id) {
      selectedDealId.value = null;
      detailModalOpen.value = false;
      detailError.value = null;
      return;
    }

    if (id === selectedDealId.value && detailModalOpen.value) return;

    void handleDeepLink(id);
  },
  { immediate: true },
);
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
