<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  ArrowUturnLeftIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import { ChevronDownIcon } from "@heroicons/vue/24/solid";
import SectionCard from "@/components/ui/SectionCard.vue";
import { FormFieldWrapper, FormLayout } from "@/components/ui/form";
import { deepClone } from "@/utils/object";
import type {
  ConfigArrayItemProperty,
  ConfigFieldRow,
  ConfigFieldType,
} from "@/types/config";

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

const normalizeObjectInput = (value: string) => {
  if (!value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && typeof parsed === "object" ? parsed : null;
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

const resolveArrayValue = (row: ConfigFieldRow): unknown[] => {
  const value = row.isOverride
    ? (row.overrideValue ?? row.defaultValue)
    : (row.effectiveValue ?? row.defaultValue);
  return Array.isArray(value) ? value : [];
};

const deriveDefaultForType = (
  type: ConfigFieldRow["arrayItemType"] | ConfigFieldType,
  options?:
    | ConfigFieldRow["arrayItemOptions"]
    | ConfigArrayItemProperty["arrayItemOptions"],
) => {
  if (options && options.length) {
    return deepClone(options[0]!.value);
  }

  switch (type) {
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "object":
      return {};
    case "string":
      return "";
    default:
      return null;
  }
};

const buildTemplateForArrayMeta = (
  itemType:
    | ConfigFieldRow["arrayItemType"]
    | ConfigArrayItemProperty["arrayItemType"],
  itemOptions?:
    | ConfigFieldRow["arrayItemOptions"]
    | ConfigArrayItemProperty["arrayItemOptions"],
  itemProperties?: ConfigArrayItemProperty[],
) => {
  if (itemType === "object" && itemProperties?.length) {
    const template: Record<string, unknown> = {};
    itemProperties.forEach((property) => {
      if (property.defaultValue !== undefined) {
        template[property.key] = deepClone(property.defaultValue);
      } else if (property.options?.length) {
        template[property.key] = deepClone(property.options[0]!.value);
      } else {
        template[property.key] = deriveDefaultForType(
          property.type,
          property.options,
        );
      }
    });
    return template;
  }

  return deriveDefaultForType(itemType, itemOptions);
};

const buildArrayItemTemplate = (row: ConfigFieldRow) =>
  buildTemplateForArrayMeta(
    row.arrayItemType,
    row.arrayItemOptions,
    row.arrayItemProperties,
  );

const buildPropertyArrayItemTemplate = (property: ConfigArrayItemProperty) =>
  buildTemplateForArrayMeta(
    property.arrayItemType,
    property.arrayItemOptions,
    property.arrayItemProperties,
  );

const updateArrayRow = (row: ConfigFieldRow, next: unknown[]) => {
  emitUpdate(row, next);
  clearRowError(row.id);
};

const updateObjectArrayPropertyValue = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
  value: unknown,
) => {
  const next = deepClone(resolveArrayValue(row)) as Record<string, unknown>[];
  const target = { ...(next[index] ?? {}) };
  target[property.key] = value;
  next[index] = target;
  updateArrayRow(row, next);
};

const handleArrayItemAdd = (row: ConfigFieldRow) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  const current = resolveArrayValue(row);
  const next = deepClone(current) as unknown[];
  next.push(buildArrayItemTemplate(row));
  updateArrayRow(row, next);
};

const handleArrayItemRemove = (row: ConfigFieldRow, index: number) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  const current = resolveArrayValue(row);
  const minItems = row.minItems ?? 0;
  if (current.length <= minItems) {
    setRowError(
      row.id,
      minItems > 0
        ? `At least ${minItems} item${minItems === 1 ? "" : "s"} required.`
        : "Cannot remove the final item.",
    );
    return;
  }

  const next = deepClone(current) as unknown[];
  next.splice(index, 1);
  updateArrayRow(row, next);
};

