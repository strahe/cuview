<template>
  <div class="space-y-6">
    <!-- Editor Header -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Status info -->
          <div>
            <h2 class="text-xl font-semibold">Configuration Editor</h2>
            <p class="text-base-content/70 text-sm">
              Layer: <span class="font-medium">{{ layerName }}</span>
              <span class="mx-2">•</span>
              {{ enabledFieldCount }}/{{ totalFieldCount }} fields enabled
              <span v-if="isDirty" class="text-warning mx-2"
                >• Unsaved changes</span
              >
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="toggleMode"
            >
              <EyeIcon v-if="!isPreviewMode" class="mr-1 h-4 w-4" />
              <PencilIcon v-else class="mr-1 h-4 w-4" />
              {{ isPreviewMode ? "Edit" : "Preview" }}
            </button>

            <button
              v-if="isDirty"
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
              <span
                v-if="saving"
                class="loading loading-spinner loading-xs mr-2"
              ></span>
              {{ saving ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filter Controls (Editor Mode Only) -->
    <div v-if="!isPreviewMode" class="card bg-base-50 shadow-sm">
      <div class="card-body">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Search -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Search fields</span>
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search configuration fields..."
              class="input input-bordered input-sm"
            />
          </div>

          <!-- Category filter -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Category</span>
            </label>
            <select
              v-model="selectedCategory"
              class="select select-bordered select-sm"
            >
              <option value="">All Categories</option>
              <option
                v-for="category in categories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </option>
            </select>
          </div>

          <!-- Show only enabled -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Filter</span>
            </label>
            <label class="label cursor-pointer">
              <input
                v-model="showOnlyEnabled"
                type="checkbox"
                class="checkbox checkbox-sm"
              />
              <span class="label-text">Show only enabled</span>
            </label>
          </div>

          <!-- Clear filters -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">&nbsp;</span>
            </label>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="btn btn-ghost btn-sm"
              @click="clearFilters"
            >
              <XMarkIcon class="mr-1 h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Mode -->
    <div v-if="isPreviewMode" class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h3 class="mb-4 text-lg font-semibold">Configuration Preview</h3>
        <div class="bg-base-200 rounded-lg p-4">
          <pre class="overflow-x-auto text-sm">{{ formattedConfig }}</pre>
        </div>
      </div>
    </div>

    <!-- Editor Mode -->
    <div v-else>
      <!-- Configuration Sections -->
      <div
        v-for="section in filteredSections"
        :key="section.key"
        class="card bg-base-100 shadow-sm"
      >
        <div class="card-body">
          <!-- Section Header -->
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">{{ section.title }}</h3>
              <p
                v-if="section.description"
                class="text-base-content/70 text-sm"
              >
                {{ section.description }}
              </p>
            </div>

            <!-- Section toggle -->
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="toggleSection(section.key)"
            >
              <ChevronDownIcon
                v-if="expandedSections.has(section.key)"
                class="h-4 w-4"
              />
              <ChevronRightIcon v-else class="h-4 w-4" />
            </button>
          </div>

          <!-- Section Content -->
          <div v-if="expandedSections.has(section.key)" class="space-y-4">
            <div
              v-for="field in section.fields"
              :key="field.key"
              class="form-control"
            >
              <!-- Field Label -->
              <label class="label">
                <span class="label-text font-medium">
                  {{ field.title }}
                  <span v-if="field.required" class="text-error">*</span>
                </span>
                <span class="label-text-alt">
                  <input
                    v-model="fieldStates[field.key].enabled"
                    type="checkbox"
                    class="toggle toggle-xs"
                    @change="onFieldToggle"
                  />
                </span>
              </label>

              <!-- Field Input -->
              <div v-if="fieldStates[field.key].enabled">
                <!-- Text Input -->
                <input
                  v-if="field.type === 'string' || field.type === 'number'"
                  v-model="fieldStates[field.key].value"
                  :type="field.type === 'number' ? 'number' : 'text'"
                  :placeholder="
                    field.placeholder || String(field.default || '')
                  "
                  class="input input-bordered"
                  @input="onFieldChange"
                />

                <!-- Boolean Input -->
                <input
                  v-else-if="field.type === 'boolean'"
                  v-model="fieldStates[field.key].value"
                  type="checkbox"
                  class="checkbox"
                  @change="onFieldChange"
                />

                <!-- Select Input -->
                <select
                  v-else-if="field.type === 'select'"
                  v-model="fieldStates[field.key].value"
                  class="select select-bordered"
                  @change="onFieldChange"
                >
                  <option value="">Select option...</option>
                  <option
                    v-for="option in field.options || []"
                    :key="String(option.value)"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>

                <!-- Array/List Input -->
                <div v-else-if="field.type === 'array'" class="space-y-2">
                  <div
                    v-for="(_item, index) in Array.isArray(
                      fieldStates[field.key].value,
                    )
                      ? fieldStates[field.key].value
                      : []"
                    :key="index"
                    class="flex gap-2"
                  >
                    <input
                      v-model="
                        (fieldStates[field.key].value as string[])[index]
                      "
                      type="text"
                      class="input input-bordered flex-1"
                      @input="onFieldChange"
                    />
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      @click="removeArrayItem(field.key, index)"
                    >
                      <XMarkIcon class="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    @click="addArrayItem(field.key)"
                  >
                    <PlusIcon class="mr-1 h-4 w-4" />
                    Add Item
                  </button>
                </div>

                <!-- Textarea for long text -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  :value="String(fieldStates[field.key].value || '')"
                  :placeholder="
                    field.placeholder || String(field.default || '')
                  "
                  class="textarea textarea-bordered"
                  rows="3"
                  @input="
                    (e) => {
                      fieldStates[field.key].value = (
                        e.target as HTMLTextAreaElement
                      ).value;
                      onFieldChange();
                    }
                  "
                ></textarea>
              </div>

              <!-- Field Help Text -->
              <div v-if="field.description" class="label">
                <span class="label-text-alt text-base-content/60">
                  {{ field.description }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No results message -->
      <div v-if="filteredSections.length === 0" class="py-12 text-center">
        <MagnifyingGlassIcon
          class="text-base-content/20 mx-auto mb-4 h-16 w-16"
        />
        <h3 class="mb-2 text-lg font-semibold">
          No matching configuration fields
        </h3>
        <p class="text-base-content/70 mb-4">
          Try adjusting your search or filter criteria
        </p>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";
import type { ConfigSchema, ConfigLayer } from "@/types/api";
import { useConfigLayers } from "../composables/useConfigLayers";

// Local type definitions for the editor
interface FieldState {
  enabled: boolean;
  value: unknown;
}

interface SchemaProperty {
  category?: string;
  title?: string;
  description?: string;
  type?: string;
  default?: unknown;
  placeholder?: string;
  enum?: unknown[];
  options?: Array<{ label: string; value: unknown }>;
  [key: string]: unknown; // Allow index signature
}

interface ConfigField {
  key: string;
  title: string;
  description?: string;
  type: string;
  required: boolean;
  default?: unknown;
  placeholder?: string;
  options?: Array<{ label: string; value: unknown }>;
}

interface ConfigSection {
  key: string;
  title: string;
  description: string;
  fields: ConfigField[];
}

interface Props {
  layerName: string;
  layerData: ConfigLayer;
  schema: ConfigSchema;
}

const props = defineProps<Props>();

// State
const isPreviewMode = ref(false);
const searchQuery = ref("");
const selectedCategory = ref("");
const showOnlyEnabled = ref(false);
const expandedSections = reactive(new Set<string>());
const fieldStates = reactive<Record<string, FieldState>>({});
const isDirty = ref(false);
const saving = ref(false);

// Initialize field states from layer data
const initializeFieldStates = () => {
  const schema = props.schema as {
    properties?: Record<string, SchemaProperty>;
  };
  const schemaProps = schema?.properties || {};
  Object.keys(schemaProps).forEach((key) => {
    const layerDataRecord = props.layerData as Record<string, unknown>;
    const schemaPropRecord = schemaProps[key];
    fieldStates[key] = {
      enabled: key in props.layerData,
      value: layerDataRecord[key] ?? schemaPropRecord?.default ?? "",
    };
  });

  // Expand first section by default
  const firstSection = sections.value[0];
  if (firstSection) {
    expandedSections.add(firstSection.key);
  }
};

// Computed properties
const sections = computed((): ConfigSection[] => {
  const schema = props.schema as {
    properties?: Record<string, SchemaProperty>;
  };
  const schemaProps = schema?.properties || {};
  const grouped: Record<string, ConfigField[]> = {};

  Object.entries(schemaProps).forEach(([key, field]) => {
    const fieldTyped = field as SchemaProperty;
    const category = fieldTyped.category || "General";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({
      key,
      title: fieldTyped.title || key,
      description: fieldTyped.description,
      type: fieldTyped.type || "string",
      required: false,
      default: fieldTyped.default,
      placeholder: fieldTyped.placeholder,
      options:
        fieldTyped.enum?.map((v: unknown) => ({
          label: String(v),
          value: v,
        })) || fieldTyped.options,
    });
  });

  return Object.entries(grouped).map(([category, fields]) => ({
    key: category,
    title: category,
    description: `${category} configuration settings`,
    fields,
  }));
});

const categories = computed(() => {
  return Array.from(new Set(sections.value.map((s) => s.key)));
});

const filteredSections = computed(() => {
  return sections.value
    .map((section) => {
      const filteredFields = section.fields.filter((field) => {
        // Search filter
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          if (
            !field.title.toLowerCase().includes(query) &&
            !field.description?.toLowerCase().includes(query)
          ) {
            return false;
          }
        }

        // Show only enabled filter
        if (showOnlyEnabled.value && !fieldStates[field.key]?.enabled) {
          return false;
        }

        return true;
      });

      return {
        ...section,
        fields: filteredFields,
      };
    })
    .filter((section) => {
      // Category filter
      if (selectedCategory.value && section.key !== selectedCategory.value) {
        return false;
      }

      // Only show sections with matching fields
      return section.fields.length > 0;
    });
});

const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    selectedCategory.value ||
    showOnlyEnabled.value
  );
});

