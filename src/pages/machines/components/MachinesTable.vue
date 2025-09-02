<script setup lang="ts">
import { computed, h } from "vue";
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  FlexRender,
  type Row,
  type Cell,
} from "@tanstack/vue-table";
import { useTableHelpers } from "@/composables/useTableHelpers";
import { useTableState } from "@/composables/useTableState";
import DataSection from "@/components/ui/DataSection.vue";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import MachineStatusBadge from "./MachineStatusBadge.vue";
import TasksDisplay from "./TasksDisplay.vue";
import type { MachineSummary } from "@/types/machine";

interface Props {
  machines: MachineSummary[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
});

// Table state management
const store = useTableState("machinesTable", {
  defaultSorting: [{ id: "ID", desc: false }],
});

// Compute available task types from machines data
const availableTaskTypes = computed(() => {
  if (!props.machines?.length) return [];
  const taskTypes = new Set<string>();
  props.machines.forEach((machine) => {
    if (machine.Tasks) {
      machine.Tasks.split(",")
        .map((task) => task.trim())
        .filter(Boolean)
        .forEach((task) => taskTypes.add(task));
    }
  });
  return Array.from(taskTypes).sort();
});

// Compute status distribution
const statusDistribution = computed(() => {
  if (!props.machines?.length)
    return { online: 0, offline: 0, unschedulable: 0 };

  let online = 0;
  let offline = 0;
  let unschedulable = 0;

  props.machines.forEach((machine) => {
    if (machine.Unschedulable) {
      unschedulable++;
    } else {
      const contactMatch = machine.SinceContact.match(/(\d+)s/);
      const secondsSinceContact = contactMatch ? parseInt(contactMatch[1]) : 0;
      if (secondsSinceContact <= 60) {
        online++;
      } else {
        offline++;
      }
    }
  });

  return { online, offline, unschedulable };
});

// Custom filter functions
const statusFilterFn = (
  row: { original: MachineSummary },
  _columnId: string,
  filterValue: string,
) => {
  if (filterValue === "all") return true;

  const machine = row.original;
  const contactMatch = machine.SinceContact.match(/(\d+)s/);
  const secondsSinceContact = contactMatch ? parseInt(contactMatch[1]) : 0;

  switch (filterValue) {
    case "online":
      return secondsSinceContact <= 60 && !machine.Unschedulable;
    case "offline":
      return secondsSinceContact > 60 && !machine.Unschedulable;
    case "unschedulable":
      return machine.Unschedulable;
    default:
      return true;
  }
};

const taskFilterFn = (
  row: { original: MachineSummary },
  _columnId: string,
  filterValue: string,
) => {
  if (!filterValue) return true;

  const machine = row.original;
  return machine.Tasks?.includes(filterValue) ?? false;
};

// Column definitions
const columnHelper = createColumnHelper<MachineSummary>();

const columns = [
  columnHelper.accessor("ID", {
    header: "ID",
    size: 80,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "font-mono text-sm" }, info.getValue().toString()),
  }),
  columnHelper.accessor("Name", {
    header: "Name",
    size: 200,
    enableGrouping: false,
    cell: (info) => {
      const name = info.getValue();
      const machineId = info.row.original.ID;
      return h(
        "span",
        { class: "font-medium" },
        name || `machine-${machineId}`,
      );
    },
  }),
  columnHelper.accessor("Unschedulable", {
    id: "status",
    header: "Status",
    size: 120,
    enableGrouping: false,
    enableColumnFilter: true,
    filterFn: statusFilterFn,
    cell: (info) =>
      h(MachineStatusBadge, {
        unschedulable: info.getValue(),
        sinceContact: info.row.original.SinceContact,
        runningTasks: info.row.original.RunningTasks,
      }),
  }),
  columnHelper.accessor("Address", {
    header: "Address",
    size: 200,
    enableGrouping: false,
    cell: (info) =>
      h(
        "span",
        { class: "text-base-content/70 font-mono text-sm" },
        info.getValue(),
      ),
  }),
  columnHelper.display({
    id: "Resources",
    header: "Resources",
    size: 150,
    enableGrouping: false,
    cell: (info) => {
      const machine = info.row.original;
      return h("div", { class: "text-sm text-right" }, [
        h("div", {}, `${machine.Cpu} CPU`),
        h("div", { class: "text-base-content/60" }, machine.RamHumanized),
        machine.Gpu > 0
          ? h("div", { class: "text-warning" }, `${machine.Gpu} GPU`)
          : null,
      ]);
    },
  }),
  columnHelper.accessor("Tasks", {
    id: "tasks",
    header: "Tasks",
    size: 250,
    enableGrouping: false,
    enableColumnFilter: true,
    filterFn: taskFilterFn,
    cell: (info) => h(TasksDisplay, { tasks: info.getValue(), limit: 2 }),
  }),
  columnHelper.accessor("Uptime", {
    header: "Uptime",
    size: 120,
    enableGrouping: false,
    cell: (info) =>
      h(
        "span",
        { class: "text-base-content/70 text-sm" },
        info.getValue() || "-",
      ),
  }),
  columnHelper.accessor("SinceContact", {
    header: "Last Contact",
    size: 120,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-base-content/60 text-sm" }, info.getValue()),
  }),
];

