<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  createColumnHelper,
  type ColumnFiltersState,
  type Row,
  type Cell,
  FlexRender,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useTableHelpers } from "@/composables/useTableHelpers";
import { useTableState } from "@/composables/useTableState";
import DataSection from "@/components/ui/DataSection.vue";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { TaskHistorySummary } from "@/types/task";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";

const {
  data: rawData,
  loading,
  error,
  refresh,
} = useCachedQuery<TaskHistorySummary[]>("ClusterTaskHistory", [], {
  pollingInterval: 30000,
});

const store = useTableState("taskHistoryTable", {
  defaultSorting: [{ id: "Start", desc: true }],
  customFilters: { resultFilter: "all" },
});

const filteredData = computed(() => {
  if (!Array.isArray(rawData.value)) return [];

  let filtered = rawData.value;

  // Search filter
  if (store.searchQuery) {
    const query = store.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.Name?.toLowerCase().includes(query) ||
        task.TaskID?.toString().includes(query) ||
        task.CompletedBy?.toLowerCase().includes(query) ||
        task.Err?.toLowerCase().includes(query),
    );
  }

  // Result filter
  if (store.customFilters.resultFilter !== "all") {
    const isSuccess = store.customFilters.resultFilter === "success";
    filtered = filtered.filter((task) => task.Result === isSuccess);
  }

  return filtered;
});

const columnHelper = createColumnHelper<TaskHistorySummary>();

const columns = [
  columnHelper.accessor("TaskID", {
    header: "Task ID",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const taskId = info.getValue();
      return h(
        "button",
        {
          class: "link link-primary font-mono text-sm hover:link-hover",
          onClick: () => handleTaskClick(taskId),
        },
        `#${taskId.toString()}`,
      );
    },
    aggregatedCell: () => "—",
  }),
  columnHelper.accessor("Name", {
    header: "Task Type",
    size: 200,
    enableGrouping: true,
    cell: (info) => {
      const taskName = info.getValue();
      return h("span", { class: "font-semibold capitalize" }, taskName);
    },
    aggregatedCell: (info) => {
      const count = info.table.getRowModel().rows.length;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${count} tasks`,
      );
    },
  }),
  columnHelper.accessor("Start", {
    header: "Started",
    size: 150,
    enableGrouping: false,
    cell: (info) => {
      const date = new Date(info.getValue());
      const timeAgo = formatDistanceToNow(date, { addSuffix: true });
      return h(
        "span",
        {
          class: "text-sm text-base-content/80",
          title: date.toLocaleString(),
        },
        timeAgo,
      );
    },
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskHistorySummary }[] };
      const rows = context.subRows || [];
      if (rows.length === 0) return "—";

      const dates = rows.map((row) => new Date(row.original.Start));
      const oldest = Math.min(...dates.map((d) => d.getTime()));
      const newest = Math.max(...dates.map((d) => d.getTime()));

      return h("div", { class: "text-xs text-base-content/70" }, [
        h(
          "div",
          `Oldest: ${formatDistanceToNow(new Date(oldest), { addSuffix: true })}`,
        ),
        h(
          "div",
          `Newest: ${formatDistanceToNow(new Date(newest), { addSuffix: true })}`,
        ),
      ]);
    },
  }),
  columnHelper.accessor("Took", {
    header: "Duration",
    size: 100,
    enableGrouping: false,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskHistorySummary }[] };
      const rows = context.subRows || [];
      if (rows.length === 0) return "—";

      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${rows.length} tasks`,
      );
    },
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
          class: "link link-secondary font-mono text-sm hover:link-hover",
          onClick: () => handleMachineClick(machine),
        },
        machine,
      );
    },
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskHistorySummary }[] };
      const rows = context.subRows || [];
      const machines = new Set(
        rows.map((row) => row.original.CompletedBy).filter(Boolean),
      );
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${machines.size} machine${machines.size !== 1 ? "s" : ""}`,
      );
    },
  }),
  columnHelper.accessor("Result", {
    header: "Result",
    size: 100,
    enableGrouping: true,
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
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskHistorySummary }[] };
      const rows = context.subRows || [];
      const successCount = rows.filter((row) => row.original.Result).length;
      const failCount = rows.length - successCount;

      return h("div", { class: "text-xs text-base-content/70" }, [
        h("div", `✅ ${successCount} success`),
        h("div", `❌ ${failCount} failed`),
      ]);
    },
  }),
  columnHelper.accessor("Err", {
    header: "Error",
    size: 200,
    enableGrouping: false,
    cell: (info) => {
      const error = info.getValue();
      if (!error) return h("span", { class: "text-base-content/40" }, "—");

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
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskHistorySummary }[] };
      const rows = context.subRows || [];
      const errorCount = rows.filter((row) => row.original.Err).length;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${errorCount} with errors`,
      );
    },
  }),
];

