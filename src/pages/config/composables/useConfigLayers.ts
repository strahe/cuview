import { ref, computed } from "vue";
import type {
  ConfigLayerSummary,
  CreateConfigLayerRequest,
} from "@/types/config";
import type { ConfigLayer, ConfigSchema, DefaultConfig } from "@/types/api";
import { CurioApiService } from "@/services/curio-api";

export function useConfigLayers() {
  const api = new CurioApiService();

  const layers = ref<string[]>([]);
  const layerSummaries = ref<Record<string, ConfigLayerSummary>>({});
  const currentLayer = ref<ConfigLayer | null>(null);
  const schema = ref<ConfigSchema | null>(null);
  const defaultConfig = ref<DefaultConfig | null>(null);

  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Load available config layers
  const loadLayers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const layerNames = await api.getConfigLayers();
      layers.value = layerNames;

      // Create basic summaries
      layerSummaries.value = {};
      for (const name of layerNames) {
        layerSummaries.value[name] = {
          name,
          title: formatLayerTitle(name),
          description: `Configuration layer: ${name}`,
        };
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to load config layers");
      console.error("Error loading config layers:", err);
    } finally {
      loading.value = false;
    }
  };

  // Load a specific config layer
  const loadLayer = async (layerName: string): Promise<ConfigLayer | null> => {
    loading.value = true;
    error.value = null;

    try {
      const layer = await api.getConfigLayer(layerName);
      currentLayer.value = layer;

      // Update summary with more details
      if (layerSummaries.value[layerName]) {
        layerSummaries.value[layerName].fieldCount = countFields(layer);
        layerSummaries.value[layerName].modifiedAt = new Date().toISOString();
      }

      return layer;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error(`Failed to load layer: ${layerName}`);
      console.error(`Error loading config layer ${layerName}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Load config schema
  const loadSchema = async (): Promise<ConfigSchema | null> => {
    if (schema.value) return schema.value;

    loading.value = true;
    error.value = null;

    try {
      const configSchema = await api.getConfigSchema();
      schema.value = configSchema;
      return schema.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to load config schema");
      console.error("Error loading config schema:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Load default config
  const loadDefaultConfig = async (): Promise<DefaultConfig | null> => {
    if (defaultConfig.value) return defaultConfig.value;

    loading.value = true;
    error.value = null;

    try {
      const config = await api.getDefaultConfig();
      defaultConfig.value = config;
      return config;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to load default config");
      console.error("Error loading default config:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Create a new config layer
  const createLayer = async (
    request: CreateConfigLayerRequest,
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      await api.addConfigLayer(request.name);

      // If copying from another layer, load and set it
      if (request.copyFrom) {
        const sourceLayer = await api.getConfigLayer(request.copyFrom);
        await api.setConfigLayer(request.name, sourceLayer);
      }

      // Add to local state
      layers.value.push(request.name);
      layerSummaries.value[request.name] = {
        name: request.name,
        title: request.title || formatLayerTitle(request.name),
        description:
          request.description || `Configuration layer: ${request.name}`,
        createdAt: new Date().toISOString(),
        fieldCount: request.copyFrom
          ? layerSummaries.value[request.copyFrom]?.fieldCount || 0
          : 0,
      };

      return true;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error(`Failed to create layer: ${request.name}`);
      console.error(`Error creating config layer ${request.name}:`, err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Update a config layer
  const updateLayer = async (
    layerName: string,
    config: ConfigLayer,
    // comment?: string
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      await api.setConfigLayer(layerName, config);

      // Update local state
      currentLayer.value = config;

      if (layerSummaries.value[layerName]) {
        layerSummaries.value[layerName].fieldCount = countFields(config);
        layerSummaries.value[layerName].modifiedAt = new Date().toISOString();
      }

      return true;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error(`Failed to update layer: ${layerName}`);
      console.error(`Error updating config layer ${layerName}:`, err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Delete a config layer (if API supports it)
  const deleteLayer = async (/* layerName: string */): Promise<boolean> => {
    // Note: API doesn't seem to have delete endpoint, this would need to be added
    console.warn("Delete layer functionality not implemented in API");
    return false;
  };

  // Utility functions
  const formatLayerTitle = (name: string): string => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const countFields = (config: ConfigLayer): number => {
    let count = 0;

    const countRecursive = (obj: unknown) => {
      if (typeof obj === "object" && obj !== null) {
        for (const value of Object.values(obj)) {
          if (typeof value === "object" && value !== null) {
            countRecursive(value);
          } else {
            count++;
          }
        }
      }
    };

    countRecursive(config);
    return count;
  };

  // Computed properties
  const sortedLayers = computed(() => {
    return [...layers.value].sort((a, b) => {
      const aModified = layerSummaries.value[a]?.modifiedAt;
      const bModified = layerSummaries.value[b]?.modifiedAt;

      if (!aModified && !bModified) return a.localeCompare(b);
      if (!aModified) return 1;
      if (!bModified) return -1;

      return new Date(bModified).getTime() - new Date(aModified).getTime();
    });
  });

  const hasLayers = computed(() => layers.value.length > 0);

  return {
    // State
    layers,
    layerSummaries,
    currentLayer,
    schema,
    defaultConfig,
    loading,
    error,

    // Computed
    sortedLayers,
    hasLayers,

    // Actions
    loadLayers,
    loadLayer,
    loadSchema,
    loadDefaultConfig,
    createLayer,
    updateLayer,
    deleteLayer,
    formatLayerTitle,
  };
}
