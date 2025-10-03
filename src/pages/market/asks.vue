<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "Storage Asks"
  }
}
</route>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ScaleIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import SectionCard from "@/components/ui/SectionCard.vue";
import MarketLayout from "./components/MarketLayout.vue";
import StorageAsksTable from "./asks/components/StorageAsksTable.vue";
import StorageAskForm from "./asks/components/StorageAskForm.vue";
import type { StorageAsk } from "@/types/market";

interface ActorInfo {
  ID: number;
  Address: string;
}

const {
  data: actors,
  loading: actorsLoading,
  error: actorsError,
  refresh: refreshActors,
} = useCachedQuery<ActorInfo[]>("ActorList", [], {
  pollingInterval: 60000,
});

const { execute: fetchStorageAsk } = useLazyQuery<StorageAsk>("GetStorageAsk");
const { execute: setStorageAsk, error: setError } =
  useLazyQuery<void>("SetStorageAsk");

const asks = ref<StorageAsk[]>([]);
const loadingAsks = ref(false);
const askError = ref<Error | null>(null);
const showAskForm = ref(false);
const selectedSpId = ref<number>(0);
const currentAsk = ref<StorageAsk | null>(null);

const asksLoading = computed(() => actorsLoading.value || loadingAsks.value);
const asksErrorComputed = computed(
  () => actorsError.value || askError.value || setError.value,
);

const fetchAllAsks = async () => {
  if (!actors.value || actors.value.length === 0) {
    asks.value = [];
    return;
  }

  loadingAsks.value = true;
  askError.value = null;
  const fetchedAsks: StorageAsk[] = [];

  try {
    for (const actor of actors.value) {
      try {
        const ask = await fetchStorageAsk(actor.ID);
        if (ask) {
          fetchedAsks.push(ask);
        }
      } catch (err) {
        console.debug(`No storage ask for SP ${actor.ID}`, err);
      }
    }
    asks.value = fetchedAsks;
  } catch (err) {
    askError.value = err as Error;
  } finally {
    loadingAsks.value = false;
  }
};

const handleUpdateAsk = async (spId: number) => {
  selectedSpId.value = spId;

  try {
    const existingAsk = await fetchStorageAsk(spId);
    currentAsk.value = existingAsk;
  } catch {
    currentAsk.value = null;
  }

  showAskForm.value = true;
};

const handleSaveAsk = async (askData: Partial<StorageAsk>) => {
  try {
    await setStorageAsk(
      askData.SpID,
      askData.Price,
      askData.VerifiedPrice,
      askData.MinSize,
      askData.MaxSize,
    );

    await fetchAllAsks();
    showAskForm.value = false;
    currentAsk.value = null;
  } catch (err) {
    console.error("Failed to set storage ask:", err);
  }
};

const handleRefreshAsks = async () => {
  await refreshActors();
  await fetchAllAsks();
};

watch(
  () => actors.value,
  () => {
    if (actors.value && actors.value.length > 0) {
      fetchAllAsks();
    }
  },
);

onMounted(() => {
  fetchAllAsks();
});
</script>

<template>
  <MarketLayout current-tab="asks">
    <SectionCard
      title="Storage Asks"
      :icon="ScaleIcon"
      tooltip="Manage ask parameters for each storage provider"
    >
      <StorageAsksTable
        :actors="actors || []"
        :asks="asks"
        :loading="asksLoading"
        :error="asksErrorComputed"
        :on-refresh="handleRefreshAsks"
        @update-ask="handleUpdateAsk"
      />
    </SectionCard>

    <!-- Storage Ask Form Modal -->
    <StorageAskForm
      v-model:visible="showAskForm"
      :sp-id="selectedSpId"
      :initial-ask="currentAsk"
      @save="handleSaveAsk"
      @cancel="showAskForm = false"
    />
  </MarketLayout>
</template>
