<script setup lang="ts" generic="TData extends Record<string, any> = any">
import { computed, ref, watch } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  FlexRender,
  type ColumnDef,
  type Row,
  type Cell,
  type SortingState,
  type GroupingState,
  type ExpandedState,
  type ColumnFiltersState,
} from "@tanstack/vue-table";
import { debouncedRef, useLocalStorage } from "@vueuse/core";
import { ArrowPathIcon } from "@heroicons/vue/24/outline";
import DataSection from "@/components/ui/DataSection.vue";

interface GroupingOption {
  value: string;
  label: string;
}

interface DataTableProps<TData = Record<string, unknown>> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  error?: Error | null;
  enableSearch?: boolean;
  enableGrouping?: boolean;
  enableExport?: boolean;
  enableRefresh?: boolean;
  enableStats?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  tableSize?: "sm" | "md" | "lg";
  groupingOptions?: GroupingOption[];
  persistStateKey?: string;
}

interface DataTableEmits<TData = Record<string, unknown>> {
  "row-click": [row: Row<TData>];
  "cell-right-click": [cell: Cell<TData, unknown>, event: MouseEvent];
  refresh: [];
}

const props = withDefaults(defineProps<DataTableProps<TData>>(), {
  loading: false,
  error: null,
  enableSearch: true,
  enableGrouping: false,
  enableExport: false,
  enableRefresh: false,
  enableStats: false,
  searchPlaceholder: "Search...",
  emptyMessage: "No data found",
  tableSize: "md",
  groupingOptions: () => [],
  persistStateKey: undefined,
});

const emit = defineEmits<DataTableEmits<TData>>();

// Reactive state
const searchQuery = debouncedRef("", 300);
const selectedGroupBy = ref("");
const sorting = props.persistStateKey
  ? useLocalStorage<SortingState>(`${props.persistStateKey}-sorting`, [])
  : ref<SortingState>([]);
const grouping = ref<GroupingState>([]);
const expanded = ref<ExpandedState>({});
const columnFilters = ref<ColumnFiltersState>([]);

// Computed properties
const hasData = computed(
  () => Array.isArray(props.data) && props.data.length > 0,
);

const tableClasses = computed(() => ({
  "table-sm": props.tableSize === "sm",
  "table-lg": props.tableSize === "lg",
}));

const filteredData = computed(() => {
  let result = props.data;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((item) =>
      Object.values(item).some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }

  return result;
});

const groupCount = computed(() => {
  if (!selectedGroupBy.value) return 0;
  const groups = new Set(props.data.map((item) => item[selectedGroupBy.value]));
  return groups.size;
});

// Watch for grouping changes
watch(selectedGroupBy, (newValue) => {
  grouping.value = newValue ? [newValue] : [];
});

// TanStack Table instance
const table = useVueTable({
  get data() {
    return filteredData.value;
  },
  columns: props.columns,
  getRowId: (row: TData, index: number) =>
    (row as Record<string, unknown>).id?.toString() ||
    (row as Record<string, unknown>).ID?.toString() ||
    index.toString(),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  enableGrouping: props.enableGrouping,
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get grouping() {
      return grouping.value;
    },
    get expanded() {
      return expanded.value;
    },
  },
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === "function" ? updater(sorting.value) : updater;
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value =
      typeof updater === "function" ? updater(columnFilters.value) : updater;
  },
  onGroupingChange: (updater) => {
    grouping.value =
      typeof updater === "function" ? updater(grouping.value) : updater;
  },
  onExpandedChange: (updater) => {
    expanded.value =
      typeof updater === "function" ? updater(expanded.value) : updater;
  },
});

// Event handlers
const handleRowClick = (row: Row<TData>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  }
  emit("row-click", row);
};

const handleCellRightClick = (
  cell: Cell<TData, unknown>,
  event: MouseEvent,
) => {
  event.preventDefault();
  const value = String(cell.getValue() || "");
  if (value) {
    navigator.clipboard?.writeText(value);
  }
  emit("cell-right-click", cell, event);
};

