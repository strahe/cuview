<script setup lang="ts">
import { ref, h } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type ExpandedState,
  type GroupingState,
  type Row,
  FlexRender,
} from "@tanstack/vue-table";
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import DataSection from "@/components/ui/DataSection.vue";
import type { TaskHistorySummary } from "@/types/task";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const grouping = ref<GroupingState>([]);
const expanded = ref<ExpandedState>({});

const {
  data: rawData,
  loading,
  error,
  hasData,
  refresh,
} = useCachedQuery<TaskHistorySummary[]>("ClusterTaskHistory", [], {
  pollingInterval: 30000,
});

const columnHelper = createColumnHelper<TaskHistorySummary>();

const columns = [
  columnHelper.accessor("TaskID", {
    header: "Task ID",
    size: 100,
    cell: (info) => {
      const taskId = info.getValue();
      return h(
        "button",
        {
          class: "link link-primary font-mono text-sm",
          onClick: () => handleTaskClick(taskId),
        },
        taskId.toString(),
      );
    },
  }),
  columnHelper.accessor("Name", {
    header: "Name",
    size: 180,
    enableGrouping: true,
    cell: (info) => h("span", { class: "font-medium" }, info.getValue()),
  }),
  columnHelper.accessor("Start", {
    header: "Started",
    size: 130,
    cell: (info) =>
      h("span", { class: "text-sm text-base-content/80" }, info.getValue()),
  }),
  columnHelper.accessor("Took", {
    header: "Duration",
    size: 100,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("CompletedBy", {
    header: "Completed By",
    size: 150,
    enableGrouping: true,
    cell: (info) => {
      const machine = info.getValue();
      return h(
        "button",
        {
          class: "link link-secondary text-sm",
          onClick: () => handleMachineClick(machine),
        },
        machine,
      );
    },
  }),
  columnHelper.accessor("Result", {
    header: "Result",
    size: 80,
    cell: (info) => {
      const success = info.getValue();
      const IconComponent = success ? CheckCircleIcon : XCircleIcon;
      const iconClass = success ? "h-4 w-4 text-success" : "h-4 w-4 text-error";
      const textClass = success
        ? "text-sm font-medium text-success"
        : "text-sm font-medium text-error";
      const label = success ? "Success" : "Failed";

      return h("div", { class: "flex items-center gap-1" }, [
        h(IconComponent, { class: iconClass }),
        h("span", { class: textClass }, label),
      ]);
    },
  }),
  columnHelper.accessor("Err", {
    header: "Error",
    size: 200,
    cell: (info) => {
      const error = info.getValue();
      if (!error) return null;

      const truncated = error.length > 50 ? `${error.slice(0, 50)}...` : error;
      return h(
        "span",
        {
          class: "text-sm text-error cursor-help",
          title: error,
        },
        truncated,
      );
    },
  }),
];

const table = useVueTable({
  get data() {
    return rawData.value || [];
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
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
  onSortingChange: (updaterOrValue) => {
    sorting.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting.value)
        : updaterOrValue;
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters.value)
        : updaterOrValue;
  },
  onGroupingChange: (updaterOrValue) => {
    grouping.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(grouping.value)
        : updaterOrValue;
  },
  onExpandedChange: (updaterOrValue) => {
    expanded.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(expanded.value)
        : updaterOrValue;
  },
});

const handleTaskClick = (taskId: number) => {
  console.log("Task clicked:", taskId);
  // TODO: Navigate to task detail page
};

const handleMachineClick = (machineName: string) => {
  console.log("Machine clicked:", machineName);
  // TODO: Navigate to machine detail page
};

const handleRowClick = (row: Row<TaskHistorySummary>) => {
  if (row.getIsGrouped()) {
    if (row.getCanExpand()) {
      row.getToggleExpandedHandler()();
    }
  } else {
    handleTaskClick(row.original.TaskID);
  }
};

const toggleGrouping = (columnId: string) => {
  const currentGrouping = grouping.value;
  const isGrouped = currentGrouping.includes(columnId);

  if (isGrouped) {
    grouping.value = currentGrouping.filter((id) => id !== columnId);
  } else {
    grouping.value = [...currentGrouping, columnId];
  }

  console.log("Grouping changed:", {
    columnId,
    isGrouped,
    newGrouping: grouping.value,
  });
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied to clipboard:", text);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      console.log("Copied to clipboard (fallback):", text);
    } catch (error) {
      console.error("Copy failed:", error);
    }
    document.body.removeChild(textArea);
  }
};

