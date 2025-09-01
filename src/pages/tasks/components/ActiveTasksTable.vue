<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData || false"
    :empty-message="'No active tasks found'"
  >
    <div class="mb-4 space-y-3">
      <div
        class="bg-base-100 border-base-300 flex flex-wrap items-center gap-3 rounded-lg border p-3 shadow-sm"
      >
        <div class="form-control">
          <input
            v-model="store.searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="input input-bordered input-sm w-56"
          />
        </div>

        <div class="border-base-300 border-l pl-3">
          <div class="flex items-center gap-2">
            <span
              class="text-base-content/70 text-sm font-medium whitespace-nowrap"
              >Group by</span
            >
            <select
              :value="store.selectedGroupBy"
              class="select select-bordered select-sm w-36"
              @change="handleGroupByChange"
            >
              <option value="">None</option>
              <option value="Name">Task Type</option>
              <option value="Owner">Owner</option>
              <option value="Miner">Miner</option>
            </select>
          </div>
        </div>

        <div class="border-base-300 border-l pl-3">
          <label
            class="flex cursor-pointer items-center gap-2 whitespace-nowrap"
          >
            <input
              v-model="store.showAggregateInfo"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            <span class="text-sm">Column stats</span>
          </label>
        </div>

        <div class="border-base-300 border-l pl-3">
          <button
            class="btn btn-outline btn-sm"
            :class="{ loading }"
            @click="refresh"
          >
            <span v-if="!loading">🔄</span>
            Refresh
          </button>
        </div>

        <div class="text-base-content/60 ml-auto text-xs">
          <span class="font-medium">{{ totalTasks }}</span> tasks
          <span v-if="store.grouping.length > 0" class="text-base-content/40">
            • <span class="font-medium">{{ getGroupCount() }}</span> groups
          </span>
        </div>
      </div>
    </div>

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

                <div
                  v-if="
                    store.showAggregateInfo && header.column.id !== 'actions'
                  "
                  class="text-base-content/60 space-y-0.5 text-xs"
                >
                  <div v-if="getColumnAggregateInfo(header.column.id)">
                    {{ getColumnAggregateInfo(header.column.id) }}
                  </div>
                </div>
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

<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  createColumnHelper,
  FlexRender,
  type ColumnFiltersState,
  type Row,
  type Cell,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useActiveTasksTableStore } from "@/stores/activeTasksTable";
import type { TaskSummary } from "@/types/task";
import TaskStatusBadge from "./TaskStatusBadge.vue";
import DataSection from "@/components/ui/DataSection.vue";

const {
  data: rawData,
  loading,
  error,
  refresh,
} = useCachedQuery<TaskSummary[]>("ClusterTaskSummary", [], {
  pollingInterval: 2000,
});

const hasData = computed(() => {
  return Array.isArray(rawData.value) && rawData.value.length > 0;
});

const store = useActiveTasksTableStore();

const filteredData = computed(() => {
  if (!Array.isArray(rawData.value)) return [];

  let filtered = rawData.value;

  if (store.searchQuery) {
    const query = store.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.Name?.toLowerCase().includes(query) ||
        task.ID?.toString().includes(query) ||
        task.Owner?.toLowerCase().includes(query) ||
        task.Miner?.toLowerCase().includes(query),
    );
  }

  return filtered;
});

const totalTasks = computed(() => filteredData.value.length);

const columnHelper = createColumnHelper<TaskSummary>();

const columns = [
  columnHelper.accessor("SpID", {
    header: "SP ID",
    size: 120,
    enableGrouping: false,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
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
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskSummary }[] };
      const rows = context.subRows || [];
      if (rows.length === 0) return "—";

      const dates = rows.map((row) => new Date(row.original.SincePosted));
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
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskSummary }[] };
      const rows = context.subRows || [];
      const owners = new Set(
        rows.map((row) => row.original.Owner).filter(Boolean),
      );
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${owners.size} owner${owners.size !== 1 ? "s" : ""}`,
      );
    },
  }),
  columnHelper.accessor("Miner", {
    header: "Miner",
    size: 120,
    enableGrouping: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
    aggregatedCell: (info) => {
      const context = info as { subRows?: { original: TaskSummary }[] };
      const rows = context.subRows || [];
      const miners = new Set(
        rows.map((row) => row.original.Miner).filter(Boolean),
      );
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${miners.size} miner${miners.size !== 1 ? "s" : ""}`,
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
  getRowId: (row: TaskSummary) => `task-${row.ID}`,
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
    case "Owner": {
      const owners = new Set(data.map((task) => task.Owner).filter(Boolean));
      const pending = data.filter((task) => !task.Owner).length;
      return `${owners.size} owners${pending > 0 ? `, ${pending} pending` : ""}`;
    }
    case "Miner": {
      const miners = new Set(data.map((task) => task.Miner).filter(Boolean));
      return `${miners.size} unique miners`;
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

const handleTaskClick = (taskId: number) => {
  console.log("Task clicked:", taskId);
  // TODO: Navigate to task details
};

const handleMachineClick = (machineName: string) => {
  console.log("Machine clicked:", machineName);
  // TODO: Navigate to machine details or filter by machine
};

const handleRowClick = (row: Row<TaskSummary>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  } else if (!row.getIsGrouped()) {
    handleTaskClick(row.original.ID);
  }
};

const getCellTooltip = (cell: Cell<TaskSummary, unknown>) => {
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
