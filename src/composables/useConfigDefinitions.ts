import { onMounted, onUnmounted, ref } from "vue";
import { fetchConfigDefaults, fetchConfigSchema } from "@/services/config-api";
import type { ConfigLayerResponse, ConfigSchemaDocument } from "@/types/config";

export function useConfigDefinitions() {
  const defaults = ref<ConfigLayerResponse | null>(null);
  const schema = ref<ConfigSchemaDocument | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  let abortController: AbortController | null = null;

  const load = async (force = false) => {
    if (loading.value && !force) return;
    if (defaults.value && schema.value && !force) return;

    loading.value = true;
    error.value = null;

    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    try {
      const [defaultsValue, schemaValue] = await Promise.all([
        fetchConfigDefaults(abortController.signal),
        fetchConfigSchema(abortController.signal),
      ]);

      defaults.value = defaultsValue;
      schema.value = schemaValue;
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return;
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => load(true);

  onMounted(() => {
    load();
  });

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  return {
    defaults,
    schema,
    loading,
    error,
    refresh,
  };
}