const handleCellRightClick = (
  event: MouseEvent,
  cell: { column: { id: string }; getValue: () => unknown },
) => {
  event.preventDefault();

  const cellValue = cell.getValue();

  if (
    cellValue &&
    cellValue !== "-" &&
    cellValue !== null &&
    cellValue !== undefined
  ) {
    copyToClipboard(String(cellValue));
  }
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Task History Error"
    empty-icon="📜"
    empty-message="No task history available"
  >
    <template #loading>Loading task history...</template>

    <div
      class="bg-base-100 border-base-300/30 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table-zebra table-sm table w-full">
        <thead class="bg-base-200/50 sticky top-0 z-10">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-base-300/50 border-b"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              :style="{ width: `${header.getSize()}px` }"
              class="text-base-content border-base-300/30 border-r bg-transparent px-3 py-3 font-medium backdrop-blur-sm first:rounded-tl-lg last:rounded-tr-lg last:border-r-0"
            >
              <div
                v-if="header.column.getCanSort()"
                class="flex cursor-pointer items-center gap-2 select-none"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <span
                  class="text-sm transition-transform duration-200"
                  :class="{
                    'rotate-180 transform':
                      header.column.getIsSorted() === 'desc',
                    'opacity-50': !header.column.getIsSorted(),
                  }"
                >
                  {{ header.column.getIsSorted() ? "▲" : "▼" }}
                </span>
              </div>
              <FlexRender
                v-else
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />

              <button
                v-if="header.column.getCanGroup()"
                :title="header.column.getIsGrouped() ? 'Ungroup' : 'Group'"
                class="btn btn-xs btn-circle btn-ghost ml-1 opacity-60 hover:opacity-100"
                @click.stop="toggleGrouping(header.column.id)"
              >
                <MagnifyingGlassMinusIcon
                  v-if="header.column.getIsGrouped()"
                  class="h-3 w-3"
                />
                <MagnifyingGlassPlusIcon v-else class="h-3 w-3" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :class="[
              'cursor-pointer transition-all duration-200',
              !row.original?.Result && !row.getIsGrouped()
                ? 'bg-error/10 hover:bg-error/20 text-error-content'
                : 'hover:bg-base-200/70',
            ]"
            @click="handleRowClick(row)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :title="String(cell.getValue() || '')"
              class="border-base-300/30 cursor-context-menu border-r px-3 py-4 text-sm font-medium last:border-r-0"
              @contextmenu="handleCellRightClick($event, cell)"
            >
              <template v-if="cell.column.getIsGrouped()">
                <template v-if="row.getCanExpand()">
                  <div class="flex items-center gap-2 font-semibold">
                    <MagnifyingGlassMinusIcon
                      v-if="row.getIsExpanded()"
                      class="text-success h-4 w-4"
                    />
                    <MagnifyingGlassPlusIcon
                      v-else
                      class="text-success h-4 w-4"
                    />
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                    <span class="badge badge-success badge-sm">
                      {{ row.subRows.length }}
                    </span>
                  </div>
                </template>
              </template>
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

    <!-- Results count -->
    <div class="text-base-content/70 mt-4 text-sm">
      Showing {{ rawData?.length || 0 }} completed tasks
    </div>
  </DataSection>
</template>
