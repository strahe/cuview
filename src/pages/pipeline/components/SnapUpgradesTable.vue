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
  type Row,
  type Cell,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { useTableState } from "@/composables/useTableState";
import { useTableHelpers } from "@/composables/useTableHelpers";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { SnapSectorEntry } from "@/types/pipeline";

interface Props {
  sectors: SnapSectorEntry[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => props.sectors);

const store = useTableState("snapUpgradesTable", {
  defaultSorting: [{ id: "StartTime", desc: true }],
});

const groupingOptions = [
  { value: "CurrentState", label: "State" },
  { value: "Address", label: "Miner" },
];

const showSectorDetailsModal = ref(false);
const selectedSector = ref<SnapSectorEntry | null>(null);

const restartingTasks = ref(new Set<string>());

// Helper functions for data processing
const getCurrentState = (sector: SnapSectorEntry): string => {
  if (sector.Failed) return "Failed";
  if (sector.AfterMoveStorage) return "Completed";
  if (!sector.AfterEncode) return "Encoding";
  if (!sector.AfterProve) return "Proving";
  if (!sector.AfterSubmit) return "Submitting";
  if (!sector.AfterMoveStorage) return "Moving";
  return "Unknown";
};

const getStateBadgeClass = (state: string) => {
  switch (state.toLowerCase()) {
    case "completed":
      return "badge-success";
    case "failed":
      return "badge-error";
    case "encoding":
      return "badge-info";
    case "proving":
      return "badge-warning";
    case "submitting":
      return "badge-primary";
    case "moving":
      return "badge-secondary";
    default:
      return "badge-ghost";
  }
};

const columnHelper = createColumnHelper<SnapSectorEntry>();

const columns = [
  columnHelper.accessor("SpID", {
    header: "Miner",
    size: 120,
    enableGrouping: true,
    cell: (info) => {
      const spID = info.getValue();
      return h("div", { class: "font-mono text-sm" }, `f0${spID}`);
    },
    aggregatedCell: (info) => {
      const count = info.row.subRows.length;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${count} upgrades`,
      );
    },
  }),
  columnHelper.accessor("SectorNumber", {
    header: "Sector",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const sectorNumber = info.getValue();
      return h(
        "button",
        {
          class: "link link-primary font-mono text-sm hover:link-hover",
          onClick: () => handleSectorClick(info.row.original),
        },
        sectorNumber.toString(),
      );
    },
    aggregatedCell: () => "—",
  }),
  columnHelper.display({
    id: "CurrentState",
    header: "State",
    size: 120,
    enableGrouping: true,
    cell: (info) => {
      const sector = info.row.original;
      const state = getCurrentState(sector);
      const badgeClass = getStateBadgeClass(state);
      return h("div", { class: `badge badge-outline ${badgeClass}` }, state);
    },
    aggregatedCell: (info) => {
      const count = info.row.subRows.length;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${count} upgrades`,
      );
    },
    getGroupingValue: (row) => {
      return getCurrentState(row);
    },
  }),
  columnHelper.display({
    id: "progress",
    header: "Progress",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const sector = info.row.original;
      const progress = getUpgradeProgress(sector);
      const state = getCurrentState(sector);

      return h("div", { class: "w-full" }, [
        h("div", { class: "flex items-center justify-between mb-1" }, [
          h("span", { class: "text-xs text-base-content/60" }, state),
          h("span", { class: "text-xs font-medium" }, `${progress}%`),
        ]),
        h("div", { class: "bg-base-200 h-1.5 w-full rounded-full" }, [
          h("div", {
            class: "bg-primary h-1.5 rounded-full transition-all duration-300",
            style: { width: `${progress}%` },
          }),
        ]),
      ]);
    },
  }),
  columnHelper.display({
    id: "startTime",
    header: "Started",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const sector = info.row.original;
      try {
        const date = new Date(sector.StartTime);
        return h(
          "span",
          {
            class: "text-sm text-base-content/80",
            title: date.toLocaleString(),
          },
          formatDistanceToNow(date, { addSuffix: true }),
        );
      } catch (error) {
        console.error("Error formatting start time:", sector.StartTime, error);
        return h("div", { class: "text-sm text-error" }, "Invalid date");
      }
    },
  }),
  columnHelper.display({
    id: "updateReady",
    header: "Ready",
    cell: (info) => {
      const sector = info.row.original;
      const readyTime = sector.UpdateReadyAt;
      if (readyTime) {
        try {
          const date = new Date(readyTime);
          return h(
            "span",
            {
              class: "text-sm text-success",
              title: date.toLocaleString(),
            },
            formatDistanceToNow(date, { addSuffix: true }),
          );
        } catch (error) {
          console.error("Error formatting ready time:", readyTime, error);
          return h("div", { class: "text-sm text-success" }, "✓");
        }
      }
      return h("div", { class: "text-base-content/30" }, "—");
    },
    size: 120,
  }),
  columnHelper.display({
    id: "error",
    header: "Error",
    cell: (info) => {
      const sector = info.row.original;
      if (sector.Failed && sector.FailedReason) {
        const errorText =
          sector.FailedReasonMsg || sector.FailedReason || "Upgrade Failed";
        return h(
          "div",
          {
            class: "text-error text-sm font-medium truncate max-w-32",
            title: errorText,
          },
          errorText,
        );
      }
      return h("div", { class: "text-base-content/40 text-sm" }, "—");
    },
    size: 150,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 120,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const sector = info.row.original;
      const sectorKey = `${sector.SpID}-${sector.SectorNumber}`;
      const isRestarting = restartingTasks.value.has(sectorKey);
      const buttons = [];

      // Restart button for failed upgrades
      if (sector.Failed) {
        buttons.push(
          h(
            "button",
            {
              class: isRestarting
                ? "btn btn-xs btn-primary loading cursor-not-allowed"
                : "btn btn-xs btn-primary hover:btn-outline transition-colors",
              disabled: isRestarting,
              title: "Reset and restart upgrade",
              onClick: (e: Event) => {
                e.stopPropagation();
                handleRestartUpgrade(sector);
              },
            },
            isRestarting ? "Restarting..." : "Restart",
          ),
        );
      }

      // Delete button
      buttons.push(
        h(
          "button",
          {
            class: "btn btn-xs btn-error hover:btn-outline transition-colors",
            title: "Remove upgrade from pipeline",
            onClick: (e: Event) => {
              e.stopPropagation();
              handleDeleteUpgrade(sector);
            },
          },
          "Delete",
        ),
      );

      return h("div", { class: "flex items-center gap-1" }, buttons);
    },
  }),
];

