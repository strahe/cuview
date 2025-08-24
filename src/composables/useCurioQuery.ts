import { ref, computed, onMounted, onUnmounted } from "vue";
import { CurioApiService } from "@/services/curio-api";
import { useConfigStore } from "@/stores/config";

// Global API instance
let globalApi: CurioApiService | null = null;
let currentEndpoint: string | null = null;

function getApi(): CurioApiService {
  const configStore = useConfigStore();
  const endpoint = configStore.getEndpoint();

  // Create new API instance if endpoint changed
  if (!globalApi || currentEndpoint !== endpoint) {
    if (globalApi) {
      globalApi.disconnect();
    }

    globalApi = new CurioApiService({ endpoint });
    currentEndpoint = endpoint;
    globalApi.connect().catch(console.error);
  }

  return globalApi;
}

export interface QueryOptions {
  immediate?: boolean;
  polling?: boolean;
  pollingInterval?: number;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export interface QueryResult<T> {
  data: import("vue").Ref<T | null>;
  loading: import("vue").Ref<boolean>;
  refreshing: import("vue").Ref<boolean>;
  error: import("vue").Ref<Error | null>;
  refresh: () => Promise<void>;
  reset: () => void;
  isReady: import("vue").ComputedRef<boolean>;
  hasData: import("vue").ComputedRef<boolean>;
  isEmpty: import("vue").ComputedRef<boolean>;
}

function createQuery<T>(
  method: string,
  params: unknown[] = [],
  options: QueryOptions = {},
): QueryResult<T> {
  const {
    immediate = true,
    polling = false,
    pollingInterval = 30000,
    retry = true,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const api = getApi();

  const data = ref<T | null>(null);
  const loading = ref(false);
  const refreshing = ref(false);
  const error = ref<Error | null>(null);

  let pollingTimer: NodeJS.Timeout | null = null;
  let retryTimer: NodeJS.Timeout | null = null;
  let currentRetryCount = 0;

  async function execute(isRefresh = false): Promise<void> {
    // Prevent multiple concurrent requests
    if (loading.value || refreshing.value) return;

    // Set appropriate loading state - NEVER set loading=true during refresh
    if (isRefresh) {
      refreshing.value = true;
    } else {
      loading.value = true;
      error.value = null;
    }

    try {
      const result = await api.call<T>(method, params);

      // Only update data if we got a valid result
      // For refresh operations, preserve existing data if new data is null/undefined
      if (isRefresh && (result === null || result === undefined)) {
        console.warn(
          `Refresh returned null/undefined for ${method}, keeping existing data`,
        );
      } else {
        data.value = result;
      }

      currentRetryCount = 0;

      // Clear error on successful request
      if (error.value) {
        error.value = null;
      }
    } catch (err) {
      error.value = err as Error;

      // Auto retry with same refresh status
      if (retry && currentRetryCount < retryCount) {
        currentRetryCount++;
        retryTimer = setTimeout(
          () => {
            execute(isRefresh);
          },
          retryDelay * Math.pow(2, currentRetryCount - 1),
        );
      }
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  }

  const refresh = () => execute(true);

  function reset() {
    data.value = null;
    loading.value = false;
    refreshing.value = false;
    error.value = null;
    currentRetryCount = 0;
    stopPolling();
    clearRetryTimer();
  }

  function startPolling() {
    // Auto-enable polling if pollingInterval is set
    const shouldPoll = polling || pollingInterval > 0;
    if (!shouldPoll) return;

    stopPolling();
    pollingTimer = setInterval(() => {
      if (api.isConnected && !loading.value && !refreshing.value) {
        execute(true); // Always use refresh mode for polling
      }
    }, pollingInterval);
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  function clearRetryTimer() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  const isReady = computed(() => api.isConnected && !loading.value);
  const hasData = computed(() => data.value !== null);
  const isEmpty = computed(
    () => !loading.value && !hasData.value && !error.value,
  );

  onMounted(() => {
    if (immediate) {
      const checkAndExecute = () => {
        if (api.isConnected) {
          execute();
          startPolling();
        } else {
          setTimeout(checkAndExecute, 1000);
        }
      };
      checkAndExecute();
    }
  });

  onUnmounted(() => {
    stopPolling();
    clearRetryTimer();
  });

  return {
    data: data as import("vue").Ref<T | null>,
    loading,
    refreshing,
    error,
    refresh,
    reset,
    isReady,
    hasData,
    isEmpty,
  };
}

// Create API object with convenient methods
export function createCurioQuery() {
  return {
    // Version info
    version: (options?: QueryOptions) =>
      createQuery<number[]>("Version", [], options),

    // Actor summary
    actorSummary: (options?: QueryOptions) =>
      createQuery<unknown[]>("ActorSummary", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),

    // Generic query method
    query: <T>(method: string, params?: unknown[], options?: QueryOptions) =>
      createQuery<T>(method, params || [], options),

    // Direct call method for imperative usage (legacy, less type-safe)
    call: async <T>(method: string, params?: unknown[]): Promise<T> => {
      const api = getApi();

      // Wait for connection if not connected
      if (!api.isConnected) {
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (api.isConnected) {
              resolve(void 0);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      return await api.call<T>(method, params || []);
    },

    // Batch query
    batch: (
      calls: Array<{ method: string; params?: unknown[] }>,
      options?: QueryOptions,
    ) => createQuery<unknown[]>("batch", [calls], options),
  };
}

// Global instance
let globalQuery: ReturnType<typeof createCurioQuery> | null = null;

export function useCurioQuery() {
  if (!globalQuery) {
    globalQuery = createCurioQuery();
  }
  return globalQuery;
}