const parseValueForType = (
  type: ConfigFieldRow["arrayItemType"],
  raw: string,
  options?: ConfigFieldRow["arrayItemOptions"],
) => {
  if (options && options.length) {
    const match = options.find((option) => String(option.value) === raw);
    if (!match) {
      return {
        valid: false,
        message: "Select a valid option.",
      };
    }
    return { valid: true, value: match.value };
  }

  switch (type) {
    case "integer": {
      const parsed = normalizeNumber(raw, true);
      if (parsed === null) {
        return { valid: false, message: "Enter a valid integer value." };
      }
      return { valid: true, value: parsed };
    }
    case "number": {
      const parsed = normalizeNumber(raw, false);
      if (parsed === null) {
        return { valid: false, message: "Enter a valid numeric value." };
      }
      return { valid: true, value: parsed };
    }
    case "boolean": {
      if (raw === "true" || raw === "false") {
        return { valid: true, value: raw === "true" };
      }
      return { valid: false, message: "Select true or false." };
    }
    case "array": {
      const parsed = normalizeArrayInput(raw);
      if (!Array.isArray(parsed)) {
        return {
          valid: false,
          message: 'Provide a valid JSON array. Example: ["value"]',
        };
      }
      return { valid: true, value: parsed };
    }
    case "object": {
      const parsed = normalizeObjectInput(raw);
      if (!parsed || Array.isArray(parsed)) {
        return { valid: false, message: "Provide a valid JSON object." };
      }
      return { valid: true, value: parsed };
    }
    default: {
      return { valid: true, value: raw };
    }
  }
};

const handlePrimitiveArrayChange = (
  row: ConfigFieldRow,
  index: number,
  raw: string,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);
  const result = parseValueForType(
    row.arrayItemType,
    raw,
    row.arrayItemOptions,
  );
  if (!result.valid) {
    setRowError(row.id, result.message ?? "Invalid value.");
    return;
  }
  const next = deepClone(resolveArrayValue(row)) as unknown[];
  next[index] = result.value;
  updateArrayRow(row, next);
};

const handleObjectArrayPropertyChange = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
  raw: string,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);

  const result = parseValueForType(property.type, raw, property.options);
  if (!result.valid) {
    setRowError(row.id, result.message ?? "Invalid value.");
    return;
  }

  updateObjectArrayPropertyValue(row, index, property, result.value);
};

const handleObjectArrayJsonChange = (
  row: ConfigFieldRow,
  index: number,
  raw: string,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);
  const parsed = normalizeObjectInput(raw);

  if (!parsed || Array.isArray(parsed)) {
    setRowError(row.id, "Provide a valid JSON object.");
    return;
  }

  const next = deepClone(resolveArrayValue(row)) as Record<string, unknown>[];
  next[index] = parsed;
  updateArrayRow(row, next);
};

const resolvePropertyArrayValue = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
): unknown[] => {
  const container = resolveArrayValue(row)[index];
  if (container && typeof container === "object" && !Array.isArray(container)) {
    const value = (container as Record<string, unknown>)[property.key];
    if (Array.isArray(value)) {
      return value as unknown[];
    }
  }
  return [];
};

const handlePropertyArrayItemAdd = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);
  const current = resolvePropertyArrayValue(row, index, property);
  const maxItems = property.maxItems;
  if (maxItems !== undefined && current.length >= maxItems) {
    setRowError(
      row.id,
      `Maximum of ${maxItems} item${maxItems === 1 ? "" : "s"} allowed.`,
    );
    return;
  }
  const next = deepClone(current) as unknown[];
  next.push(buildPropertyArrayItemTemplate(property));
  updateObjectArrayPropertyValue(row, index, property, next);
};

const handlePropertyArrayItemRemove = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
  itemIndex: number,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);
  const current = resolvePropertyArrayValue(row, index, property);
  const minItems = property.minItems ?? 0;
  if (current.length <= minItems) {
    setRowError(
      row.id,
      minItems > 0
        ? `At least ${minItems} item${minItems === 1 ? "" : "s"} required.`
        : "Cannot remove the final item.",
    );
    return;
  }
  const next = deepClone(current) as unknown[];
  next.splice(itemIndex, 1);
  updateObjectArrayPropertyValue(row, index, property, next);
};

const handlePropertyArrayPrimitiveChange = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
  itemIndex: number,
  raw: string,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);
  const result = parseValueForType(
    property.arrayItemType,
    raw,
    property.arrayItemOptions,
  );
  if (!result.valid) {
    setRowError(row.id, result.message ?? "Invalid value.");
    return;
  }
  const next = deepClone(
    resolvePropertyArrayValue(row, index, property),
  ) as unknown[];
  next[itemIndex] = result.value;
  updateObjectArrayPropertyValue(row, index, property, next);
};

