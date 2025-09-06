<script setup lang="ts">
import { computed, h, ref } from "vue";
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
import {
  PauseIcon,
  PlayIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";
import { useRouter } from "vue-router";
import { useTableHelpers } from "@/composables/useTableHelpers";
import { useTableState } from "@/composables/useTableState";
import DataSection from "@/components/ui/DataSection.vue";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import MachineStatusBadge from "./MachineStatusBadge.vue";
import TasksDisplay from "./TasksDisplay.vue";
import { useMachineOperations } from "../composables/useMachineOperations";
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

// Router for navigation
const router = useRouter();

// Machine operations
const {
  loading: operationLoading,
  error: operationError,
  cordon,
  uncordon,
  restart,
  abortRestart,
  clearError,
} = useMachineOperations();

// Confirmation dialog state
const showConfirmDialog = ref(false);
const confirmAction = ref<"cordon" | "uncordon" | "restart" | "abortRestart">(
  "cordon",
);
const selectedMachine = ref<MachineSummary | null>(null);

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
    return { online: 0, offline: 0, unschedulable: 0, restarting: 0 };

  let online = 0;
  let offline = 0;
  let unschedulable = 0;
  let restarting = 0;

  props.machines.forEach((machine) => {
    if (machine.Restarting) {
      restarting++;
    } else if (machine.Unschedulable) {
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

  return { online, offline, unschedulable, restarting };
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
      return (
        secondsSinceContact <= 60 &&
        !machine.Unschedulable &&
        !machine.Restarting
      );
    case "offline":
      return (
        secondsSinceContact > 60 &&
        !machine.Unschedulable &&
        !machine.Restarting
      );
    case "unschedulable":
      return machine.Unschedulable && !machine.Restarting;
    case "restarting":
      return Boolean(machine.Restarting);
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
    header: "Status",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    filterFn: statusFilterFn,
    cell: (info) =>
      h(MachineStatusBadge, {
        unschedulable: info.getValue(),
        sinceContact: info.row.original.SinceContact,
        runningTasks: info.row.original.RunningTasks,
        restarting: info.row.original.Restarting,
        restartRequest: info.row.original.RestartRequest,
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
    size: 180,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const machine = info.row.original;
      const parts = [`${machine.Cpu}C`, machine.RamHumanized];

      if (machine.Gpu > 0) {
        parts.push(`${machine.Gpu}G`);
      }

      return h("div", { class: "text-sm font-mono flex items-center gap-1" }, [
        h("span", { class: "text-primary" }, parts[0]), // CPU
        h("span", { class: "text-base-content/60" }, "•"),
        h("span", { class: "text-base-content" }, parts[1]), // RAM
        machine.Gpu > 0
          ? h("span", { class: "text-base-content/60" }, "•")
          : null,
        machine.Gpu > 0 ? h("span", { class: "text-warning" }, parts[2]) : null, // GPU
      ]);
    },
  }),
  columnHelper.accessor("Tasks", {
    id: "tasks",
    header: "Tasks",
    size: 250,
    enableGrouping: false,
    enableSorting: false,
    enableColumnFilter: true,
    filterFn: taskFilterFn,
    cell: (info) => h(TasksDisplay, { tasks: info.getValue(), limit: 3 }),
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
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 140,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const machine = info.row.original;
      const buttons = [];

      // Show uncordon button for cordoned machines
      if (machine.Unschedulable) {
        buttons.push(
          h(
            "button",
            {
              class: "btn btn-success btn-xs gap-1 no-row-click",
              disabled: operationLoading.value,
              title: "Uncordon (Allow new tasks)",
              onClick: () => handleUncordonClick(machine),
            },
            [
              h(PlayIcon, { class: "size-3" }),
              h("span", { class: "text-xs font-medium" }, "Resume"),
            ],
          ),
        );
      } else {
        // Show cordon button for active machines
        buttons.push(
          h(
            "button",
            {
              class: "btn btn-warning btn-xs gap-1 no-row-click",
              disabled: operationLoading.value,
              title: "Cordon (Prevent new tasks)",
              onClick: () => handleCordonClick(machine),
            },
            [
              h(PauseIcon, { class: "size-3" }),
              h("span", { class: "text-xs font-medium" }, "Cordon"),
            ],
          ),
        );
      }

      // Restart/abort restart buttons based on machine state
      if (machine.Restarting) {
        buttons.push(
          h(
            "button",
            {
              class: "btn btn-error btn-xs no-row-click",
              disabled: operationLoading.value,
              title: "Abort Restart",
              onClick: () => handleAbortRestartClick(machine),
            },
            [h(XCircleIcon, { class: "size-3" })],
          ),
        );
      } else {
        if (machine.Unschedulable) {
          buttons.push(
            h(
              "button",
              {
                class: "btn btn-info btn-xs no-row-click",
                disabled: operationLoading.value,
                title: "Restart machine",
                onClick: () => handleRestartClick(machine),
              },
              [h(ArrowPathIcon, { class: "size-3" })],
            ),
          );
        } else {
          // Disabled restart button with tooltip for uncordoned machines
          buttons.push(
            h(
              "span",
              {
                title: "Must cordon machine first to restart",
                class: "inline-block no-row-click",
              },
              [
                h(
                  "button",
                  {
                    class:
                      "btn btn-outline btn-neutral btn-xs border-base-content/30",
                    disabled: true,
                    onClick: undefined,
                  },
                  [h(ArrowPathIcon, { class: "size-3" })],
                ),
              ],
            ),
          );
        }
      }

      return h("div", { class: "flex items-center gap-1" }, buttons);
    },
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
    const filter = table.getColumn("Unschedulable")?.getFilterValue() as string;
    return filter || "all";
  },
  set: (value: string) => {
    table
      .getColumn("Unschedulable")
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
  router.push(`/machines/${machineId}`);
};

const handleRowClick = (row: Row<MachineSummary>, event: MouseEvent) => {
  // Prevent row navigation when clicking interactive elements
  const target = event.target as HTMLElement;
  if (target.closest(".no-row-click")) {
    return;
  }
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

// Machine operation handlers
const handleCordonClick = (machine: MachineSummary) => {
  selectedMachine.value = machine;
  confirmAction.value = "cordon";
  showConfirmDialog.value = true;
};

const handleUncordonClick = (machine: MachineSummary) => {
  selectedMachine.value = machine;
  confirmAction.value = "uncordon";
  showConfirmDialog.value = true;
};

const handleRestartClick = (machine: MachineSummary) => {
  selectedMachine.value = machine;
  confirmAction.value = "restart";
  showConfirmDialog.value = true;
};

const handleAbortRestartClick = (machine: MachineSummary) => {
  selectedMachine.value = machine;
  confirmAction.value = "abortRestart";
  showConfirmDialog.value = true;
};

const handleConfirmAction = async () => {
  if (!selectedMachine.value) return;

  const machine = selectedMachine.value;
  const machineName = machine.Name || `machine-${machine.ID}`;

  let result;
  if (confirmAction.value === "cordon") {
    result = await cordon(machine.ID, machineName);
  } else if (confirmAction.value === "uncordon") {
    result = await uncordon(machine.ID, machineName);
  } else if (confirmAction.value === "restart") {
    result = await restart(machine.ID, machineName);
  } else if (confirmAction.value === "abortRestart") {
    result = await abortRestart(machine.ID, machineName);
  } else {
    return; // Unknown action
  }

  if (result?.success) {
    showConfirmDialog.value = false;
    selectedMachine.value = null;
    props.onRefresh();
  }
};

const handleCancelAction = () => {
  showConfirmDialog.value = false;
  selectedMachine.value = null;
  clearError();
};

const getConfirmationProps = () => {
  if (!selectedMachine.value) {
    return {
      title: "",
      message: "",
      confirmText: "",
      type: "warning" as const,
    };
  }

  const machine = selectedMachine.value;
  const machineName = machine.Name || `machine-${machine.ID}`;

  if (confirmAction.value === "cordon") {
    return {
      title: "Cordon Machine",
      message: `Are you sure you want to cordon machine "${machineName}"? This will prevent new tasks from being scheduled to this machine. Running tasks will continue to completion.`,
      confirmText: "Cordon",
      type: "warning" as const,
    };
  } else if (confirmAction.value === "uncordon") {
    return {
      title: "Uncordon Machine",
      message: `Are you sure you want to uncordon machine "${machineName}"? This will allow new tasks to be scheduled to this machine.`,
      confirmText: "Uncordon",
      type: "info" as const,
    };
  } else if (confirmAction.value === "restart") {
    return {
      title: "Restart Machine",
      message: `Are you sure you want to restart machine "${machineName}"?\n\n⚠️ This is a long-running operation:\n• Machine will be cordoned automatically\n• All running tasks must complete first\n• Restart process may take several minutes\n• Machine status will show "Restarting" until complete`,
      confirmText: "Start Restart",
      type: "danger" as const,
    };
  } else if (confirmAction.value === "abortRestart") {
    return {
      title: "Abort Restart",
      message: `Are you sure you want to abort the restart for machine "${machineName}"? The machine will remain cordoned but the restart process will be cancelled.`,
      confirmText: "Abort Restart",
      type: "warning" as const,
    };
  } else {
    return {
      title: "Unknown Action",
      message: "Unknown action requested.",
      confirmText: "OK",
      type: "warning" as const,
    };
  }
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
      const restarting = data.filter((machine) => machine.Restarting).length;
      const online = data.filter((machine) => {
        const contactMatch = machine.SinceContact.match(/(\d+)s/);
        const secondsSinceContact = contactMatch
          ? parseInt(contactMatch[1])
          : 0;
        return (
          secondsSinceContact <= 60 &&
          !machine.Unschedulable &&
          !machine.Restarting
        );
      }).length;
      const unschedulable = data.filter(
        (machine) => machine.Unschedulable && !machine.Restarting,
      ).length;
      const offline = data.length - online - unschedulable - restarting;
      return `${online} online, ${offline} offline, ${unschedulable} cordoned, ${restarting} restarting`;
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
              Cordoned ({{ statusDistribution.unschedulable }})
            </option>
            <option value="restarting">
              Restarting ({{ statusDistribution.restarting }})
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
            @click="handleRowClick(row, $event)"
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

    <!-- Error Alert -->
    <div v-if="operationError" class="alert alert-error mt-4">
      <div class="flex items-start justify-between">
        <span>{{ operationError }}</span>
        <button class="btn btn-ghost btn-xs" @click="clearError">×</button>
      </div>
    </div>
  </DataSection>

  <!-- Confirmation Dialog -->
  <ConfirmationDialog
    v-model:show="showConfirmDialog"
    v-bind="getConfirmationProps()"
    :loading="operationLoading"
    @confirm="handleConfirmAction"
    @cancel="handleCancelAction"
  />
</template>
