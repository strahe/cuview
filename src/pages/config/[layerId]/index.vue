<template>
  <div class="config-layer-edit-page bg-base-50 min-h-screen">
    <div class="container mx-auto px-4 py-6">
      <!-- Page header with breadcrumb -->
      <div class="mb-8">
        <nav class="breadcrumbs mb-4 text-sm">
          <ul>
            <li>
              <router-link to="/config" class="link link-hover">
                Configuration
              </router-link>
            </li>
            <li class="text-base-content/70">{{ layerId }}</li>
          </ul>
        </nav>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              @click="$router.go(-1)"
            >
              <ArrowLeftIcon class="h-4 w-4" />
            </button>
            <div
              class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg"
            >
              <CogIcon class="text-primary h-6 w-6" />
            </div>
            <div>
              <h1 class="text-base-content text-3xl font-bold">
                {{ layerTitle }}
              </h1>
              <p class="text-base-content/70">
                Configure settings for the
                <span class="font-mono font-medium">{{ layerId }}</span> layer
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="initialLoading" class="flex items-center justify-center py-24">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg mb-4 block"></span>
          <p class="text-base-content/70">Loading configuration...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="alert alert-error">
        <ExclamationTriangleIcon class="h-6 w-6 shrink-0" />
        <div>
          <h3 class="font-bold">Failed to load configuration</h3>
          <div class="text-sm">{{ loadError.message }}</div>
        </div>
        <button class="btn btn-sm" @click="reloadData">Retry</button>
      </div>

      <!-- Unified Editor/Preview -->
      <div v-if="currentLayer && schema">
        <ConfigLayerEditor
          :layer-name="layerId"
          :layer-data="currentLayer"
          :schema="schema"
        />
      </div>

      <!-- No data state -->
      <div v-else class="py-24 text-center">
        <div class="text-base-content/20 mb-4 text-6xl">📋</div>
        <h3 class="text-base-content mb-2 text-lg font-semibold">
          No configuration data
        </h3>
        <p class="text-base-content/70 mb-6">
          This layer appears to be empty. Start configuring to add settings.
        </p>
        <button
          type="button"
          class="btn btn-primary"
          @click="initializeEmptyLayer"
        >
          Initialize Layer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  CogIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import ConfigLayerEditor from "../components/ConfigLayerEditor.vue";
import { useConfigLayers } from "../composables/useConfigLayers";

const route = useRoute();

// State
const initialLoading = ref(true);
const loadError = ref<Error | null>(null);

// Get layer ID from route
const layerId = computed(() => {
  return typeof route.params.layerId === "string"
    ? route.params.layerId
    : Array.isArray(route.params.layerId)
      ? route.params.layerId[0]
      : "";
});

// Use composables
const {
  currentLayer,
  schema,
  layerSummaries,
  loadLayer,
  loadSchema,
  formatLayerTitle,
} = useConfigLayers();

// Computed properties
const layerTitle = computed(() => {
  const summary = layerSummaries.value[layerId.value];
  return summary?.title || formatLayerTitle(layerId.value);
});

// Methods
const loadData = async () => {
  if (!layerId.value) {
    loadError.value = new Error("Invalid layer ID");
    return;
  }

  initialLoading.value = true;
  loadError.value = null;

  try {
    // Load schema and layer data in parallel
    const [layerData, schemaData] = await Promise.all([
      loadLayer(layerId.value),
      loadSchema(),
    ]);

    if (!layerData) {
      throw new Error(`Layer "${layerId.value}" not found`);
    }

    if (!schemaData) {
      throw new Error("Failed to load configuration schema");
    }
  } catch (err) {
    loadError.value =
      err instanceof Error ? err : new Error("Unknown error occurred");
    console.error("Error loading config data:", err);
  } finally {
    initialLoading.value = false;
  }
};

const reloadData = () => {
  loadData();
};

const initializeEmptyLayer = async () => {
  // Initialize an empty layer with default structure
  try {
    initialLoading.value = true;

    // This would normally save the empty config to initialize the layer
    // await updateLayer(layerId.value, {});

    // Reload data after initialization
    await loadData();
  } catch (err) {
    loadError.value =
      err instanceof Error ? err : new Error("Failed to initialize layer");
  } finally {
    initialLoading.value = false;
  }
};

// Watch for route changes
watch(
  () => layerId.value,
  (newLayerId) => {
    if (newLayerId) {
      loadData();
    }
  },
);

// Load data on mount
onMounted(() => {
  if (layerId.value) {
    loadData();
  } else {
    loadError.value = new Error("Layer ID is required");
    initialLoading.value = false;
  }
});
</script>

<style scoped>
.config-layer-edit-page {
  min-height: 100vh;
}

.container {
  max-width: 1400px; /* Wider for the editor */
}

.breadcrumbs {
  @apply mb-4;
}

.config-preview,
.config-editor {
  @apply w-full;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    @apply px-2;
  }

  .config-layer-edit-page {
    @apply py-4;
  }
}
</style>
