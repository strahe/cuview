import { ref, computed, onMounted, onUnmounted } from "vue";
import { fetchSectors } from "@/services/sector-api";
import type { SectorListItem } from "@/types/sectors";

export function useSectorsData() {
  const sectors = ref<SectorListItem[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const lastUpdated = ref(0);

  let ongoingRequest: Promise<void> | null = null;
  let activeController: AbortController | null = null;
  let queuedForceReload = false;

  const hasData = computed(() => sectors.value.length > 0);

  const cleanupRequest = () => {
    queuedForceReload = false;
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  };

  async function load(force = false): Promise<void> {
    if (ongoingRequest) {
      if (force) {
        queuedForceReload = true;
      }
      return ongoingRequest;
    }

    if (force || !hasData.value) {
      loading.value = true;
    }

    const controller = new AbortController();
    activeController = controller;

    const requestPromise = (async () => {
      try {
        const result = await fetchSectors(controller.signal);
        sectors.value = result;
        lastUpdated.value = Date.now();
        error.value = null;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        error.value = err as Error;
      }
    })();

    ongoingRequest = requestPromise;

    try {
      await requestPromise;
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
      if (ongoingRequest === requestPromise) {
        ongoingRequest = null;
        loading.value = false;
      }
    }

    if (queuedForceReload) {
      queuedForceReload = false;
      await load(true);
    }
  }

  async function refresh() {
    await load(true);
  }

  onMounted(() => {
    load(true);
  });

  onUnmounted(() => {
    cleanupRequest();
  });

  return {
    sectors,
    loading,
    error,
    hasData,
    lastUpdated,
    refresh,
  };
}
