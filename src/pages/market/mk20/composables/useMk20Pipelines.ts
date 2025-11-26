import { computed, onMounted, ref } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { normalizeMk20Pipeline } from "@/utils/market";
import type { Mk20Pipeline, Mk20PipelineRaw } from "@/types/market";

export interface UseMk20PipelinesOptions {
  batchSize?: number;
  initialBatches?: number;
  immediate?: boolean;
  maxItems?: number;
}

export function useMk20Pipelines(
  options: UseMk20PipelinesOptions = {},
  method = "MK20DDOPipelines",
) {
  const {
    batchSize = 50,
    initialBatches = 2,
    immediate = true,
    maxItems = 2000,
  } = options;

  const { call } = useCurioQuery();

  const items = ref<Mk20Pipeline[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const hasMore = ref(true);
  const loadingMore = ref(false);
  const paginationError = ref<Error | null>(null);

  const currentOffset = ref(0);
  const seenIds = new Set<string>();

  const totalItems = computed(() => items.value.length);
  const hasData = computed(() => items.value.length > 0);

  const fetchBatch = async (offset: number, limit: number) => {
    const response = await call<Mk20PipelineRaw[]>(method, [limit, offset]);
    const payload = response ?? [];
    return payload.map((entry) => normalizeMk20Pipeline(entry));
  };

  const loadInitialData = async () => {
    loading.value = true;
    error.value = null;
    paginationError.value = null;
    hasMore.value = true;
    currentOffset.value = 0;
    seenIds.clear();

    try {
      const limit = batchSize * initialBatches;
      const initialBatch = await fetchBatch(0, limit);

      const unique = initialBatch.filter((pipeline) => {
        if (seenIds.has(pipeline.id)) {
          return false;
        }
        seenIds.add(pipeline.id);
        return true;
      });

      items.value = unique;
      currentOffset.value = initialBatch.length;

      if (initialBatch.length < limit) {
        hasMore.value = false;
      }
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) {
      return;
    }

    loadingMore.value = true;
    paginationError.value = null;

    try {
      const nextBatch = await fetchBatch(currentOffset.value, batchSize);

      if (nextBatch.length < batchSize) {
        hasMore.value = false;
      }

      if (nextBatch.length > 0) {
        const newItems: Mk20Pipeline[] = [];
        for (const pipeline of nextBatch) {
          if (!seenIds.has(pipeline.id)) {
            seenIds.add(pipeline.id);
            newItems.push(pipeline);
          }
        }

        if (newItems.length > 0) {
          const combined = [...items.value, ...newItems];

          if (combined.length > maxItems) {
            const trimmed = combined.slice(-maxItems);
            items.value = trimmed;
            seenIds.clear();
            trimmed.forEach((entry) => seenIds.add(entry.id));
          } else {
            items.value = combined;
          }
        }
      }

      currentOffset.value += nextBatch.length;
    } catch (err) {
      paginationError.value = err as Error;
    } finally {
      loadingMore.value = false;
    }
  };

  const retryPagination = async () => {
    if (paginationError.value) {
      await loadMore();
    }
  };

  const refresh = async () => {
    await loadInitialData();
  };

  onMounted(() => {
    if (immediate) {
      void loadInitialData();
    }
  });

  return {
    data: computed(() => items.value),
    totalItems,
    loading,
    error,
    hasData,
    hasMore,
    loadingMore,
    paginationError,
    loadMore,
    retryPagination,
    refresh,
    load: loadInitialData,
  };
}
