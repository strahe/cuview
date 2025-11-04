<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  TrashIcon,
  ExclamationTriangleIcon,
  WalletIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { getTableRowClasses } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { AllowDenyEntry, AllowDenyTableEntry } from "@/types/market";
import CopyButton from "@/components/ui/CopyButton.vue";

interface Props {
  items: AllowDenyEntry[];
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
  toggle: [wallet: string, status: boolean];
  remove: [wallet: string];
}>();

const rawData = computed<AllowDenyTableEntry[]>(() =>
  props.items.map((item) => ({
    ...item,
    id: item.wallet,
  })),
);

const columnHelper = createColumnHelper<AllowDenyTableEntry>();

const columns = [
  columnHelper.accessor("wallet", {
    header: "Wallet Address",
    size: 400,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => {
      const wallet = info.getValue();
      return h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "font-mono text-sm" }, wallet),
        h(
          "div",
          {
            class: "no-row-click",
            onClick: (event: MouseEvent) => event.stopPropagation(),
          },
          [
            h(CopyButton, {
              value: wallet,
              iconOnly: true,
              ariaLabel: `Copy wallet address ${wallet}`,
              extraClass: "border border-transparent",
            }),
          ],
        ),
      ]);
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 200,
    enableGrouping: false,
    cell: (info) => {
      const entry = info.row.original;
      const status = info.getValue();
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          "div",
          {
            class: status ? "badge badge-success" : "badge badge-error",
          },
          status ? "Allow" : "Deny",
        ),
        h("input", {
          type: "checkbox",
          class: "toggle toggle-success toggle-sm no-row-click",
          checked: status,
          onChange: (e: Event) => {
            const target = e.target as HTMLInputElement;
            emit("toggle", entry.wallet, target.checked);
          },
        }),
      ]);
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 100,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const entry = info.row.original;
      return h(
        "button",
        {
          class: "btn btn-ghost btn-xs text-error no-row-click",
          title: "Delete",
          onClick: () => emit("remove", entry.wallet),
        },
        [h(TrashIcon, { class: "size-4" })],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<AllowDenyTableEntry>({
    tableId: "allowDenyListTable",
    columns: columns as ColumnDef<AllowDenyTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "wallet", desc: false }],
    getRowId: (row) => row.id,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "wallet":
      return `${data.length} total wallets`;
    case "status": {
      const allowed = data.filter((e) => e.status).length;
      const denied = data.length - allowed;
      return `${allowed} allowed, ${denied} denied`;
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
      search-placeholder="Search wallet addresses..."
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
        <span class="font-medium">{{ totalItems }}</span> wallets
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
              :style="{ width: `${header.getSize()}px` }"
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
                <div>Loading allow/deny list...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-12 text-center"
              >
                <WalletIcon
                  class="text-base-content/40 mx-auto mb-3 h-12 w-12"
                />
                <div class="text-base font-medium">
                  No wallet addresses configured
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
