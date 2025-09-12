<template>
  <div class="config-preview">
    <!-- Header -->
    <div class="config-preview-header mb-6 p-4 bg-base-100 border border-base-300 rounded-lg shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-base-content mb-1">
            Configuration Preview
          </h2>
          <p class="text-sm text-base-content/70">
            Review your configuration before applying
          </p>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="$emit('exitPreview')"
          >
            <PencilIcon class="w-4 h-4 mr-1" />
            Edit
          </button>
          
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="!isValid || applying"
            @click="applyConfiguration"
          >
            <span v-if="applying" class="loading loading-spinner loading-xs mr-2"></span>
            {{ applying ? "Applying..." : "Apply Configuration" }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Configuration Tree (Left Panel) -->
      <div class="lg:col-span-2">
        <div class="config-tree bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <!-- Tree header -->
          <div class="border-b border-base-300 p-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-base-content">Configuration Structure</h3>
              
              <div class="flex items-center gap-2">
                <!-- View mode toggle -->
                <div class="btn-group">
                  <button
                    type="button"
                    class="btn btn-xs"
                    :class="{ 'btn-active': viewMode === 'tree' }"
                    @click="viewMode = 'tree'"
                  >
                    Tree
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs"
                    :class="{ 'btn-active': viewMode === 'json' }"
                    @click="viewMode = 'json'"
                  >
                    JSON
                  </button>
                </div>
                
                <!-- Copy button -->
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  @click="copyConfiguration"
                >
                  <ClipboardIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Tree content -->
          <div class="p-4">
            <!-- Tree view -->
            <div v-if="viewMode === 'tree'" class="config-tree-view">
              <ConfigTreeNode
                v-for="[key, value] in Object.entries(layerData)"
                :key="key"
                :node-key="key"
                :node-value="value"
                :level="0"
                :schema="schema"
              />
            </div>
            
            <!-- JSON view -->
            <div v-else class="config-json-view">
              <pre class="bg-base-50 border border-base-200 rounded-lg p-4 text-sm font-mono overflow-x-auto"><code>{{ formattedJson }}</code></pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Validation & Stats (Right Panel) -->
      <div class="space-y-6">
        <!-- Validation Results -->
        <div class="bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <div class="border-b border-base-300 p-4">
            <h3 class="font-semibold text-base-content">Validation</h3>
          </div>
          
          <div class="p-4 space-y-4">
            <!-- Overall status -->
            <div class="flex items-center gap-3">
              <div 
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-success': isValid,
                  'bg-error': !isValid && validationErrors.length > 0,
                  'bg-warning': !isValid && validationWarnings.length > 0 && validationErrors.length === 0,
                  'bg-base-300': validationErrors.length === 0 && validationWarnings.length === 0,
                }"
              ></div>
              <span class="font-medium">
                {{ validationStatus }}
              </span>
            </div>
            
            <!-- Validation errors -->
            <div v-if="validationErrors.length > 0">
              <h4 class="text-sm font-medium text-error mb-2">
                Errors ({{ validationErrors.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="error in validationErrors.slice(0, 5)"
                  :key="error.field"
                  class="text-xs p-2 bg-error/10 border border-error/20 rounded text-error"
                >
                  <div class="font-mono">{{ error.field }}</div>
                  <div>{{ error.message }}</div>
                </div>
                <div v-if="validationErrors.length > 5" class="text-xs text-base-content/60">
                  ... and {{ validationErrors.length - 5 }} more errors
                </div>
              </div>
            </div>
            
            <!-- Validation warnings -->
            <div v-if="validationWarnings.length > 0">
              <h4 class="text-sm font-medium text-warning mb-2">
                Warnings ({{ validationWarnings.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="warning in validationWarnings.slice(0, 3)"
                  :key="warning.field"
                  class="text-xs p-2 bg-warning/10 border border-warning/20 rounded text-warning"
                >
                  <div class="font-mono">{{ warning.field }}</div>
                  <div>{{ warning.message }}</div>
                </div>
                <div v-if="validationWarnings.length > 3" class="text-xs text-base-content/60">
                  ... and {{ validationWarnings.length - 3 }} more warnings
                </div>
              </div>
            </div>
            
            <!-- All good -->
            <div v-if="isValid" class="text-xs text-success">
              Configuration is valid and ready to apply
            </div>
          </div>
        </div>
        
        <!-- Configuration Stats -->
        <div class="bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <div class="border-b border-base-300 p-4">
            <h3 class="font-semibold text-base-content">Statistics</h3>
          </div>
          
          <div class="p-4 space-y-3">
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Total sections</span>
              <span class="font-medium">{{ configStats.totalSections }}</span>
            </div>
            
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Configured fields</span>
              <span class="font-medium">{{ configStats.configuredFields }}</span>
            </div>
            
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Empty values</span>
              <span class="font-medium">{{ configStats.emptyValues }}</span>
            </div>
            
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">File size</span>
              <span class="font-medium">{{ formatFileSize(formattedJson.length) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Schema Compliance -->
        <div class="bg-base-100 border border-base-300 rounded-lg shadow-sm">
          <div class="border-b border-base-300 p-4">
            <h3 class="font-semibold text-base-content">Schema Compliance</h3>
          </div>
          
          <div class="p-4 space-y-3">
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Schema version</span>
              <span class="font-medium font-mono">{{ schemaVersion }}</span>
            </div>
            
            <div class="flex justify-between items-center text-sm">
              <span class="text-base-content/70">Compliance</span>
              <span 
                class="font-medium"
                :class="{
                  'text-success': compliancePercentage >= 90,
                  'text-warning': compliancePercentage >= 70 && compliancePercentage < 90,
                  'text-error': compliancePercentage < 70,
                }"
              >
                {{ Math.round(compliancePercentage) }}%
              </span>
            </div>
            
            <div class="w-full bg-base-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                :class="{
                  'bg-success': compliancePercentage >= 90,
                  'bg-warning': compliancePercentage >= 70 && compliancePercentage < 90,
                  'bg-error': compliancePercentage < 70,
                }"
                :style="{ width: `${compliancePercentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { PencilIcon, ClipboardIcon } from "@heroicons/vue/24/outline";
import ConfigTreeNode from "./ConfigTreeNode.vue";
import type { ConfigLayer, JSONSchema } from "@/types/api";
import type { ConfigValidationError } from "@/types/config";

interface Props {
  layerName: string;
  layerData: ConfigLayer;
  schema: JSONSchema;
}

interface Emits {
  exitPreview: [];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  exitPreview: [];
}>();

// State
const viewMode = ref<"tree" | "json">("tree");
const applying = ref(false);
const validationErrors = ref<ConfigValidationError[]>([]);
const validationWarnings = ref<ConfigValidationError[]>([]);

// Computed properties
const formattedJson = computed(() => {
  return JSON.stringify(props.layerData, null, 2);
});

const isValid = computed(() => {
  return validationErrors.value.length === 0;
});

const validationStatus = computed(() => {
  if (validationErrors.value.length > 0) {
    return "Invalid Configuration";
  } else if (validationWarnings.value.length > 0) {
    return "Valid with Warnings";
  } else {
    return "Valid Configuration";
  }
});

const configStats = computed(() => {
  let totalSections = 0;
  let configuredFields = 0;
  let emptyValues = 0;

  const countRecursive = (obj: any) => {
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      totalSections++;
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          countRecursive(value);
        } else {
          configuredFields++;
          if (value === null || value === undefined || value === "" || 
              (Array.isArray(value) && value.length === 0)) {
            emptyValues++;
          }
        }
      }
    }
  };

  countRecursive(props.layerData);

  return {
    totalSections,
    configuredFields,
    emptyValues,
  };
});

const schemaVersion = computed(() => {
  return props.schema?.$schema?.split("/").pop() || "unknown";
});

const compliancePercentage = computed(() => {
  const total = configStats.value.configuredFields;
  if (total === 0) return 100;
  
  const compliant = total - validationErrors.value.length;
  return (compliant / total) * 100;
});

// Methods
const copyConfiguration = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value);
    // Show success toast
    console.log("Configuration copied to clipboard");
  } catch (err) {
    console.error("Failed to copy configuration:", err);
  }
};

const applyConfiguration = async () => {
  applying.value = true;
  
  try {
    // This would actually apply the configuration
    console.log("Applying configuration:", props.layerData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Success feedback
    console.log("Configuration applied successfully");
    
  } catch (err) {
    console.error("Failed to apply configuration:", err);
  } finally {
    applying.value = false;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Perform validation on mount/data change
const validateConfiguration = () => {
  validationErrors.value = [];
  validationWarnings.value = [];
  
  // Basic validation logic here
  // This would integrate with the schema validation from useConfigEditor
  
  // Example validations:
  const validateRecursive = (obj: any, path: string = "") => {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      // Check for required fields that are empty
      if (value === null || value === undefined || value === "") {
        validationWarnings.value.push({
          field: fullPath,
          message: "Field is empty",
          severity: "warning",
        });
      }
      
      // Recursively validate nested objects
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        validateRecursive(value, fullPath);
      }
    }
  };
  
  if (props.layerData && typeof props.layerData === "object") {
    validateRecursive(props.layerData);
  }
};

// Validate when data changes
validateConfiguration();
</script>

<style scoped>
.config-preview {
  @apply w-full;
}

.config-tree-view {
  @apply space-y-1;
}

.config-json-view pre {
  @apply max-h-96 overflow-y-auto;
}

.config-json-view code {
  @apply text-xs leading-relaxed;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .grid-cols-1.lg\:grid-cols-3 {
    @apply grid-cols-1;
  }
  
  .lg\:col-span-2 {
    @apply col-span-1;
  }
}
</style>