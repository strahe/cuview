<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  ArrowUturnLeftIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
import { ChevronDownIcon } from "@heroicons/vue/24/solid";
import SectionCard from "@/components/ui/SectionCard.vue";
import type { ConfigFieldRow } from "@/types/config";

interface ConfigSection {
  key: string;
  label: string;
  rows: ConfigFieldRow[];
}

interface Props {
  sections?: ConfigSection[];
  loading?: boolean;
  error?: Error | null;
  selectedLayer?: string | null;
  isDefaultLayer?: boolean;
  dirty?: boolean;
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  loading: false,
  error: null,
  selectedLayer: null,
  isDefaultLayer: false,
  dirty: false,
  saving: false,
});

const emit = defineEmits<{
  (
    event: "update",
    payload: { path: string[]; value: unknown; row: ConfigFieldRow },
  ): void;
  (
    event: "toggle",
    payload: {
      path: string[];
      enabled: boolean;
      fallback: unknown;
      row: ConfigFieldRow;
    },
  ): void;
  (event: "reset-row", payload: { path: string[] }): void;
  (event: "reset-all"): void;
  (event: "save"): void;
}>();

const validationErrors = ref<Record<string, string>>({});
const expandedSections = ref<Record<string, boolean>>({});

const headerLabel = computed(() => {
  if (!props.selectedLayer) return "Select a layer";
  return props.selectedLayer;
});

const normalizeNumber = (value: string, isInteger: boolean) => {
  if (!value.length) return null;
  const parsed = isInteger
    ? Number.parseInt(value, 10)
    : Number.parseFloat(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const normalizeArrayInput = (value: string) => {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const clearRowError = (rowId: string) => {
  if (validationErrors.value[rowId]) {
    const next = { ...validationErrors.value };
    delete next[rowId];
    validationErrors.value = next;
  }
};

const setRowError = (rowId: string, message: string) => {
  validationErrors.value = {
    ...validationErrors.value,
    [rowId]: message,
  };
};

const emitToggle = (row: ConfigFieldRow, enabled: boolean) => {
  const fallback =
    row.effectiveValue ??
    row.defaultValue ??
    (row.type === "boolean" ? false : null);
  emit("toggle", {
    path: row.path,
    enabled,
    fallback,
    row,
  });
  clearRowError(row.id);
};

const emitUpdate = (row: ConfigFieldRow, value: unknown) => {
  emit("update", { path: row.path, value, row });
};

const formatArrayDisplay = (value: unknown): string => {
  if (Array.isArray(value)) {
    return JSON.stringify(value, null, 2);
  }
  return "";
};

const handleTextInput = (row: ConfigFieldRow, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);

  switch (row.type) {
    case "integer":
    case "number": {
      const parsed = normalizeNumber(target.value, row.type === "integer");
      if (parsed === null) {
        setRowError(row.id, "Enter a valid numeric value.");
        return;
      }
      emitUpdate(row, parsed);
      break;
    }
    case "array": {
      const parsed = normalizeArrayInput(target.value);
      if (!Array.isArray(parsed)) {
        setRowError(row.id, 'Provide a valid JSON array. Example: ["value"]');
        return;
      }
      emitUpdate(row, parsed);
      break;
    }
    default: {
      emitUpdate(row, target.value);
    }
  }
};

const handleBooleanInput = (row: ConfigFieldRow, value: boolean | string) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  const resolved = typeof value === "string" ? value === "true" : value;
  emitUpdate(row, resolved);
};

const handleSelectInput = (row: ConfigFieldRow, event: Event) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  const target = event.target as HTMLSelectElement;
  const match = row.options?.find(
    (option) => String(option.value) === target.value,
  );
  const resolved = match ? match.value : target.value;
  emitUpdate(row, resolved);
};

const handleResetRow = (row: ConfigFieldRow) => {
  emit("reset-row", { path: row.path });
  clearRowError(row.id);
};

const isInputDisabled = (row: ConfigFieldRow) =>
  props.isDefaultLayer || !row.isEditable || !row.isOverride;

const handleOverrideChange = (row: ConfigFieldRow, enabled: boolean) => {
  if (props.isDefaultLayer || !row.isEditable) return;
  emitToggle(row, enabled);
};

const displayValue = (row: ConfigFieldRow) => {
  if (row.isOverride) {
    return row.overrideValue ?? row.defaultValue ?? "";
  }
  return row.effectiveValue ?? row.defaultValue ?? "";
};

const formatDefaultValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "Not set";
  if (Array.isArray(value)) {
    return value.length ? `${value.length} items` : "[]";
  }
  if (typeof value === "object") {
    return "Object";
  }
  return String(value);
};

const resolveBooleanValue = (row: ConfigFieldRow) => {
  const value = row.isOverride
    ? (row.overrideValue ?? row.defaultValue)
    : (row.effectiveValue ?? row.defaultValue);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return Boolean(value);
};

const resolveInputValue = (row: ConfigFieldRow) => {
  const value = displayValue(row);
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return String(value);
};

const isSectionExpanded = (key: string) => expandedSections.value[key] ?? true;

const toggleSection = (key: string) => {
  expandedSections.value = {
    ...expandedSections.value,
    [key]: !isSectionExpanded(key),
  };
};

watch(
  () => props.sections?.map((section) => section.key) ?? [],
  (keys) => {
    const next: Record<string, boolean> = {};
    keys.forEach((key) => {
      next[key] = expandedSections.value[key] ?? false;
    });
    expandedSections.value = next;
  },
  { immediate: true },
);
</script>