const enabledFieldCount = computed(() => {
  return Object.values(fieldStates).filter((state) => state.enabled).length;
});

const totalFieldCount = computed(() => {
  return Object.keys(fieldStates).length;
});

const canSave = computed(() => {
  return isDirty.value && !saving.value;
});

const formattedConfig = computed(() => {
  const config: Record<string, unknown> = {};
  Object.entries(fieldStates).forEach(([key, state]) => {
    if (state.enabled) {
      config[key] = state.value;
    }
  });
  return JSON.stringify(config, null, 2);
});

// Methods
const toggleMode = () => {
  isPreviewMode.value = !isPreviewMode.value;
};

const toggleSection = (sectionKey: string) => {
  if (expandedSections.has(sectionKey)) {
    expandedSections.delete(sectionKey);
  } else {
    expandedSections.add(sectionKey);
  }
};

const clearFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "";
  showOnlyEnabled.value = false;
};

const onFieldToggle = () => {
  isDirty.value = true;
};

const onFieldChange = () => {
  isDirty.value = true;
};

const addArrayItem = (fieldKey: string) => {
  if (!Array.isArray(fieldStates[fieldKey].value)) {
    fieldStates[fieldKey].value = [];
  }
  (fieldStates[fieldKey].value as string[]).push("");
  isDirty.value = true;
};

const removeArrayItem = (fieldKey: string, index: number) => {
  if (Array.isArray(fieldStates[fieldKey].value)) {
    (fieldStates[fieldKey].value as string[]).splice(index, 1);
    isDirty.value = true;
  }
};

const resetForm = () => {
  initializeFieldStates();
  isDirty.value = false;
};

// Get composable for save functionality
const { updateLayer } = useConfigLayers();

const handleSave = async () => {
  saving.value = true;

  try {
    const config: Record<string, unknown> = {};
    Object.entries(fieldStates).forEach(([key, state]) => {
      if (state.enabled) {
        config[key] = state.value;
      }
    });

    const success = await updateLayer(props.layerName, config);

    if (success) {
      isDirty.value = false;
    } else {
      console.error("Failed to save configuration");
    }
  } catch (error) {
    console.error("Failed to save configuration:", error);
  } finally {
    saving.value = false;
  }
};

// Initialize on mount
onMounted(() => {
  initializeFieldStates();
});
</script>