const table = useVueTable({
  get data() {
    return rawData.value || [];
  },
  columns,
  getRowId: (row: SnapSectorEntry) => `upgrade-${row.SpID}-${row.SectorNumber}`,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  enableGrouping: true,
  autoResetExpanded: false,
  autoResetPageIndex: false,
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

const { hasData: tableHasData, totalItems } = useTableHelpers(rawData, table);
const groupCount = computed(() => {
  if (!store.selectedGroupBy) return 0;
  const groups = new Set(
    rawData.value?.map((sector) => {
      if (store.selectedGroupBy === "CurrentState") {
        return getCurrentState(sector);
      }
      return sector[store.selectedGroupBy as keyof SnapSectorEntry];
    }),
  );
  return groups.size;
});

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return store.searchQuery.trim() !== "" || store.selectedGroupBy !== "";
});

// Clear all filters
const clearAllFilters = () => {
  store.setSearchQuery("");
  store.setSelectedGroupBy("");
};

const handleGroupByChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  store.setSelectedGroupBy(target.value);
};

const handleSectorClick = (sector: SnapSectorEntry) => {
  selectedSector.value = sector;
  showSectorDetailsModal.value = true;
};

const handleRowClick = (row: Row<SnapSectorEntry>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  } else if (!row.getIsGrouped()) {
    selectedSector.value = row.original;
    showSectorDetailsModal.value = true;
  }
};

