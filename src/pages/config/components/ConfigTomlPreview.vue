<script setup lang="ts">
import { computed } from "vue";
import { diffArrays } from "diff";
import type { ChangeObject } from "diff";
import CopyButton from "@/components/ui/CopyButton.vue";
import SectionCard from "@/components/ui/SectionCard.vue";

interface Props {
  toml?: string;
  previousToml?: string;
  loading?: boolean;
  selectedLayer?: string | null;
  dirty?: boolean;
}

interface DiffEntry {
  line: string;
  type: "added" | "removed" | "unchanged";
}

const props = withDefaults(defineProps<Props>(), {
  toml: "",
  previousToml: "",
  loading: false,
  selectedLayer: null,
  dirty: false,
});

const normalizeLines = (value?: string) => {
  if (!value) return [];
  const normalized = value.replace(/\r\n/g, "\n");
  const segments = normalized.split("\n");
  if (segments.length && segments[segments.length - 1] === "") {
    segments.pop();
  }
  return segments;
};

const diffEntries = computed<DiffEntry[]>(() => {
  const currentLines = normalizeLines(props.toml);

  if (!props.dirty) {
    return currentLines.map((line) => ({ line, type: "unchanged" }));
  }

  const previousLines = normalizeLines(props.previousToml);
  const diff = diffArrays(previousLines, currentLines);

  if (!diff) {
    return currentLines.map((line) => ({ line, type: "unchanged" }));
  }

  const entries: DiffEntry[] = [];

  diff.forEach((part: ChangeObject<string[]>) => {
    const lines = part.value;

    if (part.added) {
      lines.forEach((line) => {
        entries.push({ line, type: "added" });
      });
      return;
    }

    if (part.removed) {
      lines.forEach((line) => {
        entries.push({ line, type: "removed" });
      });
      return;
    }

    lines.forEach((line) => {
      entries.push({ line, type: "unchanged" });
    });
  });

  return entries;
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
        class="border-base-300 flex flex-1 items-center justify-center rounded-lg border border-dashed"
      >
        <div class="loading loading-spinner loading-md text-primary"></div>
      </div>

      <div
        v-else-if="!selectedLayer"
        class="border-base-300 text-base-content/60 flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      >
        Select a configuration layer to generate the preview.
      </div>

      <div
        v-else-if="!diffEntries.length"
        class="border-base-300 text-base-content/60 flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
      >
        Preview will appear once configuration data is available.
      </div>

      <div v-else class="min-h-0 flex-1">
        <div
          class="border-base-300/60 bg-base-200/50 flex h-full flex-col overflow-hidden rounded-lg border font-mono text-xs leading-relaxed"
        >
          <div class="flex-1 overflow-y-auto">
            <div
              v-for="(entry, index) in diffEntries"
              :key="`${index}-${entry.type}-${entry.line}`"
              :class="[
                'border-base-200/30 text-base-content/80 flex items-start gap-3 px-4 py-1.5 whitespace-pre-wrap',
                index === diffEntries.length - 1 ? 'border-b-0' : 'border-b',
              ]"
            >
              <span
                :class="[
                  'mt-0.5 font-semibold select-none',
                  entry.type === 'added'
                    ? 'text-success'
                    : entry.type === 'removed'
                      ? 'text-error'
                      : 'text-base-content/40',
                ]"
              >
                {{
                  entry.type === "added"
                    ? "+"
                    : entry.type === "removed"
                      ? "-"
                      : " "
                }}
              </span>
              <span
                class="flex-1"
                :class="
                  entry.type === 'added'
                    ? 'text-success'
                    : entry.type === 'removed'
                      ? 'text-error'
                      : 'text-base-content/80'
                "
              >
                <span
                  :class="[
                    'rounded px-1.5 py-0.5',
                    entry.type === 'added'
                      ? 'bg-success/20'
                      : entry.type === 'removed'
                        ? 'bg-error/20'
                        : 'bg-transparent',
                  ]"
                >
                  {{ entry.line || " " }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>
