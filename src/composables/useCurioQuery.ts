import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CurioApiService } from '@/services/curio-api'

// Global API instance
let globalApi: CurioApiService | null = null

function getApi(): CurioApiService {
  if (!globalApi) {
    const endpoint = import.meta.env.VITE_CURIO_ENDPOINT || '/api/webrpc/v0'
    globalApi = new CurioApiService({
      endpoint
    })
    globalApi.connect().catch(console.error)
  }
  return globalApi
}

export interface QueryOptions {
  immediate?: boolean
  polling?: boolean
  pollingInterval?: number
  retry?: boolean
  retryCount?: number
  retryDelay?: number
}

export interface QueryResult<T> {
  data: import('vue').Ref<T | null>
  loading: import('vue').Ref<boolean>
  error: import('vue').Ref<Error | null>
  refresh: () => Promise<void>
  reset: () => void
  isReady: import('vue').ComputedRef<boolean>
  hasData: import('vue').ComputedRef<boolean>
  isEmpty: import('vue').ComputedRef<boolean>
}

function createQuery<T>(
  method: string,
  params: any[] = [],
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    immediate = true,
    polling = false,
    pollingInterval = 30000,
    retry = true,
    retryCount = 3,
    retryDelay = 1000
  } = options

  const api = getApi()
  
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  let pollingTimer: NodeJS.Timeout | null = null
  let retryTimer: NodeJS.Timeout | null = null
  let currentRetryCount = 0

  async function execute(): Promise<void> {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const result = await api.call<T>(method, params)
      data.value = result
      currentRetryCount = 0
    } catch (err) {
      error.value = err as Error
      
      // Auto retry
      if (retry && currentRetryCount < retryCount) {
        currentRetryCount++
        retryTimer = setTimeout(() => {
          execute()
        }, retryDelay * Math.pow(2, currentRetryCount - 1))
      }
    } finally {
      loading.value = false
    }
  }

  const refresh = () => execute()

  function reset() {
    data.value = null
    loading.value = false
    error.value = null
    currentRetryCount = 0
    stopPolling()
    clearRetryTimer()
  }

  function startPolling() {
    if (!polling || pollingInterval <= 0) return
    
    stopPolling()
    pollingTimer = setInterval(() => {
      if (api.isConnected && !loading.value) {
        execute()
      }
    }, pollingInterval)
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  function clearRetryTimer() {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  const isReady = computed(() => api.isConnected && !loading.value)
  const hasData = computed(() => data.value !== null)
  const isEmpty = computed(() => !loading.value && !hasData.value && !error.value)

  onMounted(() => {
    if (immediate) {
      const checkAndExecute = () => {
        if (api.isConnected) {
          execute()
          startPolling()
        } else {
          setTimeout(checkAndExecute, 1000)
        }
      }
      checkAndExecute()
    }
  })

  onUnmounted(() => {
    stopPolling()
    clearRetryTimer()
  })

  return {
    data: data as import('vue').Ref<T | null>,
    loading,
    error,
    refresh,
    reset,
    isReady,
    hasData,
    isEmpty
  }
}

// Create API object with convenient methods
export function createCurioQuery() {
  return {
    // Version info
    version: (options?: QueryOptions) => 
      createQuery<number[]>('Version', [], options),

    // Actor summary
    actorSummary: (options?: QueryOptions) => 
      createQuery<any[]>('ActorSummary', [], {
        polling: true,
        pollingInterval: 30000,
        ...options
      }),

    // Generic query method
    query: <T>(method: string, params?: any[], options?: QueryOptions) =>
      createQuery<T>(method, params || [], options),

    // Batch query
    batch: (calls: Array<{ method: string; params?: any[] }>, options?: QueryOptions) =>
      createQuery<any[]>('batch', [calls], options)
  }
}

// Global instance
let globalQuery: ReturnType<typeof createCurioQuery> | null = null

export function useCurioQuery() {
  if (!globalQuery) {
    globalQuery = createCurioQuery()
  }
  return globalQuery
}