<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Configuration Layers</h2>
        <p class="text-base-content/70 mt-1 text-sm">
          Manage your configuration layers and their settings
        </p>
      </div>

      <button
        type="button"
        class="btn btn-primary"
        @click="showCreateModal = true"
      >
        <PlusIcon class="mr-2 h-4 w-4" />
        New Layer
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error">
      <ExclamationTriangleIcon class="h-6 w-6 shrink-0" />
      <div>
        <h3 class="font-bold">Error loading layers</h3>
        <div class="text-sm">{{ error.message }}</div>
      </div>
      <button class="btn btn-sm" @click="loadLayers">Retry</button>
    </div>

    <!-- Layers grid -->
    <div
      v-else-if="hasLayers"
      class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="layerName in sortedLayers"
        :key="layerName"
        class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg"
      >
        <div class="card-body">
          <!-- Layer header -->
          <div class="mb-3 flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <h3 class="card-title truncate text-lg">
                {{ layerSummaries[layerName]?.title || layerName }}
              </h3>
              <p class="text-base-content/60 font-mono text-sm">
                {{ layerName }}
              </p>
            </div>

            <!-- Actions dropdown -->
            <div class="dropdown dropdown-end">
              <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-sm btn-square"
              >
                <EllipsisVerticalIcon class="h-4 w-4" />
              </div>
              <ul
                tabindex="0"
                class="dropdown-content menu bg-base-100 rounded-box w-48 p-2 shadow"
              >
                <li>
                  <router-link
                    :to="`/config/${layerName}`"
                    class="flex items-center gap-2"
                  >
                    <PencilIcon class="h-4 w-4" />
                    Edit Layer
                  </router-link>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2"
                    @click="duplicateLayer(layerName)"
                  >
                    <DocumentDuplicateIcon class="h-4 w-4" />
                    Duplicate
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2"
                    @click="exportLayer(layerName)"
                  >
                    <ArrowDownTrayIcon class="h-4 w-4" />
                    Export JSON
                  </a>
                </li>
                <div class="divider my-1"></div>
                <li>
                  <a
                    class="text-error flex items-center gap-2"
                    @click="confirmDeleteLayer(layerName)"
                  >
                    <TrashIcon class="h-4 w-4" />
                    Delete
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Layer description -->
          <p
            v-if="layerSummaries[layerName]?.description"
            class="text-base-content/70 mb-4 text-sm"
          >
            {{ layerSummaries[layerName].description }}
          </p>

          <!-- Layer stats -->
          <div class="mb-4 flex flex-wrap gap-2">
            <div class="badge badge-outline badge-sm">
              {{ layerSummaries[layerName]?.fieldCount || 0 }} fields
            </div>
            <div
              v-if="layerSummaries[layerName]?.modifiedAt"
              class="badge badge-ghost badge-sm"
            >
              Modified {{ formatDate(layerSummaries[layerName].modifiedAt!) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="card-actions justify-end">
            <router-link
              :to="`/config/${layerName}`"
              class="btn btn-primary btn-sm"
            >
              Configure
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="py-12 text-center">
      <CogIcon class="text-base-content/20 mx-auto mb-4 h-16 w-16" />
      <h3 class="mb-2 text-lg font-semibold">No configuration layers found</h3>
      <p class="text-base-content/70 mb-6">
        Create your first configuration layer to get started
      </p>
      <button
        type="button"
        class="btn btn-primary"
        @click="showCreateModal = true"
      >
        Create First Layer
      </button>
    </div>

    <!-- Create Layer Modal -->
    <div v-if="showCreateModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="mb-4 text-lg font-bold">Create New Configuration Layer</h3>

        <FormKit
          type="form"
          submit-label="Create Layer"
          @submit="handleCreateLayer"
        >
          <FormKit
            type="text"
            name="name"
            label="Layer Name"
            placeholder="e.g., production, development, custom"
            validation="required|length:3,50|matches:/^[a-z0-9-_]+$/"
            help="Use lowercase letters, numbers, hyphens, and underscores only"
          />

          <FormKit
            type="text"
            name="title"
            label="Display Title"
            placeholder="e.g., Production Configuration"
            help="Human-readable name for this layer"
          />

          <FormKit
            type="textarea"
            name="description"
            label="Description"
            placeholder="Describe the purpose of this configuration layer..."
            help="Optional description of what this layer is used for"
          />

          <FormKit
            type="select"
            name="copyFrom"
            label="Copy From"
            placeholder="Select layer to copy (optional)"
            :options="copyFromOptions"
            help="Start with settings from an existing layer"
          />

          <div class="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              class="btn btn-ghost"
              @click="showCreateModal = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              <span
                v-if="creating"
                class="loading loading-spinner loading-xs mr-2"
              ></span>
              {{ creating ? "Creating..." : "Create Layer" }}
            </button>
          </div>
        </FormKit>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
        @click="showCreateModal = false"
      >
        <button>close</button>
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="layerToDelete" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-error mb-4 text-lg font-bold">
          Delete Configuration Layer
        </h3>
        <p class="mb-4">
          Are you sure you want to delete the layer
          <strong>{{ layerToDelete }}</strong
          >? This action cannot be undone.
        </p>

        <div class="bg-warning/10 border-warning/20 mb-4 rounded-lg border p-3">
          <div class="flex items-start gap-2">
            <ExclamationTriangleIcon class="text-warning mt-0.5 h-5 w-5" />
            <div>
              <p class="text-warning text-sm font-medium">Warning</p>
              <p class="text-warning/80 text-sm">
                All configuration settings in this layer will be permanently
                lost.
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost"
            @click="layerToDelete = null"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-error"
            :disabled="deleting"
            @click="handleDeleteLayer"
          >
            <span
              v-if="deleting"
              class="loading loading-spinner loading-xs mr-2"
            ></span>
            {{ deleting ? "Deleting..." : "Delete Layer" }}
          </button>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
        @click="layerToDelete = null"
      >
        <button>close</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { FormKit } from "@formkit/vue";
import { useRouter } from "vue-router";
import {
  CogIcon,
  PlusIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { useConfigLayers } from "../composables/useConfigLayers";
import type { CreateConfigLayerRequest } from "@/types/config";

const router = useRouter();

// State
const showCreateModal = ref(false);
const layerToDelete = ref<string | null>(null);
const creating = ref(false);
const deleting = ref(false);

// Use composable
const {
  layers,
  layerSummaries,
  loading,
  error,
  sortedLayers,
  hasLayers,
  loadLayers,
  createLayer,
  deleteLayer,
} = useConfigLayers();

// Computed properties
const copyFromOptions = computed(() => {
  return [
    { label: "Start with empty layer", value: "" },
    ...layers.value.map((layer) => ({
      label: layerSummaries.value[layer]?.title || layer,
      value: layer,
    })),
  ];
});

// Event handlers
const handleCreateLayer = async (data: Record<string, unknown>) => {
  creating.value = true;

  try {
    const request: CreateConfigLayerRequest = {
      name: data.name as string,
      title: (data.title as string) || undefined,
      description: (data.description as string) || undefined,
      copyFrom: (data.copyFrom as string) || undefined,
    };

    const success = await createLayer(request);

    if (success) {
      showCreateModal.value = false;
      router.push(`/config/${request.name}`);
    }
  } finally {
    creating.value = false;
  }
};

const confirmDeleteLayer = (layerName: string) => {
  layerToDelete.value = layerName;
};

const handleDeleteLayer = async () => {
  if (!layerToDelete.value) return;

  deleting.value = true;

  try {
    const success = await deleteLayer();

    if (success) {
      layerToDelete.value = null;
      await loadLayers();
    }
  } finally {
    deleting.value = false;
  }
};

const duplicateLayer = async (layerName: string) => {
  const newName = `${layerName}-copy`;
  const summary = layerSummaries.value[layerName];

  const request: CreateConfigLayerRequest = {
    name: newName,
    title: `${summary?.title || layerName} (Copy)`,
    description: `Copy of ${layerName}`,
    copyFrom: layerName,
  };

  const success = await createLayer(request);
  if (success) {
    router.push(`/config/${newName}`);
  }
};

const exportLayer = async (layerName: string) => {
  try {
    const response = await fetch(
      `/api/config/layers/${encodeURIComponent(layerName)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch layer: ${response.statusText}`);
    }

    const config = await response.json();

    const dataStr = JSON.stringify(config, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${layerName}-config.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  } catch (err) {
    console.error("Failed to export layer:", err);
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "unknown";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "today";
    } else if (diffDays === 1) {
      return "yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return "unknown";
  }
};

// Load layers on mount
onMounted(() => {
  loadLayers();
});
</script>
