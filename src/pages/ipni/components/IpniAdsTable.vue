<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import { useStandardTable } from "@/composables/useStandardTable";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import { getTableRowClasses } from "@/utils/ui";
import { formatBytes } from "@/utils/format";
import type { IpniAdRow } from "@/types/ipni";
import {
  CheckCircleIcon,
  MinusIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/vue/24/outline";
import { XMarkIcon } from "@heroicons/vue/24/solid";

interface Props {
  items?: IpniAdRow[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  pendingAdCid?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
  pendingAdCid: null,
});

const emit = defineEmits<{
  (event: "view", payload: IpniAdRow): void;
  (event: "toggle-skip", payload: IpniAdRow): void;
}>();

const columnHelper = createColumnHelper<IpniAdRow>();

const rawData = computed(() => props.items);

const columns = [
  columnHelper.accessor("miner", {
    header: "Miner",
    cell: (info) => h("span", { class: "font-semibold" }, info.getValue()),
    size: 200,
  }),
  columnHelper.accessor("peerId", {
    header: "Peer",
    cell: (info) =>
      h(
        "span",
        {
          class:
            "font-mono text-xs break-all max-w-[160px] inline-block align-top",
          title: info.getValue(),
        },
        info.getValue(),
      ),
    size: 220,
  }),
  columnHelper.accessor("ad_cid", {
    header: "Ad CID",
    cell: (info) =>
      h(
        "span",
        {
          class:
            "font-mono text-xs break-all max-w-[220px] inline-block align-top",
          title: info.getValue(),
        },
        info.getValue(),
      ),
    size: 280,
  }),
  columnHelper.accessor("piece_cid", {
    header: "Piece CID",
    cell: (info) =>
      h(
        "span",
        {
          class:
            "font-mono text-xs break-all max-w-[220px] inline-block align-top",
          title: info.getValue(),
        },
        info.getValue(),
      ),
    size: 260,
  }),
  columnHelper.accessor("piece_size", {
    header: "Size",
    cell: (info) => formatBytes(info.getValue()),
    size: 120,
  }),
  columnHelper.accessor("entry_count", {
    header: "Entries",
    cell: (info) => info.getValue() ?? 0,
    size: 90,
  }),
  columnHelper.accessor("is_rm", {
    header: "Remove",
    cell: (info) =>
      info.getValue()
        ? h(CheckCircleIcon, { class: "size-4 text-warning" })
        : h(MinusIcon, { class: "size-4 text-base-content/40" }),
    enableSorting: true,
    size: 80,
  }),
  columnHelper.accessor("is_skip", {
    header: "Skip",
    cell: (info) =>
      info.getValue()
        ? h(CheckCircleIcon, { class: "size-4 text-error" })
        : h(MinusIcon, { class: "size-4 text-base-content/40" }),
    enableSorting: true,
    size: 80,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const ad = info.row.original;
      const isPending = props.pendingAdCid === ad.ad_cid;

      return h("div", { class: "flex gap-2" }, [
        h(
          "button",
          {
            type: "button",
            class: "btn btn-ghost btn-xs gap-1",
            onClick: () => emit("view", ad),
          },
          [
            h(ArrowTopRightOnSquareIcon, { class: "size-4" }),
            h("span", { class: "hidden sm:inline" }, "View"),
          ],
        ),
        h(
          "button",
          {
            type: "button",
            class: [
              "btn btn-xs",
              ad.is_skip ? "btn-success" : "btn-warning",
            ].join(" "),
            disabled: isPending,
            onClick: () => emit("toggle-skip", ad),
          },
          isPending
            ? h("span", { class: "loading loading-spinner loading-xs" })
            : ad.is_skip
              ? "Unskip"
              : "Skip",
        ),
      ]);
    },
    size: 160,
  }),
];

const { table, store, helpers, handlers } = useStandardTable<IpniAdRow>({
  tableId: "ipniAdsTable",
  columns: columns as ColumnDef<IpniAdRow>[],
  data: rawData,
  defaultSorting: [{ id: "ad_cid", desc: false }],
  enableGrouping: false,
  getRowId: (row) => `ad-${row.ad_cid}`,
});

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, clearAllFilters } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "miner": {
      const unique = new Set(data.map((item) => item.miner));
      return `${unique.size} miners`;
    }
    case "piece_size": {
      const total = data.reduce((acc, item) => acc + (item.piece_size || 0), 0);
      return `Total ${formatBytes(total)}`;
    }
    case "entry_count": {
      const totalEntries = data.reduce(
        (acc, item) => acc + (item.entry_count || 0),
        0,
      );
      return `${totalEntries} entries`;
    }
    case "is_skip": {
      const skipped = data.filter((item) => item.is_skip).length;
      return `${skipped} skipped`;
    }
    case "is_rm": {
      const removals = data.filter((item) => item.is_rm).length;
      return `${removals} removals`;
    }
    default:
      return `${data.length} advertisements`;
  }
};
</script>

<template>
  <div class="space-y-4">
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search advertisements..."
      :loading="props.loading"
      @refresh="props.onRefresh"
    >
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
        <ColumnStats :show-stats="store.showAggregateInfo" stats-text="" />
        <span class="text-base-content/70 ml-2 text-xs">
          {{ totalItems }} items
        </span>
      </template>
    </TableControls>

    <div
      class="border-base-300 bg-base-100 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table-zebra table w-full">
        <thead class="bg-base-200">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-base-300 border-b"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              class="border-base-200 text-base-content/60 bg-transparent px-3 py-3 text-left text-xs font-semibold tracking-wide uppercase last:border-r-0"
              :class="{
                'cursor-pointer select-none': header.column.getCanSort(),
              }"
              @click="
                header.column.getCanSort() &&
                header.column.getToggleSortingHandler()?.($event)
              "
            >
              <div class="flex items-center gap-2">
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
          <template v-if="props.error">
            <tr>
              <td :colspan="columns.length" class="py-8 text-center">
                <div class="alert alert-error inline-flex items-center gap-2">
                  {{ props.error.message }}
                </div>
              </td>
            </tr>
          </template>
          <template v-else-if="props.loading && !tableHasData">
            <tr>
              <td :colspan="columns.length" class="py-10 text-center">
                <div class="loading loading-spinner loading-lg"></div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center text-sm"
              >
                No advertisements found.
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
