<script setup lang="ts">
import { computed, h, reactive, ref, watch } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
  type Table,
  type Row,
} from "@tanstack/vue-table";
import { useVirtualizer } from "@tanstack/vue-virtual";
import type { VirtualItem } from "@tanstack/virtual-core";
import {
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import ItemDetailsModal from "@/components/table/ItemDetailsModal.vue";
import { useStandardTable } from "@/composables/useStandardTable";
import { useItemModal } from "@/composables/useItemModal";
import { useLazyQuery } from "@/composables/useLazyQuery";
import { terminateSectors } from "@/services/sector-api";
import { getTableRowClasses } from "@/utils/ui";
import type {
  SectorDetail,
  SectorListItem,
  SectorTerminationPayload,
} from "@/types/sectors";

interface Props {
  sectors?: SectorListItem[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const ROW_HEIGHT = 56;
const OVERSCAN = 12;

const props = withDefaults(defineProps<Props>(), {
  sectors: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => props.sectors ?? []);

const columnHelper = createColumnHelper<SectorListItem>();

const tableInstance = ref<Table<SectorListItem> | null>(null);

const selectedKeys = ref<Set<string>>(new Set());
const getRowKey = (sector: SectorListItem) =>
  `${sector.MinerAddress}-${sector.SectorNum}`;

const allRows = computed(() => tableInstance.value?.getRowModel().rows ?? []);

const selectedItems = computed(() => {
  if (!selectedKeys.value.size) return [];
  const keySet = selectedKeys.value;
  return rawData.value.filter((item) => keySet.has(getRowKey(item)));
});

const toggleRowSelection = (key: string, value: boolean) => {
  if (value) {
    selectedKeys.value = new Set(selectedKeys.value).add(key);
  } else if (selectedKeys.value.has(key)) {
    const next = new Set(selectedKeys.value);
    next.delete(key);
    selectedKeys.value = next;
  }
};

const toggleSelectAll = () => {
  const keys = visibleRowKeys.value;
  if (!keys.length) return;
  if (allVisibleSelected.value) {
    const next = new Set(selectedKeys.value);
    keys.forEach((key: string) => next.delete(key));
    selectedKeys.value = next;
  } else {
    const next = new Set(selectedKeys.value);
    keys.forEach((key: string) => next.add(key));
    selectedKeys.value = next;
  }
};

const clearSelection = () => {
  selectedKeys.value = new Set();
};

watch(
  rawData,
  (items) => {
    if (!selectedKeys.value.size) return;
    const available = new Set(items.map((item) => getRowKey(item)));
    const next = new Set(
      Array.from(selectedKeys.value).filter((key) => available.has(key)),
    );
    if (next.size !== selectedKeys.value.size) {
      selectedKeys.value = next;
    }
  },
  { immediate: true },
);

const renderBooleanBadge = (
  label: string,
  tone: "success" | "warning" | "neutral",
) => {
  const baseClass = "badge badge-sm border-none font-medium";
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-base-200 text-base-content/70";
  return h(
    "span",
    {
      class: [baseClass, toneClass],
    },
    label,
  );
};

const columns = [
  columnHelper.display({
    id: "selection",
    header: () =>
      h("input", {
        type: "checkbox",
        class: "checkbox checkbox-sm",
        checked: allVisibleSelected.value,
        indeterminate: someVisibleSelected.value,
        onChange: toggleSelectAll,
        "aria-label": "Select all visible sectors",
      }),
    cell: (info) => {
      const sector = info.row.original;
      const key = getRowKey(sector);
      return h("input", {
        type: "checkbox",
        class: "checkbox checkbox-sm",
        checked: selectedKeys.value.has(key),
        onChange: (event: Event) => {
          const target = event.target as HTMLInputElement;
          toggleRowSelection(key, target.checked);
        },
        "aria-label": `Select sector ${sector.SectorNum}`,
      });
    },
    enableSorting: false,
    enableGlobalFilter: false,
    size: 40,
  }),
  columnHelper.accessor("MinerAddress", {
    id: "miner",
    header: "Miner",
    cell: (info) =>
      h(
        "span",
        {
          class: "font-mono text-sm",
        },
        info.getValue(),
      ),
  }),
  columnHelper.accessor("SectorNum", {
    id: "sector",
    header: "Sector",
    size: 100,
    cell: (info) => {
      const sector = info.row.original;
      return h(
        "button",
        {
          class:
            "link link-primary font-medium hover:link-hover focus:outline-none",
          onClick: () => handleOpenDetails(sector),
        },
        sector.SectorNum.toString(),
      );
    },
  }),
  columnHelper.accessor("ExpiresAt", {
    id: "expiry",
    header: "Expiry (Epoch)",
    size: 140,
    cell: (info) => {
      const value = info.getValue();
      if (!value || value <= 0) {
        return h("span", { class: "text-base-content/60 text-sm" }, "—");
      }
      return h(
        "span",
        { class: "text-sm font-medium" },
        value.toLocaleString(),
      );
    },
  }),
  columnHelper.accessor("IsOnChain", {
    id: "onChain",
    header: "On Chain",
    size: 100,
    cell: (info) => {
      const value = info.getValue();
      return value
        ? renderBooleanBadge("Yes", "success")
        : renderBooleanBadge("No", "neutral");
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const value = row.getValue<boolean>(columnId);
      return filterValue === "yes" ? value : !value;
    },
  }),
  columnHelper.accessor("Proving", {
    id: "proving",
    header: "Proving",
    size: 110,
    cell: (info) => {
      const value = info.getValue();
      return value
        ? renderBooleanBadge("Active", "success")
        : renderBooleanBadge("Idle", "neutral");
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const value = row.getValue<boolean>(columnId);
      return filterValue === "yes" ? value : !value;
    },
  }),
  columnHelper.accessor("DealWeight", {
    id: "dealWeight",
    header: "Deal Weight",
    size: 140,
    cell: (info) =>
      h("span", { class: "text-sm font-medium" }, info.getValue()),
  }),
  columnHelper.accessor("Deals", {
    id: "deals",
    header: "Deals",
    cell: (info) =>
      h("span", { class: "text-sm text-base-content/80" }, info.getValue()),
  }),
  columnHelper.accessor("IsFilPlus", {
    id: "filPlus",
    header: "Fil+",
    size: 90,
    cell: (info) => {
      const value = info.getValue();
      return value
        ? renderBooleanBadge("Fil+", "success")
        : renderBooleanBadge("Standard", "neutral");
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const value = row.getValue<boolean>(columnId);
      return filterValue === "yes" ? value : !value;
    },
  }),
  columnHelper.display({
    id: "storage",
    header: "Storage",
    cell: (info) => {
      const sector = info.row.original;
      const badges = [];
      if (sector.HasSealed) {
        badges.push(
          h(
            "span",
            {
              class: "badge badge-xs border-none bg-primary/10 text-primary",
            },
            "Sealed",
          ),
        );
      }
      if (sector.HasUnsealed) {
        badges.push(
          h(
            "span",
            {
              class: "badge badge-xs border-none bg-info/10 text-info",
            },
            "Unsealed",
          ),
        );
      }
      if (sector.HasSnap) {
        badges.push(
          h(
            "span",
            {
              class: "badge badge-xs border-none bg-accent/10 text-accent",
            },
            "Snap",
          ),
        );
      }
      if (!badges.length) {
        badges.push(
          h("span", { class: "text-base-content/50 text-xs font-medium" }, "—"),
        );
      }
      return h(
        "div",
        { class: "flex flex-wrap gap-1" },
        badges.map((badge, index) =>
          h("span", { key: `${info.row.id}-storage-${index}` }, [badge]),
        ),
      );
    },
    size: 140,
  }),
  columnHelper.accessor("SealInfo", {
    id: "sealInfo",
    header: "Size",
    size: 100,
    cell: (info) =>
      h("span", { class: "text-sm font-medium" }, info.getValue() || "—"),
  }),
  columnHelper.accessor("Flag", {
    id: "flagged",
    header: "Flag",
    size: 90,
    cell: (info) => {
      const value = info.getValue();
      return value
        ? h(
            "span",
            {
              class:
                "badge badge-sm border-none bg-error/10 text-error font-semibold",
            },
            "Flagged",
          )
        : h(
            "span",
            {
              class:
                "badge badge-sm border-none bg-base-200 text-base-content/60",
            },
            "Clear",
          );
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const value = row.getValue<boolean>(columnId);
      return filterValue === "yes" ? value : !value;
    },
  }),
] as const;

const tableColumns = columns as unknown as ColumnDef<SectorListItem>[];

const { table, store, helpers, handlers } = useStandardTable<SectorListItem>({
  tableId: "sectorsTable",
  columns: tableColumns,
  data: rawData,
  defaultSorting: [],
  enableGrouping: false,
  enableSorting: true,
  autoResetExpanded: true,
});

tableInstance.value = table;

type FilterOption = "all" | "yes" | "no";

const filters = reactive<{
  filPlus: FilterOption;
  proving: FilterOption;
  flagged: FilterOption;
  onChain: FilterOption;
}>({
  filPlus: "all",
  proving: "all",
  flagged: "all",
  onChain: "all",
});

const applyFilter = (columnId: string, value: FilterOption) => {
  const column = table.getColumn(columnId);
  if (!column) return;
  if (value === "all") {
    column.setFilterValue(undefined);
  } else {
    column.setFilterValue(value);
  }
};

watch(
  () => filters.filPlus,
  (value) => applyFilter("filPlus", value),
  { immediate: true },
);

watch(
  () => filters.proving,
  (value) => applyFilter("proving", value),
  { immediate: true },
);

watch(
  () => filters.flagged,
  (value) => applyFilter("flagged", value),
  { immediate: true },
);

watch(
  () => filters.onChain,
  (value) => applyFilter("onChain", value),
  { immediate: true },
);

const filteredRowCount = computed(() => allRows.value.length);
const hasVisibleRows = computed(() => filteredRowCount.value > 0);

const scrollContainer = ref<HTMLDivElement | null>(null);

const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
  count: filteredRowCount.value,
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: OVERSCAN,
});

watch(filteredRowCount, (count) => {
  rowVirtualizer.value.setOptions({
    ...rowVirtualizer.value.options,
    count,
  });
});

const virtualItems = computed<VirtualItem[]>(() =>
  rowVirtualizer.value.getVirtualItems(),
);

type VirtualizedRow = {
  virtualItem: VirtualItem;
  row: Row<SectorListItem>;
};

const virtualRows = computed<VirtualizedRow[]>(() => {
  const rows = allRows.value;
  return virtualItems.value.flatMap((virtualItem) => {
    const row = rows[virtualItem.index];
    if (!row) return [];
    return [{ virtualItem, row }];
  });
});

const paddingTop = computed(() => {
  const first = virtualItems.value[0];
  return first ? Math.max(0, first.start) : 0;
});

const paddingBottom = computed(() => {
  const items = virtualItems.value;
  const last = items[items.length - 1];
  if (!last) return 0;
  return Math.max(0, rowVirtualizer.value.getTotalSize() - last.end);
});

const visibleRowKeys = computed(() =>
  virtualRows.value.map(({ row }) => getRowKey(row.original)),
);

const allVisibleSelected = computed(() => {
  const keys = visibleRowKeys.value;
  if (!keys.length) return false;
  return keys.every((key) => selectedKeys.value.has(key));
});

const someVisibleSelected = computed(() => {
  const keys = visibleRowKeys.value;
  return (
    keys.some((key) => selectedKeys.value.has(key)) && !allVisibleSelected.value
  );
});

const selectedCount = computed(() => selectedKeys.value.size);

const visibleColumnCount = computed(() => table.getVisibleLeafColumns().length);

const searchValue = computed({
  get: () => store.searchQuery,
  set: (value: string) => store.setSearchQuery(value),
});

const showTerminateDialog = ref(false);
const isTerminating = ref(false);
const terminationError = ref<string | null>(null);

const handleOpenTerminateDialog = () => {
  if (!selectedItems.value.length) return;
  terminationError.value = null;
  showTerminateDialog.value = true;
};

const handleTerminateCancel = () => {
  showTerminateDialog.value = false;
  terminationError.value = null;
};

const handleTerminateConfirm = async () => {
  if (!selectedItems.value.length) return;
  isTerminating.value = true;
  terminationError.value = null;

  const payload: SectorTerminationPayload[] = selectedItems.value.map(
    (sector) => ({
      MinerAddress: sector.MinerAddress,
      Sector: sector.SectorNum,
    }),
  );

  try {
    await terminateSectors(payload);
    showTerminateDialog.value = false;
    clearSelection();
    props.onRefresh();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to terminate sectors.";
    terminationError.value = message;
  } finally {
    isTerminating.value = false;
  }
};

const { showModal, selectedItem, openModal, handleModalClose } =
  useItemModal<SectorListItem>();

const sectorInfoQuery = useLazyQuery<SectorDetail>("SectorInfo");

const handleOpenDetails = async (sector: SectorListItem) => {
  openModal(sector);
  sectorInfoQuery.reset();
  try {
    await sectorInfoQuery.execute(sector.MinerAddress, sector.SectorNum);
  } catch (error) {
    console.error("Failed to load sector info", error);
  }
};

const detailEntries = computed(() => {
  const data = sectorInfoQuery.data.value;
  if (!data) return [];
  return Object.entries(data);
});

const getColumnAggregateInfo = (_columnId?: string) => {
  void _columnId;
  return "";
};

const clearAllFilters = () => {
  filters.filPlus = "all";
  filters.proving = "all";
  filters.flagged = "all";
  filters.onChain = "all";
  handlers.clearAllFilters();
};
</script>

<template>
  <div class="space-y-4">
    <TableControls
      :search-input="searchValue"
      :loading="loading"
      search-placeholder="Search miners, sectors, or deals..."
      @update:search-input="(value: string) => (searchValue = value)"
      @refresh="onRefresh"
    >
      <template #default>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm">
            <span class="text-base-content/60">Fil+</span>
            <select
              v-model="filters.filPlus"
              class="select select-bordered select-sm w-28"
            >
              <option value="all">All</option>
              <option value="yes">Fil+</option>
              <option value="no">Standard</option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm">
            <span class="text-base-content/60">Proving</span>
            <select
              v-model="filters.proving"
              class="select select-bordered select-sm w-28"
            >
              <option value="all">All</option>
              <option value="yes">Active</option>
              <option value="no">Idle</option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm">
            <span class="text-base-content/60">On Chain</span>
            <select
              v-model="filters.onChain"
              class="select select-bordered select-sm w-28"
            >
              <option value="all">All</option>
              <option value="yes">On Chain</option>
              <option value="no">Off Chain</option>
            </select>
          </label>

          <label class="flex items-center gap-2 text-sm">
            <span class="text-base-content/60">Flag</span>
            <select
              v-model="filters.flagged"
              class="select select-bordered select-sm w-32"
            >
              <option value="all">All</option>
              <option value="yes">Flagged</option>
              <option value="no">Clear</option>
            </select>
          </label>
        </div>
      </template>

      <template #actions>
        <div class="flex items-center gap-3">
          <button
            v-if="helpers.hasActiveFilters.value"
            class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content"
            @click="clearAllFilters"
          >
            <XMarkIcon class="h-4 w-4" />
            Clear Filters
          </button>
          <button
            class="btn btn-error btn-sm"
            :disabled="selectedCount === 0"
            @click="handleOpenTerminateDialog"
          >
            Terminate Selected ({{ selectedCount }})
          </button>
        </div>
      </template>

      <template #stats>
        <span class="font-medium">{{ filteredRowCount }}</span>
        <span class="text-base-content/60">visible sectors</span>
      </template>
    </TableControls>

    <div class="border-base-300 bg-base-100 rounded-lg border shadow-md">
      <div ref="scrollContainer" class="max-h-[65vh] overflow-y-auto">
        <table class="table-pin-rows table-zebra table w-full">
          <thead class="bg-base-200 sticky top-0 z-10">
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="border-base-300 border-b"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :colspan="header.colSpan"
                class="border-base-200 bg-transparent px-3 py-3 text-left text-sm font-semibold"
                :class="{
                  'cursor-pointer select-none': header.column.getCanSort(),
                }"
                @click="
                  header.column.getCanSort() &&
                  header.column.getToggleSortingHandler()?.($event)
                "
              >
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
              </th>
            </tr>
          </thead>

          <tbody>
            <template v-if="error">
              <tr>
                <td :colspan="visibleColumnCount" class="py-10 text-center">
                  <div
                    class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
                  >
                    <InformationCircleIcon class="text-error h-8 w-8" />
                  </div>
                  <h3 class="text-base-content mb-2 text-lg font-semibold">
                    Unable to load sectors
                  </h3>
                  <p class="text-base-content/70 mb-4 text-sm">
                    {{ error.message }}
                  </p>
                  <button
                    class="btn btn-outline btn-sm"
                    :disabled="loading"
                    @click="onRefresh"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            </template>

            <template v-else-if="loading && rawData.length === 0">
              <tr>
                <td
                  :colspan="visibleColumnCount"
                  class="text-base-content/60 py-12 text-center"
                >
                  <div
                    class="loading loading-spinner loading-lg mx-auto mb-4"
                  />
                  Loading sectors...
                </td>
              </tr>
            </template>

            <template v-else-if="!hasVisibleRows">
              <tr>
                <td
                  :colspan="visibleColumnCount"
                  class="text-base-content/60 py-16 text-center"
                >
                  <div
                    class="border-base-300 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-dashed"
                  >
                    <CheckIcon class="text-base-content/50 h-6 w-6" />
                  </div>
                  No sectors match the current filters.
                </td>
              </tr>
            </template>

            <template v-else>
              <tr v-if="paddingTop > 0" class="border-0">
                <td :colspan="visibleColumnCount" class="p-0">
                  <div :style="{ height: `${paddingTop}px` }"></div>
                </td>
              </tr>

              <tr
                v-for="{ virtualItem, row } in virtualRows"
                :key="row.id"
                :class="[
                  getTableRowClasses(true),
                  'bg-base-100',
                  selectedKeys.has(getRowKey(row.original))
                    ? 'selected-row [&>td]:bg-primary/5'
                    : '',
                ]"
                :style="{ height: `${virtualItem.size}px` }"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :title="handlers.getCellTooltip(cell)"
                  class="border-base-200 border-r px-3 py-3 text-sm last:border-r-0"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </td>
              </tr>

              <tr v-if="paddingBottom > 0" class="border-0">
                <td :colspan="visibleColumnCount" class="p-0">
                  <div :style="{ height: `${paddingBottom}px` }"></div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="terminationError" class="alert alert-error">
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="h-5 w-5 shrink-0" />
        <div>
          <p class="font-semibold">Termination failed</p>
          <p class="text-error-content/80 text-sm">{{ terminationError }}</p>
        </div>
        <button class="btn btn-ghost btn-xs" @click="terminationError = null">
          Dismiss
        </button>
      </div>
    </div>

    <ConfirmationDialog
      v-model:show="showTerminateDialog"
      title="Terminate selected sectors"
      :message="`You are about to terminate ${selectedItems.length} sector(s). This action cannot be undone.`"
      confirm-text="Terminate"
      cancel-text="Cancel"
      type="danger"
      :loading="isTerminating"
      @confirm="handleTerminateConfirm"
      @cancel="handleTerminateCancel"
    >
      <template #description>
        <p class="mb-2">Confirm termination for the following sectors:</p>
        <ul class="max-h-40 space-y-1 overflow-y-auto text-sm">
          <li
            v-for="item in selectedItems"
            :key="getRowKey(item)"
            class="font-mono"
          >
            {{ item.MinerAddress }} · {{ item.SectorNum }}
          </li>
        </ul>
      </template>
    </ConfirmationDialog>

    <ItemDetailsModal
      :show="showModal"
      :item="selectedItem"
      @update:show="showModal = $event"
      @close="handleModalClose"
    >
      <template #title="{ item }">
        <div class="flex items-center gap-3">
          <div>
            <h3 class="text-lg font-semibold">Sector Details</h3>
            <p class="text-base-content/70 font-mono text-sm">
              {{ item?.MinerAddress }} · {{ item?.SectorNum }}
            </p>
          </div>
        </div>
      </template>

      <template #main-content>
        <div class="space-y-4">
          <div v-if="sectorInfoQuery.loading.value" class="py-6 text-center">
            <div class="loading loading-spinner loading-lg mx-auto" />
            <p class="text-base-content/70 mt-3 text-sm">
              Loading sector information...
            </p>
          </div>

          <div
            v-else-if="sectorInfoQuery.error.value"
            class="alert alert-error"
          >
            <ExclamationTriangleIcon class="h-5 w-5" />
            <span>
              Failed to load detailed sector information. Please try again
              later.
            </span>
          </div>

          <dl v-else class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <template v-for="[key, value] in detailEntries" :key="key">
              <div>
                <dt class="text-base-content/60">{{ key }}</dt>
                <dd class="text-base-content font-mono">
                  {{
                    typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)
                  }}
                </dd>
              </div>
            </template>
          </dl>
        </div>
      </template>
    </ItemDetailsModal>
  </div>
</template>
