import { ref } from "vue";
import { useCurioQuery } from "@/composables/useCurioQuery";

export const useLazyQuery = <T>(method: string) => {
  const { call } = useCurioQuery();

  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async (...params: unknown[]) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await call<T>(method, params);
      data.value = result ?? null;
      return data.value;
    } catch (err) {
      error.value = err as Error;
      data.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = null;
    error.value = null;
  };

  return { data, loading, error, execute, reset };
};
