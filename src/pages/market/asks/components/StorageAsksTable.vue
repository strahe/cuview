<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  ExclamationTriangleIcon,
  PencilIcon,
  PlusCircleIcon,
  ScaleIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { getTableRowClasses } from "@/utils/ui";
import {
  attoFilToFilPerTiBPerMonth,
  generateSizeOptions,
} from "@/utils/market";
import { formatBytes } from "@/utils/format";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { StorageAsk, StorageAskTableEntry } from "@/types/market";

interface ActorInfo {
  ID: number;
  Address: string;
}

interface Props {
  actors?: ActorInfo[]; // All SPs
  asks?: StorageAsk[]; // Existing asks
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  actors: () => [],
  asks: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
});

const emit = defineEmits<{
  "update-ask": [spId: number];
}>();

const rawData = computed(() => {
  if (!props.actors || props.actors.length === 0) {
    return [];
  }

  return props.actors.map((actor) => {
    const ask = props.asks?.find((a) => a.SpID === actor.ID);
    return {
      id: `ask-${actor.ID}`,
      SpID: actor.ID,
      Miner: actor.Address,
      hasAsk: !!ask,
      // Spread ask properties if exists
      ...(ask || {}),
    } as StorageAskTableEntry;
  });
});

const sizeOptions = generateSizeOptions();
const getSizeLabel = (bytes: number): string => {
  const option = sizeOptions.find((opt) => opt.value === bytes);
  return option ? option.label : formatBytes(bytes);
};

const columnHelper = createColumnHelper<StorageAskTableEntry>();

const columns = [
  columnHelper.accessor("SpID", {
    header: "SP ID",
    size: 100,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "font-mono text-sm" }, `f0${info.getValue()}`),
  }),
  columnHelper.display({
    id: "priceFilPerTiB",
    header: "Price (FIL/TiB/Month)",
    size: 160,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const price = info.row.original.Price;
      if (!price) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      const filPerTiB = attoFilToFilPerTiBPerMonth(price);
      return h(
        "span",
        { class: "font-mono text-sm text-primary" },
        `${filPerTiB} FIL`,
      );
    },
  }),
  columnHelper.accessor("Price", {
    header: "Price (attoFIL/GiB/Epoch)",
    size: 180,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      return h(
        "span",
        { class: "font-mono text-xs text-base-content/60" },
        value.toString(),
      );
    },
  }),
  columnHelper.display({
    id: "verifiedPriceFilPerTiB",
    header: "Verified Price (FIL/TiB/Month)",
    size: 200,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const price = info.row.original.VerifiedPrice;
      if (!price) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      const filPerTiB = attoFilToFilPerTiBPerMonth(price);
      return h(
        "span",
        { class: "font-mono text-sm text-success" },
        `${filPerTiB} FIL`,
      );
    },
  }),
  columnHelper.accessor("VerifiedPrice", {
    header: "Verified Price (attoFIL/GiB/Epoch)",
    size: 220,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      return h(
        "span",
        { class: "font-mono text-xs text-base-content/60" },
        value.toString(),
      );
    },
  }),
  columnHelper.accessor("MinSize", {
    header: "Min Size",
    size: 180,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      return h("span", { class: "text-sm" }, getSizeLabel(value));
    },
  }),
  columnHelper.accessor("MaxSize", {
    header: "Max Size",
    size: 180,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      if (!value) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      return h("span", { class: "text-sm" }, getSizeLabel(value));
    },
  }),
  columnHelper.accessor("Sequence", {
    header: "Sequence",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      if (value === undefined) {
        return h("span", { class: "text-base-content/40" }, "-");
      }
      return h("span", { class: "font-mono text-sm" }, value.toString());
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 120,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const item = info.row.original;
      const buttonText = item.hasAsk ? "Update Ask" : "Set Ask";
      const buttonClass = item.hasAsk
        ? "btn btn-primary btn-xs gap-1"
        : "btn btn-success btn-xs gap-1";
      const IconComponent = item.hasAsk ? PencilIcon : PlusCircleIcon;
      const title = item.hasAsk
        ? "Update storage ask for this SP"
        : "Set storage ask for this SP";

      return h(
        "button",
        {
          class: buttonClass,
          title,
          onClick: () => {
            emit("update-ask", item.SpID);
          },
        },
        [h(IconComponent, { class: "size-3" }), h("span", buttonText)],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<StorageAskTableEntry>({
    tableId: "storageAsksTable",
    columns: columns as ColumnDef<StorageAskTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "SpID", desc: false }],
    getRowId: (row) => `ask-${row.SpID}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "SpID":
      return `${data.length} storage providers`;
    default:
      return "";
  }
};
</script>

<template>
  <div class="space-y-4">
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search by SP ID..."
      :loading="props.loading"
      @refresh="props.onRefresh"
    >
      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> storage providers
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
                <div>Loading storage providers...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <ScaleIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No storage providers found</div>
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
