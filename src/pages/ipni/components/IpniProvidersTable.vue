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
import CopyButton from "@/components/ui/CopyButton.vue";
import { getTableRowClasses } from "@/utils/ui";
import type { IpniProviderSummary } from "@/types/ipni";
import {
  getSyncStatusBadge,
  getSyncStatusLabel,
  getServiceHost,
  hasSyncError,
  isSyncBehind,
} from "@/utils/ipni";
import { XMarkIcon } from "@heroicons/vue/24/solid";

interface Props {
  items?: IpniProviderSummary[];
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

const columnHelper = createColumnHelper<IpniProviderSummary>();

const rawData = computed(() => props.items);

const columns = [
  columnHelper.accessor("miner", {
    header: "Miner",
    cell: (info) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(
          "span",
          { class: "font-semibold whitespace-nowrap" },
          info.getValue(),
        ),
        h(CopyButton, {
          value: info.getValue(),
          iconOnly: true,
          "aria-label": "Copy miner ID",
          "extra-class": "btn-ghost btn-xs",
        }),
      ]),
    enableColumnFilter: true,
    size: 200,
  }),
  columnHelper.accessor("peer_id", {
    header: "Peer ID",
    cell: (info) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(
          "span",
          {
            class: "font-mono text-xs whitespace-nowrap",
            title: info.getValue(),
          },
          info.getValue(),
        ),
        h(CopyButton, {
          value: info.getValue(),
          iconOnly: true,
          "aria-label": "Copy peer ID",
          "extra-class": "btn-ghost btn-xs",
        }),
      ]),
    enableColumnFilter: true,
    size: 450,
  }),
  columnHelper.accessor("head", {
    header: "Head",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return h("span", "—");

      return h("div", { class: "flex items-center gap-2" }, [
        h(
          "span",
          {
            class: "font-mono text-xs whitespace-nowrap",
            title: value,
          },
          value,
        ),
        h(CopyButton, {
          value: value,
          iconOnly: true,
          "aria-label": "Copy head CID",
          "extra-class": "btn-ghost btn-xs",
        }),
      ]);
    },
    enableColumnFilter: true,
    size: 450,
  }),
  columnHelper.accessor("sync_status", {
    header: "Services",
    cell: (info) => {
      const statuses = info.getValue() || [];
      if (statuses.length === 0) {
        return h("span", { class: "badge badge-neutral" }, "Unknown");
      }
      return h(
        "div",
        { class: "flex flex-wrap gap-2" },
        statuses.map((status) =>
          h(
            "span",
            {
              key: `${info.row.original.peer_id}-${status.service}`,
              class: ["badge gap-2", getSyncStatusBadge(status)].join(" "),
            },
            [
              h(
                "span",
                { class: "font-semibold" },
                getServiceHost(status.service),
              ),
              h("span", {}, getSyncStatusLabel(status)),
            ],
          ),
        ),
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
    size: 400,
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<IpniProviderSummary>({
    tableId: "ipniProvidersTable",
    columns: columns as ColumnDef<IpniProviderSummary>[],
    data: rawData,
    defaultSorting: [{ id: "miner", desc: false }],
    enableGrouping: false,
    getRowId: (row) => row.peer_id,
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
    case "peer_id": {
      return `${data.length} providers`;
    }
    case "sync_status": {
      const allStatuses = data.flatMap((item) => item.sync_status || []);
      const synced = allStatuses.filter(
        (s) => !hasSyncError(s) && !isSyncBehind(s),
      ).length;
      const errors = allStatuses.filter((s) => hasSyncError(s)).length;
      const behind = allStatuses.filter((s) => isSyncBehind(s)).length;

      const parts = [];
      if (synced > 0) parts.push(`${synced} synced`);
      if (behind > 0) parts.push(`${behind} behind`);
      if (errors > 0) parts.push(`${errors} error`);
      return parts.join(" • ") || "No services";
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
      search-placeholder="Search providers..."
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
      class="border-base-300/30 bg-base-100 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table w-full">
        <thead class="bg-base-200/50">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-base-300/50 border-b"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              class="border-base-300/30 text-base-content/60 bg-transparent px-3 py-3 text-left text-xs font-semibold tracking-wide uppercase last:border-r-0"
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
          <tr v-if="props.error">
            <td :colspan="columns.length" class="py-8 text-center">
              <div class="alert alert-error inline-flex items-center gap-2">
                {{ props.error.message }}
              </div>
            </td>
          </tr>
          <template v-if="tableHasData">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[getTableRowClasses(), 'bg-base-100']"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
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
          <template v-else>
            <tr v-if="props.loading">
              <td :colspan="columns.length" class="py-10 text-center">
                <div class="loading loading-spinner loading-lg"></div>
              </td>
            </tr>
            <tr v-else>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center text-sm"
              >
                No IPNI providers found.
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
