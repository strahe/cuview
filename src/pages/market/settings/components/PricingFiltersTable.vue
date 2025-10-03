<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { formatBytes } from "@/utils/format";
import { attoFilToFilPerTiBPerMonth } from "@/utils/market";
import { getTableRowClasses } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { PricingFilter, PricingFilterTableEntry } from "@/types/market";

interface Props {
  items: PricingFilter[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
});

const emit = defineEmits<{
  add: [];
  edit: [filter: PricingFilter];
  remove: [name: string];
}>();

const rawData = computed<PricingFilterTableEntry[]>(() =>
  props.items.map((item) => ({
    ...item,
    id: item.name,
  })),
);

const columnHelper = createColumnHelper<PricingFilterTableEntry>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.display({
    id: "duration",
    header: "Duration Range",
    size: 160,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      return h(
        "span",
        { class: "text-sm" },
        `${filter.min_dur} - ${filter.max_dur} days`,
      );
    },
  }),
  columnHelper.display({
    id: "size",
    header: "Size Range",
    size: 200,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      return h(
        "span",
        { class: "text-sm font-mono" },
        `${formatBytes(filter.min_size)} - ${formatBytes(filter.max_size)}`,
      );
    },
  }),
  columnHelper.display({
    id: "price_fil",
    header: "Price (FIL/TiB/Month)",
    size: 180,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      const priceFilTiB = attoFilToFilPerTiBPerMonth(filter.price);
      return h("span", { class: "font-mono text-sm" }, priceFilTiB);
    },
  }),
  columnHelper.accessor("price", {
    header: "Price (attoFIL/GiB/Epoch)",
    size: 200,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "font-mono text-xs text-base-content/70" }, [
        info.getValue().toLocaleString(),
      ]),
  }),
  columnHelper.accessor("verified", {
    header: "Type",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const isVerified = info.getValue();
      return h(
        "span",
        {
          class: isVerified
            ? "badge badge-success badge-sm"
            : "badge badge-neutral badge-sm",
        },
        isVerified ? "Verified" : "Regular",
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 120,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      return h("div", { class: "flex items-center gap-1" }, [
        h(
          "button",
          {
            class: "btn btn-ghost btn-xs no-row-click",
            title: "Edit",
            onClick: () => emit("edit", filter),
          },
          [h(PencilIcon, { class: "size-4" })],
        ),
        h(
          "button",
          {
            class: "btn btn-ghost btn-xs text-error no-row-click",
            title: "Delete",
            onClick: () => emit("remove", filter.name),
          },
          [h(TrashIcon, { class: "size-4" })],
        ),
      ]);
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<PricingFilterTableEntry>({
    tableId: "pricingFiltersTable",
    columns: columns as ColumnDef<PricingFilterTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "name", desc: false }],
    getRowId: (row) => row.id,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "name":
      return `${data.length} total filters`;
    case "verified": {
      const verified = data.filter((f) => f.verified).length;
      const regular = data.length - verified;
      return `${verified} verified, ${regular} regular`;
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
      search-placeholder="Search pricing filters..."
      :loading="props.loading"
      @refresh="props.onRefresh"
    >
      <!-- Column stats -->
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
        <span class="font-medium">{{ totalItems }}</span> filters
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
              :style="{ width: `${header.getSize()}px` }"
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
                <div>Loading pricing filters...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-12 text-center"
              >
                <FunnelIcon
                  class="text-base-content/40 mx-auto mb-3 h-12 w-12"
                />
                <div class="mb-2 text-base font-medium">
                  No pricing filters configured
                </div>
                <div class="text-base-content/40 text-sm">
                  Click the "Add Filter" button above to create your first
                  pricing filter
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[getTableRowClasses(false), 'bg-base-100']"
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
