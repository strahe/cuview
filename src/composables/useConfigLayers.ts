import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { fetchConfigLayers, fetchConfigTopology } from "@/services/config-api";
import type { ConfigLayerSummary, ConfigTopologyEntry } from "@/types/config";

const LAST_LAYER_KEY = "cuview.config.lastLayer";

export function useConfigLayers() {
  const rawLayers = ref<string[]>([]);
  const topology = ref<ConfigTopologyEntry[]>([]);
  const layerSummaries = ref<ConfigLayerSummary[]>([]);

  const loading = ref(false);
  const error = ref<Error | null>(null);
  const lastSelected = useStorage<string | null>(LAST_LAYER_KEY, null);
  const selectedLayer = ref<string | null>(lastSelected.value);

  let abortController: AbortController | null = null;

  const hasLayers = computed(() => layerSummaries.value.length > 0);

  const isSelectedDefault = computed(
    () => selectedLayer.value === "default" && hasLayers.value,
  );

  const refreshSummaries = () => {
    const lookup = new Map<string, number>();

    topology.value.forEach((entry) => {
      if (!entry.LayersCSV) return;
      entry.LayersCSV.split(",")
        .map((layer) => layer.trim())
        .filter(Boolean)
        .forEach((layer) => {
          lookup.set(layer, (lookup.get(layer) ?? 0) + 1);
        });
    });

    layerSummaries.value = rawLayers.value.map((name) => ({
      name,
      isDefault: name === "default",
      nodeCount: lookup.get(name) ?? 0,
    }));
  };

  const ensureSelection = () => {
    if (!rawLayers.value.length) {
      selectedLayer.value = null;
      return;
    }

    if (selectedLayer.value && rawLayers.value.includes(selectedLayer.value)) {
      return;
    }

    const preferred = rawLayers.value.find((name) => name !== "default");
    selectedLayer.value = preferred ?? rawLayers.value[0];
  };

  const loadLayers = async (force = false) => {
    if (loading.value && !force) return;

    loading.value = true;
    error.value = null;

    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();

    try {
      const [layerNames, topologyData] = await Promise.all([
        fetchConfigLayers(abortController.signal),
        fetchConfigTopology(abortController.signal),
      ]);

      rawLayers.value = layerNames;
      topology.value = topologyData;

      refreshSummaries();
      ensureSelection();
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return;
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => loadLayers(true);

  const selectLayer = (layer: string) => {
    if (!rawLayers.value.includes(layer)) return;
    selectedLayer.value = layer;
  };

  onMounted(() => {
    loadLayers();
  });

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  watch(selectedLayer, (value) => {
    lastSelected.value = value;
  });

  const selectedSummary = computed(
    () =>
      layerSummaries.value.find(
        (summary) => summary.name === selectedLayer.value,
      ) ?? null,
  );

  return {
    layers: computed(() => layerSummaries.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    selectedLayer,
    selectedSummary,
    selectLayer,
    refresh,
    hasLayers,
    isSelectedDefault,
  };
}
