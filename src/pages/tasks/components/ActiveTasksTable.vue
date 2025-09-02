<script setup lang="ts">
import { computed, h } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  createColumnHelper,
  FlexRender,
  type Row,
  type Cell,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useTableHelpers } from "@/composables/useTableHelpers";
import { useTableState } from "@/composables/useTableState";
import DataSection from "@/components/ui/DataSection.vue";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import TaskStatusBadge from "./TaskStatusBadge.vue";
import type { TaskSummary } from "@/types/task";

// Data query
const {
  data: rawData,
  loading,
  error,
  refresh,
} = useCachedQuery<TaskSummary[]>("ClusterTaskSummary", [], {
  pollingInterval: 2000,
});

// Table store
const store = useTableState("activeTasksTable", {
  defaultSorting: [{ id: "SincePosted", desc: true }],
});

// Grouping options
const groupingOptions = [
  { value: "Name", label: "Task Type" },
  { value: "Owner", label: "Owner" },
  { value: "Miner", label: "Miner" },
];

// Handle group by change
const handleGroupByChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  store.setSelectedGroupBy(target.value);
};

// Column definitions
const columnHelper = createColumnHelper<TaskSummary>();

const columns = [
  columnHelper.accessor("Name", {
    header: "Task Type",
    size: 200,
    enableGrouping: true,
    cell: (info) =>
      h("span", { class: "font-semibold capitalize" }, info.getValue()),
    aggregatedCell: (info) => {
      const count = info.table.getRowModel().rows.length;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${count} tasks`,
      );
    },
  }),
  columnHelper.accessor("ID", {
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
  columnHelper.accessor("SincePosted", {
    header: "Posted",
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
  }),
  columnHelper.accessor("Owner", {
    header: "Owner",
    size: 150,
    enableGrouping: true,
    cell: (info) => {
      const owner = info.getValue();
      if (!owner) {
        return h("div", { class: "flex items-center gap-2" }, [
          h(TaskStatusBadge, { status: "pending", size: "xs" }),
          h("span", { class: "text-xs text-base-content/60" }, "Pending"),
        ]);
      }
      return h(
        "button",
        {
          class: "link link-secondary font-mono text-sm hover:link-hover",
          onClick: () => handleMachineClick(owner),
        },
        owner,
      );
    },
  }),
  columnHelper.accessor("Miner", {
    header: "Miner",
    size: 120,
    enableGrouping: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
];

// Table instance
const table = useVueTable({
  get data() {
    return rawData.value || [];
  },
  columns,
  getRowId: (row: TaskSummary) => `task-${row.ID}`,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  enableGrouping: true,
  autoResetExpanded: false,
  globalFilterFn: "includesString",
  state: {
    get sorting() {
      return store.sorting;
    },
    get grouping() {
      return store.grouping;
    },
    get expanded() {
      return store.expanded;
    },
    get globalFilter() {
      return store.searchQuery;
    },
  },
  onSortingChange: (updater) => {
    const newSorting =
      typeof updater === "function" ? updater(store.sorting) : updater;
    store.setSorting(newSorting);
  },
  onGroupingChange: (updater) => {
    const newGrouping =
      typeof updater === "function" ? updater(store.grouping) : updater;
    store.setGrouping(newGrouping);
  },
  onExpandedChange: (updater) => {
    const newExpanded =
      typeof updater === "function" ? updater(store.expanded) : updater;
    store.setExpanded(newExpanded);
  },
  onGlobalFilterChange: (updater) => {
    const newValue =
      typeof updater === "function" ? updater(store.searchQuery) : updater;
    store.setSearchQuery(newValue || "");
  },
});

// Table helper utilities
const { hasData, totalItems } = useTableHelpers(rawData, table);
const groupCount = computed(() => {
  if (!store.selectedGroupBy) return 0;
  const groups = new Set(
    rawData.value?.map(
      (task) => task[store.selectedGroupBy as keyof TaskSummary],
    ),
  );
  return groups.size;
});

// Event handlers
const handleTaskClick = (taskId: number) => {
  console.log("Task clicked:", taskId);
};

const handleMachineClick = (machineName: string) => {
  console.log("Machine clicked:", machineName);
};

const handleRowClick = (row: Row<TaskSummary>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  } else if (!row.getIsGrouped()) {
    handleTaskClick(row.original.ID);
  }
};

const handleCellRightClick = (
  cell: Cell<TaskSummary, unknown>,
  event: MouseEvent,
) => {
  event.preventDefault();
  const value = String(cell.getValue() || "");
  if (value && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
};

const getCellTooltip = (cell: Cell<TaskSummary, unknown>) => {
  if (cell.getIsGrouped()) {
    return `Click to ${cell.row.getIsExpanded() ? "collapse" : "expand"} group`;
  }
  return String(cell.getValue() || "");
};

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

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
    case "ID":
      return `${data.length} total tasks`;
    case "SincePosted": {
      if (data.length === 0) return "";
      const dates = data.map((task) => new Date(task.SincePosted));
      const oldest = Math.min(...dates.map((d) => d.getTime()));
      const newest = Math.max(...dates.map((d) => d.getTime()));
      return `${formatDistanceToNow(new Date(oldest))} - ${formatDistanceToNow(new Date(newest))}`;
    }
    case "Owner": {
      const owners = new Set(data.map((task) => task.Owner).filter(Boolean));
      const pendingCount = data.filter((task) => !task.Owner).length;
      return `${owners.size} assigned, ${pendingCount} pending`;
    }
    case "Miner": {
      const miners = new Set(data.map((task) => task.Miner).filter(Boolean));
      return `${miners.size} unique miners`;
    }
    default:
      return "";
  }
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    empty-message="No active tasks found"
  >
    <!-- Control bar -->
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search tasks..."
      :loading="loading"
      @refresh="refresh"
    >
      <!-- Grouping -->
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
        <span v-if="groupCount > 0" class="text-base-content/40">
          • <span class="font-medium">{{ groupCount }}</span> groups
        </span>
      </template>
    </TableControls>

    <!-- Table -->
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
              class="border-base-300/30 text-base-content border-r bg-transparent px-3 py-3 font-medium last:border-r-0"
              :class="{
                'cursor-pointer select-none': header.column.getCanSort(),
              }"
              @click="
                header.column.getCanSort() &&
                header.column.getToggleSortingHandler()?.($event)
              "
            >
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-2">
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
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
                <ColumnStats
                  :show-stats="store.showAggregateInfo"
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
            class="bg-base-100 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200"
            :class="{ 'bg-base-200/30 font-medium': row.getIsGrouped() }"
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
              @contextmenu="handleCellRightClick(cell, $event)"
            >
              <!-- Grouped cell -->
              <template v-if="cell.getIsGrouped()">
                <div class="flex items-center gap-2 font-semibold">
                  <span class="text-primary">
                    {{ cell.row.getIsExpanded() ? "📂" : "📁" }}
                  </span>
                  <span class="capitalize">
                    {{ cell.getValue() || "Unassigned" }}
                  </span>
                  <div class="badge badge-primary badge-sm">
                    {{ cell.row.subRows.length }}
                  </div>
                </div>
              </template>

              <!-- Aggregated cell -->
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

              <!-- Placeholder cell -->
              <template v-else-if="cell.getIsPlaceholder()">
                <div class="text-base-content/40">—</div>
              </template>

              <!-- Regular cell -->
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
