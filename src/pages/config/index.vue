<route>
{
  "meta": {
    "title": "Configuration"
  }
}
</route>

<script setup lang="ts">
import { computed, ref } from "vue";
import { InformationCircleIcon } from "@heroicons/vue/24/outline";

import ConfigLayerList from "./components/ConfigLayerList.vue";
import ConfigLayerEditor from "./components/ConfigLayerEditor.vue";
import ConfigTomlPreview from "./components/ConfigTomlPreview.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { useConfigLayers } from "@/composables/useConfigLayers";
import { useConfigDefinitions } from "@/composables/useConfigDefinitions";
import { useConfigEditor } from "@/composables/useConfigEditor";
import { createConfigLayer } from "@/services/config-api";

const layers = useConfigLayers();
const definitions = useConfigDefinitions();

const editor = useConfigEditor({
  selectedLayer: layers.selectedLayer,
  defaults: definitions.defaults,
  schema: definitions.schema,
});

const sections = computed(() => {
  const groups = editor.groupedRows.value;
  return Array.from(groups.entries()).map(([key, rows]) => ({
    key,
    label: rows[0]?.groupLabel ?? key,
    rows,
  }));
});

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

const status = ref<StatusMessage | null>(null);
const showCreateModal = ref(false);
const newLayerName = ref("");
const createError = ref("");
const creatingLayer = ref(false);

const loadError = computed(() => {
  return (
    definitions.error.value ?? layers.error.value ?? editor.error.value ?? null
  );
});

const layerListError = computed(() => {
  if (definitions.error.value) {
    return null;
  }
  return layers.error.value;
});

const loadErrorMessage = computed(() => loadError.value?.message ?? "");
const hasLoadError = computed(() => Boolean(loadError.value));

const setStatus = (payload: StatusMessage | null) => {
  status.value = payload;
  if (payload) {
    window.setTimeout(() => {
      if (status.value === payload) {
        status.value = null;
      }
    }, 4000);
  }
};

const openCreateModal = () => {
  newLayerName.value = "";
  createError.value = "";
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const handleCreateLayer = async () => {
  const trimmed = newLayerName.value.trim();
  if (!trimmed.length) {
    createError.value = "Layer name cannot be empty.";
    return;
  }

  creatingLayer.value = true;
  createError.value = "";

  try {
    await createConfigLayer(trimmed);
    await layers.refresh();
    layers.selectLayer(trimmed);
    showCreateModal.value = false;
    setStatus({
      type: "success",
      text: `Layer "${trimmed}" created successfully.`,
    });
  } catch (err) {
    createError.value = (err as Error).message ?? "Failed to create layer.";
  } finally {
    creatingLayer.value = false;
  }
};

const handleSave = async () => {
  try {
    await editor.save();
    setStatus({
      type: "success",
      text: "Configuration saved.",
    });
  } catch (err) {
    setStatus({
      type: "error",
      text: (err as Error).message ?? "Failed to save configuration.",
    });
  }
};

const handleOverrideToggle = (payload: {
  path: string[];
  enabled: boolean;
  fallback: unknown;
}) => {
  if (payload.enabled) {
    editor.updateFieldValue(payload.path, payload.fallback);
  } else {
    editor.disableFieldOverride(payload.path);
  }
};
</script>

<template>
  <div class="flex min-h-full flex-col gap-6 p-6">
    <div
      v-if="status"
      :class="[
        'mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
        status.type === 'success'
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-error/40 bg-error/10 text-error',
      ]"
    >
      <InformationCircleIcon class="size-5 shrink-0" />
      <span>{{ status.text }}</span>
    </div>

    <div
      v-if="hasLoadError"
      class="border-error/40 bg-error/10 text-error mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
    >
      <InformationCircleIcon class="size-5 shrink-0" />
      <span>{{ loadErrorMessage }}</span>
    </div>

    <div
      class="grid min-h-0 flex-1 items-stretch gap-6 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.9fr)_minmax(260px,1.1fr)] xl:grid-cols-[minmax(240px,0.9fr)_minmax(0,2fr)_minmax(280px,1.15fr)] 2xl:grid-cols-[minmax(260px,0.95fr)_minmax(0,2.15fr)_minmax(300px,1.2fr)]"
    >
      <div class="min-h-0 min-w-0">
        <ConfigLayerList
          class="h-full"
          :layers="layers.layers.value"
          :loading="layers.loading.value"
          :error="layerListError"
          :selected-layer="layers.selectedLayer.value"
          :disable-create="definitions.loading.value || hasLoadError"
          @update:selected="layers.selectLayer"
          @refresh="layers.refresh"
          @create="openCreateModal"
        />
      </div>

      <div class="min-h-0 min-w-0">
        <ConfigLayerEditor
          class="h-full"
          :sections="sections"
          :loading="editor.loading.value || definitions.loading.value"
          :error="editor.error.value"
          :selected-layer="layers.selectedLayer.value"
          :is-default-layer="editor.isDefaultLayer.value"
          :dirty="editor.dirty.value"
          :saving="editor.saving.value"
          @update="({ path, value }) => editor.updateFieldValue(path, value)"
          @toggle="handleOverrideToggle"
          @reset-row="({ path }) => editor.disableFieldOverride(path)"
          @reset-all="editor.reset"
          @save="handleSave"
        />
      </div>

      <div class="min-h-0 min-w-0">
        <ConfigTomlPreview
          class="h-full"
          :toml="editor.tomlPreview.value"
          :previous-toml="editor.originalTomlPreview.value"
          :loading="definitions.loading.value || editor.loading.value"
          :selected-layer="layers.selectedLayer.value"
          :dirty="editor.dirty.value"
        />
      </div>
    </div>

    <BaseModal
      :open="showCreateModal"
      title="Create Configuration Layer"
      size="sm"
      @close="closeCreateModal"
    >
      <form
        id="create-layer-form"
        class="flex flex-col gap-4 py-4"
        @submit.prevent="handleCreateLayer"
      >
        <label class="form-control w-full">
          <span class="label">
            <span class="label-text font-medium">Layer Name</span>
            <span class="label-text-alt">
              Unique identifier without spaces.
            </span>
          </span>
          <input
            v-model="newLayerName"
            type="text"
            class="input input-bordered w-full"
            placeholder="e.g. sealing-cluster"
            :disabled="creatingLayer"
            autofocus
          />
        </label>

        <p v-if="createError" class="text-error text-sm">
          {{ createError }}
        </p>
      </form>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="creatingLayer"
            @click="closeCreateModal"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="creatingLayer"
            form="create-layer-form"
          >
            <span
              v-if="creatingLayer"
              class="loading loading-spinner loading-xs"
            ></span>
            Create Layer
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
