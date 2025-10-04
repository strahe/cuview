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
import { getDealStatus, getProgressFromStatus } from "@/utils/market";
import { formatBytes, formatDateTime } from "@/utils/format";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { MK12Pipeline, PipelineTableEntry } from "@/types/market";
import CopyButton from "@/components/ui/CopyButton.vue";

interface Props {
  items?: MK12Pipeline[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => {
  if (!props.items || props.items.length === 0) {
    return [];
  }

  return props.items.map(
    (item) =>
      ({
        ...item,
        id: `pipeline-${item.uuid}`,
      }) as PipelineTableEntry,
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

const renderProgressBar = (status: string) => {
  const progress = getProgressFromStatus(status);

  return h("div", { class: "space-y-1" }, [
    h("div", { class: "text-xs text-base-content/70 font-mono" }, status),
    h(
      "div",
      { class: "w-full bg-base-300 rounded-full h-1.5 overflow-hidden" },
      [
        h("div", {
          class: "bg-primary h-full transition-all duration-300",
          style: { width: `${progress}%` },
        }),
      ],
    ),
  ]);
};

const columnHelper = createColumnHelper<PipelineTableEntry>();

const columns = [
  columnHelper.accessor("created_at", {
    header: "Created At",
    size: 140,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatDateTime(info.getValue())),
  }),
  columnHelper.accessor("uuid", {
    header: "UUID",
    size: 200,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      truncateWithCopy(
        info.getValue(),
        8,
        4,
        `Copy pipeline UUID ${info.getValue()}`,
      ),
  }),
  columnHelper.accessor("miner", {
    header: "SP ID",
    size: 120,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "font-mono text-sm text-primary" }, info.getValue()),
  }),
  columnHelper.accessor("piece_cid", {
    header: "Piece CID",
    size: 200,
    enableGrouping: false,
    cell: (info) =>
      truncateWithCopy(
        info.getValue(),
        12,
        6,
        `Copy piece CID ${info.getValue()}`,
      ),
  }),
  columnHelper.accessor("piece_size", {
    header: "Piece Size",
    size: 120,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatBytes(info.getValue())),
  }),
  columnHelper.display({
    id: "status",
    header: "Status",
    size: 250,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const deal = info.row.original;
      const status = getDealStatus(deal);
      return renderProgressBar(status);
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<PipelineTableEntry>({
    tableId: "dealPipelinesTable",
    columns: columns as ColumnDef<PipelineTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "created_at", desc: true }],
    getRowId: (row) => `pipeline-${row.uuid}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "uuid":
      return `${data.length} pipelines`;
    case "miner": {
      const uniqueMiners = new Set(data.map((p) => p.miner));
      return `${uniqueMiners.size} unique SPs`;
    }
    case "piece_size": {
      const totalSize = data.reduce((sum, p) => sum + p.piece_size, 0);
      return `Total: ${formatBytes(totalSize)}`;
    }
    case "status": {
      const complete = data.filter((p) => p.complete).length;
      const indexed = data.filter((p) => p.indexed && !p.complete).length;
      return `${complete} complete, ${indexed} indexed`;
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
      search-placeholder="Search pipelines..."
      :loading="props.loading"
      @refresh="props.onRefresh"
    >
      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> pipelines
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
                <div>Loading pipelines...</div>
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
                <div>No pipelines found</div>
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
                class="border-base-300/30 border-r px-3 py-3 text-sm last:border-r-0"
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