const handlePropertyArrayObjectPropertyChange = (
  row: ConfigFieldRow,
  index: number,
  property: ConfigArrayItemProperty,
  itemIndex: number,
  childProperty: ConfigArrayItemProperty,
  raw: string,
) => {
  if (!row.isOverride || props.isDefaultLayer) return;
  clearRowError(row.id);
  const result = parseValueForType(
    childProperty.type,
    raw,
    childProperty.options,
  );
  if (!result.valid) {
    setRowError(row.id, result.message ?? "Invalid value.");
    return;
  }

  const next = deepClone(
    resolvePropertyArrayValue(row, index, property),
  ) as Record<string, unknown>[];
  const target = { ...(next[itemIndex] ?? {}) };
  target[childProperty.key] = result.value;
  next[itemIndex] = target;
  updateObjectArrayPropertyValue(row, index, property, next);
};

const resolveObjectPropertyValue = (
  item: unknown,
  property: ConfigArrayItemProperty,
) => {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    return (item as Record<string, unknown>)[property.key];
  }
  return undefined;
};

const formatComplexValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatPrimitiveArrayValue = (
  value: unknown,
  type: ConfigFieldRow["arrayItemType"],
) => {
  if (value === null || value === undefined) return "";
  if (type === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
};

const formatPropertyArrayPrimitiveValue = (
  value: unknown,
  property: ConfigArrayItemProperty,
) => formatPrimitiveArrayValue(value, property.arrayItemType);

const formatPropertyInputValue = (
  item: unknown,
  property: ConfigArrayItemProperty,
) => {
  const value = resolveObjectPropertyValue(item, property);
  if (property.type === "array" || property.type === "object") {
    return formatComplexValue(value);
  }
  if (property.type === "boolean") {
    return value ? "true" : "false";
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const formatArrayItemLabel = (row: ConfigFieldRow, index: number) =>
  row.arrayItemLabel || `Item ${index + 1}`;

const formatPropertyArrayItemLabel = (
  property: ConfigArrayItemProperty,
  index: number,
) => property.arrayItemLabel || `Item ${index + 1}`;

const normalizeOptionValue = (value: unknown) => String(value ?? "");

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

const isSectionExpanded = (key: string) => expandedSections.value[key] ?? false;

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

    <div class="flex h-full flex-col gap-6">
      <div
        class="border-base-200/80 bg-base-100/90 shadow-base-300/20 rounded-3xl border px-5 py-4 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2">
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
          <p v-if="selectedLayer" class="text-base-content/60 text-xs">
            {{
              isDefaultLayer
                ? "Viewing the base configuration values."
                : "Enable overrides to customize values for this layer."
            }}
          </p>
        </div>
      </div>

      <div
        v-if="error"
        class="text-error border-error/40 bg-error/10 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm"
      >
        <ExclamationCircleIcon class="size-5 shrink-0" />
        {{ error.message }}
      </div>

      <div class="relative min-h-0 flex-1">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="loading loading-spinner loading-lg text-primary"></div>
        </div>

        <div
          v-else-if="!sections.length && !error"
          class="border-base-300/60 bg-base-200/50 text-base-content/70 flex h-full items-center justify-center rounded-3xl border border-dashed px-4 py-10 text-center text-sm"
        >
          Select or create a configuration layer from the left panel to load
          editable fields here.
        </div>

        <div
          v-else
          class="border-base-200/80 bg-base-100 shadow-base-300/30 h-full rounded-[28px] border shadow-lg"
        >
          <div class="h-full overflow-y-auto px-5 py-6 pr-6">
            <FormLayout>
              <div
                v-for="section in sections"
                :key="section.key"
                class="group border-base-300/80 bg-base-300/50 shadow-base-300/80 ring-base-100/40 hover:border-primary/70 hover:ring-primary/50 relative rounded-3xl border shadow-[0_20px_40px_-25px_var(--tw-shadow-color)] ring-1 transition-all duration-200 ring-inset"
              >
                <div
                  aria-hidden="true"
                  class="from-primary/25 via-primary/15 pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent opacity-60 transition-opacity duration-200 group-hover:opacity-100"
                ></div>
                <button
                  type="button"
                  class="bg-base-100/80 group-hover:bg-base-100/95 flex w-full items-center justify-between gap-3 rounded-3xl px-6 py-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors duration-200"
                  @click="toggleSection(section.key)"
                >
                  <div class="flex items-center gap-3">
                    <ChevronDownIcon
                      class="text-base-content/70 size-5 transition-transform"
                      :class="[
                        isSectionExpanded(section.key)
                          ? 'rotate-0'
                          : '-rotate-90 opacity-60',
                      ]"
                    />
                    <div class="flex flex-col">
                      <span
                        class="text-base-content text-sm font-semibold tracking-wide uppercase"
                      >
                        {{ section.label }}
                      </span>
                      <span class="text-base-content/60 text-xs">
                        {{ section.rows.length }} field{{
                          section.rows.length === 1 ? "" : "s"
                        }}
                      </span>
                    </div>
                  </div>
                  <span
                    class="badge badge-outline badge-xs border-base-300/70 bg-base-100 text-base-content/60 text-[0.65rem] tracking-wide uppercase"
                  >
                    {{ isSectionExpanded(section.key) ? "Collapse" : "Expand" }}
                  </span>
                </button>

                <div
                  v-if="isSectionExpanded(section.key)"
                  class="border-base-200/60 bg-base-200/50 border-t px-6 py-6 backdrop-blur"
                >
                  <div class="flex flex-col gap-4">
                    <div
                      v-for="row in section.rows"
                      :key="row.id"
                      :class="[
                        'group border-base-300/60 bg-base-100/90 shadow-base-300/40 ring-base-100/30 hover:border-primary/50 hover:ring-primary/40 relative rounded-2xl border p-5 shadow-lg ring-1 transition-all duration-200 ring-inset',
                        row.isOverride && !isDefaultLayer
                          ? 'border-primary/70 bg-primary/10 shadow-primary/40 ring-primary/40'
                          : '',
                      ]"
                    >
                      <div
                        aria-hidden="true"
                        class="pointer-events-none absolute inset-x-4 top-0 h-[3px] rounded-full bg-gradient-to-r transition-all duration-300"
                        :class="
                          row.isOverride && !isDefaultLayer
                            ? 'from-primary/60 via-primary/40 to-primary/10 opacity-100'
                            : 'from-base-300/40 via-base-200/40 to-transparent opacity-70'
                        "
                      ></div>
                      <div
                        class="flex flex-wrap items-start justify-between gap-4"
                      >
                        <div class="flex flex-col gap-2">
                          <div
                            class="text-base-content flex flex-wrap items-center gap-2 text-sm font-semibold"
                          >
                            <span>{{ row.label }}</span>
                            <span
                              class="badge badge-outline badge-xs text-base-content/70 tracking-wide uppercase"
                            >
                              {{ row.type }}
                              <span
                                v-if="row.type === 'array' && row.arrayItemType"
                                class="text-base-content/60 ml-1 lowercase"
                              >
                                ({{ row.arrayItemType }})
                              </span>
                            </span>
                            <div
                              v-if="row.helpText || row.description"
                              class="relative"
                            >
                              <button
                                type="button"
                                :aria-describedby="`${row.id}-tooltip`"
                                class="peer border-base-300/70 bg-base-200/70 text-base-content/60 hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/40 flex size-7 items-center justify-center rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring"
                              >
                                <InformationCircleIcon class="size-4" />
                              </button>
                              <div
                                :id="`${row.id}-tooltip`"
                                class="border-base-300/70 bg-base-100/95 text-base-content shadow-base-300/60 ring-base-100/30 pointer-events-none absolute top-[calc(100%+0.5rem)] left-1/2 z-30 w-64 -translate-x-1/2 translate-y-1 rounded-xl border p-3 text-xs leading-relaxed opacity-0 shadow-2xl ring-1 backdrop-blur transition-all duration-200 peer-hover:translate-y-2 peer-hover:opacity-100 peer-focus-visible:translate-y-2 peer-focus-visible:opacity-100"
                                role="tooltip"
                              >
                                <div class="flex items-start gap-2">
                                  <InformationCircleIcon
                                    class="text-primary/70 size-4"
                                  />
                                  <span>{{
                                    row.helpText ?? row.description
                                  }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p
                            v-if="row.description"
                            class="text-base-content/60 text-xs"
                          >
                            {{ row.description }}
                          </p>
                        </div>

                        <div class="flex items-center gap-3">
                          <label
                            class="text-base-content/70 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                          >
                            <input
                              :checked="row.isOverride"
                              :disabled="isDefaultLayer || !row.isEditable"
                              class="toggle toggle-sm toggle-primary"
                              type="checkbox"
                              @change="
                                (event) =>
                                  handleOverrideChange(
                                    row,
                                    (event.target as HTMLInputElement).checked,
                                  )
                              "
                            />
                            Override
                          </label>
                          <button
                            class="btn btn-ghost btn-xs text-primary transition-opacity duration-150"
                            type="button"
                            :disabled="!row.isOverride || isDefaultLayer"
                            :class="[
                              row.isOverride && !isDefaultLayer
                                ? 'opacity-100'
                                : 'pointer-events-none opacity-0',
                            ]"
                            @click="handleResetRow(row)"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div class="mt-4 space-y-4">
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
                            :value="String(resolveInputValue(row))"
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

                        <template
                          v-else-if="
                            row.type === 'array' &&
                            row.arrayItemType === 'object' &&
                            row.arrayItemProperties &&
                            row.arrayItemProperties.length
                          "
                        >
                          <div class="space-y-4">
                            <div
                              v-for="(item, index) in resolveArrayValue(row)"
                              :key="`${row.id}-item-${index}`"
                              class="border-base-200/70 bg-base-100/90 rounded-2xl border p-4 shadow-inner"
                            >
                              <div
                                class="flex flex-wrap items-center justify-between gap-3"
                              >
                                <span
                                  class="text-base-content/80 text-sm font-semibold"
                                >
                                  {{ formatArrayItemLabel(row, index) }}
                                </span>
                                <button
                                  type="button"
                                  class="btn btn-ghost btn-xs text-error"
                                  :disabled="isInputDisabled(row)"
                                  @click="handleArrayItemRemove(row, index)"
                                >
                                  <TrashIcon class="size-4" />
                                  Remove
                                </button>
                              </div>

                              <div class="mt-4 grid gap-4 md:grid-cols-2">
                                <FormFieldWrapper
                                  v-for="property in row.arrayItemProperties"
                                  :key="property.key"
                                  :label="property.label"
                                  :description="property.description"
                                >
                                  <template
                                    v-if="
                                      property.options &&
                                      property.options.length
                                    "
                                  >
                                    <select
                                      class="select select-bordered select-xs w-full"
                                      :disabled="isInputDisabled(row)"
                                      :value="
                                        normalizeOptionValue(
                                          resolveObjectPropertyValue(
                                            item,
                                            property,
                                          ),
                                        )
                                      "
                                      @change="
                                        (event) =>
                                          handleObjectArrayPropertyChange(
                                            row,
                                            index,
                                            property,
                                            (event.target as HTMLSelectElement)
                                              .value,
                                          )
                                      "
                                    >
                                      <option
                                        v-for="option in property.options"
                                        :key="String(option.value)"
                                        :value="String(option.value)"
                                      >
                                        {{ option.label }}
                                      </option>
                                    </select>
                                  </template>
                                  <template
                                    v-else-if="property.type === 'boolean'"
                                  >
                                    <select
                                      class="select select-bordered select-xs w-full"
                                      :disabled="isInputDisabled(row)"
                                      :value="
                                        formatPropertyInputValue(item, property)
                                      "
                                      @change="
                                        (event) =>
                                          handleObjectArrayPropertyChange(
                                            row,
                                            index,
                                            property,
                                            (event.target as HTMLSelectElement)
                                              .value,
                                          )
                                      "
                                    >
                                      <option value="true">true</option>
                                      <option value="false">false</option>
                                    </select>
                                  </template>
                                  <template
                                    v-else-if="property.type === 'array'"
                                  >
                                    <div class="space-y-3">
                                      <div
                                        v-for="(
                                          propertyItem, propertyIndex
                                        ) in resolvePropertyArrayValue(
                                          row,
                                          index,
                                          property,
                                        )"
                                        :key="`${row.id}-${property.key}-${propertyIndex}`"
                                        class="border-base-200/70 bg-base-100/90 rounded-xl border p-3 shadow-inner"
                                      >
                                        <div
                                          class="text-base-content/60 flex items-center justify-between gap-3 text-[0.7rem] font-semibold tracking-wide uppercase"
                                        >
                                          <span>
                                            {{
                                              formatPropertyArrayItemLabel(
                                                property,
                                                propertyIndex,
                                              )
                                            }}
                                          </span>
                                          <button
                                            type="button"
                                            class="btn btn-ghost btn-xs text-error"
                                            :disabled="isInputDisabled(row)"
                                            @click="
                                              handlePropertyArrayItemRemove(
                                                row,
                                                index,
                                                property,
                                                propertyIndex,
                                              )
                                            "
                                          >
                                            <TrashIcon class="size-4" />
                                            Remove
                                          </button>
                                        </div>

                                        <div
                                          v-if="
                                            property.arrayItemType ===
                                              'object' &&
                                            property.arrayItemProperties &&
                                            property.arrayItemProperties.length
                                          "
                                          class="mt-3 grid gap-3 md:grid-cols-2"
                                        >
                                          <FormFieldWrapper
                                            v-for="child in property.arrayItemProperties"
                                            :key="child.key"
                                            :label="child.label"
                                            :description="child.description"
                                          >
                                            <template
                                              v-if="
                                                child.options &&
                                                child.options.length
                                              "
                                            >
                                              <select
                                                class="select select-bordered select-xs w-full"
                                                :disabled="isInputDisabled(row)"
                                                :value="
                                                  normalizeOptionValue(
                                                    resolveObjectPropertyValue(
                                                      propertyItem,
                                                      child,
                                                    ),
                                                  )
                                                "
                                                @change="
                                                  (event) =>
                                                    handlePropertyArrayObjectPropertyChange(
                                                      row,
                                                      index,
                                                      property,
                                                      propertyIndex,
                                                      child,
                                                      (
                                                        event.target as HTMLSelectElement
                                                      ).value,
                                                    )
                                                "
                                              >
                                                <option
                                                  v-for="option in child.options"
                                                  :key="String(option.value)"
                                                  :value="String(option.value)"
                                                >
                                                  {{ option.label }}
                                                </option>
                                              </select>
                                            </template>
                                            <template
                                              v-else-if="
                                                child.type === 'boolean'
                                              "
                                            >
                                              <select
                                                class="select select-bordered select-xs w-full"
                                                :disabled="isInputDisabled(row)"
                                                :value="
                                                  formatPropertyInputValue(
                                                    propertyItem,
                                                    child,
                                                  )
                                                "
                                                @change="
                                                  (event) =>
                                                    handlePropertyArrayObjectPropertyChange(
                                                      row,
                                                      index,
                                                      property,
                                                      propertyIndex,
                                                      child,
                                                      (
                                                        event.target as HTMLSelectElement
                                                      ).value,
                                                    )
                                                "
                                              >
                                                <option value="true">
                                                  true
                                                </option>
                                                <option value="false">
                                                  false
                                                </option>
                                              </select>
                                            </template>
                                            <template
                                              v-else-if="
                                                child.type === 'array' ||
                                                child.type === 'object'
                                              "
                                            >
                                              <textarea
                                                class="textarea textarea-bordered textarea-xs min-h-20 w-full"
                                                :disabled="isInputDisabled(row)"
                                                :value="
                                                  formatPropertyInputValue(
                                                    propertyItem,
                                                    child,
                                                  )
                                                "
                                                placeholder='Use JSON format e.g. {"key":"value"}'
                                                @change="
                                                  (event) =>
                                                    handlePropertyArrayObjectPropertyChange(
                                                      row,
                                                      index,
                                                      property,
                                                      propertyIndex,
                                                      child,
                                                      (
                                                        event.target as HTMLTextAreaElement
                                                      ).value,
                                                    )
                                                "
                                              ></textarea>
                                            </template>
                                            <template v-else>
                                              <input
                                                :type="
                                                  child.type === 'number' ||
                                                  child.type === 'integer'
                                                    ? 'number'
                                                    : 'text'
                                                "
                                                class="input input-bordered input-xs w-full"
                                                :step="
                                                  child.type === 'integer'
                                                    ? 1
                                                    : 'any'
                                                "
                                                :disabled="isInputDisabled(row)"
                                                :value="
                                                  formatPropertyInputValue(
                                                    propertyItem,
                                                    child,
                                                  )
                                                "
                                                @input="
                                                  (event) =>
                                                    handlePropertyArrayObjectPropertyChange(
                                                      row,
                                                      index,
                                                      property,
                                                      propertyIndex,
                                                      child,
                                                      (
                                                        event.target as HTMLInputElement
                                                      ).value,
                                                    )
                                                "
                                              />
                                            </template>
                                          </FormFieldWrapper>
                                        </div>
                                        <div
                                          v-else
                                          class="mt-3 flex flex-wrap items-center gap-3"
                                        >
                                          <template
                                            v-if="
                                              property.arrayItemOptions &&
                                              property.arrayItemOptions.length
                                            "
                                          >
                                            <select
                                              class="select select-bordered select-xs min-w-[140px]"
                                              :disabled="isInputDisabled(row)"
                                              :value="
                                                String(propertyItem ?? '')
                                              "
                                              @change="
                                                (event) =>
                                                  handlePropertyArrayPrimitiveChange(
                                                    row,
                                                    index,
                                                    property,
                                                    propertyIndex,
                                                    (
                                                      event.target as HTMLSelectElement
                                                    ).value,
                                                  )
                                              "
                                            >
                                              <option
                                                v-for="option in property.arrayItemOptions"
                                                :key="String(option.value)"
                                                :value="String(option.value)"
                                              >
                                                {{ option.label }}
                                              </option>
                                            </select>
                                          </template>
                                          <template
                                            v-else-if="
                                              property.arrayItemType ===
                                              'boolean'
                                            "
                                          >
                                            <select
                                              class="select select-bordered select-xs min-w-[140px]"
                                              :disabled="isInputDisabled(row)"
                                              :value="
                                                formatPropertyArrayPrimitiveValue(
                                                  propertyItem,
                                                  property,
                                                )
                                              "
                                              @change="
                                                (event) =>
                                                  handlePropertyArrayPrimitiveChange(
                                                    row,
                                                    index,
                                                    property,
                                                    propertyIndex,
                                                    (
                                                      event.target as HTMLSelectElement
                                                    ).value,
                                                  )
                                              "
                                            >
                                              <option value="true">true</option>
                                              <option value="false">
                                                false
                                              </option>
                                            </select>
                                          </template>
                                          <template v-else>
                                            <input
                                              :type="
                                                property.arrayItemType ===
                                                  'number' ||
                                                property.arrayItemType ===
                                                  'integer'
                                                  ? 'number'
                                                  : 'text'
                                              "
                                              class="input input-bordered input-xs min-w-[140px]"
                                              :step="
                                                property.arrayItemType ===
                                                'integer'
                                                  ? 1
                                                  : 'any'
                                              "
                                              :disabled="isInputDisabled(row)"
                                              :value="
                                                formatPropertyArrayPrimitiveValue(
                                                  propertyItem,
                                                  property,
                                                )
                                              "
                                              @change="
                                                (event) =>
                                                  handlePropertyArrayPrimitiveChange(
                                                    row,
                                                    index,
                                                    property,
                                                    propertyIndex,
                                                    (
                                                      event.target as HTMLInputElement
                                                    ).value,
                                                  )
                                              "
                                            />
                                          </template>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        class="btn btn-outline btn-xs"
                                        :disabled="isInputDisabled(row)"
                                        @click="
                                          handlePropertyArrayItemAdd(
                                            row,
                                            index,
                                            property,
                                          )
                                        "
                                      >
                                        <PlusIcon class="size-4" />
                                        Add
                                        {{ property.arrayItemLabel ?? "Item" }}
                                      </button>
                                    </div>
                                  </template>
                                  <template
                                    v-else-if="property.type === 'object'"
                                  >
                                    <textarea
                                      class="textarea textarea-bordered textarea-xs min-h-20 w-full"
                                      :disabled="isInputDisabled(row)"
                                      :value="
                                        formatPropertyInputValue(item, property)
                                      "
                                      placeholder='Use JSON format e.g. {"key":"value"}'
                                      @change="
                                        (event) =>
                                          handleObjectArrayPropertyChange(
                                            row,
                                            index,
                                            property,
                                            (
                                              event.target as HTMLTextAreaElement
                                            ).value,
                                          )
                                      "
                                    ></textarea>
                                  </template>
                                  <template v-else>
                                    <input
                                      :type="
                                        property.type === 'number' ||
                                        property.type === 'integer'
                                          ? 'number'
                                          : 'text'
                                      "
                                      class="input input-bordered input-xs w-full"
                                      :step="
                                        property.type === 'integer' ? 1 : 'any'
                                      "
                                      :disabled="isInputDisabled(row)"
                                      :value="
                                        formatPropertyInputValue(item, property)
                                      "
                                      @input="
                                        (event) =>
                                          handleObjectArrayPropertyChange(
                                            row,
                                            index,
                                            property,
                                            (event.target as HTMLInputElement)
                                              .value,
                                          )
                                      "
                                    />
                                  </template>
                                </FormFieldWrapper>
                              </div>
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm"
                              :disabled="isInputDisabled(row)"
                              @click="handleArrayItemAdd(row)"
                            >
                              <PlusIcon class="size-4" />
                              Add
                              {{ row.arrayItemLabel ?? "Item" }}
                            </button>
                          </div>
                        </template>

                        <template
                          v-else-if="
                            row.type === 'array' &&
                            row.arrayItemType === 'object'
                          "
                        >
                          <div class="space-y-4">
                            <div
                              v-for="(item, index) in resolveArrayValue(row)"
                              :key="`${row.id}-raw-${index}`"
                              class="border-base-200/70 bg-base-100/90 rounded-2xl border p-4 shadow-inner"
                            >
                              <div
                                class="flex items-center justify-between gap-3"
                              >
                                <span
                                  class="text-base-content/80 text-sm font-semibold"
                                >
                                  {{ formatArrayItemLabel(row, index) }}
                                </span>
                                <button
                                  type="button"
                                  class="btn btn-ghost btn-xs text-error"
                                  :disabled="isInputDisabled(row)"
                                  @click="handleArrayItemRemove(row, index)"
                                >
                                  <TrashIcon class="size-4" />
                                  Remove
                                </button>
                              </div>
                              <textarea
                                class="textarea textarea-bordered textarea-sm mt-3 w-full"
                                :disabled="isInputDisabled(row)"
                                :value="formatComplexValue(item)"
                                placeholder='Provide a JSON object e.g. {"key":"value"}'
                                @change="
                                  (event) =>
                                    handleObjectArrayJsonChange(
                                      row,
                                      index,
                                      (event.target as HTMLTextAreaElement)
                                        .value,
                                    )
                                "
                              ></textarea>
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm"
                              :disabled="isInputDisabled(row)"
                              @click="handleArrayItemAdd(row)"
                            >
                              <PlusIcon class="size-4" />
                              Add
                              {{ row.arrayItemLabel ?? "Item" }}
                            </button>
                          </div>
                        </template>

                        <template v-else-if="row.type === 'array'">
                          <div class="space-y-3">
                            <div
                              v-for="(item, index) in resolveArrayValue(row)"
                              :key="`${row.id}-primitive-${index}`"
                              class="border-base-200/70 bg-base-100/90 flex flex-wrap items-center gap-3 rounded-2xl border px-3 py-2"
                            >
                              <template
                                v-if="
                                  row.arrayItemOptions &&
                                  row.arrayItemOptions.length
                                "
                              >
                                <select
                                  class="select select-bordered select-xs min-w-[160px] flex-1"
                                  :disabled="isInputDisabled(row)"
                                  :value="String(item)"
                                  @change="
                                    (event) =>
                                      handlePrimitiveArrayChange(
                                        row,
                                        index,
                                        (event.target as HTMLSelectElement)
                                          .value,
                                      )
                                  "
                                >
                                  <option
                                    v-for="option in row.arrayItemOptions"
                                    :key="String(option.value)"
                                    :value="String(option.value)"
                                  >
                                    {{ option.label }}
                                  </option>
                                </select>
                              </template>
                              <template
                                v-else-if="row.arrayItemType === 'boolean'"
                              >
                                <select
                                  class="select select-bordered select-xs min-w-[160px]"
                                  :disabled="isInputDisabled(row)"
                                  :value="
                                    formatPrimitiveArrayValue(
                                      item,
                                      row.arrayItemType,
                                    )
                                  "
                                  @change="
                                    (event) =>
                                      handlePrimitiveArrayChange(
                                        row,
                                        index,
                                        (event.target as HTMLSelectElement)
                                          .value,
                                      )
                                  "
                                >
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              </template>
                              <template v-else>
                                <input
                                  :type="
                                    row.arrayItemType === 'number' ||
                                    row.arrayItemType === 'integer'
                                      ? 'number'
                                      : 'text'
                                  "
                                  class="input input-bordered input-xs flex-1"
                                  :step="
                                    row.arrayItemType === 'integer' ? 1 : 'any'
                                  "
                                  :disabled="isInputDisabled(row)"
                                  :value="
                                    formatPrimitiveArrayValue(
                                      item,
                                      row.arrayItemType,
                                    )
                                  "
                                  @change="
                                    (event) =>
                                      handlePrimitiveArrayChange(
                                        row,
                                        index,
                                        (event.target as HTMLInputElement)
                                          .value,
                                      )
                                  "
                                />
                              </template>

                              <button
                                type="button"
                                class="btn btn-ghost btn-xs text-error"
                                :disabled="isInputDisabled(row)"
                                @click="handleArrayItemRemove(row, index)"
                              >
                                <TrashIcon class="size-4" />
                                Remove
                              </button>
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm"
                              :disabled="isInputDisabled(row)"
                              @click="handleArrayItemAdd(row)"
                            >
                              <PlusIcon class="size-4" />
                              Add
                              {{ row.arrayItemLabel ?? "Item" }}
                            </button>
                          </div>
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
                        class="text-base-content/60 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <span>
                          Default: {{ formatDefaultValue(row.defaultValue) }}
                        </span>
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
            </FormLayout>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>
