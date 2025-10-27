<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { getTableRowClasses } from "@/utils/ui";
import { formatBytes, formatDateTime } from "@/utils/format";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { OpenDealInfo, PendingDealTableEntry } from "@/types/market";
import CopyButton from "@/components/ui/CopyButton.vue";

interface Props {
  items?: OpenDealInfo[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

interface Emits {
  (e: "seal-now", payload: { spId: number; sectorNumber: number }): void;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
});

const emit = defineEmits<Emits>();

const rawData = computed(() => {
  if (!props.items || props.items.length === 0) {
    return [];
  }

  return props.items.map(
    (item) =>
      ({
        ...item,
        id: `pending-deal-${item.Actor}-${item.SectorNumber}`,
      }) as PendingDealTableEntry,
  );
});

const truncateWithCopy = (
  text: string,
  startLen: number,
  endLen: number,
  ariaLabel: string,
) => {
  const displayText =
    text.length <= startLen + endLen
      ? text
      : `${text.substring(0, startLen)}...${text.substring(text.length - endLen)}`;

  return h("div", { class: "flex items-center gap-2" }, [
    h("span", { class: "font-mono text-sm" }, displayText),
    h(
      "div",
      {
        onClick: (event: MouseEvent) => event.stopPropagation(),
      },
      [
        h(CopyButton, {
          value: text,
          iconOnly: true,
          ariaLabel,
          extraClass: "border border-transparent",
        }),
      ],
    ),
  ]);
};

const renderSealNowButton = (deal: PendingDealTableEntry) => {
  return h(
    "button",
    {
      class: "btn btn-primary btn-sm",
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        emit("seal-now", {
          spId: deal.Actor,
          sectorNumber: deal.SectorNumber,
        });
      },
    },
    "Seal Now",
  );
};

const renderSnapBadge = (isSnap: boolean) => {
  return h(
    "div",
    {
      class: isSnap
        ? "badge badge-success badge-sm"
        : "badge badge-neutral badge-sm",
    },
    isSnap ? "Snap" : "Regular",
  );
};

const columnHelper = createColumnHelper<PendingDealTableEntry>();

const columns = [
  columnHelper.accessor("Miner", {
    header: "SP ID",
    size: 120,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "font-mono text-sm text-primary" }, info.getValue()),
  }),
  columnHelper.accessor("SectorNumber", {
    header: "Sector Number",
    size: 120,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("PieceCID", {
    header: "Piece CID",
    size: 220,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      truncateWithCopy(
        info.getValue(),
        12,
        6,
        `Copy piece CID ${info.getValue()}`,
      ),
  }),
  columnHelper.accessor("PieceSize", {
    header: "Piece Size",
    size: 120,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatBytes(info.getValue())),
  }),
  columnHelper.accessor("CreatedAt", {
    header: "Created At",
    size: 140,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatDateTime(info.getValue())),
  }),
  columnHelper.accessor("SnapDeals", {
    header: "Snap Deal",
    size: 100,
    enableGrouping: false,
    cell: (info) => renderSnapBadge(info.getValue()),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 120,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => renderSealNowButton(info.row.original),
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<PendingDealTableEntry>({
    tableId: "pendingDealsTable",
    columns: columns as ColumnDef<PendingDealTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "CreatedAt", desc: true }],
    getRowId: (row) => row.id,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "Miner": {
      const uniqueMiners = new Set(data.map((d) => d.Miner));
      return `${uniqueMiners.size} unique SPs`;
    }
    case "SectorNumber":
      return `${data.length} sectors`;
    case "PieceSize": {
      const totalSize = data.reduce((sum, d) => sum + d.PieceSize, 0);
      return `Total: ${formatBytes(totalSize)}`;
    }
    case "SnapDeals": {
      const snapCount = data.filter((d) => d.SnapDeals).length;
      const regularCount = data.length - snapCount;
      return `${snapCount} Snap, ${regularCount} Regular`;
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
      search-placeholder="Search SP, Piece CID or Sector..."
      :loading="props.loading"
      @refresh="props.onRefresh"
    >
      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> pending deals
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
                <div>Loading pending deals...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <ClipboardDocumentListIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No pending deals</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[getTableRowClasses(), 'bg-base-100']"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :title="getCellTooltip(cell)"
                class="border-base-200 border-r px-3 py-3 text-sm last:border-r-0"
                @contextmenu="handleCellRightClick(cell, $event)"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
