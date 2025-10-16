<script setup lang="ts">
import { ref, watch } from "vue";
import {
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";

interface Props {
  toml?: string;
  loading?: boolean;
  selectedLayer?: string | null;
  dirty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  toml: "",
  loading: false,
  selectedLayer: null,
  dirty: false,
});

const copyState = ref<"idle" | "copied" | "error">("idle");

const resetCopyState = () => {
  copyState.value = "idle";
};

watch(
  () => props.toml,
  () => {
    resetCopyState();
  },
);

const handleCopy = async () => {
  if (!props.toml) return;
  try {
    await navigator.clipboard.writeText(props.toml);
    copyState.value = "copied";
    setTimeout(() => {
      resetCopyState();
    }, 2000);
  } catch (err) {
    console.error("Failed to copy TOML preview", err);
    copyState.value = "error";
  }
};

const handleDownload = () => {
  if (!props.toml || !props.selectedLayer) return;
  const blob = new Blob([props.toml], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.selectedLayer}.toml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<template>
  <SectionCard
    title="TOML Preview"
    tooltip="Generated TOML for the selected layer. Copy or download to validate changes before applying."
    class="h-full"
  >
    <template #actions>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          class="btn btn-ghost btn-sm btn-square"
          :disabled="!toml"
          :title="copyState === 'copied' ? 'Copied' : 'Copy TOML'"
          aria-label="Copy TOML"
          @click="handleCopy"
        >
          <DocumentDuplicateIcon class="size-4" />
          <span class="sr-only">
            <template v-if="copyState === 'copied'">Copied</template>
            <template v-else-if="copyState === 'error'">Retry copy</template>
            <template v-else>Copy TOML</template>
          </span>
        </button>
        <button
          class="btn btn-outline btn-sm whitespace-nowrap"
          :disabled="!toml || !selectedLayer"
          @click="handleDownload"
        >
          <ArrowDownTrayIcon class="size-4" />
          Download
        </button>
      </div>
    </template>

    <div class="flex h-full flex-col gap-3">
      <div
        v-if="copyState === 'copied'"
        class="text-success/80 text-xs font-medium"
      >
        TOML copied to clipboard.
      </div>
      <div
        v-else-if="copyState === 'error'"
        class="text-warning/80 text-xs font-medium"
      >
        Copy failed. Please try again.
      </div>
      <div class="text-base-content/60 text-xs">
        Latest render from merged defaults and overrides.
        <span v-if="dirty" class="text-warning font-medium">
          Unsaved changes included.
        </span>
      </div>

      <div
        v-if="loading"
        class="border-base-300 flex h-full items-center justify-center rounded-lg border border-dashed"
      >
        <div class="loading loading-spinner loading-md text-primary"></div>
      </div>

      <div
        v-else-if="!selectedLayer"
        class="border-base-300 text-base-content/60 flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      >
        Select a configuration layer from the left panel to generate the TOML
        preview.
      </div>

      <div
        v-else-if="!toml"
        class="border-base-300 text-base-content/60 flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      >
        Preview will appear once configuration data is available.
      </div>

      <pre
        v-else
        class="bg-base-200/60 text-base-content/80 relative h-full min-h-[260px] overflow-auto rounded-lg p-4 font-mono text-xs leading-relaxed"
        >{{ toml }}</pre
      >
    </div>
  </SectionCard>
</template>
