<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  FolderOpenIcon,
  FolderIcon,
  CheckIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useItemModal } from "@/composables/useItemModal";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useTableActions } from "@/composables/useTableActions";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ItemDetailsModal from "@/components/table/ItemDetailsModal.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import type { SectorListEntry } from "@/types/pipeline";
import { getTableRowClasses } from "@/utils/ui";

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

const groupingOptions = [
  { value: "Address", label: "Miner" },
  { value: "state", label: "State" },
];

const { showModal, selectedItem, openModal, handleModalClose } =
  useItemModal<SectorListEntry>();

const { call } = useCurioQuery();
const { isLoading: isActionLoading, executeAction } =
  useTableActions<SectorListEntry>({
    actions: {
      restart: {
        name: "restart",
        handler: async (sector) => {
          await call("SectorRestart", [sector.SpID, sector.SectorNumber]);
        },
        loadingKey: (sector) => `${sector.SpID}-${sector.SectorNumber}`,
        onSuccess: () => props.onRefresh(),
      },
      delete: {
        name: "delete",
        handler: async (sector) => {
          await call("SectorRemove", [sector.SpID, sector.SectorNumber]);
        },
        loadingKey: (sector) => `delete-${sector.SpID}-${sector.SectorNumber}`,
        onSuccess: () => props.onRefresh(),
      },
    },
  });

const deleteDialogVisible = ref(false);
const sectorPendingDelete = ref<SectorListEntry | null>(null);
const deleteError = ref<string | null>(null);

const isDeletingSector = computed(() => {
  const target = sectorPendingDelete.value;
  if (!target) return false;
  return isActionLoading("delete", target);
});

const deleteDialogMessage = computed(() => {
  const sector = sectorPendingDelete.value;
  if (!sector) {
    return "Are you sure you want to delete this sector?";
  }
  return `Are you sure you want to delete sector ${sector.SectorNumber} from miner ${sector.Address}? This action cannot be undone.`;
});

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
      return "text-success";
    case "failed":
      return "text-error";
    case "waitseed":
      return "text-warning";
    default:
      return "";
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
        { class: "text-sm text-base-content/80" },
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
        { class: "text-sm text-base-content/80" },
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
            class: "text-sm",
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
          return h(CheckIcon, { class: "h-4 w-4 text-success" });
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
          return h(CheckIcon, { class: "h-4 w-4 text-success" });
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
    header: "Action",
    size: 100,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const sector = info.row.original;
      const isRestarting = isActionLoading("restart", sector);
      const isDeleting = isActionLoading("delete", sector);
      const buttons = [];

      if (sector.Failed) {
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
                executeAction("restart", sector);
              },
            },
            isRestarting ? "Restarting..." : "Restart",
          ),
        );
      }

      buttons.push(
        h(
          "button",
          {
            class: isDeleting
              ? "btn btn-xs btn-error loading cursor-not-allowed"
              : "btn btn-xs btn-error hover:btn-outline transition-colors",
            disabled: isDeleting,
            title: "Delete sector from pipeline",
            onClick: (e: Event) => {
              e.stopPropagation();
              openDeleteDialog(sector);
            },
          },
          isDeleting ? "Deleting..." : "Delete",
        ),
      );

      return h("div", { class: "flex items-center gap-1" }, buttons);
    },
  }),
];

