export interface CachedData<T = any> {
  data: T | null
  lastUpdated: number
  loading: boolean
  error: Error | null
}