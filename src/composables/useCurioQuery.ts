import { ref, computed, onMounted, onUnmounted } from "vue";
import { CurioApiService } from "@/services/curio-api";
import { useConfigStore } from "@/stores/config";
import { useConnectionStore } from "@/stores/connection";

// Global API instance
let globalApi: CurioApiService | null = null;
let currentEndpoint: string | null = null;

function getApi(): CurioApiService {
  const configStore = useConfigStore();
  const connectionStore = useConnectionStore();
  const endpoint = configStore.getEndpoint();

  // Create new API instance if endpoint changed
  if (!globalApi || currentEndpoint !== endpoint) {
    if (globalApi) {
      globalApi.disconnect();
    }

    globalApi = new CurioApiService({ endpoint });
    currentEndpoint = endpoint;

    // Set up connection status listeners
    globalApi.on("connected", () => {
      connectionStore.setStatus("connected");
    });

    globalApi.on("disconnected", () => {
      connectionStore.setStatus("disconnected");
    });

    globalApi.on("reconnecting", (attempt: number) => {
      connectionStore.setStatus("reconnecting");
      connectionStore.setReconnectAttempt(attempt);
    });

    globalApi.on("error", () => {
      connectionStore.setStatus("disconnected");
    });

    connectionStore.setStatus("connecting");
    globalApi.connect().catch(() => {
      connectionStore.setStatus("disconnected");
    });
  }

  return globalApi;
}

export function useCurioApi(): CurioApiService {
  return getApi();
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
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
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

  const clearConnectTimer = () => {
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  };

  const scheduleInitialFetch = () => {
    if (!immediate) return;

    clearConnectTimer();

    if (api.isConnected) {
      void execute();
      startPolling();
      return;
    }

    connectTimer = setTimeout(() => {
      scheduleInitialFetch();
    }, 1000);
  };

  function reset() {
    data.value = null;
    loading.value = false;
    refreshing.value = false;
    error.value = null;
    currentRetryCount = 0;
    cleanupTimers();
    scheduleInitialFetch();
  }

  function startPolling() {
    // Only enable polling when explicitly requested
    const shouldPoll = polling && pollingInterval > 0;
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

  function cleanupTimers() {
    stopPolling();
    clearRetryTimer();
    clearConnectTimer();
  }

  const isReady = computed(() => api.isConnected && !loading.value);
  const hasData = computed(() => data.value !== null);
  const isEmpty = computed(
    () => !loading.value && !hasData.value && !error.value,
  );

  onMounted(() => {
    scheduleInitialFetch();
  });

  onUnmounted(() => {
    cleanupTimers();
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
  // Initialize API to set up connection status
  getApi();

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

    // Pipeline APIs
    pipelinePorepSectors: (options?: QueryOptions) =>
      createQuery<unknown[]>("PipelinePorepSectors", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),

    porepPipelineSummary: (options?: QueryOptions) =>
      createQuery<unknown[]>("PorepPipelineSummary", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),

    pipelineStatsSDR: (options?: QueryOptions) =>
      createQuery<unknown>("PipelineStatsSDR", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),

    pipelineStatsSnap: (options?: QueryOptions) =>
      createQuery<unknown>("PipelineStatsSnap", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),
    upgradeSectors: (options?: QueryOptions) =>
      createQuery<unknown>("UpgradeSectors", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),

    pipelineFailedTasksMarket: (options?: QueryOptions) =>
      createQuery<unknown>("MK12PipelineFailedTasks", [], {
        polling: true,
        pollingInterval: 30000,
        ...options,
      }),

    // Pipeline Actions
    pipelinePorepRestartAll: async () => {
      const api = getApi();
      return await api.call<null>("PipelinePorepRestartAll", []);
    },

    pipelineSnapRestartAll: async () => {
      const api = getApi();
      return await api.call<null>("PipelineSnapRestartAll", []);
    },
    // Upgrade operations
    upgradeResetTaskIDs: async (spid: number, sectorNum: number) => {
      const api = getApi();
      return await api.call<null>("UpgradeResetTaskIDs", [spid, sectorNum]);
    },
    upgradeDelete: async (spid: number, sectorNum: number) => {
      const api = getApi();
      return await api.call<null>("UpgradeDelete", [spid, sectorNum]);
    },

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

      const result = await api.call<T>(method, params || []);
      return result;
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
