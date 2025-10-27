<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { formatBytes } from "@/utils/format";
import { getTableRowClasses } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { ClientFilter, ClientFilterTableEntry } from "@/types/market";
import BaseModal from "@/components/ui/BaseModal.vue";

interface Props {
  items: ClientFilter[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  availablePricingFilters?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
  availablePricingFilters: () => [],
});

const emit = defineEmits<{
  add: [];
  edit: [filter: ClientFilter];
  remove: [name: string];
  toggle: [name: string, active: boolean];
}>();

const rawData = computed<ClientFilterTableEntry[]>(() =>
  props.items.map((item) => ({
    ...item,
    id: item.name,
  })),
);

const columnHelper = createColumnHelper<ClientFilterTableEntry>();

const showDetailsModal = ref(false);
const selectedDetails = ref<{
  name: string;
  wallets: string[];
  peerIds: string[];
} | null>(null);

const openDetailsModal = (filter: ClientFilterTableEntry) => {
  selectedDetails.value = {
    name: filter.name,
    wallets: filter.wallets || [],
    peerIds: filter.peer_ids || [],
  };
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedDetails.value = null;
};

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("active", {
    header: "Active",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const filter = info.row.original;
      return h("input", {
        type: "checkbox",
        class: "toggle toggle-success toggle-sm no-row-click",
        checked: info.getValue(),
        onChange: (e: Event) => {
          const target = e.target as HTMLInputElement;
          emit("toggle", filter.name, target.checked);
        },
      });
    },
  }),
  columnHelper.display({
    id: "clients",
    header: "Clients",
    size: 150,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      const walletsCount = filter.wallets?.length || 0;
      const peersCount = filter.peer_ids?.length || 0;
      const totalCount = walletsCount + peersCount;

      return h("div", { class: "flex items-center gap-2" }, [
        h(
          "span",
          {
            class: "badge badge-neutral badge-sm",
            title: `${walletsCount} wallets, ${peersCount} peer IDs`,
          },
          `${totalCount}`,
        ),
        h(
          "button",
          {
            class: "btn btn-ghost btn-xs no-row-click",
            onClick: (event: MouseEvent) => {
              event.stopPropagation();
              openDetailsModal(filter);
            },
          },
          "Details",
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "pricing_filters",
    header: "Pricing Filters",
    size: 200,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      const filters = filter.pricing_filters || [];

      if (filters.length === 0) {
        return h("span", { class: "text-base-content/50 text-xs" }, "None");
      }

      if (filters.length <= 2) {
        return h(
          "div",
          { class: "flex flex-wrap gap-1" },
          filters.map((f) =>
            h("span", { class: "badge badge-primary badge-sm" }, f),
          ),
        );
      }

      return h("div", { class: "flex items-center gap-2" }, [
        h(
          "div",
          { class: "flex flex-wrap gap-1" },
          filters
            .slice(0, 2)
            .map((f) =>
              h("span", { class: "badge badge-primary badge-sm" }, f),
            ),
        ),
        h(
          "div",
          {
            class: "dropdown dropdown-hover",
          },
          [
            h(
              "div",
              {
                tabindex: 0,
                class: "badge badge-ghost badge-sm cursor-pointer no-row-click",
              },
              `+${filters.length - 2}`,
            ),
            h(
              "div",
              {
                tabindex: 0,
                class:
                  "dropdown-content z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl p-3 w-64",
              },
              [
                h(
                  "div",
                  { class: "font-semibold mb-2" },
                  "All Pricing Filters:",
                ),
                h(
                  "div",
                  { class: "flex flex-wrap gap-1" },
                  filters.map((f) =>
                    h("span", { class: "badge badge-primary badge-sm" }, f),
                  ),
                ),
              ],
            ),
          ],
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "rate_limits",
    header: "Rate Limits",
    size: 200,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const filter = info.row.original;
      const dealsPerHour = filter.max_deals_per_hour || 0;
      const sizePerHour = filter.max_deal_size_per_hour || 0;

      return h("div", { class: "text-sm space-y-1" }, [
        h("div", {}, [
          h("span", { class: "font-mono" }, `${dealsPerHour}`),
          h("span", { class: "text-base-content/70 ml-1" }, "deals/h"),
        ]),
        h("div", {}, [
          h("span", { class: "font-mono" }, formatBytes(sizePerHour)),
          h("span", { class: "text-base-content/70 ml-1" }, "/h"),
        ]),
      ]);
    },
  }),
  columnHelper.accessor("additional_info", {
    header: "Info",
    size: 200,
    enableGrouping: false,
    cell: (info) => {
      const text = info.getValue() || "";
      if (!text) {
        return h("span", { class: "text-base-content/50 text-xs" }, "None");
      }

      const truncated = text.length > 40 ? text.substring(0, 40) + "..." : text;
      return h(
        "span",
        {
          class: "text-sm cursor-help",
          title: text,
        },
        truncated,
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
  useStandardTable<ClientFilterTableEntry>({
    tableId: "clientFiltersTable",
    columns: columns as ColumnDef<ClientFilterTableEntry>[],
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
    case "active": {
      const active = data.filter((f) => f.active).length;
      const inactive = data.length - active;
      return `${active} active, ${inactive} inactive`;
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
      search-placeholder="Search client filters..."
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
                <div>Loading client filters...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-12 text-center"
              >
                <UserGroupIcon
                  class="text-base-content/40 mx-auto mb-3 h-12 w-12"
                />
                <div class="mb-2 text-base font-medium">
                  No client filters configured
                </div>
                <div class="text-base-content/40 text-sm">
                  Click the "Add Filter" button above to create your first
                  client filter
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

    <BaseModal
      :open="showDetailsModal"
      title="Client Targets"
      size="md"
      :modal="true"
      @close="closeDetailsModal"
    >
      <template v-if="selectedDetails">
        <div class="space-y-4">
          <div>
            <div class="text-base-content/70 text-xs tracking-wide uppercase">
              Filter
            </div>
            <div class="font-mono text-sm">{{ selectedDetails.name }}</div>
          </div>

          <div v-if="selectedDetails.wallets.length" class="space-y-1">
            <div class="text-sm font-semibold">Wallet Addresses</div>
            <ul
              class="border-base-300 bg-base-200 max-h-40 space-y-1 overflow-y-auto rounded-lg border p-3"
            >
              <li
                v-for="wallet in selectedDetails.wallets"
                :key="wallet"
                class="font-mono text-xs"
              >
                {{ wallet }}
              </li>
            </ul>
          </div>

          <div v-if="selectedDetails.peerIds.length" class="space-y-1">
            <div class="text-sm font-semibold">Peer IDs</div>
            <ul
              class="border-base-300 bg-base-200 max-h-40 space-y-1 overflow-y-auto rounded-lg border p-3"
            >
              <li
                v-for="peer in selectedDetails.peerIds"
                :key="peer"
                class="font-mono text-xs break-all"
              >
                {{ peer }}
              </li>
            </ul>
          </div>

          <div
            v-if="
              !selectedDetails.wallets.length && !selectedDetails.peerIds.length
            "
            class="text-base-content/60 text-sm"
          >
            No wallets or Peer IDs configured.
          </div>
        </div>
      </template>

      <template #footer>
        <button class="btn btn-sm btn-primary" @click="closeDetailsModal">
          Close
        </button>
      </template>
    </BaseModal>
  </div>
</template>
