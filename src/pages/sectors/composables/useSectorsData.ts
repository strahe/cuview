import { ref, computed, onMounted } from "vue";
import { CurioApiService } from "@/services/curio-api";
import type { SectorsAllResponse } from "@/types/sector";

export function useSectorsData() {
  const sectorsResponse = ref<SectorsAllResponse | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const isRefreshing = ref(false);

  const sectors = computed(() => sectorsResponse.value?.data || []);

  const api = new CurioApiService();

  const refresh = async () => {
    loading.value = true;
    isRefreshing.value = true;
    error.value = null;

    try {
      await api.connect();
      const result = await api.fetchSectorsAll();
      sectorsResponse.value = result as SectorsAllResponse;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to fetch sectors:", err);
    } finally {
      loading.value = false;
      isRefreshing.value = false;
    }
  };

  onMounted(() => {
    refresh();
  });

  return {
    sectors,
    loading,
    error,
    refresh,
    isRefreshing,
  };
}
