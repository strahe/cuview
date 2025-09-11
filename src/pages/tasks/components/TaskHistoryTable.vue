<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { TaskHistorySummary } from "@/types/task";

interface Props {
  items: TaskHistorySummary[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => props.items);

const groupingOptions = [
  { value: "Name", label: "Task Type" },
  { value: "CompletedBy", label: "Machine" },
  { value: "Result", label: "Result" },
];

const resultFilterFn = (
  row: { original: TaskHistorySummary },
  _columnId: string,
  filterValue: string,
) => {
  if (filterValue === "all") return true;

  const task = row.original;
  switch (filterValue) {
    case "success":
      return task.Result === true;
    case "failed":
      return task.Result === false;
    default:
      return true;
  }
};

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
    enableColumnFilter: true,
    filterFn: resultFilterFn,
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

const { table, store, helpers, handlers } =
  useStandardTable<TaskHistorySummary>({
    tableId: "taskHistoryTable",
    columns: columns as ColumnDef<TaskHistorySummary>[],
    data: rawData,
    defaultSorting: [{ id: "Start", desc: true }],
    groupingOptions,
    getRowId: (row) => `task-${row.TaskID}`,
  });

const {
  hasData: tableHasData,
  totalItems,
  groupCount,
  hasActiveFilters,
} = helpers;
const {
  handleGroupByChange,
  handleCellRightClick,
  getCellTooltip,
  clearAllFilters,
} = handlers;

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

const resultFilter = computed({
  get: () => {
    const filter = table.getColumn("Result")?.getFilterValue() as string;
    return filter || "all";
  },
  set: (value: string) => {
    table
      .getColumn("Result")
      ?.setFilterValue(value === "all" ? undefined : value);
  },
});

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
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
</script>

<template>
  <div class="space-y-4">
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search history..."
      :loading="props.loading"
      @refresh="props.onRefresh"
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

      <!-- Status Filter -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Status
          </span>
          <select
            v-model="resultFilter"
            class="select select-bordered select-sm w-32"
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

      <!-- Clear Filters Button moved to actions slot to appear after refresh -->
      <template #actions>
        <div v-if="hasActiveFilters">
          <button
            class="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content"
            title="Clear all filters"
            @click="clearAllFilters"
          >
            <XMarkIcon class="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      </template>

      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> tasks
        <span v-if="groupCount > 0" class="text-base-content/40">
          • <span class="font-medium">{{ groupCount }}</span> groups
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
              class="text-base-content border-base-300/30 border-r bg-transparent px-3 py-3 font-medium last:border-r-0"
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
          <template v-if="props.error">
            <tr>
              <td :colspan="columns.length" class="py-12 text-center">
                <div
                  class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
                >
                  <div class="text-error text-2xl">⚠️</div>
                </div>
                <h3 class="text-base-content mb-2 text-lg font-semibold">
                  Connection Error
                </h3>
                <p class="text-base-content/70 mb-4 text-sm">
                  {{ props.error.message }}
                </p>
                <button
                  class="btn btn-outline btn-sm"
                  :disabled="props.loading"
                  @click="props.onRefresh"
                >
                  <span
                    v-if="props.loading"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <span class="ml-2">{{
                    props.loading ? "Retrying..." : "Retry Connection"
                  }}</span>
                </button>
              </td>
            </tr>
          </template>
          <template v-else-if="props.loading && !tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-12 text-center"
              >
                <div
                  class="loading loading-spinner loading-lg mx-auto mb-4"
                ></div>
                <div>Loading...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <div class="mb-2 text-4xl">📊</div>
                <div>No task history found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="bg-base-100 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200"
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
                @contextmenu="handleCellRightClick(cell, $event)"
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
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
