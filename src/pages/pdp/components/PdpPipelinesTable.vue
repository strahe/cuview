<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from "vue";
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
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import { getTableRowClasses } from "@/utils/ui";
import { formatDateTime } from "@/utils/format";
import { getProgressFromStatus } from "@/utils/market";
import { getPdpPipelineStatus, formatPieceCidShort } from "@/utils/pdp";
import type { PdpPipeline } from "../types";

interface Props {
  items?: PdpPipeline[];
  loading?: boolean;
  error?: Error | null;
  totalItems?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
  paginationError?: Error | null;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  totalItems: 0,
  hasMore: false,
  loadingMore: false,
  paginationError: null,
});

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "load-more"): void;
  (e: "retry-pagination"): void;
}>();

interface TableEntry extends PdpPipeline {
  rowId: string;
}

const rawData = computed<TableEntry[]>(() => {
  if (!props.items || props.items.length === 0) {
    return [];
  }

  return props.items.map((item) => ({
    ...item,
    rowId: `pdp-pipeline-${item.id}`,
  }));
});

const truncateWithCopy = (
  value: string,
  start: number,
  end: number,
  ariaLabel: string,
) => {
  const display =
    value.length <= start + end
      ? value
      : `${value.slice(0, start)}...${value.slice(-end)}`;

  return h("div", { class: "flex items-center gap-2" }, [
    h("span", { class: "font-mono text-sm" }, display),
    h(
      "div",
      {
        onClick: (event: MouseEvent) => event.stopPropagation(),
      },
      [
        h(CopyButton, {
          value,
          iconOnly: true,
          ariaLabel,
          extraClass: "border border-transparent",
        }),
      ],
    ),
  ]);
};

const renderStatus = (pipeline: PdpPipeline) => {
  const status = getPdpPipelineStatus(pipeline);
  const progress = getProgressFromStatus(status);

  return h("div", { class: "space-y-1" }, [
    h("div", { class: "font-mono text-xs text-base-content" }, status),
    h(
      "div",
      { class: "h-1.5 w-full overflow-hidden rounded-full bg-base-300" },
      [
        h("div", {
          class: "h-full bg-primary transition-all duration-300",
          style: { width: `${progress}%` },
        }),
      ],
    ),
  ]);
};

const columnHelper = createColumnHelper<TableEntry>();

const columns = [
  columnHelper.accessor("created_at", {
    header: "Created At",
    size: 160,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatDateTime(info.getValue())),
  }),
  columnHelper.accessor("id", {
    header: "Pipeline ID",
    size: 200,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      truncateWithCopy(
        info.getValue(),
        10,
        6,
        `Copy pipeline ID ${info.getValue()}`,
      ),
  }),
  columnHelper.accessor("miner", {
    header: "SP ID",
    size: 140,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "font-mono text-sm text-primary" }, info.getValue()),
  }),
  columnHelper.accessor("piece_cid_v2", {
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
  columnHelper.display({
    id: "status",
    header: "Status",
    size: 260,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => renderStatus(info.row.original),
  }),
];

const { table, store, helpers, handlers } = useStandardTable<TableEntry>({
  tableId: "pdpPipelinesTable",
  columns: columns as ColumnDef<TableEntry>[],
  data: rawData,
  defaultSorting: [{ id: "created_at", desc: true }],
  enableGrouping: false,
  getRowId: (row) => row.rowId,
});

const { hasData: tableHasData, totalItems: filteredTotal } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;
const tableRows = computed(() => table.getRowModel().rows);

const containerRef = ref<HTMLDivElement | null>(null);
const tableHeight = ref("600px");

const updateHeight = () => {
  const available = window.innerHeight - 260;
  const minHeight = 420;
  tableHeight.value = `${Math.max(available, minHeight)}px`;
};

onMounted(() => {
  updateHeight();
  window.addEventListener("resize", updateHeight);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateHeight);
});

const handleScroll = (event: Event) => {
  const element = event.target as HTMLElement;
  const { scrollTop, clientHeight, scrollHeight } = element;
  const progress = (scrollTop + clientHeight) / scrollHeight;

  if (progress > 0.7 && props.hasMore && !props.loadingMore) {
    emit("load-more");
  }
};

const getColumnAggregateInfo = (columnId: string) => {
  const items = rawData.value;
  if (!items.length) return "";

  switch (columnId) {
    case "miner": {
      const unique = new Set(items.map((pipeline) => pipeline.miner));
      return `${unique.size} unique SPs`;
    }
    case "piece_cid_v2": {
      const [firstItem] = items;
      if (!firstItem) return "";
      return `Latest: ${formatPieceCidShort(firstItem.piece_cid_v2)}`;
    }
    case "status": {
      const complete = items.filter((pipeline) => pipeline.complete).length;
      return `${complete} complete`;
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
      search-placeholder="Search PDP pipelines..."
      :loading="props.loading"
      @refresh="emit('refresh')"
    >
      <template #stats>
        <span class="font-medium">{{ props.totalItems || filteredTotal }}</span>
        <span class="text-base-content ml-1">pipelines loaded</span>
      </template>
    </TableControls>

    <div
      ref="containerRef"
      class="border-base-300 bg-base-100 overflow-auto rounded-lg border shadow-md"
      :style="{ height: tableHeight }"
      @scroll.passive="handleScroll"
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
              :colspan="header.colSpan"
              class="border-base-200 border-r px-3 py-3 text-left font-medium last:border-r-0"
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
              <td
                :colspan="table.getAllColumns().length"
                class="py-12 text-center"
              >
                <div
                  class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
                >
                  <ExclamationTriangleIcon class="text-error h-8 w-8" />
                </div>
                <h3 class="text-base-content mb-2 text-lg font-semibold">
                  Connection Error
                </h3>
                <p class="text-base-content mb-4 text-sm">
                  {{ props.error.message }}
                </p>
                <button
                  class="btn btn-outline btn-sm"
                  :disabled="props.loading"
                  @click="emit('refresh')"
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
                :colspan="table.getAllColumns().length"
                class="text-base-content py-12 text-center"
              >
                <div
                  class="loading loading-spinner loading-lg mx-auto mb-4"
                ></div>
                <div>Loading PDP pipelines...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="table.getAllColumns().length"
                class="text-base-content py-8 text-center"
              >
                <ClipboardDocumentListIcon
                  class="text-base-content mx-auto mb-2 h-12 w-12"
                />
                <div>No pipelines found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in tableRows"
              :key="row.id"
              :class="[getTableRowClasses(true), 'bg-base-100']"
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

      <div
        v-if="props.hasMore || props.loadingMore || props.paginationError"
        class="border-base-300 bg-base-100 flex items-center justify-center border-t py-4"
      >
        <div v-if="props.paginationError" class="space-y-2 text-center">
          <div class="text-error text-sm">
            Failed to load more: {{ props.paginationError.message }}
          </div>
          <button
            class="btn btn-outline btn-sm"
            :disabled="props.loadingMore"
            @click="emit('retry-pagination')"
          >
            <span
              v-if="props.loadingMore"
              class="loading loading-spinner loading-xs"
            ></span>
            Retry
          </button>
        </div>
        <div
          v-else-if="props.loadingMore"
          class="text-base-content flex items-center gap-2"
        >
          <span
            class="loading loading-spinner loading-sm"
            aria-hidden="true"
          ></span>
          <span>Loading more...</span>
        </div>
        <div v-else-if="props.hasMore" class="text-base-content text-sm">
          Scroll to load additional pipelines
        </div>
      </div>
    </div>
  </div>
</template>
