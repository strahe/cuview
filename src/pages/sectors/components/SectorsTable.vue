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
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";

import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import ItemDetailsModal from "@/components/table/ItemDetailsModal.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import DataTable from "@/components/ui/DataTable.vue";
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
      return h(
        "span",
        {
          class: "font-mono text-xs",
        },
        value ? "true" : "false",
      );
    },
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const value = row.getValue<boolean>(columnId);
      return filterValue === "yes" ? value : !value;
    },
  }),
  columnHelper.accessor("HasSealed", {
    id: "hasSealed",
    header: "Has Sealed",
    size: 110,
    cell: (info) =>
      h(
        "span",
        {
          class: "font-mono text-xs",
        },
        info.getValue() ? "true" : "false",
      ),
  }),
  columnHelper.accessor("HasUnsealed", {
    id: "hasUnsealed",
    header: "Has Unsealed",
    size: 120,
    cell: (info) =>
      h(
        "span",
        {
          class: "font-mono text-xs",
        },
        info.getValue() ? "true" : "false",
      ),
  }),
  columnHelper.accessor("HasSnap", {
    id: "hasSnap",
    header: "Has Snap",
    size: 110,
    cell: (info) =>
      h(
        "span",
        {
          class: "font-mono text-xs",
        },
        info.getValue() ? "true" : "false",
      ),
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
      return h(
        "span",
        {
          class: "font-mono text-xs",
        },
        value ? "true" : "false",
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
  showRawPayload.value = false;
  try {
    await sectorInfoQuery.execute(sector.MinerAddress, sector.SectorNum);
  } catch (error) {
    console.error("Failed to load sector info", error);
  }
};

const humanizeKey = (key: string) =>
  key
    .replace(/[_-]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

interface SummaryCardDefinition {
  id: string;
  label: string;
  value: string;
  valueClass?: string;
  helper?: string;
}

interface DetailField {
  key: string;
  label: string;
  value: unknown;
  format?: "text" | "mono" | "boolean" | "cid" | "code";
}

interface LocationRow {
  id: string;
  pathType: string;
  fileType: string;
  storageId: string;
  urls: string[];
}

interface RawLocationDetail {
  StorageID?: string | null;
  Urls?: (string | null | undefined)[] | null;
}

interface RawLocationEntry {
  PathType?: string | null;
  FileType?: string | null;
  Locations?: RawLocationDetail[] | null;
}

type DetailContent = {
  overview: DetailField[];
  state: DetailField[];
  chainMessages: DetailField[];
  cids: DetailField[];
  additional: DetailField[];
  locations: LocationRow[];
  rawPayload: string | null;
};

const showRawPayload = ref(false);

const summaryCards = computed<SummaryCardDefinition[]>(() => {
  const item = selectedItem.value;
  if (!item) return [];

  return [
    {
      id: "onChain",
      label: "On Chain",
      value: item.IsOnChain ? "On Chain" : "Off Chain",
      valueClass: item.IsOnChain ? "text-success" : "text-warning",
      helper: item.IsOnChain
        ? "Sector registered on chain"
        : "Awaiting chain inclusion",
    },
    {
      id: "proving",
      label: "Proving Window",
      value: item.Proving ? "Active" : "Idle",
      valueClass: item.Proving ? "text-success" : "text-base-content/60",
      helper: item.Proving ? "Sector currently proving" : "No active proof",
    },
    {
      id: "dealWeight",
      label: "Deal Weight",
      value: item.DealWeight || "—",
      valueClass: "text-info",
      helper: item.SealInfo || undefined,
    },
  ];
});

const detailContent = computed<DetailContent>(() => {
  const detail = sectorInfoQuery.data.value ?? null;
  const item = selectedItem.value ?? null;
  const usedKeys = new Set<string>();

  const hasOwn = (object: Record<string, unknown>, key: string) =>
    Object.prototype.hasOwnProperty.call(object, key);

  const readDetailValue = (key: string) => {
    if (!detail || !hasOwn(detail, key)) return undefined;
    usedKeys.add(key);
    return detail[key];
  };

  const createField = (
    target: DetailField[],
    key: string,
    label: string,
    format: DetailField["format"] = "text",
    fallback?: unknown,
  ) => {
    let value = readDetailValue(key);
    if (value === undefined && fallback !== undefined) {
      value = fallback;
    }
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return;
    }
    if (format === "code" && typeof value !== "string") {
      value = JSON.stringify(value, null, 2);
    }
    if (format === "cid") {
      value = String(value);
    }
    target.push({
      key,
      label,
      value,
      format,
    });
  };

  const overview: DetailField[] = [];
  createField(
    overview,
    "SectorNumber",
    "Sector Number",
    "mono",
    item?.SectorNum,
  );
  createField(overview, "SpID", "Storage Provider ID", "mono");
  createField(overview, "Miner", "Miner Address", "mono", item?.MinerAddress);
  createField(overview, "SealProof", "Seal Proof");
  createField(overview, "ActivationEpoch", "Activation Epoch", "mono");
  createField(
    overview,
    "ExpirationEpoch",
    "Expiration Epoch",
    "mono",
    item?.ExpiresAt,
  );
  createField(overview, "Deadline", "Deadline", "mono");
  createField(overview, "Partition", "Partition", "mono");
  createField(overview, "DealWeight", "Deal Weight", "mono", item?.DealWeight);
  createField(overview, "Deals", "Deals", "text", item?.Deals);
  createField(overview, "SealInfo", "Seal Info", "text", item?.SealInfo);

  const state: DetailField[] = [];
  createField(state, "IsOnChain", "On Chain", "boolean", item?.IsOnChain);
  createField(state, "Proving", "Proving", "boolean", item?.Proving);
  createField(
    state,
    "HasSealed",
    "Has Sealed Copy",
    "boolean",
    item?.HasSealed,
  );
  createField(
    state,
    "HasUnsealed",
    "Has Unsealed Copy",
    "boolean",
    item?.HasUnsealed,
  );
  createField(state, "HasSnap", "Has Snap", "boolean", item?.HasSnap);
  createField(state, "IsSnap", "Snap Upgrade", "boolean");
  createField(state, "UnsealedState", "Unsealed State");

  const chainMessages: DetailField[] = [];
  createField(chainMessages, "PreCommitMsg", "Pre-Commit Message", "cid");
  createField(chainMessages, "CommitMsg", "Prove Commit Message", "cid");
  createField(chainMessages, "UpdateMsg", "Update Message", "cid");

  const cids: DetailField[] = [];
  createField(cids, "UnsealedCid", "Unsealed CID", "cid");
  createField(cids, "SealedCid", "Sealed CID", "cid");
  createField(cids, "UpdatedUnsealedCid", "Updated Unsealed CID", "cid");
  createField(cids, "UpdatedSealedCid", "Updated Sealed CID", "cid");

  const locations: LocationRow[] = [];
  const rawLocations = readDetailValue("Locations");
  if (Array.isArray(rawLocations)) {
    (rawLocations as RawLocationEntry[]).forEach((entry, entryIndex) => {
      if (!entry) return;
      const pathType =
        entry.PathType && entry.PathType.trim() ? entry.PathType : "—";
      const fileType =
        entry.FileType && entry.FileType.trim() ? entry.FileType : "—";
      const innerLocations = Array.isArray(entry.Locations)
        ? (entry.Locations ?? [])
        : [];
      if (!innerLocations.length) {
        locations.push({
          id: `${entryIndex}-empty`,
          pathType,
          fileType,
          storageId: "—",
          urls: [],
        });
        return;
      }
      innerLocations.forEach(
        (loc: RawLocationDetail | null | undefined, locIndex) => {
          if (!loc) return;
          const storageId =
            loc.StorageID && loc.StorageID.trim() ? loc.StorageID : "—";
          const urls = Array.isArray(loc.Urls)
            ? loc.Urls.filter(
                (url): url is string =>
                  typeof url === "string" && url.trim().length > 0,
              )
            : [];
          locations.push({
            id: `${entryIndex}-${locIndex}`,
            pathType,
            fileType,
            storageId,
            urls,
          });
        },
      );
    });
  }

  const additional: DetailField[] = [];
  if (detail) {
    Object.entries(detail).forEach(([key, value]) => {
      if (usedKeys.has(key)) return;
      const format: DetailField["format"] =
        typeof value === "boolean"
          ? "boolean"
          : typeof value === "number"
            ? "mono"
            : typeof value === "object" && value !== null
              ? "code"
              : "text";
      let display: unknown = value;
      if (format === "code" && typeof value !== "string") {
        display = JSON.stringify(value, null, 2);
      }
      additional.push({
        key,
        label: humanizeKey(key),
        value: display,
        format,
      });
    });
  }

  return {
    overview,
    state,
    chainMessages,
    cids,
    additional,
    locations,
    rawPayload: detail ? JSON.stringify(detail, null, 2) : null,
  };
});

const hasDetailData = computed(() => {
  const content = detailContent.value;
  return (
    content.overview.length > 0 ||
    content.state.length > 0 ||
    content.chainMessages.length > 0 ||
    content.cids.length > 0 ||
    content.locations.length > 0 ||
    content.additional.length > 0 ||
    !!content.rawPayload
  );
});

const getBooleanBadgeClass = (value: boolean) =>
  value
    ? "badge badge-sm border-none bg-success/10 text-success"
    : "badge badge-sm border-none bg-base-300 text-base-content/70";

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
      :show-refresh="false"
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
      dialog-class="w-[95vw] max-w-5xl"
      @update:show="showModal = $event"
      @close="handleModalClose"
    >
      <template #title="{ item }">
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold">Sector Details</h3>
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-base-content/70 font-mono text-sm">
              {{ item?.MinerAddress }} · {{ item?.SectorNum }}
            </p>
            <span
              v-if="item?.SealInfo"
              class="badge badge-outline badge-sm border-base-300 bg-base-200/80"
            >
              {{ item.SealInfo }}
            </span>
          </div>
        </div>
      </template>

      <template #header-stats>
        <div
          v-if="summaryCards.length"
          class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <div
            v-for="card in summaryCards"
            :key="card.id"
            class="border-base-300 bg-base-100 rounded-md border p-3 shadow-sm"
          >
            <div class="text-base-content/60 text-xs tracking-wide">
              {{ card.label }}
            </div>
            <div class="mt-2 text-lg font-semibold" :class="card.valueClass">
              {{ card.value }}
            </div>
            <p
              v-if="card.helper"
              class="text-base-content/60 mt-1 text-xs leading-relaxed"
            >
              {{ card.helper }}
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

          <div
            v-else-if="!hasDetailData"
            class="border-base-300 bg-base-100 text-base-content/70 rounded-lg border p-6 text-center text-sm"
          >
            No additional metadata is available for this sector.
          </div>

          <template v-else>
            <section
              v-if="detailContent.overview.length"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <div class="card-header border-base-300 border-b px-4 py-3">
                <h4 class="text-base font-semibold">Sector Overview</h4>
              </div>
              <div class="card-body px-4 py-4">
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div
                    v-for="field in detailContent.overview"
                    :key="field.key"
                    class="space-y-1"
                  >
                    <div class="text-base-content/60 text-xs font-medium">
                      {{ field.label }}
                    </div>
                    <div
                      class="text-base-content text-sm leading-snug"
                      :class="
                        field.format === 'mono' ? 'font-mono break-all' : ''
                      "
                    >
                      <template v-if="field.format === 'boolean'">
                        <span
                          :class="getBooleanBadgeClass(Boolean(field.value))"
                        >
                          {{ Boolean(field.value) ? "Yes" : "No" }}
                        </span>
                      </template>
                      <template v-else-if="field.format === 'cid'">
                        <div class="flex items-start gap-2">
                          <span
                            class="flex-1 font-mono text-xs leading-relaxed break-all"
                          >
                            {{ field.value }}
                          </span>
                          <CopyButton
                            :value="String(field.value)"
                            variant="ghost"
                            size="xs"
                            :icon-only="true"
                            :aria-label="`Copy ${field.label}`"
                            extra-class="shrink-0"
                          />
                        </div>
                      </template>
                      <template v-else-if="field.format === 'code'">
                        <pre
                          class="bg-base-200/70 text-base-content/80 max-h-48 overflow-auto rounded-md p-2 font-mono text-xs"
                          >{{ field.value }}</pre
                        >
                      </template>
                      <template v-else>
                        {{ field.value }}
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              v-if="detailContent.state.length"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <div class="card-header border-base-300 border-b px-4 py-3">
                <h4 class="text-base font-semibold">State & Copies</h4>
              </div>
              <div class="card-body p-0">
                <DataTable :compact="true">
                  <tbody>
                    <tr
                      v-for="field in detailContent.state"
                      :key="field.key"
                      class="hover"
                    >
                      <th
                        class="text-base-content/60 w-56 px-4 py-3 text-left text-xs"
                      >
                        {{ field.label }}
                      </th>
                      <td class="text-base-content px-4 py-3 text-sm">
                        <template v-if="field.format === 'boolean'">
                          <span
                            :class="getBooleanBadgeClass(Boolean(field.value))"
                          >
                            {{ Boolean(field.value) ? "Yes" : "No" }}
                          </span>
                        </template>
                        <template v-else>
                          <span class="font-mono">{{ field.value }}</span>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </section>

            <section
              v-if="detailContent.chainMessages.length"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <div class="card-header border-base-300 border-b px-4 py-3">
                <h4 class="text-base font-semibold">Chain Messages</h4>
              </div>
              <div class="card-body p-0">
                <DataTable :compact="true">
                  <tbody>
                    <tr
                      v-for="field in detailContent.chainMessages"
                      :key="field.key"
                      class="hover"
                    >
                      <th
                        class="text-base-content/60 w-56 px-4 py-3 text-left text-xs"
                      >
                        {{ field.label }}
                      </th>
                      <td class="text-base-content px-4 py-3 text-sm">
                        <div class="flex items-start gap-2">
                          <span
                            class="flex-1 font-mono text-xs leading-relaxed break-all"
                          >
                            {{ field.value }}
                          </span>
                          <CopyButton
                            :value="String(field.value)"
                            variant="ghost"
                            size="xs"
                            :icon-only="true"
                            :aria-label="`Copy ${field.label}`"
                            extra-class="shrink-0"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </section>

            <section
              v-if="detailContent.cids.length"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <div class="card-header border-base-300 border-b px-4 py-3">
                <h4 class="text-base font-semibold">Content Identifiers</h4>
              </div>
              <div class="card-body p-0">
                <DataTable :compact="true">
                  <tbody>
                    <tr
                      v-for="field in detailContent.cids"
                      :key="field.key"
                      class="hover"
                    >
                      <th
                        class="text-base-content/60 w-56 px-4 py-3 text-left text-xs"
                      >
                        {{ field.label }}
                      </th>
                      <td class="text-base-content px-4 py-3 text-sm">
                        <div class="flex items-start gap-2">
                          <span
                            class="flex-1 font-mono text-xs leading-relaxed break-all"
                          >
                            {{ field.value }}
                          </span>
                          <CopyButton
                            :value="String(field.value)"
                            variant="ghost"
                            size="xs"
                            :icon-only="true"
                            :aria-label="`Copy ${field.label}`"
                            extra-class="shrink-0"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </section>

            <section
              v-if="detailContent.locations.length"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <div class="card-header border-base-300 border-b px-4 py-3">
                <h4 class="text-base font-semibold">Locations</h4>
              </div>
              <div class="card-body p-0">
                <DataTable :compact="true">
                  <thead>
                    <tr class="text-base-content/60 text-xs tracking-wide">
                      <th class="px-4 py-3">Path Type</th>
                      <th class="px-4 py-3">File Type</th>
                      <th class="px-4 py-3">Storage ID</th>
                      <th class="px-4 py-3">URLs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in detailContent.locations"
                      :key="row.id"
                      class="align-top text-sm"
                    >
                      <td class="px-4 py-3 font-mono text-xs">
                        {{ row.pathType }}
                      </td>
                      <td class="px-4 py-3 font-mono text-xs">
                        {{ row.fileType }}
                      </td>
                      <td class="px-4 py-3 font-mono text-xs">
                        {{ row.storageId }}
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="url in row.urls"
                            :key="url"
                            class="badge badge-outline badge-xs"
                          >
                            {{ url }}
                          </span>
                          <span
                            v-if="!row.urls.length"
                            class="text-base-content/60 text-xs"
                          >
                            —
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </section>

            <section
              v-if="detailContent.additional.length"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <div class="card-header border-base-300 border-b px-4 py-3">
                <h4 class="text-base font-semibold">Additional Fields</h4>
              </div>
              <div class="card-body p-0">
                <DataTable :compact="true">
                  <tbody>
                    <tr
                      v-for="field in detailContent.additional"
                      :key="field.key"
                      class="hover"
                    >
                      <th
                        class="text-base-content/60 w-56 px-4 py-3 text-left text-xs"
                      >
                        {{ field.label }}
                      </th>
                      <td class="text-base-content px-4 py-3 text-sm">
                        <template v-if="field.format === 'boolean'">
                          <span
                            :class="getBooleanBadgeClass(Boolean(field.value))"
                          >
                            {{ Boolean(field.value) ? "Yes" : "No" }}
                          </span>
                        </template>
                        <template v-else-if="field.format === 'cid'">
                          <div class="flex items-start gap-2">
                            <span
                              class="flex-1 font-mono text-xs leading-relaxed break-all"
                            >
                              {{ field.value }}
                            </span>
                            <CopyButton
                              :value="String(field.value)"
                              variant="ghost"
                              size="xs"
                              :icon-only="true"
                              :aria-label="`Copy ${field.label}`"
                              extra-class="shrink-0"
                            />
                          </div>
                        </template>
                        <template v-else-if="field.format === 'code'">
                          <pre
                            class="bg-base-200/70 text-base-content/80 max-h-48 overflow-auto rounded-md p-2 font-mono text-xs"
                            >{{ field.value }}</pre
                          >
                        </template>
                        <template v-else>
                          <span
                            :class="
                              field.format === 'mono'
                                ? 'font-mono break-all'
                                : ''
                            "
                          >
                            {{ field.value }}
                          </span>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </section>

            <section
              v-if="detailContent.rawPayload"
              class="card bg-base-100 border-base-300 border shadow-sm"
            >
              <button
                class="card-header border-base-300 text-base-content hover:bg-base-200/40 border-b px-4 py-3 text-left text-sm font-semibold transition"
                type="button"
                @click="showRawPayload = !showRawPayload"
              >
                <div class="flex items-center justify-between">
                  <span>Raw Payload</span>
                  <ChevronDownIcon
                    class="h-4 w-4 transition-transform duration-200"
                    :class="showRawPayload ? 'rotate-180' : ''"
                  />
                </div>
              </button>
              <transition name="fade">
                <pre
                  v-if="showRawPayload"
                  class="border-base-300 bg-base-200/70 text-base-content/80 max-h-96 overflow-auto border-t p-3 font-mono text-xs"
                  v-text="detailContent.rawPayload"
                />
              </transition>
            </section>
          </template>
        </div>
      </template>
    </ItemDetailsModal>
  </div>
</template>