const columnFilters = ref<ColumnFiltersState>([]);

const table = useVueTable({
  get data() {
    return filteredData.value;
  },
  columns,
  getRowId: (row: TaskHistorySummary) => `task-${row.TaskID}`,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  enableGrouping: true,
  autoResetExpanded: false,
  state: {
    get sorting() {
      return store.sorting;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get grouping() {
      return store.grouping;
    },
    get expanded() {
      return store.expanded;
    },
  },
  onSortingChange: (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(store.sorting)
        : updaterOrValue;
    store.setSorting(newSorting);
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters.value)
        : updaterOrValue;
  },
  onGroupingChange: (updaterOrValue) => {
    const newGrouping =
      typeof updaterOrValue === "function"
        ? updaterOrValue(store.grouping)
        : updaterOrValue;
    store.setGrouping(newGrouping);
  },
  onExpandedChange: (updaterOrValue) => {
    const newExpanded =
      typeof updaterOrValue === "function"
        ? updaterOrValue(store.expanded)
        : updaterOrValue;
    store.setExpanded(newExpanded);
  },
});

// Table helper utilities
const { hasData, totalItems } = useTableHelpers(rawData, table);

const getColumnAggregateInfo = (columnId: string) => {
  const data = filteredData.value;
  if (!data.length) return "";

  switch (columnId) {
    case "Name": {
      const taskTypes = data.reduce(
        (acc, task) => {
          acc[task.Name] = (acc[task.Name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const uniqueCount = Object.keys(taskTypes).length;
      return `${uniqueCount} unique types`;
    }
    case "CompletedBy": {
      const machines = new Set(
        data.map((task) => task.CompletedBy).filter(Boolean),
      );
      return `${machines.size} unique machines`;
    }
    case "Result": {
      const successCount = data.filter((task) => task.Result).length;
      const failCount = data.length - successCount;
      return `${successCount} success, ${failCount} failed`;
    }
    case "TaskID":
      return `${data.length} total tasks`;
    case "Start": {
      if (data.length === 0) return "";
      const dates = data.map((task) => new Date(task.Start));
      const oldest = Math.min(...dates.map((d) => d.getTime()));
      const newest = Math.max(...dates.map((d) => d.getTime()));
      return `${formatDistanceToNow(new Date(oldest))} - ${formatDistanceToNow(new Date(newest))}`;
    }
    case "Err": {
      const errorCount = data.filter((task) => task.Err).length;
      return `${errorCount} with errors`;
    }
    default:
      return "";
  }
};

const getGroupCount = () => {
  const groupedRows = table
    .getRowModel()
    .rows.filter((row) => row.getIsGrouped());
  return groupedRows.length;
};

const handleGroupByChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  store.setSelectedGroupBy(target.value);
};

const handleResultFilterChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  store.setCustomFilter(
    "resultFilter",
    target.value as "all" | "success" | "failed",
  );
};

const handleTaskClick = (taskId: number) => {
  console.log("Task clicked:", taskId);
  // TODO: Navigate to task details
};

const handleMachineClick = (machineName: string) => {
  console.log("Machine clicked:", machineName);
  // TODO: Navigate to machine details or filter by machine
};

const handleRowClick = (row: Row<TaskHistorySummary>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  } else if (!row.getIsGrouped()) {
    handleTaskClick(row.original.TaskID);
  }
};

const getCellTooltip = (cell: Cell<TaskHistorySummary, unknown>) => {
  const value = cell.getValue();
  if (cell.getIsGrouped()) {
    return `Click to ${cell.row.getIsExpanded() ? "collapse" : "expand"} group`;
  }
  return String(value || "");
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied to clipboard:", text);
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
};

const handleCellRightClick = (
  event: MouseEvent,
  cell: { getValue: () => unknown },
) => {
  event.preventDefault();
  const value = String(cell.getValue() || "");
  if (value) {
    copyToClipboard(value);
  }
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    empty-message="No task history found"
  >
    <!-- Control bar -->
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search history..."
      :loading="loading"
      @refresh="refresh"
    >
      <!-- Group by -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Group by
          </span>
          <select
            :value="store.selectedGroupBy"
            class="select select-bordered select-sm w-36"
            @change="handleGroupByChange"
          >
            <option value="">None</option>
            <option value="Name">Task Type</option>
            <option value="CompletedBy">Machine</option>
            <option value="Result">Result</option>
          </select>
        </div>
      </div>

      <!-- Status Filter -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Status
          </span>
          <select
            :value="store.customFilters.resultFilter"
            class="select select-bordered select-sm w-32"
            @change="handleResultFilterChange"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <!-- Column stats -->
      <div class="border-base-300 border-l pl-3">
        <label class="flex cursor-pointer items-center gap-2 whitespace-nowrap">
          <input
            v-model="store.showAggregateInfo"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="text-sm">Column stats</span>
        </label>
      </div>

      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> tasks
        <span v-if="store.grouping.length > 0" class="text-base-content/40">
          • <span class="font-medium">{{ getGroupCount() }}</span> groups
        </span>
      </template>
    </TableControls>

    <div
      class="border-base-300/30 bg-base-100 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table w-full">
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
              class="text-base-content border-base-300/30 border-r bg-transparent px-3 py-3 font-medium last:border-r-0"
            >
              <div class="space-y-1">
                <div
                  :class="{
                    'cursor-pointer select-none': header.column.getCanSort(),
                  }"
                  @click="
                    header.column.getCanSort() &&
                    header.column.getToggleSortingHandler()?.($event)
                  "
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <FlexRender
                        v-if="!header.isPlaceholder"
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                      <button
                        v-if="header.column.getCanGroup()"
                        :title="
                          header.column.getIsGrouped()
                            ? 'Remove grouping'
                            : 'Group by this column'
                        "
                        class="btn btn-xs btn-circle btn-ghost opacity-60 hover:opacity-100"
                        :class="{
                          'btn-primary': header.column.getIsGrouped(),
                        }"
                        @click.stop="store.toggleGrouping(header.column.id)"
                      >
                        <span v-if="header.column.getIsGrouped()">📌</span>
                        <span v-else>📂</span>
                      </button>
                    </div>

                    <span
                      v-if="header.column.getIsSorted()"
                      class="text-sm transition-transform duration-200"
                      :class="{
                        'rotate-180 transform':
                          header.column.getIsSorted() === 'desc',
                      }"
                    >
                      ▲
                    </span>
                  </div>
                </div>

                <ColumnStats
                  :show-stats="
                    store.showAggregateInfo && header.column.id !== 'actions'
                  "
                  :stats-text="getColumnAggregateInfo(header.column.id)"
                />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="bg-base-100 hover:bg-primary! hover:text-primary-content cursor-pointer transition-all duration-200"
            :class="{
              'bg-base-200/30': row.getIsGrouped(),
              'font-medium': row.getIsGrouped(),
            }"
            @click="handleRowClick(row)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :title="getCellTooltip(cell)"
              class="border-base-300/30 border-r px-3 py-3 text-sm last:border-r-0"
              :class="{
                'font-semibold': cell.getIsGrouped(),
                'pl-6': cell.getIsPlaceholder() && !cell.getIsGrouped(),
              }"
              @contextmenu="handleCellRightClick($event, cell)"
            >
              <template v-if="cell.getIsGrouped()">
                <div class="flex items-center gap-2 font-semibold">
                  <span class="text-primary">
                    {{ row.getIsExpanded() ? "📂" : "📁" }}
                  </span>
                  <span class="capitalize">{{
                    cell.getValue() || "Unassigned"
                  }}</span>
                  <div class="badge badge-primary badge-sm">
                    {{ row.subRows.length }}
                  </div>
                </div>
              </template>

              <template v-else-if="cell.getIsAggregated()">
                <div class="text-base-content/70 text-center">
                  <FlexRender
                    :render="
                      cell.column.columnDef.aggregatedCell ??
                      cell.column.columnDef.cell
                    "
                    :props="cell.getContext()"
                  />
                </div>
              </template>

              <template v-else-if="cell.getIsPlaceholder()">
                <div class="text-base-content/40">—</div>
              </template>

              <template v-else>
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </DataSection>
</template>
