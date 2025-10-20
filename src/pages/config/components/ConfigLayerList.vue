<script setup lang="ts">
import { computed } from "vue";
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from "reka-ui";
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import type { ConfigLayerSummary } from "@/types/config";

interface Props {
  layers?: ConfigLayerSummary[];
  loading?: boolean;
  error?: Error | null;
  selectedLayer?: string | null;
  disableCreate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layers: () => [],
  loading: false,
  error: null,
  selectedLayer: null,
  disableCreate: false,
});

const emit = defineEmits<{
  (event: "update:selected", layer: string): void;
  (event: "create"): void;
  (event: "refresh"): void;
}>();

const modelValue = computed({
  get: () => props.selectedLayer ?? "",
  set: (value: string) => {
    if (!value) return;
    emit("update:selected", value);
  },
});

const errorMessage = computed(
  () => props.error?.message ?? "Unable to load configuration layers.",
);

const handleCreateLayer = () => {
  emit("create");
};

const handleRefresh = () => {
  emit("refresh");
};
</script>

<template>
  <SectionCard title="Layers" class="h-full">
    <template #actions>
      <div class="flex items-center justify-end gap-2">
        <button
          class="btn btn-ghost btn-sm btn-circle border-base-200 bg-base-100/60 hover:border-primary/40 hover:bg-primary/10 border"
          :disabled="disableCreate || loading"
          @click="handleCreateLayer"
        >
          <PlusIcon class="size-4" />
          <span class="sr-only">Add layer</span>
        </button>
        <button
          class="btn btn-ghost btn-sm btn-square"
          :disabled="loading"
          :title="loading ? 'Refreshing layers' : 'Refresh layers'"
          @click="handleRefresh"
        >
          <ArrowPathIcon class="size-4" />
        </button>
      </div>
    </template>

    <div class="flex h-full flex-col gap-4">
      <div
        v-if="error"
        class="bg-error/10 text-error flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
      >
        <ExclamationCircleIcon class="size-5 shrink-0" />
        <div class="flex flex-col">
          <span class="font-semibold">Unable to load layers</span>
          <span class="text-error/70 text-xs">
            {{ errorMessage }}
          </span>
        </div>
      </div>

      <div
        v-else-if="!layers.length && !loading"
        class="bg-base-200 text-base-content/70 rounded-lg px-4 py-6 text-sm"
      >
        No layers found. Create a new layer to begin configuring overrides.
      </div>

      <div v-else class="min-h-0 flex-1">
        <div
          class="flex h-full flex-col overflow-y-auto pr-1"
          data-testid="config-layer-list"
        >
          <RadioGroupRoot
            v-model="modelValue"
            orientation="vertical"
            class="flex flex-col gap-2"
            :disabled="!layers.length"
          >
            <RadioGroupItem
              v-for="layer in layers"
              :key="layer.name"
              :value="layer.name"
              :aria-label="`Select layer ${layer.name}`"
              class="border-base-200 text-left transition-colors"
              :class="[
                'group bg-base-100 focus-visible:ring-primary/70 relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 outline-none focus-visible:ring-2',
                'data-[state=checked]:border-primary/40 data-[state=checked]:bg-primary/10',
              ]"
            >
              <div class="flex items-center gap-2 truncate text-sm font-medium">
                <span class="truncate">{{ layer.name }}</span>
                <span
                  v-if="layer.isDefault"
                  class="badge badge-outline badge-xs border-warning text-warning uppercase"
                >
                  Default
                </span>
              </div>

              <div class="text-base-content/60 flex items-center gap-2 text-xs">
                <span class="badge badge-outline badge-sm">
                  {{ layer.nodeCount }} nodes
                </span>
                <span
                  class="border-primary/50 group-data-[state=checked]:bg-primary group-data-[state=checked]:border-primary/70 pointer-events-none inline-flex size-3 items-center justify-center rounded-full border transition-all"
                  aria-hidden="true"
                >
                  <RadioGroupIndicator
                    class="bg-primary block size-2 rounded-full"
                  />
                </span>
              </div>
            </RadioGroupItem>
          </RadioGroupRoot>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-6">
        <div class="loading loading-spinner loading-md text-primary"></div>
      </div>
    </div>
  </SectionCard>
</template>
