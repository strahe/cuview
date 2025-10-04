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
  data: actorAddresses,
  loading: actorsLoading,
  error: actorsError,
  refresh: refreshActorAddresses,
} = useCachedQuery<string[]>("ActorList", [], {
  pollingInterval: 60000,
});

const actors = computed<ActorInfo[]>(() => {
  if (!actorAddresses.value || actorAddresses.value.length === 0) {
    return [];
  }

  return actorAddresses.value
    .map((address) => {
      if (!address || typeof address !== "string") {
        return null;
      }
      const match = address.match(/^[ft](\d+)$/);
      if (!match) {
        return null;
      }
      const parsedId = Number.parseInt(match[1], 10);
      if (Number.isNaN(parsedId)) {
        return null;
      }
      return {
        ID: parsedId,
        Address: address,
      } satisfies ActorInfo;
    })
    .filter((actor): actor is ActorInfo => actor !== null);
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

  try {
    const responses = await Promise.all(
      actors.value.map(async (actor) => {
        try {
          const ask = await fetchStorageAsk(actor.ID);
          return ask ?? null;
        } catch (err) {
          console.debug(`No storage ask for SP ${actor.ID}`, err);
          return null;
        }
      }),
    );

    asks.value = responses.filter((ask): ask is StorageAsk => ask !== null);
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
    const spId = askData.SpID ?? selectedSpId.value;
    if (!spId) {
      throw new Error("Storage provider ID is required.");
    }

    if (
      askData.Price === undefined ||
      askData.VerifiedPrice === undefined ||
      askData.MinSize === undefined ||
      askData.MaxSize === undefined
    ) {
      throw new Error("Incomplete storage ask payload.");
    }

    const now = Math.floor(Date.now() / 1000);
    const actorMatch = actors.value.find((actor) => actor.ID === spId);
    const payload: StorageAsk = {
      SpID: spId,
      Price: askData.Price,
      VerifiedPrice: askData.VerifiedPrice,
      MinSize: askData.MinSize,
      MaxSize: askData.MaxSize,
      CreatedAt: now,
      Expiry: now + 365 * 24 * 60 * 60,
      Sequence: askData.Sequence ?? currentAsk.value?.Sequence ?? 0,
      Miner:
        askData.Miner ??
        currentAsk.value?.Miner ??
        actorMatch?.Address ??
        `f0${spId}`,
    };

    await setStorageAsk(payload);

    await fetchAllAsks();
    showAskForm.value = false;
    currentAsk.value = null;
  } catch (err) {
    console.error("Failed to set storage ask:", err);
  }
};

const handleRefreshAsks = async () => {
  await refreshActorAddresses();
  await fetchAllAsks();
};

watch(actors, (next) => {
  if (next && next.length > 0) {
    fetchAllAsks();
  }
});

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
