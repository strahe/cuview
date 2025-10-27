import { computed, onUnmounted, ref, watch } from "vue";
import { fetchConfigLayer, saveConfigLayer } from "@/services/config-api";
import { buildConfigFieldRows, groupFieldRows } from "@/utils/config";
import {
  deepClone,
  deepEqual,
  mergeDeep,
  setAtPath,
  unsetAtPath,
} from "@/utils/object";
import { serializeToml } from "@/utils/toml";
import type {
  ConfigFieldRow,
  ConfigLayerResponse,
  ConfigSchemaDocument,
} from "@/types/config";

interface UseConfigEditorOptions {
  selectedLayer: import("vue").Ref<string | null>;
  defaults: import("vue").Ref<ConfigLayerResponse | null>;
  schema: import("vue").Ref<ConfigSchemaDocument | null>;
}

export function useConfigEditor(options: UseConfigEditorOptions) {
  const overrides = ref<ConfigLayerResponse>({});
  const originalOverrides = ref<ConfigLayerResponse>({});

  const loading = ref(false);
  const error = ref<Error | null>(null);
  const saving = ref(false);

  let abortController: AbortController | null = null;

  const isDefaultLayer = computed(
    () => options.selectedLayer.value === "default",
  );

  const effectiveConfig = computed<Record<string, unknown> | null>(() => {
    if (!options.defaults.value) {
      return null;
    }
    return mergeDeep(options.defaults.value, overrides.value);
  });

  const fieldRows = computed<ConfigFieldRow[]>(() => {
    if (!options.schema.value || !options.defaults.value) {
      return [];
    }

    return buildConfigFieldRows(
      options.schema.value,
      options.defaults.value,
      overrides.value,
    );
  });

  const groupedRows = computed(() => groupFieldRows(fieldRows.value));

  const tomlPreview = computed(() => {
    if (!options.selectedLayer.value) {
      return "";
    }

    if (isDefaultLayer.value) {
      return serializeToml(options.defaults.value ?? {});
    }

    return serializeToml(overrides.value);
  });

  const originalTomlPreview = computed(() => {
    if (!options.selectedLayer.value) {
      return "";
    }

    if (isDefaultLayer.value) {
      return serializeToml(options.defaults.value ?? {});
    }

    return serializeToml(originalOverrides.value);
  });

  const dirty = computed(
    () => !deepEqual(overrides.value, originalOverrides.value),
  );

  const resetOverrides = () => {
    overrides.value = deepClone(originalOverrides.value);
  };

  const handleSelectionChange = async (layer: string | null) => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    if (!layer) {
      overrides.value = {};
      originalOverrides.value = {};
      loading.value = false;
      error.value = null;
      return;
    }

    if (layer === "default") {
      overrides.value = {};
      originalOverrides.value = {};
      loading.value = false;
      error.value = null;
      return;
    }

    loading.value = true;
    error.value = null;
    abortController = new AbortController();

    try {
      const result = await fetchConfigLayer(layer, abortController.signal);
      originalOverrides.value = deepClone(result);
      overrides.value = deepClone(result);
    } catch (err) {
      if ((err as DOMException).name === "AbortError") return;
      error.value = err as Error;
      overrides.value = {};
      originalOverrides.value = {};
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => options.selectedLayer.value,
    (layer) => {
      handleSelectionChange(layer);
    },
    { immediate: true },
  );

  const updateFieldValue = (path: string[], value: unknown) => {
    if (!path.length) return;
    if (isDefaultLayer.value) return;

    const nextOverrides = deepClone(overrides.value);
    setAtPath(nextOverrides, path, value);
    overrides.value = nextOverrides;
  };

  const disableFieldOverride = (path: string[]) => {
    if (!path.length) return;
    if (isDefaultLayer.value) return;

    const nextOverrides = deepClone(overrides.value);
    unsetAtPath(nextOverrides, path);
    overrides.value = nextOverrides;
  };

  const toggleFieldOverride = (
    path: string[],
    enabled: boolean,
    fallbackValue: unknown,
  ) => {
    if (enabled) {
      updateFieldValue(path, fallbackValue);
    } else {
      disableFieldOverride(path);
    }
  };

  const save = async () => {
    if (!options.selectedLayer.value) return;
    if (isDefaultLayer.value) return;
    if (!dirty.value) return;

    saving.value = true;
    try {
      await saveConfigLayer(options.selectedLayer.value, overrides.value);
      originalOverrides.value = deepClone(overrides.value);
      error.value = null;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const selectedLayerName = computed(() => options.selectedLayer.value);

  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  return {
    overrides,
    originalOverrides,
    loading,
    error,
    saving,
    fieldRows,
    groupedRows,
    effectiveConfig,
    tomlPreview,
    originalTomlPreview,
    isDefaultLayer,
    dirty,
    updateFieldValue,
    disableFieldOverride,
    toggleFieldOverride,
    reset: resetOverrides,
    save,
    selectedLayer: selectedLayerName,
  };
}
