<script setup lang="ts">
import { computed, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/vue-table";
import {
  ExclamationTriangleIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline";
import { useRouter } from "vue-router";
import { useStandardTable } from "@/composables/useStandardTable";
import { getTableRowClasses } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import DeadlineGrid from "@/components/ui/DeadlineGrid.vue";
import DeadlineLegend from "@/components/ui/DeadlineLegend.vue";
import type { ActorSummaryData } from "@/types/actor";

interface Props {
  actors: ActorSummaryData[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => props.actors);

const router = useRouter();

const columnHelper = createColumnHelper<ActorSummaryData>();

const columns = [
  columnHelper.accessor("Address", {
    header: "Address",
    size: 200,
    enableGrouping: false,
    cell: (info) => {
      const address = info.getValue();
      return h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "font-mono text-sm break-all" }, address),
        h(CopyButton, {
          value: address,
          ariaLabel: "Copy address",
          size: "xs",
          iconOnly: true,
          extraClass: "no-row-click",
        }),
      ]);
    },
  }),
  columnHelper.accessor("CLayers", {
    header: "Source Layers",
    size: 150,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const layers = info.getValue();
      return h(
        "div",
        { class: "flex flex-wrap gap-1" },
        layers.map((layer) =>
          h(
            "span",
            {
              key: layer,
              class: "badge badge-outline badge-sm",
            },
            layer,
          ),
        ),
      );
    },
  }),
  columnHelper.accessor("QualityAdjustedPower", {
    header: "QaP",
    size: 120,
    enableGrouping: false,
    cell: (info) => h("span", { class: "font-medium" }, info.getValue()),
  }),
  columnHelper.accessor("Deadlines", {
    header: "Deadlines",
    size: 180,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const deadlines = info.getValue();
      const address = info.row.original.Address;
      return h(DeadlineGrid, {
        deadlines,
        entityId: address,
      });
    },
  }),
  columnHelper.accessor("ActorBalance", {
    header: "Balance",
    size: 120,
    enableGrouping: false,
    cell: (info) => h("span", { class: "font-medium" }, info.getValue()),
  }),
  columnHelper.accessor("ActorAvailable", {
    header: "Available",
    size: 120,
    enableGrouping: false,
    cell: (info) => h("span", { class: "font-medium" }, info.getValue()),
  }),
  columnHelper.display({
    id: "wins",
    header: "Wins (1d/7d/30d)",
    size: 150,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const actor = info.row.original;
      return h("div", { class: "flex items-center gap-1 text-sm" }, [
        h("span", { class: "font-medium" }, actor.Win1.toString()),
        h("span", { class: "text-base-content/60" }, "/"),
        h("span", { class: "font-medium" }, actor.Win7.toString()),
        h("span", { class: "text-base-content/60" }, "/"),
        h("span", { class: "font-medium" }, actor.Win30.toString()),
      ]);
    },
  }),
];

const { table, store, helpers, handlers } = useStandardTable<ActorSummaryData>({
  tableId: "actorSummaryTable",
  columns: columns as ColumnDef<ActorSummaryData>[],
  data: rawData,
  defaultSorting: [{ id: "Address", desc: false }],
  getRowId: (row) => `actor-${row.Address}`,
  enableGrouping: false,
});

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const handleActorClick = (address: string) => {
  router.push(`/actor/${encodeURIComponent(address)}`);
};

const handleRowClick = (row: Row<ActorSummaryData>, event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest(".no-row-click")) {
    return;
  }
  handleActorClick(row.original.Address);
};

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "Address":
      return `${data.length} total actors`;
    case "CLayers": {
      const uniqueLayers = new Set<string>();
      data.forEach((actor) =>
        actor.CLayers.forEach((layer) => uniqueLayers.add(layer)),
      );
      return `${uniqueLayers.size} unique layers`;
    }
    case "QualityAdjustedPower": {
      return `Total QaP across all actors`;
    }
    case "ActorBalance": {
      const totalBalance = data.reduce((sum, actor) => {
        const balance = parseFloat(actor.ActorBalance) || 0;
        return sum + balance;
      }, 0);
      return `${totalBalance.toFixed(2)} FIL total`;
    }
    case "ActorAvailable": {
      const totalAvailable = data.reduce((sum, actor) => {
        const available = parseFloat(actor.ActorAvailable) || 0;
        return sum + available;
      }, 0);
      return `${totalAvailable.toFixed(2)} FIL available`;
    }
    case "wins": {
      const totalWins1d = data.reduce((sum, actor) => sum + actor.Win1, 0);
      const totalWins7d = data.reduce((sum, actor) => sum + actor.Win7, 0);
      const totalWins30d = data.reduce((sum, actor) => sum + actor.Win30, 0);
      return `${totalWins1d}/${totalWins7d}/${totalWins30d} total wins`;
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
      search-placeholder="Search actors..."
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
        <span class="font-medium">{{ totalItems }}</span> actors
      </template>

      <template #actions>
        <div v-if="hasActiveFilters">
          <button
            class="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content"
            title="Clear all filters"
            @click="clearAllFilters"
          >
            Clear Filters
          </button>
        </div>
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
                <div>Loading actors...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <UserGroupIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No actors found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[getTableRowClasses(true), 'bg-base-100']"
              @click="handleRowClick(row, $event)"
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

    <DeadlineLegend />
  </div>
</template>
