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
import { useTableState } from "@/composables/useTableState";
import { useTableHelpers } from "@/composables/useTableHelpers";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { SectorListEntry } from "@/types/pipeline";

interface Props {
  sectors: SectorListEntry[];
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

const store = useTableState("porepSectorsTable", {
  defaultSorting: [{ id: "SectorNumber", desc: true }],
});

const groupingOptions = [
  { value: "Address", label: "Miner" },
  { value: "state", label: "State" },
];

const showSectorDetailsModal = ref(false);
const selectedSector = ref<SectorListEntry | null>(null);

const restartingTasks = ref(new Set<string>());

// Helper functions for data processing
const getCurrentState = (sector: SectorListEntry): string => {
  if (sector.Failed) return "Failed";
  if (sector.AfterCommitMsgSuccess) return "Completed";
  if (!sector.AfterSDR) return "SDR";
  if (!sector.AfterTreeD) return "TreeD";
  if (!sector.AfterTreeC) return "TreeC";
  if (!sector.AfterTreeR) return "TreeR";
  if (!sector.AfterSynthetic) return "Synthetic";
  if (!sector.AfterPrecommitMsg) return "PreCommit";
  if (!sector.AfterSeed) return "WaitSeed";
  if (!sector.AfterPoRep) return "PoRep";
  if (!sector.AfterFinalize) return "Finalize";
  if (!sector.AfterMoveStorage) return "MoveStorage";
  if (!sector.AfterCommitMsg) return "CommitMsg";
  return "Unknown";
};

const getStateBadgeClass = (state: string) => {
  switch (state.toLowerCase()) {
    case "completed":
      return "badge-success";
    case "failed":
      return "badge-error";
    case "waitseed":
      return "badge-warning";
    default:
      return "badge-info";
  }
};

const columnHelper = createColumnHelper<SectorListEntry>();

const columns = [
  columnHelper.accessor("Address", {
    header: "Miner",
    size: 120,
    enableGrouping: true,
    cell: (info) => h("div", { class: "font-mono text-sm" }, info.getValue()),
    aggregatedCell: (info) => {
      const count = info.row.subRows.length;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        `${count} sectors`,
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
          onClick: () => handleSectorClick(sectorNumber),
        },
        sectorNumber.toString(),
      );
    },
    aggregatedCell: () => "—",
  }),
  columnHelper.display({
    id: "state",
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
        `${count} sectors`,
      );
    },
    getGroupingValue: (row) => {
      return getCurrentState(row);
    },
  }),
  columnHelper.display({
    id: "created",
    header: "Create Time",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const sector = info.row.original;
      // Use CreateTime field from SectorListEntry
      const timeField = sector.CreateTime || Date.now();
      try {
        const date = new Date(timeField);
        return h(
          "span",
          {
            class: "text-sm text-base-content/80",
            title: date.toLocaleString(),
          },
          formatDistanceToNow(date, { addSuffix: true }),
        );
      } catch (error) {
        console.error("Error formatting date:", timeField, error);
        return h("div", { class: "text-sm text-error" }, "Invalid date");
      }
    },
  }),
  columnHelper.display({
    id: "precommit",
    header: "PreCommit Ready",
    cell: (info) => {
      const sector = info.row.original;
      const readyTime = sector.PreCommitReadyAt;
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
          console.error(
            "Error formatting PreCommit ready time:",
            readyTime,
            error,
          );
          return h("div", { class: "text-sm text-success" }, "✓");
        }
      }
      return h("div", { class: "text-base-content/30" }, "—");
    },
    size: 120,
  }),
  columnHelper.display({
    id: "commit",
    header: "Commit Ready",
    cell: (info) => {
      const sector = info.row.original;
      const readyTime = sector.CommitReadyAt;
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
          console.error(
            "Error formatting Commit ready time:",
            readyTime,
            error,
          );
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
      if (sector.Failed) {
        const errorText = sector.FailedReason || "Task Failed";
        return h(
          "div",
          {
            class: "text-error text-sm font-medium",
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
    size: 100,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const sector = info.row.original;
      const sectorKey = `${sector.SpID}-${sector.SectorNumber}`;
      const isRestarting = restartingTasks.value.has(sectorKey);
      const buttons = [];

      buttons.push(
        h(
          "button",
          {
            class: isRestarting
              ? "btn btn-xs btn-primary loading cursor-not-allowed"
              : "btn btn-xs btn-primary hover:btn-outline transition-colors",
            disabled: isRestarting,
            title: "Restart sector processing",
            onClick: (e: Event) => {
              e.stopPropagation();
              handleRestartSector(sector);
            },
          },
          isRestarting ? "Restarting..." : "Restart",
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
  getRowId: (row: SectorListEntry) =>
    `sector-${row.Address}-${row.SectorNumber}`,
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
      if (store.selectedGroupBy === "state") {
        return getCurrentState(sector);
      }
      return sector[store.selectedGroupBy as keyof SectorListEntry];
    }),
  );
  return groups.size;
});

const handleGroupByChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  store.setSelectedGroupBy(target.value);
};

const handleSectorClick = (sectorNumber: number) => {
  console.log("Sector clicked:", sectorNumber);
  const sector = rawData.value?.find((s) => s.SectorNumber === sectorNumber);
  if (sector) {
    selectedSector.value = sector;
    showSectorDetailsModal.value = true;
  }
};

const handleRowClick = (row: Row<SectorListEntry>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  } else if (!row.getIsGrouped()) {
    selectedSector.value = row.original;
    showSectorDetailsModal.value = true;
  }
};

const handleCellRightClick = (
  cell: Cell<SectorListEntry, unknown>,
  event: MouseEvent,
) => {
  event.preventDefault();
  const value = String(cell.getValue() || "");
  if (value && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
};

const getCellTooltip = (cell: Cell<SectorListEntry, unknown>) => {
  if (cell.getIsGrouped()) {
    return `Click to ${cell.row.getIsExpanded() ? "collapse" : "expand"} group`;
  }
  return String(cell.getValue() || "");
};

const handleRestartSector = async (sector: SectorListEntry) => {
  console.log(`Restarting sector ${sector.SectorNumber}`);

  const sectorKey = `${sector.SpID}-${sector.SectorNumber}`;
  const { call } = useCurioQuery();

  try {
    restartingTasks.value.add(sectorKey);

    await call("SectorRestart", [sector.SpID, sector.SectorNumber]);
    console.log(`Successfully restarted sector ${sector.SectorNumber}`);

    refresh();
  } catch (error) {
    console.error(`Failed to restart sector ${sector.SectorNumber}:`, error);
  } finally {
    restartingTasks.value.delete(sectorKey);
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
    case "Address": {
      const miners = new Set(data.map((sector) => sector.Address));
      return `${miners.size} unique miners`;
    }
    case "SectorNumber":
      return `${data.length} total sectors`;
    case "state": {
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
    case "created": {
      if (data.length === 0) return "";
      const dates = data.map(
        (sector) => new Date(sector.CreateTime || Date.now()),
      );
      const oldest = Math.min(...dates.map((d) => d.getTime()));
      const newest = Math.max(...dates.map((d) => d.getTime()));
      return `${formatDistanceToNow(new Date(oldest))} - ${formatDistanceToNow(new Date(newest))}`;
    }
    case "precommit": {
      const ready = data.filter((sector) => sector.PreCommitReadyAt).length;
      return `${ready}/${data.length} ready`;
    }
    case "commit": {
      const ready = data.filter((sector) => sector.CommitReadyAt).length;
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

// Calculate pipeline progress percentage
const getPipelineProgress = (sector: SectorListEntry | null): number => {
  if (!sector) return 0;

  const steps = [
    sector.AfterSDR, // Step 1
    sector.AfterTreeD && sector.AfterTreeC && sector.AfterTreeR, // Step 2 (Trees combined)
    sector.AfterSynthetic, // Step 3
    sector.AfterPrecommitMsg, // Step 4
    sector.AfterSeed, // Step 5
    sector.AfterPoRep, // Step 6
    sector.AfterFinalize, // Step 7
    sector.AfterCommitMsg, // Step 8
  ];

  const completedSteps = steps.filter(Boolean).length;
  return Math.round((completedSteps / steps.length) * 100);
};

// Get progress steps for horizontal display
const getProgressSteps = (sector: SectorListEntry | null) => {
  if (!sector) return [];

  return [
    {
      number: 1,
      label: "SDR",
      completed: sector.AfterSDR,
    },
    {
      number: 2,
      label: "Trees",
      completed: sector.AfterTreeD && sector.AfterTreeC && sector.AfterTreeR,
    },
    {
      number: 3,
      label: "Synthetic",
      completed: sector.AfterSynthetic,
    },
    {
      number: 4,
      label: "PreCommit",
      completed: sector.AfterPrecommitMsg,
    },
    {
      number: 5,
      label: "WaitSeed",
      completed: sector.AfterSeed,
    },
    {
      number: 6,
      label: "PoRep",
      completed: sector.AfterPoRep,
    },
    {
      number: 7,
      label: "Finalize",
      completed: sector.AfterFinalize,
    },
    {
      number: 8,
      label: "Commit",
      completed: sector.AfterCommitMsg,
    },
  ];
};
</script>

<template>
  <div class="space-y-4">
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search sectors..."
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

      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> sectors
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
                <div class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                  <div class="text-error text-2xl">⚠️</div>
                </div>
                <h3 class="text-base-content mb-2 text-lg font-semibold">Connection Error</h3>
                <p class="text-base-content/70 mb-4 text-sm">{{ props.error.message }}</p>
                <button class="btn btn-outline btn-sm" :disabled="props.loading" @click="props.onRefresh">
                  <span v-if="props.loading" class="loading loading-spinner loading-xs"></span>
                  <span class="ml-2">{{ props.loading ? "Retrying..." : "Retry Connection" }}</span>
                </button>
              </td>
            </tr>
          </template>
          <template v-else-if="props.loading && !tableHasData">
            <tr>
              <td :colspan="columns.length" class="py-12 text-center text-base-content/60">
                <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
                <div>Loading...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td :colspan="columns.length" class="py-8 text-center text-base-content/60">
                <div class="mb-2 text-4xl">📊</div>
                <div>No active sectors found</div>
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
                  <template v-if="cell.column.id === 'state'">
                    <div
                      class="badge badge-outline"
                      :class="getStateBadgeClass(cell.getValue() || 'Unknown')"
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

    <div v-if="showSectorDetailsModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-bold">
              Sector {{ selectedSector?.SectorNumber }}
            </h3>
            <div class="text-base-content/60 text-sm">
              {{ selectedSector?.Address }}
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" @click="closeSectorDetails">
            ✕
          </button>
        </div>

        <div class="mb-4 grid grid-cols-3 gap-3">
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div
              class="mb-1 text-xl font-bold"
              :class="!selectedSector?.Failed ? 'text-success' : 'text-error'"
            >
              {{ !selectedSector?.Failed ? "ACTIVE" : "FAILED" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Status
            </div>
          </div>
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div
              class="mb-1 text-xl font-bold"
              :class="selectedSector?.ChainAlloc ? 'text-info' : 'text-warning'"
            >
              {{ selectedSector?.ChainAlloc ? "ALLOC" : "PENDING" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Allocation
            </div>
          </div>
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div
              class="mb-1 text-xl font-bold"
              :class="
                selectedSector?.ChainSector ? 'text-success' : 'text-warning'
              "
            >
              {{ selectedSector?.ChainSector ? "ONCHAIN" : "PENDING" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Chain
            </div>
          </div>
        </div>

        <div class="bg-base-200/30 rounded-lg p-4">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="font-semibold">Pipeline Progress</h4>
            <span class="text-primary font-bold"
              >{{ getPipelineProgress(selectedSector) }}%</span
            >
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-1">
              <div
                v-for="(step, index) in getProgressSteps(selectedSector)"
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
                :style="{ width: getPipelineProgress(selectedSector) + '%' }"
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
              {{ selectedSector?.FailedReason || "Task execution failed" }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
