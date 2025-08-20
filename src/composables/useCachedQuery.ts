import { onMounted, onUnmounted } from "vue";
import { useCurioDataStore } from "@/stores/curioData";

export interface CachedQueryOptions {
  pollingInterval?: number;
  immediate?: boolean;
}

export function useCachedQuery<T>(
  method: string,
  params: unknown[] = [],
  options: CachedQueryOptions = {},
) {
  const { pollingInterval = 30000, immediate = true } = options;

  const store = useCurioDataStore();
  const accessor = store.createDataAccessor<T>(method, params);

  onMounted(() => {
    if (immediate) {
      accessor.startPolling(pollingInterval);
    }
  });

  onUnmounted(() => {
    accessor.stopPolling();
  });

  return {
    data: accessor.data,
    loading: accessor.loading,
    error: accessor.error,
    hasData: accessor.hasData,
    lastUpdated: accessor.lastUpdated,
    refresh: accessor.refresh,
  };
}
