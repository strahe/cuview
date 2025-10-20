<script setup lang="ts">
import { computed } from "vue";
import { diffLinesRaw } from "diff";
import CopyButton from "@/components/ui/CopyButton.vue";
import SectionCard from "@/components/ui/SectionCard.vue";

interface Props {
  toml?: string;
  previousToml?: string;
  loading?: boolean;
  selectedLayer?: string | null;
  dirty?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  toml: "",
  previousToml: "",
  loading: false,
  selectedLayer: null,
  dirty: false,
});

const tomlLines = computed(() => (props.toml ? props.toml.split("\n") : []));
const previousLines = computed(() =>
  props.previousToml ? props.previousToml.split("\n") : [],
);

const diffMap = computed(() => {
  const map = new Map<number, "added" | "removed">();

  if (!props.dirty || !props.toml) {
    return map;
  }

  const diff = diffLinesRaw(props.previousToml ?? "", props.toml ?? "");

  let currentIndex = 0;
  diff.forEach((part) => {
    const lines = part.value.split("\n");
    // Remove trailing empty line introduced by split when string ends with newline
    if (lines.at(-1) === "") {
      lines.pop();
    }

    if (part.added) {
      lines.forEach((_, offset) => {
        map.set(currentIndex + offset, "added");
      });
      currentIndex += lines.length;
    } else if (part.removed) {
      // Removed lines are not counted in the current preview, so we only mark the next line as context if it exists
      return;
    } else {
      currentIndex += lines.length;
    }
  });

  return map;
});
</script>

<template>
  <SectionCard title="Preview" class="h-full">
    <template #actions>
      <CopyButton
        :value="toml"
        variant="ghost"
        size="sm"
        icon-only
        aria-label="Copy preview contents"
      />
    </template>

    <div class="flex h-full flex-col gap-3">
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
        Select a configuration layer to generate the preview.
      </div>

      <div
        v-else-if="!toml"
        class="border-base-300 text-base-content/60 flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      >
        Preview will appear once configuration data is available.
      </div>

      <div
        v-else
        class="border-base-300/60 bg-base-200/50 flex h-full flex-col overflow-hidden rounded-lg border font-mono text-xs leading-relaxed"
      >
        <div
          v-for="(line, index) in tomlLines"
          :key="`${index}-${line}`"
          :class="[
            'border-base-200/30 px-4 py-1.5 whitespace-pre-wrap',
            index === tomlLines.length - 1 ? 'border-b-0' : 'border-b',
            'text-base-content/80',
          ]"
        >
          <template v-if="highlightedLines.has(index)">
            <span
              class="bg-warning/20 text-warning-content/90 rounded px-1 py-0.5"
            >
              {{ line || " " }}
            </span>
          </template>
          <template v-else>
            {{ line || " " }}
          </template>
        </div>
      </div>
    </div>
  </SectionCard>
</template>
