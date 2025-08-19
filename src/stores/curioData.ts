import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCurioQuery } from '@/composables/useCurioQuery'
import type { CachedData } from '@/types/cache'

export const useCurioDataStore = defineStore('curioData', () => {
  const cache = ref<Map<string, CachedData>>(new Map())
  const pollingTimers = ref<Map<string, NodeJS.Timeout>>(new Map())
  const { call } = useCurioQuery()

  const getCachedData = <T>(key: string): CachedData<T> | undefined => {
    return cache.value.get(key) as CachedData<T> | undefined
  }

  const setCachedData = <T>(key: string, data: T, error: Error | null = null) => {
    const existing = cache.value.get(key)
    cache.value.set(key, {
      data,
      lastUpdated: Date.now(),
      loading: existing ? existing.loading : false,
      error
    })
  }

  const setLoading = (key: string, loading: boolean) => {
    const existing = cache.value.get(key) || { data: null, lastUpdated: 0, loading: false, error: null }
    cache.value.set(key, {
      ...existing,
      loading
    })
  }

  const setError = (key: string, error: Error | null) => {
    const existing = cache.value.get(key) || { data: null, lastUpdated: 0, loading: false, error: null }
    cache.value.set(key, {
      ...existing,
      error,
      loading: false
    })
  }

  const fetchData = async <T>(method: string, params: any[] = []): Promise<void> => {
    const key = `${method}:${JSON.stringify(params)}`
    const cached = getCachedData<T>(key)
    const isInitialLoad = !cached || cached.data === null
    
    try {
      if (isInitialLoad) {
        setLoading(key, true)
      }

      const result = await call<T>(method, params)
      setCachedData<T>(key, result)
    } catch (error) {
      console.error(`Failed to fetch ${method}:`, error)
      setError(key, error as Error)
    } finally {
      if (isInitialLoad) {
        setLoading(key, false)
      }
    }
  }

  const startPolling = (method: string, params: any[] = [], interval: number = 30000) => {
    const key = `${method}:${JSON.stringify(params)}`
    
    stopPolling(key)
    fetchData(method, params)
    
    const timer = setInterval(() => {
      fetchData(method, params)
    }, interval)
    
    pollingTimers.value.set(key, timer)
  }

  const stopPolling = (key: string) => {
    const timer = pollingTimers.value.get(key)
    if (timer) {
      clearInterval(timer)
      pollingTimers.value.delete(key)
    }
  }

  const refreshData = async <T>(method: string, params: any[] = []): Promise<void> => {
    await fetchData<T>(method, params)
  }

  const cleanup = () => {
    pollingTimers.value.forEach(timer => clearInterval(timer))
    pollingTimers.value.clear()
  }

  const createDataAccessor = <T>(method: string, params: any[] = []) => {
    const key = `${method}:${JSON.stringify(params)}`
    
    return {
      data: computed(() => getCachedData<T>(key)?.data || null),
      loading: computed(() => getCachedData<T>(key)?.loading || false),
      error: computed(() => getCachedData<T>(key)?.error || null),
      hasData: computed(() => getCachedData<T>(key)?.data !== null && getCachedData<T>(key)?.data !== undefined),
      lastUpdated: computed(() => getCachedData<T>(key)?.lastUpdated || 0),
      refresh: () => refreshData<T>(method, params),
      startPolling: (interval?: number) => startPolling(method, params, interval),
      stopPolling: () => stopPolling(key)
    }
  }

  return {
    cache: computed(() => cache.value),
    getCachedData,
    setCachedData,
    setLoading,
    setError,
    fetchData,
    startPolling,
    stopPolling,
    refreshData,
    cleanup,
    createDataAccessor
  }
})