const handleCellRightClick = (
  cell: Cell<SnapSectorEntry, unknown>,
  event: MouseEvent,
) => {
  event.preventDefault();
  const value = String(cell.getValue() || "");
  if (value && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
};

const getCellTooltip = (cell: Cell<SnapSectorEntry, unknown>) => {
  if (cell.getIsGrouped()) {
    return `Click to ${cell.row.getIsExpanded() ? "collapse" : "expand"} group`;
  }
  return String(cell.getValue() || "");
};

const handleRestartUpgrade = async (sector: SnapSectorEntry) => {
  console.log(`Restarting upgrade for sector ${sector.SectorNumber}`);

  const sectorKey = `${sector.SpID}-${sector.SectorNumber}`;
  const { upgradeResetTaskIDs } = useCurioQuery();

  try {
    restartingTasks.value.add(sectorKey);

    await upgradeResetTaskIDs(sector.SpID, sector.SectorNumber);
    console.log(
      `Successfully restarted upgrade for sector ${sector.SectorNumber}`,
    );

    props.onRefresh();
  } catch (error) {
    console.error(
      `Failed to restart upgrade for sector ${sector.SectorNumber}:`,
      error,
    );
  } finally {
    restartingTasks.value.delete(sectorKey);
  }
};

const handleDeleteUpgrade = async (sector: SnapSectorEntry) => {
  if (
    !confirm(
      `Are you sure you want to delete upgrade for sector ${sector.SectorNumber}?`,
    )
  ) {
    return;
  }

  console.log(`Deleting upgrade for sector ${sector.SectorNumber}`);

  const { upgradeDelete } = useCurioQuery();

  try {
    await upgradeDelete(sector.SpID, sector.SectorNumber);
    console.log(
      `Successfully deleted upgrade for sector ${sector.SectorNumber}`,
    );

    props.onRefresh();
  } catch (error) {
    console.error(
      `Failed to delete upgrade for sector ${sector.SectorNumber}:`,
      error,
    );
  }
};

const closeSectorDetails = () => {
  showSectorDetailsModal.value = false;
  selectedSector.value = null;
};

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "SpID": {
      const miners = new Set(data.map((sector) => sector.SpID));
      return `${miners.size} unique miners`;
    }
    case "SectorNumber":
      return `${data.length} total upgrades`;
    case "CurrentState": {
      const states = data.reduce(
        (acc, sector) => {
          const state = getCurrentState(sector);
          acc[state] = (acc[state] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const uniqueCount = Object.keys(states).length;
      return `${uniqueCount} unique states`;
    }
    case "progress": {
      if (data.length === 0) return "";
      const avgProgress =
        data.reduce((sum, sector) => sum + getUpgradeProgress(sector), 0) /
        data.length;
      return `${Math.round(avgProgress)}% average progress`;
    }
    case "startTime": {
      if (data.length === 0) return "";
      const dates = data.map((sector) => new Date(sector.StartTime));
      const oldest = Math.min(...dates.map((d) => d.getTime()));
      const newest = Math.max(...dates.map((d) => d.getTime()));
      return `${formatDistanceToNow(new Date(oldest))} - ${formatDistanceToNow(new Date(newest))}`;
    }
    case "updateReady": {
      const ready = data.filter((sector) => sector.UpdateReadyAt).length;
      return `${ready}/${data.length} ready`;
    }
    case "error": {
      const failed = data.filter((sector) => sector.Failed).length;
      return `${failed}/${data.length} failed`;
    }
    default:
      return "";
  }
};

// Calculate upgrade progress percentage
const getUpgradeProgress = (sector: SnapSectorEntry | null): number => {
  if (!sector) return 0;

  const steps = [
    sector.AfterEncode, // Step 1: Encoding
    sector.AfterProve, // Step 2: Proving
    sector.AfterSubmit, // Step 3: Submitting
    sector.AfterMoveStorage, // Step 4: Moving storage
  ];

  const completedSteps = steps.filter(Boolean).length;
  return Math.round((completedSteps / steps.length) * 100);
};

// Get progress steps for detailed display
const getProgressSteps = (sector: SnapSectorEntry | null) => {
  if (!sector) return [];

  return [
    {
      number: 1,
      label: "Encode",
      completed: sector.AfterEncode,
    },
    {
      number: 2,
      label: "Prove",
      completed: sector.AfterProve,
    },
    {
      number: 3,
      label: "Submit",
      completed: sector.AfterSubmit,
    },
    {
      number: 4,
      label: "Move",
      completed: sector.AfterMoveStorage,
    },
  ];
};
</script>

<template>
  <div class="space-y-4">
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search upgrades..."
      :loading="props.loading"
      @refresh="props.onRefresh"
    >
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
        <span class="font-medium">{{ totalItems }}</span> upgrades
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
                <div>Loading upgrades...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <div class="mb-2 text-4xl">⬆️</div>
                <div class="font-medium">No upgrades available</div>
                <div class="text-sm">
                  No sectors are currently being upgraded
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
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
                <template v-if="cell.getIsGrouped()">
                  <div class="flex items-center gap-2 font-semibold">
                    <span class="text-primary">
                      {{ cell.row.getIsExpanded() ? "📂" : "📁" }}
                    </span>
                    <!-- Special handling for state grouping -->
                    <template v-if="cell.column.id === 'CurrentState'">
                      <div
                        class="badge badge-outline"
                        :class="
                          getStateBadgeClass(
                            String(cell.getValue() || 'Unknown'),
                          )
                        "
                      >
                        {{ cell.getValue() || "Unknown" }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="capitalize">
                        {{ cell.getValue() || "Unassigned" }}
                      </span>
                    </template>
                    <div class="badge badge-primary badge-sm">
                      {{ cell.row.subRows.length }}
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

    <!-- Sector Details Modal -->
    <div v-if="showSectorDetailsModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-bold">
              Sector {{ selectedSector?.SectorNumber }} Upgrade
            </h3>
            <div class="text-base-content/60 text-sm">
              f0{{ selectedSector?.SpID }}
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" @click="closeSectorDetails">
            ✕
          </button>
        </div>

        <div class="mb-4 grid grid-cols-2 gap-3">
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div
              class="mb-1 text-xl font-bold"
              :class="!selectedSector?.Failed ? 'text-info' : 'text-error'"
            >
              {{ !selectedSector?.Failed ? "ACTIVE" : "FAILED" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Status
            </div>
          </div>
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div class="text-primary mb-1 text-xl font-bold">
              {{ selectedSector ? getCurrentState(selectedSector) : "Unknown" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Stage
            </div>
          </div>
        </div>

        <div class="bg-base-200/30 rounded-lg p-4">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="font-semibold">Upgrade Progress</h4>
            <span class="text-primary font-bold"
              >{{
                selectedSector ? getUpgradeProgress(selectedSector) : 0
              }}%</span
            >
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-1">
              <div
                v-for="(step, index) in selectedSector
                  ? getProgressSteps(selectedSector)
                  : []"
                :key="index"
                class="flex flex-1 flex-col items-center"
              >
                <div
                  class="mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                  :class="
                    step.completed
                      ? 'bg-success text-success-content'
                      : 'bg-base-300 text-base-content/50'
                  "
                >
                  {{ step.completed ? "✓" : step.number }}
                </div>
                <div
                  class="text-center text-[10px] leading-tight"
                  :class="
                    step.completed ? 'text-success' : 'text-base-content/50'
                  "
                >
                  {{ step.label }}
                </div>
              </div>
            </div>

            <div class="bg-base-300 h-1.5 w-full rounded-full">
              <div
                class="bg-success h-1.5 rounded-full transition-all duration-500"
                :style="{
                  width:
                    (selectedSector ? getUpgradeProgress(selectedSector) : 0) +
                    '%',
                }"
              ></div>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="text-base-content/60">Current:</span>
              <span class="badge badge-outline badge-sm">
                {{
                  selectedSector ? getCurrentState(selectedSector) : "Unknown"
                }}
              </span>
            </div>
            <div v-if="selectedSector?.Failed" class="text-error text-xs">
              {{
                selectedSector?.FailedReasonMsg ||
                selectedSector?.FailedReason ||
                "Upgrade failed"
              }}
            </div>
          </div>
        </div>

        <div
          v-if="selectedSector?.UpdateUnsealedCid"
          class="bg-base-200/30 mt-4 rounded-lg p-3"
        >
          <div class="text-base-content/80 mb-2 text-sm font-medium">
            CID Information
          </div>
          <div class="space-y-1 text-xs">
            <div v-if="selectedSector.UpdateUnsealedCid">
              <span class="text-base-content/60">Unsealed CID:</span>
              <span class="text-base-content ml-2 font-mono">{{
                selectedSector.UpdateUnsealedCid
              }}</span>
            </div>
            <div v-if="selectedSector.UpdateSealedCid">
              <span class="text-base-content/60">Sealed CID:</span>
              <span class="text-base-content ml-2 font-mono">{{
                selectedSector.UpdateSealedCid
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