<template>
  <!-- eslint-disable vue/v-on-event-hyphenation -->
  <SectionCard title="Layer Editor" class="h-full">
    <template #actions>
      <div class="flex items-center gap-2">
        <button
          class="btn btn-ghost btn-sm"
          :disabled="!dirty || saving"
          @click="emit('reset-all')"
        >
          <ArrowUturnLeftIcon class="size-4" />
          Revert Changes
        </button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!dirty || saving || isDefaultLayer"
          @click="emit('save')"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          Save Changes
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-base-content text-lg font-semibold">
            {{ headerLabel }}
          </h2>
          <span
            v-if="dirty"
            class="badge badge-warning badge-xs border-warning/60 bg-warning/10 text-warning tracking-wide uppercase"
          >
            Unsaved
          </span>
          <span
            v-else-if="selectedLayer"
            class="badge badge-success badge-xs border-success/40 bg-success/10 text-success tracking-wide uppercase"
          >
            Synced
          </span>
          <span
            v-if="isDefaultLayer"
            class="badge badge-outline badge-xs border-base-300 text-base-content/60 tracking-wide uppercase"
          >
            Read-only
          </span>
        </div>
      </div>

      <div
        v-if="error"
        class="bg-error/10 text-error flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
      >
        <ExclamationCircleIcon class="size-5 shrink-0" />
        {{ error.message }}
      </div>

      <div
        v-if="!loading && !sections.length && !error"
        class="bg-base-200 text-base-content/70 rounded-lg px-4 py-6 text-sm"
      >
        Select or create a configuration layer from the left panel to load
        editable fields here.
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="loading loading-spinner loading-lg text-primary"></div>
      </div>

      <div
        v-for="section in sections"
        :key="section.key"
        class="border-base-200/60 bg-base-200/20 rounded-xl border px-1"
      >
        <div
          class="text-base-content flex items-center justify-between rounded-t-xl px-3 py-3 text-sm font-semibold uppercase"
        >
          <button
            type="button"
            class="hover:text-base-content/80 flex items-center gap-2 text-left transition"
            @click="toggleSection(section.key)"
          >
            <ChevronDownIcon
              class="size-4 transition"
              :class="[
                isSectionExpanded(section.key)
                  ? 'rotate-0'
                  : '-rotate-90 opacity-60',
              ]"
            />
            <span>{{ section.label }}</span>
          </button>
          <span class="text-base-content/60 text-xs font-semibold">
            {{ section.rows.length }} fields
          </span>
        </div>

        <div v-if="isSectionExpanded(section.key)" class="space-y-3 px-3 pb-4">
          <div
            v-for="row in section.rows"
            :key="row.id"
            class="border-base-200 bg-base-200/60 rounded-xl border px-4 py-4"
          >
            <div class="flex items-start gap-4">
              <input
                :checked="row.isOverride"
                :disabled="isDefaultLayer || !row.isEditable"
                class="checkbox checkbox-sm mt-1"
                type="checkbox"
                @change="
                  (event) =>
                    handleOverrideChange(
                      row,
                      (event.target as HTMLInputElement).checked,
                    )
                "
              />
              <div class="flex-1 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div
                    class="flex flex-wrap items-center gap-2 text-sm font-medium"
                  >
                    <span>{{ row.label }}</span>
                    <span class="badge badge-outline badge-xs uppercase">
                      {{ row.type }}
                    </span>
                    <button
                      v-if="row.helpText || row.description"
                      type="button"
                      class="text-base-content/60 hover:text-base-content transition"
                      :title="row.helpText ?? row.description"
                    >
                      <InformationCircleIcon class="size-4" />
                    </button>
                  </div>
                  <button
                    v-if="row.isOverride && !isDefaultLayer"
                    class="text-primary/80 hover:text-primary text-xs font-semibold uppercase transition"
                    type="button"
                    @click="handleResetRow(row)"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <template v-if="row.type === 'boolean'">
                    <select
                      class="select select-bordered select-sm w-full"
                      :disabled="isInputDisabled(row)"
                      :value="resolveBooleanValue(row) ? 'true' : 'false'"
                      @change="
                        (event) =>
                          handleBooleanInput(
                            row,
                            (event.target as HTMLSelectElement).value,
                          )
                      "
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </template>
                  <template v-else-if="row.options && row.options.length">
                    <select
                      class="select select-bordered select-sm w-full"
                      :disabled="isInputDisabled(row)"
                      :value="resolveInputValue(row)"
                      @change="handleSelectInput(row, $event)"
                    >
                      <option
                        v-for="option in row.options"
                        :key="String(option.value)"
                        :value="String(option.value)"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                  </template>
                  <template v-else-if="row.type === 'array'">
                    <textarea
                      class="textarea textarea-bordered textarea-sm min-h-24 w-full"
                      :disabled="isInputDisabled(row)"
                      :value="
                        row.isOverride
                          ? formatArrayDisplay(row.overrideValue)
                          : formatArrayDisplay(row.effectiveValue)
                      "
                      placeholder='["value"]'
                      @change="handleTextInput(row, $event)"
                    ></textarea>
                  </template>
                  <template v-else>
                    <input
                      :type="
                        row.type === 'number' || row.type === 'integer'
                          ? 'number'
                          : 'text'
                      "
                      class="input input-bordered input-sm w-full"
                      :step="row.type === 'integer' ? 1 : 'any'"
                      :disabled="isInputDisabled(row)"
                      :value="resolveInputValue(row)"
                      @input="handleTextInput(row, $event)"
                    />
                  </template>
                </div>

                <div
                  class="text-base-content/60 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span
                    >Default: {{ formatDefaultValue(row.defaultValue) }}</span
                  >
                  <span
                    v-if="validationErrors[row.id]"
                    class="text-error flex items-center gap-1"
                  >
                    <ExclamationCircleIcon class="size-4" />
                    <span>{{ validationErrors[row.id] }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>
