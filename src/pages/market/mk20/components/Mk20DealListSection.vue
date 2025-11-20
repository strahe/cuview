<script setup lang="ts">
import { computed, h, onMounted, ref } from "vue";
import {
  ClipboardDocumentListIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useStandardTable } from "@/composables/useStandardTable";
import { formatDateTime } from "@/utils/format";
import { formatPieceCidShort } from "@/utils/pdp";
import { getTableRowClasses } from "@/utils/ui";
import { normalizeMk20DealSummary } from "@/utils/market";
import type { Mk20DealSummary, Mk20DealSummaryRaw } from "@/types/market";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";

const emit = defineEmits<{
  (e: "view-deal", id: string): void;
}>();

const { call } = useCurioQuery();
const pageSize = 25;
const offset = ref(0);
const items = ref<Mk20DealSummary[]>([]);
const loading = ref(false);
const error = ref<Error | null>(null);
const hasMore = ref(true);

const loadPage = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await call<Mk20DealSummaryRaw[]>("MK20DDOStorageDeals", [
      pageSize,
      offset.value,
    ]);
    const payload = response ?? [];
    items.value = payload.map((entry) => normalizeMk20DealSummary(entry));
    hasMore.value = payload.length === pageSize;
  } catch (err) {
    error.value = err as Error;
    items.value = [];
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
};

const nextPage = async () => {
  if (loading.value || !hasMore.value) return;
  offset.value += pageSize;
  await loadPage();
};

const prevPage = async () => {
  if (loading.value || offset.value === 0) return;
  offset.value = Math.max(0, offset.value - pageSize);
  await loadPage();
};

const currentPage = computed(() =>
  pageSize > 0 ? Math.floor(offset.value / pageSize) + 1 : 1,
);
const canGoPrev = computed(() => offset.value > 0);
const canGoNext = computed(() => hasMore.value);

onMounted(() => {
  void loadPage();
});

const columnHelper = createColumnHelper<Mk20DealSummary>();
const columns = [
  columnHelper.accessor("created_at", {
    header: "Created At",
    size: 160,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatDateTime(info.getValue())),
  }),
  columnHelper.accessor("id", {
    header: "Deal ID",
    size: 220,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "font-mono text-sm text-primary" }, info.getValue()),
  }),
  columnHelper.accessor("miner", {
    header: "SP",
    size: 160,
    enableGrouping: false,
    cell: (info) => {
      const miner = info.getValue();
      return miner
        ? h("span", { class: "font-mono text-sm" }, miner)
        : h("span", { class: "text-base-content/70 text-sm" }, "Unknown");
    },
  }),
  columnHelper.accessor("piece_cid_v2", {
    header: "Piece CID",
    size: 220,
    enableGrouping: false,
    cell: (info) => {
      const cid = info.getValue();
      return cid
        ? h("span", { class: "font-mono text-sm" }, formatPieceCidShort(cid))
        : h("span", { class: "text-base-content/70 text-sm" }, "N/A");
    },
  }),
  columnHelper.accessor("processed", {
    header: "Processed",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      const badgeClass = value ? "badge-success" : "badge-warning";
      const label = value ? "Complete" : "Pending";
      return h(
        "span",
        { class: `badge ${badgeClass} badge-sm font-semibold uppercase` },
        label,
      );
    },
  }),
  columnHelper.accessor("error", {
    header: "Error",
    size: 220,
    enableGrouping: false,
    cell: (info) => {
      const message = info.getValue();
      return message
        ? h("span", { class: "text-error text-sm" }, message)
        : h(
            "span",
            { class: "text-base-content/60 text-xs uppercase" },
            "None",
          );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 200,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(
          "button",
          {
            class: "btn btn-sm btn-outline",
            onClick: () => emit("view-deal", info.row.original.id),
          },
          [
            h(ArrowTopRightOnSquareIcon, { class: "size-4" }),
            h("span", null, "Details"),
          ],
        ),
        h(CopyButton, {
          value: `/market/mk20/deal/${info.row.original.id}`,
          borderless: true,
          iconOnly: true,
          ariaLabel: "Copy deal link",
        }),
      ]),
  }),
];

const { table, store, helpers } = useStandardTable<Mk20DealSummary>({
  tableId: "mk20DealListTable",
  columns: columns as ColumnDef<Mk20DealSummary>[],
  data: computed(() => items.value),
  enableGrouping: false,
  defaultSorting: [{ id: "created_at", desc: true }],
  getRowId: (row) => `mk20-deal-${row.id}`,
});

const { hasData: tableHasData, totalItems } = helpers;
</script>

<template>
  <SectionCard
    title="DDO Deals"
    :icon="ClipboardDocumentListIcon"
    tooltip="Paginated MK20 deal summaries."
  >
    <div class="space-y-4">
      <TableControls
        v-model:search-input="store.searchQuery"
        search-placeholder="Search deals..."
        :loading="loading"
        @refresh="loadPage"
      >
        <template #stats>
          <span class="font-medium">Page {{ currentPage }}</span>
        </template>
        <template #actions>
          <div class="join">
            <button
              class="btn join-item"
              :disabled="loading || !canGoPrev"
              @click="prevPage"
            >
              Previous
            </button>
            <button
              class="btn join-item"
              :disabled="loading || !canGoNext"
              @click="nextPage"
            >
              Next
            </button>
          </div>
        </template>
      </TableControls>

      <div
        class="border-base-300 bg-base-100 overflow-hidden rounded-lg border"
      >
        <table class="table w-full">
          <thead class="bg-base-200">
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
                    :stats-text="
                      header.column.id === 'id' ? `${totalItems} items` : ''
                    "
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="error">
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
                    Failed to load deals
                  </h3>
                  <p class="text-base-content mb-4 text-sm">
                    {{ error.message }}
                  </p>
                  <button
                    class="btn btn-outline btn-sm"
                    :disabled="loading"
                    @click="loadPage"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            </template>
            <template v-else-if="loading && !tableHasData">
              <tr>
                <td
                  :colspan="table.getAllColumns().length"
                  class="py-12 text-center"
                >
                  <div
                    class="loading loading-spinner loading-lg mx-auto mb-4"
                  ></div>
                  <div>Loading MK20 deals...</div>
                </td>
              </tr>
            </template>
            <template v-else-if="!tableHasData">
              <tr>
                <td
                  :colspan="table.getAllColumns().length"
                  class="py-12 text-center"
                >
                  <ClipboardDocumentListIcon
                    class="text-base-content mx-auto mb-2 h-12 w-12"
                  />
                  <div>No deals found</div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                :class="[getTableRowClasses(true), 'bg-base-100']"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="border-base-200 border-r px-3 py-3 text-sm last:border-r-0"
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
          v-if="tableHasData"
          class="border-base-300 bg-base-100 text-base-content/70 flex items-center justify-between border-t px-4 py-3 text-sm"
        >
          <div>Page {{ currentPage }}</div>
          <div class="join">
            <button
              class="btn btn-ghost btn-sm join-item"
              :disabled="loading || !canGoPrev"
              @click="prevPage"
            >
              Previous
            </button>
            <button
              class="btn btn-ghost btn-sm join-item"
              :disabled="loading || !canGoNext"
              @click="nextPage"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>
