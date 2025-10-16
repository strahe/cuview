<script setup lang="ts">
import { computed, ref } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";
import {
  ArrowUturnLeftIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/outline";
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

const handleBooleanInput = (row: ConfigFieldRow, value: boolean) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  emitUpdate(row, value);
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

const isRowDisabled = (row: ConfigFieldRow) =>
  !row.isOverride || !row.isEditable || props.isDefaultLayer;

const displayValue = (row: ConfigFieldRow) => {
  if (row.isOverride) {
    return row.overrideValue ?? row.defaultValue ?? "";
  }
  return row.effectiveValue ?? row.defaultValue ?? "";
};

const formatBadgeValue = (value: unknown) => {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
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
  return value;
};
</script>

<template>
  <!-- eslint-disable vue/v-on-event-hyphenation -->
  <SectionCard
    title="Layer Editor"
    tooltip="Review field-level defaults and enable overrides to customize this configuration layer."
    class="h-full"
  >
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

    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <div
            class="text-base-content/60 text-sm font-semibold tracking-wide uppercase"
          >
            Active Layer
          </div>
          <div class="text-base-content text-xl font-bold">
            {{ headerLabel }}
          </div>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <div
            v-if="dirty"
            class="badge badge-warning badge-outline border-warning text-warning uppercase"
          >
            Unsaved changes
          </div>
          <div
            v-else-if="selectedLayer"
            class="badge badge-success badge-outline border-success text-success uppercase"
          >
            Synced
          </div>
        </div>
      </div>

      <div
        v-if="isDefaultLayer"
        class="bg-base-200 text-base-content/80 flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
      >
        <InformationCircleIcon class="size-5 shrink-0" />
        The default layer is read-only. Select another layer or create a new one
        to customize configuration overrides.
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
        class="border-base-200/70 rounded-xl border"
      >
        <div
          class="bg-base-200/60 text-base-content/80 flex items-center justify-between rounded-t-xl px-4 py-2 text-sm font-semibold tracking-wide uppercase"
        >
          <span>{{ section.label }}</span>
          <span>{{ section.rows.length }} fields</span>
        </div>

        <div class="divide-base-200 divide-y">
          <div
            v-for="row in section.rows"
            :key="row.id"
            class="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px]"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-base-content font-medium">{{
                  row.label
                }}</span>
                <span
                  class="badge badge-outline badge-xs whitespace-nowrap uppercase"
                >
                  {{ row.type }}
                </span>
              </div>
              <p v-if="row.description" class="text-base-content/70 text-xs">
                {{ row.description }}
              </p>
              <div class="text-base-content/60 flex flex-wrap gap-2 text-xs">
                <span class="badge badge-outline badge-xs">
                  Default: {{ formatBadgeValue(row.defaultValue) }}
                </span>
                <span class="badge badge-outline badge-xs">
                  Effective: {{ formatBadgeValue(row.effectiveValue) }}
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <template v-if="row.type === 'boolean'">
                <!-- eslint-disable-next-line vue/v-on-event-hyphenation -->
                <SwitchRoot
                  :model-value="resolveBooleanValue(row)"
                  :disabled="isRowDisabled(row)"
                  class="focus-visible:ring-primary/70 data-[state=checked]:bg-primary/90 bg-base-200 relative inline-flex h-7 w-12 items-center rounded-full transition"
                  @update:modelValue="
                    (value: boolean) => handleBooleanInput(row, value)
                  "
                >
                  <SwitchThumb
                    class="bg-base-100 inline-block size-5 translate-x-1 rounded-full shadow transition-transform data-[state=checked]:translate-x-5"
                  />
                </SwitchRoot>
              </template>

              <template v-else-if="row.type === 'array'">
                <textarea
                  :disabled="isRowDisabled(row)"
                  :value="formatArrayDisplay(resolveInputValue(row))"
                  class="textarea textarea-bordered textarea-sm h-24 w-full"
                  placeholder='Example: ["value-1","value-2"]'
                  @change="handleTextInput(row, $event)"
                />
              </template>

              <template v-else-if="row.options && row.options.length">
                <select
                  :disabled="isRowDisabled(row)"
                  :value="String(resolveInputValue(row))"
                  class="select select-bordered select-sm w-full"
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

              <template v-else>
                <input
                  :disabled="isRowDisabled(row)"
                  :type="
                    row.type === 'number' || row.type === 'integer'
                      ? 'number'
                      : 'text'
                  "
                  :value="resolveInputValue(row)"
                  class="input input-bordered input-sm w-full"
                  @change="handleTextInput(row, $event)"
                />
              </template>

              <p
                v-if="validationErrors[row.id]"
                class="text-error text-xs font-medium"
              >
                {{ validationErrors[row.id] }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-2 md:justify-end">
              <div class="flex items-center gap-2">
                <!-- eslint-disable-next-line vue/v-on-event-hyphenation -->
                <SwitchRoot
                  :model-value="row.isOverride"
                  :disabled="isDefaultLayer || !row.isEditable"
                  class="focus-visible:ring-primary/70 data-[state=checked]:bg-primary/80 bg-base-200 relative inline-flex h-6 w-10 items-center rounded-full transition"
                  @update:modelValue="
                    (value: boolean) => emitToggle(row, value)
                  "
                >
                  <SwitchThumb
                    class="bg-base-100 inline-block size-4 translate-x-1 rounded-full shadow transition-transform data-[state=checked]:translate-x-4"
                  />
                </SwitchRoot>
                <span class="text-base-content/70 text-xs"> Override </span>
              </div>

              <button
                class="btn btn-ghost btn-xs"
                :disabled="!row.isOverride || props.isDefaultLayer"
                @click="handleResetRow(row)"
              >
                <ShieldCheckIcon class="size-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>