const exportData = (format: "csv" | "json") => {
  const data = filteredData.value;

  if (format === "csv") {
    const headers = props.columns.map((col) =>
      typeof col.header === "string" ? col.header : String(col.id || ""),
    );
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        props.columns
          .map((col) => {
            const key =
              (col as unknown as Record<string, unknown>).accessorKey || col.id;
            return `"${String((row as Record<string, unknown>)[key as string] || "").replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  } else if (format === "json") {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :empty-message="emptyMessage || 'No data found'"
  >
    <!-- Search and Controls -->
    <div
      v-if="enableSearch || enableExport"
      class="mb-4 flex flex-wrap items-center justify-between gap-4"
    >
      <div class="flex items-center gap-4">
        <div v-if="enableSearch" class="form-control">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="input input-bordered input-sm w-64"
          />
        </div>
        <div
          v-if="enableGrouping && groupingOptions.length > 0"
          class="form-control"
        >
          <select
            v-model="selectedGroupBy"
            class="select select-bordered select-sm"
          >
            <option value="">No Grouping</option>
            <option
              v-for="option in groupingOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="enableRefresh"
          class="btn btn-sm btn-outline"
          @click="$emit('refresh')"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </button>
        <div v-if="enableExport" class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-sm btn-outline">
            Export
          </div>
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li><a @click="exportData('csv')">CSV</a></li>
            <li><a @click="exportData('json')">JSON</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Data Stats -->
    <div
      v-if="enableStats && hasData"
      class="text-base-content/70 mb-4 flex items-center gap-4 text-sm"
    >
      <span>Total: {{ filteredData.length }}</span>
      <span v-if="selectedGroupBy">Groups: {{ groupCount }}</span>
    </div>

    <!-- Table -->
    <div
      class="border-base-300/30 bg-base-100 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table w-full" :class="tableClasses">
        <thead>
          <tr>
            <th
              v-for="header in table.getHeaderGroups()[0]?.headers"
              :key="header.id"
              :class="{
                'cursor-pointer select-none': header.column.getCanSort(),
              }"
              @click="
                header.column.getCanSort() &&
                header.column.getToggleSortingHandler()?.()
              "
            >
              <div class="flex items-center justify-between">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <div v-if="header.column.getIsSorted()" class="ml-2">
                  {{ header.column.getIsSorted() === "asc" ? "↑" : "↓" }}
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="hover:bg-primary hover:text-primary-content cursor-pointer transition-colors"
            :class="{ 'bg-base-200/30 font-medium': row.getIsGrouped() }"
            @click="handleRowClick(row)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="border-base-300/30 border-r px-3 py-3 text-sm last:border-r-0"
              :class="{
                'font-semibold': cell.getIsGrouped(),
                'pl-6': cell.getIsPlaceholder() && !cell.getIsGrouped(),
              }"
              @contextmenu="handleCellRightClick(cell, $event)"
            >
              <!-- Grouped Cell -->
              <div
                v-if="cell.getIsGrouped()"
                class="flex items-center gap-2 font-semibold"
              >
                <span
                  class="text-primary cursor-pointer"
                  @click.stop="row.getToggleExpandedHandler()()"
                >
                  {{ row.getIsExpanded() ? "📂" : "📁" }}
                </span>
                <span class="capitalize">
                  {{ cell.getValue() || "Unassigned" }}
                </span>
                <div
                  class="badge badge-primary badge-sm cursor-pointer"
                  @click.stop="row.getToggleExpandedHandler()()"
                >
                  {{ row.subRows.length }}
                </div>
              </div>
              <!-- Aggregated Cell -->
              <div v-else-if="cell.getIsAggregated()">
                <FlexRender
                  :render="
                    cell.column.columnDef.aggregatedCell ??
                    cell.column.columnDef.cell
                  "
                  :props="cell.getContext()"
                />
              </div>
              <!-- Placeholder Cell -->
              <div v-else-if="cell.getIsPlaceholder()"></div>
              <!-- Regular Cell -->
              <FlexRender
                v-else
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </DataSection>
</template>
