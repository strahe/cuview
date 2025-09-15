import { ref, computed, onMounted } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import type { TaskHistorySummary } from "@/types/task";

export interface PaginatedTaskHistoryOptions {
  batchSize?: number;
  initialBatches?: number;
  immediate?: boolean;
  maxItems?: number;
}

export function usePaginatedTaskHistory(
  options: PaginatedTaskHistoryOptions = {},
) {
  const {
    batchSize = 100,
    initialBatches = 2,
    immediate = true,
    maxItems = 5000,
  } = options;

  const { call } = useCurioQuery();

  // Data management
  const allData = ref<TaskHistorySummary[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const currentOffset = ref(0);

  // Track seen records to prevent duplicates - use Set for O(1) lookup
  // TODO: Use history record ID when backend provides it, currently using TaskID + Posted composite key
  const seenRecords = new Set<string>();

  // Loading more data state
  const loadingMore = ref(false);
  const paginationError = ref<Error | null>(null);

  // Safety counter to prevent infinite loops with duplicate data
  let consecutiveEmptyBatches = 0;
  const MAX_CONSECUTIVE_EMPTY_BATCHES = 3;

  const data = computed(() => allData.value);
  const hasData = computed(() => allData.value.length > 0);

  const fetchBatch = async (offset: number, limit: number) => {
    const batch = await call<TaskHistorySummary[]>("ClusterTaskHistory", [
      limit,
      offset,
    ]);
    return batch;
  };

  const loadInitialData = async () => {
    loading.value = true;
    error.value = null;
    allData.value = [];
    currentOffset.value = 0;
    hasMore.value = true;
    seenRecords.clear();
    consecutiveEmptyBatches = 0;

    try {
      // Load initial batches
      const totalInitialItems = batchSize * initialBatches;
      const initialBatch = await fetchBatch(0, totalInitialItems);

      // Track record keys for initial batch
      for (const task of initialBatch) {
        const recordKey = `${task.TaskID}-${task.Posted}`;
        seenRecords.add(recordKey);
      }

      allData.value = initialBatch;
      currentOffset.value = initialBatch.length;

      // If we got fewer items than requested, we've reached the end
      if (initialBatch.length < totalInitialItems) {
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
    paginationError.value = null; // Clear previous pagination errors

    try {
      const nextBatch = await fetchBatch(currentOffset.value, batchSize);

      // Filter out duplicates based on TaskID + Posted composite key
      const newTasks = [];
      for (const task of nextBatch) {
        const recordKey = `${task.TaskID}-${task.Posted}`;
        if (!seenRecords.has(recordKey)) {
          seenRecords.add(recordKey);
          newTasks.push(task);
        }
      }

      // Update hasMore logic: stop if we got fewer items than requested from the API
      // Don't stop just because of duplicates - there might be unique items further ahead
      if (nextBatch.length < batchSize) {
        hasMore.value = false;
      } else if (nextBatch.length === batchSize && newTasks.length === 0) {
        consecutiveEmptyBatches++;

        // Stop if we've seen too many consecutive empty batches
        if (consecutiveEmptyBatches >= MAX_CONSECUTIVE_EMPTY_BATCHES) {
          hasMore.value = false;
        }
      }

      // Only add new unique tasks
      if (newTasks.length > 0) {
        consecutiveEmptyBatches = 0; // Reset counter when we get new tasks
        const updatedData = [...allData.value, ...newTasks];

        // Memory management: Keep only the most recent items if we exceed maxItems
        if (updatedData.length > maxItems) {
          // Keep the most recent items (at the end of the array)
          const trimmedData = updatedData.slice(-maxItems);
          allData.value = trimmedData;

          // Update seen record keys to match the trimmed data
          seenRecords.clear();
          for (const task of trimmedData) {
            const recordKey = `${task.TaskID}-${task.Posted}`;
            seenRecords.add(recordKey);
          }
        } else {
          allData.value = updatedData;
        }
      }

      // Always increment offset by the number of items we requested from the API
      currentOffset.value += nextBatch.length;
    } catch (err) {
      paginationError.value = err as Error;
      // Don't set main error to preserve existing data visibility
      console.error("Pagination failed:", err);
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

  // Auto-load on mount if immediate is true
  onMounted(() => {
    if (immediate) {
      loadInitialData();
    }
  });

  return {
    data,
    loading,
    error,
    hasData,
    hasMore,
    loadingMore,
    paginationError,
    loadMore,
    refresh,
    retryPagination,
    // Manual loading for when immediate is false
    load: loadInitialData,
  };
}