// Table instance
const table = useVueTable({
  get data() {
    return props.machines || [];
  },
  columns,
  getRowId: (row: MachineSummary) => `machine-${row.ID}`,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString",
  state: {
    get sorting() {
      return store.sorting;
    },
    get columnFilters() {
      return store.columnFilters;
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
  onColumnFiltersChange: (updater) => {
    const newFilters =
      typeof updater === "function" ? updater(store.columnFilters) : updater;
    store.setColumnFilters(newFilters);
  },
  onGlobalFilterChange: (updater) => {
    const newValue =
      typeof updater === "function" ? updater(store.searchQuery) : updater;
    store.setSearchQuery(newValue || "");
  },
});

// Table helper utilities
const { hasData, totalItems } = useTableHelpers(
  computed(() => props.machines),
  table,
);

// Filter helper computed properties
const statusFilter = computed({
  get: () => {
    const filter = table.getColumn("status")?.getFilterValue() as string;
    return filter || "all";
  },
  set: (value: string) => {
    table
      .getColumn("status")
      ?.setFilterValue(value === "all" ? undefined : value);
  },
});

const taskFilter = computed({
  get: () => {
    return (table.getColumn("tasks")?.getFilterValue() as string) || "";
  },
  set: (value: string) => {
    table.getColumn("tasks")?.setFilterValue(value || undefined);
  },
});

// Check if filters are active
const hasActiveFilters = computed(() => {
  return store.columnFilters.length > 0;
});

// Reset all filters
const resetFilters = () => {
  table.resetColumnFilters();
};

// Event handlers
const handleMachineClick = (machineId: number) => {
  console.log("Machine clicked:", machineId);
};

const handleRowClick = (row: Row<MachineSummary>) => {
  handleMachineClick(row.original.ID);
};

const handleCellRightClick = (
  cell: Cell<MachineSummary, unknown>,
  event: MouseEvent,
) => {
  event.preventDefault();
  const value = String(cell.getValue() || "");
  if (value && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
};

const getCellTooltip = (cell: Cell<MachineSummary, unknown>) => {
  return String(cell.getValue() || "");
};

const getColumnAggregateInfo = (columnId: string) => {
  const data = props.machines;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "ID":
      return `${data.length} total machines`;
    case "Name": {
      const namedCount = data.filter((machine) => machine.Name).length;
      return `${namedCount} named machines`;
    }
    case "Unschedulable": {
      const online = data.filter((machine) => {
        const contactMatch = machine.SinceContact.match(/(\d+)s/);
        const secondsSinceContact = contactMatch
          ? parseInt(contactMatch[1])
          : 0;
        return secondsSinceContact <= 60 && !machine.Unschedulable;
      }).length;
      const unschedulable = data.filter(
        (machine) => machine.Unschedulable,
      ).length;
      const offline = data.length - online - unschedulable;
      return `${online} online, ${offline} offline, ${unschedulable} unschedulable`;
    }
    case "Address": {
      const uniqueAddresses = new Set(data.map((machine) => machine.Address));
      return `${uniqueAddresses.size} unique addresses`;
    }
    case "Resources": {
      const totalCpu = data.reduce((sum, machine) => sum + machine.Cpu, 0);
      const totalGpu = data.reduce((sum, machine) => sum + machine.Gpu, 0);
      return `${totalCpu} CPU cores, ${totalGpu} GPUs`;
    }
    case "Tasks": {
      const totalRunningTasks = data.reduce(
        (sum, machine) => sum + (machine.RunningTasks || 0),
        0,
      );
      return `${totalRunningTasks} total running tasks`;
    }
    case "Uptime": {
      const withUptime = data.filter((machine) => machine.Uptime).length;
      return `${withUptime} machines reporting uptime`;
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
    empty-message="No machines found"
  >
    <!-- Control bar -->
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search machines..."
      :loading="loading"
      @refresh="onRefresh"
    >
      <!-- Status Filter -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Status:
          </span>
          <select
            v-model="statusFilter"
            class="select select-bordered select-sm min-w-32"
          >
            <option value="all">All</option>
            <option value="online">
              Online ({{ statusDistribution.online }})
            </option>
            <option value="offline">
              Offline ({{ statusDistribution.offline }})
            </option>
            <option value="unschedulable">
              Unschedulable ({{ statusDistribution.unschedulable }})
            </option>
          </select>
        </div>
      </div>

      <!-- Task Filter -->
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Task:
          </span>
          <select
            v-model="taskFilter"
            class="select select-bordered select-sm min-w-32"
          >
            <option value="">All Types</option>
            <option
              v-for="task in availableTaskTypes"
              :key="task"
              :value="task"
            >
              {{ task }}
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
        <span class="font-medium">{{ totalItems }}</span> machines
      </template>

      <template #actions>
        <div v-if="hasActiveFilters" class="flex items-center">
          <button
            type="button"
            class="btn btn-ghost btn-sm gap-1"
            @click="resetFilters"
          >
            <span class="text-sm">×</span>
            Clear Filters
          </button>
        </div>
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
            @click="handleRowClick(row)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :title="getCellTooltip(cell)"
              class="border-base-300/30 border-r px-3 py-3 text-sm last:border-r-0"
              @contextmenu="handleCellRightClick(cell, $event)"
            >
              <FlexRender
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
