export interface CachedData<T = unknown> {
  data: T | null;
  lastUpdated: number;
  loading: boolean;
  error: Error | null;
}