const { table, store, helpers, handlers } = useStandardTable<SectorListEntry>({
  tableId: "porepSectorsTable",
  columns: columns as ColumnDef<SectorListEntry>[],
  data: rawData,
  defaultSorting: [{ id: "SectorNumber", desc: true }],
  groupingOptions,
  getRowId: (row) => `sector-${row.Address}-${row.SectorNumber}`,
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

const handleSectorClick = (sectorNumber: number) => {
  console.log("Sector clicked:", sectorNumber);
  const sector = rawData.value?.find((s) => s.SectorNumber === sectorNumber);
  if (sector) {
    openModal(sector);
  }
};

const handleRowClick = (row: Row<SectorListEntry>) => {
  if (row.getCanExpand()) {
    row.getToggleExpandedHandler()();
  } else if (!row.getIsGrouped()) {
    openModal(row.original);
  }
};

const openDeleteDialog = (sector: SectorListEntry) => {
  deleteError.value = null;
  sectorPendingDelete.value = sector;
  deleteDialogVisible.value = true;
};

const handleDeleteCancel = () => {
  if (isDeletingSector.value) return;
  deleteDialogVisible.value = false;
  sectorPendingDelete.value = null;
  deleteError.value = null;
};

const handleDeleteConfirm = async () => {
  const sector = sectorPendingDelete.value;
  if (!sector) return;
  deleteError.value = null;
  try {
    await executeAction("delete", sector);
    if (typeof document !== "undefined") {
      document.cookie = "sector_refresh=true; path=/";
    }
    deleteDialogVisible.value = false;
    sectorPendingDelete.value = null;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete sector.";
    deleteError.value = message;
  }
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
        <span class="font-medium">{{ totalItems }}</span> sectors
        <span v-if="groupCount > 0" class="text-base-content/40">
          • <span class="font-medium">{{ groupCount }}</span> groups
        </span>
      </template>
    </TableControls>

    <div
      class="border-base-300 bg-base-100 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table-zebra table w-full">
        <thead class="bg-base-200 sticky top-0 z-10">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-base-300 border-b"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              class="border-base-200 text-base-content border-r bg-transparent px-3 py-3 font-medium last:border-r-0"
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
                  <ExclamationTriangleIcon class="text-error h-8 w-8" />
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
                <ChartBarIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No active sectors found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[
                getTableRowClasses(true),
                'bg-base-100',
                { 'bg-base-200 font-medium': row.getIsGrouped() },
              ]"
              @click="handleRowClick(row)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :title="getCellTooltip(cell)"
                class="border-base-200 border-r px-3 py-3 text-sm last:border-r-0"
                :class="{
                  'font-semibold': cell.getIsGrouped(),
                  'pl-6': cell.getIsPlaceholder() && !cell.getIsGrouped(),
                }"
                @contextmenu="handleCellRightClick(cell, $event)"
              >
                <template v-if="cell.getIsGrouped()">
                  <div class="flex items-center gap-2 font-semibold">
                    <span class="text-primary">
                      <FolderOpenIcon
                        v-if="cell.row.getIsExpanded()"
                        class="h-4 w-4"
                      />
                      <FolderIcon v-else class="h-4 w-4" />
                    </span>
                    <!-- Special handling for state grouping -->
                    <template v-if="cell.column.id === 'state'">
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
                  <div class="text-base-content/80 text-center">
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

    <!-- Unified modal component replaces manual implementation -->
    <ItemDetailsModal
      v-model:show="showModal"
      :item="selectedItem"
      @close="handleModalClose"
    >
      <template #title="{ item }">
        <h3 class="text-lg font-bold">Sector {{ item?.SectorNumber }}</h3>
        <div class="text-base-content/60 text-sm">{{ item?.Address }}</div>
      </template>

      <template #header-stats="{ item }">
        <div class="mb-4 grid grid-cols-3 gap-3">
          <div
            class="bg-base-200 border-base-300 rounded-lg border p-3 text-center"
          >
            <div
              class="mb-1 text-xl font-bold"
              :class="!item?.Failed ? 'text-success' : 'text-error'"
            >
              {{ !item?.Failed ? "ACTIVE" : "FAILED" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Status
            </div>
          </div>
          <div
            class="bg-base-200 border-base-300 rounded-lg border p-3 text-center"
          >
            <div
              class="mb-1 text-xl font-bold"
              :class="item?.ChainAlloc ? 'text-info' : 'text-warning'"
            >
              {{ item?.ChainAlloc ? "ALLOC" : "PENDING" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Allocation
            </div>
          </div>
          <div
            class="bg-base-200 border-base-300 rounded-lg border p-3 text-center"
          >
            <div
              class="mb-1 text-xl font-bold"
              :class="item?.ChainSector ? 'text-success' : 'text-warning'"
            >
              {{ item?.ChainSector ? "ONCHAIN" : "PENDING" }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Chain
            </div>
          </div>
        </div>
      </template>

      <template #main-content="{ item }">
        <div class="bg-base-200 border-base-300 rounded-lg border p-4">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="font-semibold">Pipeline Progress</h4>
            <span class="text-primary font-bold"
              >{{ getPipelineProgress(item) }}%</span
            >
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-1">
              <div
                v-for="(step, index) in getProgressSteps(item)"
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
                  <CheckIcon v-if="step.completed" class="h-4 w-4" />
                  <span v-else>{{ step.number }}</span>
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
                :style="{ width: getPipelineProgress(item) + '%' }"
              ></div>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="text-base-content/60">Current:</span>
              <span class="badge badge-outline badge-sm">
                {{ item ? getCurrentState(item) : "Unknown" }}
              </span>
            </div>
            <div v-if="item?.Failed" class="text-error text-xs">
              {{ item?.FailedReason || "Task execution failed" }}
            </div>
          </div>
        </div>
      </template>
    </ItemDetailsModal>

    <ConfirmationDialog
      v-model:show="deleteDialogVisible"
      title="Delete sector"
      :message="deleteDialogMessage"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      :loading="isDeletingSector"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    >
      <template #description>
        <p class="text-base-content/80 text-sm">
          The sector will be removed from the PoRep pipeline. This does not
          terminate it on chain.
        </p>
        <p v-if="deleteError" class="text-error-content/80 mt-2 text-sm">
          {{ deleteError }}
        </p>
      </template>
    </ConfirmationDialog>
  </div>
</template>
