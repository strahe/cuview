<template>
  <div class="config-editor">
    <!-- Header with controls -->
    <div class="config-editor-header mb-6 p-4 bg-base-100 border border-base-300 rounded-lg shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Title and stats -->
        <div>
          <h2 class="text-xl font-semibold text-base-content mb-1">
            Configuration Editor
          </h2>
          <p class="text-sm text-base-content/70">
            Layer: <span class="font-medium">{{ layerName }}</span>
            <span class="mx-2">•</span>
            {{ enabledFieldCount }}/{{ totalFieldCount }} fields enabled
            <span v-if="editorState.isDirty" class="mx-2 text-warning">• Unsaved changes</span>
          </p>
        </div>
        
        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <button
            v-if="editorState.isDirty"
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="saving"
            @click="resetForm"
          >
            Reset
          </button>
          
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :class="{ 'btn-disabled': !canSave }"
            :disabled="!canSave"
            @click="handleSave"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs mr-2"></span>
            {{ saving ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search and filter controls -->
    <div class="config-editor-controls mb-6 p-3 sm:p-4 bg-base-50 border border-base-300 rounded-lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Search -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">Search</span>
          </label>
          <input
            v-model="uiState.searchQuery"
            type="text"
            placeholder="Search fields..."
            class="input input-bordered input-sm"
          />
        </div>
        
        <!-- Filters -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">Show</span>
          </label>
          <select v-model="filterMode" class="select select-bordered select-sm">
            <option value="all">All fields</option>
            <option value="enabled">Enabled only</option>
            <option value="disabled">Disabled only</option>
          </select>
        </div>
        
        <!-- View options -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">View</span>
          </label>
          <div class="flex flex-col sm:flex-row gap-2">
            <label class="label cursor-pointer gap-2">
              <input
                v-model="uiState.compactMode"
                type="checkbox"
                class="checkbox checkbox-sm"
              />
              <span class="label-text text-xs">Compact</span>
            </label>
            <label class="label cursor-pointer gap-2">
              <input
                v-model="uiState.showAdvanced"
                type="checkbox"
                class="checkbox checkbox-sm"
              />
              <span class="label-text text-xs">Advanced</span>
            </label>
          </div>
        </div>
        
        <!-- Quick actions -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-sm">Quick Actions</span>
          </label>
          <div class="flex gap-1">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              @click="expandAllSections"
            >
              Expand All
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              @click="collapseAllSections"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation errors -->
    <div v-if="hasValidationErrors" class="alert alert-error mb-6">
      <svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <h3 class="font-bold">Configuration Errors</h3>
        <ul class="mt-1 text-sm">
          <li v-for="error in validationErrors.slice(0, 5)" :key="error.field">
            {{ error.field }}: {{ error.message }}
          </li>
          <li v-if="validationErrors.length > 5" class="text-base-content/70">
            ... and {{ validationErrors.length - 5 }} more errors
          </li>
        </ul>
      </div>
    </div>

    <!-- Save error -->
    <div v-if="saveError" class="alert alert-error mb-6">
      <svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L5.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <h3 class="font-bold">Save Failed</h3>
        <p class="text-sm">{{ saveError.message }}</p>
      </div>
    </div>

    <!-- Config sections -->
    <div class="config-sections space-y-6">
      <ConfigSection
        v-for="[sectionKey, section] in visibleSections"
        :key="sectionKey"
        :section-key="sectionKey"
        :section="section"
        :form-data="formData"
        :compact-mode="uiState.compactMode"
        :show-advanced="uiState.showAdvanced"
        @update-field="updateField"
        @toggle-field="toggleField"
        @toggle-section="toggleSection"
      />
    </div>
    
    <!-- Empty state -->
    <div v-if="visibleSections.length === 0" class="text-center py-12">
      <div class="text-6xl text-base-content/20 mb-4">🔧</div>
      <h3 class="text-lg font-semibold text-base-content mb-2">
        No matching configuration found
      </h3>
      <p class="text-base-content/70 mb-4">
        Try adjusting your search or filter settings
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="clearFilters"
      >
        Clear Filters
      </button>
    </div>

    <!-- Footer with save confirmation -->
    <div 
      v-if="editorState.isDirty" 
      class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 p-4 shadow-lg z-50"
    >
      <div class="container mx-auto flex items-center justify-between">
        <div class="text-sm text-base-content/70">
          You have unsaved changes
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="saving"
            @click="resetForm"
          >
            Discard
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :class="{ 'btn-disabled': !canSave }"
            :disabled="!canSave"
            @click="handleSave"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs mr-2"></span>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ConfigSection from "./ConfigSection.vue";
import { useConfigEditor } from "../composables/useConfigEditor";
import type { ConfigLayer, JSONSchema } from "@/types/api";

interface Props {
  layerName: string;
  layerData: ConfigLayer;
  schema: JSONSchema;
}

const props = defineProps<Props>();

const layerNameRef = ref(props.layerName);
const filterMode = ref<"all" | "enabled" | "disabled">("all");

// Initialize editor
const {
  formData,
  editorState,
  uiState,
  validationErrors,
  saving,
  saveError,
  filteredSections,
  enabledFieldCount,
  totalFieldCount,
  hasValidationErrors,
  canSave,
  initializeForm,
  saveConfig,
  resetForm,
  validateForm,
  toggleSection,
  toggleField,
} = useConfigEditor(layerNameRef);

// Initialize form when props change
watch(
  [() => props.layerData, () => props.schema],
  ([newLayerData, newSchema]) => {
    if (newLayerData && newSchema) {
      initializeForm(newLayerData, newSchema);
    }
  },
  { immediate: true }
);

// Computed properties for filtering
const visibleSections = computed(() => {
  let sections = filteredSections.value;
  
  // Apply filter mode
  if (filterMode.value !== "all") {
    sections = sections.filter(([, section]) => {
      const hasEnabledFields = Object.values(section.fields).some(field => field.enabled);
      const hasDisabledFields = Object.values(section.fields).some(field => !field.enabled);
      
      if (filterMode.value === "enabled") {
        return hasEnabledFields;
      } else if (filterMode.value === "disabled") {
        return hasDisabledFields;
      }
      
      return true;
    });
  }
  
  return sections;
});

// Event handlers
const updateField = (fieldPath: string, value: any) => {
  formData.value[fieldPath] = value;
};

const handleSave = async () => {
  const success = await saveConfig();
  if (success) {
    // Show success message or toast
    console.log("Configuration saved successfully");
  }
};

const expandAllSections = () => {
  for (const sectionKey of Object.keys(editorState.sections)) {
    if (editorState.sections[sectionKey].collapsed) {
      toggleSection(sectionKey);
    }
  }
};

const collapseAllSections = () => {
  for (const sectionKey of Object.keys(editorState.sections)) {
    if (!editorState.sections[sectionKey].collapsed) {
      toggleSection(sectionKey);
    }
  }
};

const clearFilters = () => {
  uiState.searchQuery = "";
  filterMode.value = "all";
  uiState.showOnlyEnabled = false;
  uiState.showAdvanced = false;
};

// Auto-validate on form changes
watch(formData, () => {
  validateForm();
}, { deep: true });
</script>

<style scoped>
.config-editor {
  @apply max-w-full;
}

.config-editor-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

@media (prefers-color-scheme: dark) {
  .config-editor-header {
    background: rgba(0, 0, 0, 0.95);
  }
}

.config-editor-controls {
  position: sticky;
  top: 100px; /* Adjust based on header height */
  z-index: 30;
}

.config-sections {
  padding-bottom: 100px; /* Space for sticky footer when dirty */
}

/* Mobile responsive improvements */
@media (max-width: 768px) {
  .config-editor-controls {
    position: static; /* Remove sticky on mobile for better UX */
    top: auto;
  }
  
  .config-sections {
    padding-bottom: 120px; /* More space for mobile sticky footer */
  }
  
  .config-editor-header {
    position: static; /* Remove sticky on mobile */
    top: auto;
  }
}

/* Touch-friendly improvements */
@media (max-width: 640px) {
  .btn-sm {
    @apply btn-md; /* Larger touch targets on mobile */
  }
  
  .checkbox-sm {
    @apply checkbox; /* Larger checkboxes for touch */
  }
  
  .input-sm {
    @apply input; /* Larger inputs for touch */
  }
  
  .select-sm {
    @apply select; /* Larger selects for touch */
  }
}
</style>