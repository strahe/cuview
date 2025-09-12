import { ref, computed, type Ref } from "vue";
import type { 
  ConfigLayerSummary, 
  CreateConfigLayerRequest,
  UpdateConfigLayerRequest,
  ConfigLayerHistoryEntry,
  ConfigFieldDiff,
  ConfigLayerDiff,
} from "@/types/config";
import type { ConfigLayer, JSONSchema, DefaultConfig } from "@/types/api";
import { CurioApiService } from "@/services/curio-api";

export function useConfigLayers() {
  const api = new CurioApiService();
  
  const layers = ref<string[]>([]);
  const layerSummaries = ref<Record<string, ConfigLayerSummary>>({});
  const currentLayer = ref<ConfigLayer | null>(null);
  const schema = ref<JSONSchema | null>(null);
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
      error.value = err instanceof Error ? err : new Error("Failed to load config layers");
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
      error.value = err instanceof Error ? err : new Error(`Failed to load layer: ${layerName}`);
      console.error(`Error loading config layer ${layerName}:`, err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Load config schema
  const loadSchema = async (): Promise<JSONSchema | null> => {
    if (schema.value) return schema.value;
    
    loading.value = true;
    error.value = null;
    
    try {
      const configSchema = await api.getConfigSchema();
      schema.value = configSchema as JSONSchema;
      return schema.value;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to load config schema");
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
      error.value = err instanceof Error ? err : new Error("Failed to load default config");
      console.error("Error loading default config:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Create a new config layer
  const createLayer = async (request: CreateConfigLayerRequest): Promise<boolean> => {
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
        description: request.description || `Configuration layer: ${request.name}`,
        createdAt: new Date().toISOString(),
        fieldCount: request.copyFrom ? layerSummaries.value[request.copyFrom]?.fieldCount || 0 : 0,
      };
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(`Failed to create layer: ${request.name}`);
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
    comment?: string
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    
    try {
      await api.setConfigLayer(layerName, config);
      
      // Update local state
      if (currentLayer.value && layerName === getCurrentLayerName()) {
        currentLayer.value = config;
      }
      
      if (layerSummaries.value[layerName]) {
        layerSummaries.value[layerName].fieldCount = countFields(config);
        layerSummaries.value[layerName].modifiedAt = new Date().toISOString();
      }
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(`Failed to update layer: ${layerName}`);
      console.error(`Error updating config layer ${layerName}:`, err);
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Delete a config layer (if API supports it)
  const deleteLayer = async (layerName: string): Promise<boolean> => {
    // Note: API doesn't seem to have delete endpoint, this would need to be added
    console.warn("Delete layer functionality not implemented in API");
    return false;
  };

  // Compare two config layers
  const compareLayersR = async (layer1: string, layer2: string): Promise<ConfigLayerDiff | null> => {
    try {
      const [config1, config2] = await Promise.all([
        api.getConfigLayer(layer1),
        api.getConfigLayer(layer2),
      ]);
      
      return compareConfigs(config1, config2, layer2);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to compare layers");
      console.error("Error comparing layers:", err);
      return null;
    }
  };

  // Utility functions
  const formatLayerTitle = (name: string): string => {
    return name
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const countFields = (config: ConfigLayer): number => {
    let count = 0;
    
    const countRecursive = (obj: any) => {
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

  const compareConfigs = (
    config1: ConfigLayer, 
    config2: ConfigLayer, 
    layerName: string
  ): ConfigLayerDiff => {
    const changes: ConfigFieldDiff[] = [];
    const allKeys = new Set([...getAllKeys(config1), ...getAllKeys(config2)]);
    
    for (const key of allKeys) {
      const val1 = getNestedValue(config1, key);
      const val2 = getNestedValue(config2, key);
      
      if (val1 === undefined && val2 !== undefined) {
        changes.push({
          field: key,
          type: "added",
          newValue: val2,
        });
      } else if (val1 !== undefined && val2 === undefined) {
        changes.push({
          field: key,
          type: "removed",
          oldValue: val1,
        });
      } else if (val1 !== val2) {
        changes.push({
          field: key,
          type: "modified",
          oldValue: val1,
          newValue: val2,
        });
      }
    }
    
    const summary = {
      added: changes.filter(c => c.type === "added").length,
      removed: changes.filter(c => c.type === "removed").length,
      modified: changes.filter(c => c.type === "modified").length,
    };
    
    return {
      layerName,
      changes,
      summary,
    };
  };

  const getAllKeys = (obj: any, prefix = ""): string[] => {
    const keys: string[] = [];
    
    if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          keys.push(...getAllKeys(value, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
    }
    
    return keys;
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => {
      return current?.[key];
    }, obj);
  };

  const getCurrentLayerName = (): string | null => {
    return Object.keys(layerSummaries.value).find(name => 
      layerSummaries.value[name] === currentLayer.value
    ) || null;
  };

  // Computed properties
  const sortedLayers = computed(() => {
    return [...layers.value].sort((a, b) => {
      const summaryA = layerSummaries.value[a];
      const summaryB = layerSummaries.value[b];
      
      // Sort by modification time (most recent first)
      if (summaryA?.modifiedAt && summaryB?.modifiedAt) {
        return new Date(summaryB.modifiedAt).getTime() - new Date(summaryA.modifiedAt).getTime();
      }
      
      // Fallback to alphabetical
      return a.localeCompare(b);
    });
  });

  const hasLayers = computed(() => layers.value.length > 0);
  
  const isSchemaLoaded = computed(() => schema.value !== null);
  
  const isDefaultConfigLoaded = computed(() => defaultConfig.value !== null);

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
    isSchemaLoaded,
    isDefaultConfigLoaded,
    
    // Methods
    loadLayers,
    loadLayer,
    loadSchema,
    loadDefaultConfig,
    createLayer,
    updateLayer,
    deleteLayer,
    compareLayersR,
    formatLayerTitle,
    countFields,
  };
}