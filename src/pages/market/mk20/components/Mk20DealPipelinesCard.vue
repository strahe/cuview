<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from "vue";
import { QueueListIcon } from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import Mk20FailedTasksPanel from "./Mk20FailedTasksPanel.vue";
import { useMk20Pipelines } from "../composables/useMk20Pipelines";
import {
  getMk20DealStatus,
  getMk20TaskTypeName,
  getProgressFromStatus,
} from "@/utils/market";
import type {
  Mk20FailedTaskType,
  Mk20Pipeline,
  Mk20PipelineFailedStats,
} from "@/types/market";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/vue/24/outline";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import { formatBytes, formatDateTime } from "@/utils/format";
import { getTableRowClasses } from "@/utils/ui";
import { formatPieceCidShort } from "@/utils/pdp";
import { useStandardTable } from "@/composables/useStandardTable";

const {
  data,
  totalItems,
  loading,
  error,
  hasMore,
  loadingMore,
  paginationError,
  loadMore,
  retryPagination,
  refresh,
} = useMk20Pipelines({
  batchSize: 50,
  initialBatches: 2,
  immediate: true,
  maxItems: 2000,
});

const pipelines = computed(() => data.value);

const {
  data: failedStatsData,
  loading: failedStatsLoading,
  error: failedStatsError,
  refresh: refreshFailedStats,
} = useCachedQuery<Mk20PipelineFailedStats>("MK20PipelineFailedTasks", [], {
  pollingInterval: 30000,
});

const failedStats = computed(() => failedStatsData.value ?? undefined);

const restartFailedTasks = useLazyQuery<void>(
  "MK20BulkRestartFailedMarketTasks",
);
const removeFailedPipelines = useLazyQuery<void>(
  "MK20BulkRemoveFailedMarketPipelines",
);

const operationLoading = computed(
  () => restartFailedTasks.loading.value || removeFailedPipelines.loading.value,
);

const operationError = ref<string | null>(null);
const selectedTaskType = ref<Mk20FailedTaskType | null>(null);
const actionMode = ref<"restart" | "remove" | null>(null);
const showConfirmDialog = ref(false);

interface TableEntry extends Mk20Pipeline {
  rowId: string;
}

const tableData = computed<TableEntry[]>(() => {
  if (!pipelines.value) return [];
  return pipelines.value.map((item) => ({
    ...item,
    rowId: `mk20-pipeline-${item.id}`,
  }));
});

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
    size: 220,
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
  columnHelper.accessor("client", {
    header: "Client",
    size: 160,
    enableGrouping: false,
    cell: (info) =>
      h(
        "span",
        { class: "font-mono text-sm text-base-content" },
        info.getValue(),
      ),
  }),
  columnHelper.accessor("miner", {
    header: "SP",
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
  columnHelper.accessor("contract", {
    header: "Contract",
    size: 160,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      return value
        ? h("span", { class: "font-mono text-xs" }, value)
        : h("span", { class: "text-base-content/60 text-xs" }, "N/A");
    },
  }),
  columnHelper.accessor("allocation_id", {
    header: "Alloc",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      return value != null
        ? h("span", { class: "font-mono text-sm" }, value)
        : h("span", { class: "text-base-content/60 text-xs" }, "—");
    },
  }),
  columnHelper.accessor("piece_aggregation", {
    header: "Agg",
    size: 90,
    enableGrouping: false,
    cell: (info) =>
      h(
        "span",
        { class: "badge badge-ghost badge-sm" },
        info.getValue() ?? "—",
      ),
  }),
  columnHelper.accessor("sector", {
    header: "Sector",
    size: 110,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      return value != null
        ? h("span", { class: "font-mono text-sm" }, value)
        : h("span", { class: "text-base-content/60 text-xs" }, "Pending");
    },
  }),
  columnHelper.accessor("sealed", {
    header: "Sealed",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      const badgeClass = value ? "badge-success" : "badge-warning";
      return h(
        "span",
        { class: `badge ${badgeClass} badge-sm font-semibold uppercase` },
        value ? "Yes" : "No",
      );
    },
  }),
  columnHelper.accessor("piece_size", {
    header: "Piece Size",
    size: 140,
    enableGrouping: false,
    cell: (info) =>
      h("span", { class: "text-sm" }, formatBytes(info.getValue())),
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
  tableId: "mk20DealPipelinesTable",
  columns: columns as ColumnDef<TableEntry>[],
  data: tableData,
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

const handleRefreshAll = async () => {
  await Promise.all([refresh(), refreshFailedStats()]);
};

const handleRestartRequest = (taskType: Mk20FailedTaskType) => {
  actionMode.value = "restart";
  selectedTaskType.value = taskType;
  showConfirmDialog.value = true;
  operationError.value = null;
};

const handleRemoveRequest = (taskType: Mk20FailedTaskType) => {
  actionMode.value = "remove";
  selectedTaskType.value = taskType;
  showConfirmDialog.value = true;
  operationError.value = null;
};

const handleCancelAction = () => {
  showConfirmDialog.value = false;
  actionMode.value = null;
  selectedTaskType.value = null;
};

const handleConfirmAction = async () => {
  if (!selectedTaskType.value || !actionMode.value) {
    return;
  }

  operationError.value = null;

  try {
    if (actionMode.value === "restart") {
      await restartFailedTasks.execute(selectedTaskType.value);
    } else {
      await removeFailedPipelines.execute(selectedTaskType.value);
    }

    await Promise.all([refresh(), refreshFailedStats()]);
    handleCancelAction();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : String(err ?? "Unknown error");
  }
};

const getConfirmationProps = computed(() => {
  if (!selectedTaskType.value || !actionMode.value) {
    return {
      title: "",
      message: "",
      confirmText: "",
      type: "info" as const,
    };
  }

  const taskLabel = getMk20TaskTypeName(selectedTaskType.value);

  if (actionMode.value === "restart") {
    return {
      title: "Restart Failed Tasks",
      message: `Restart all failed ${taskLabel} tasks?`,
      confirmText: "Restart",
      type: "info" as const,
    };
  }

  return {
    title: "Remove Failed Pipelines",
    message: `Remove all failed ${taskLabel} pipelines? This cannot be undone.`,
    confirmText: "Remove",
    type: "danger" as const,
  };
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

const renderStatus = (pipeline: Mk20Pipeline) => {
  const status = getMk20DealStatus(pipeline);
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

const handleScroll = (event: Event) => {
  const element = event.target as HTMLElement;
  const { scrollTop, clientHeight, scrollHeight } = element;
  const progress = (scrollTop + clientHeight) / scrollHeight;

  if (progress > 0.7 && hasMore.value && !loadingMore.value) {
    loadMore();
  }
};

const getColumnAggregateInfo = (columnId: string) => {
  const items = tableData.value;
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
    case "client": {
      const unique = new Set(items.map((pipeline) => pipeline.client));
      return `${unique.size} unique clients`;
    }
    case "sealed": {
      const sealed = items.filter((pipeline) => pipeline.sealed).length;
      return `${sealed} sealed`;
    }
    case "piece_size": {
      const totalSize = items.reduce(
        (sum, pipeline) => sum + pipeline.piece_size,
        0,
      );
      return `Total: ${formatBytes(totalSize)}`;
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
  <SectionCard
    title="MK20 Deal Pipelines"
    :icon="QueueListIcon"
    tooltip="MK20 pipeline activity."
  >
    <div class="space-y-4">
      <div v-if="failedStatsError" class="alert alert-warning shadow-lg">
        <span>
          Failed to load failed task statistics:
          {{ failedStatsError.message }}
        </span>
        <button
          class="btn btn-sm"
          :disabled="failedStatsLoading"
          @click="refreshFailedStats"
        >
          Retry
        </button>
      </div>

      <div v-if="operationError" class="alert alert-error shadow-lg">
        <span>{{ operationError }}</span>
        <button class="btn btn-sm" @click="operationError = null">
          Dismiss
        </button>
      </div>

      <Mk20FailedTasksPanel
        :stats="failedStats"
        :loading="operationLoading || failedStatsLoading"
        @restart="handleRestartRequest"
        @remove="handleRemoveRequest"
      />

      <div class="space-y-4">
        <TableControls
          v-model:search-input="store.searchQuery"
          search-placeholder="Search MK20 pipelines..."
          :loading="loading"
          @refresh="handleRefreshAll"
        >
          <template #stats>
            <span class="font-medium">{{ totalItems || filteredTotal }}</span>
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
                      Connection Error
                    </h3>
                    <p class="text-base-content mb-4 text-sm">
                      {{ error.message }}
                    </p>
                    <button
                      class="btn btn-outline btn-sm"
                      :disabled="loading"
                      @click="handleRefreshAll"
                    >
                      <span
                        v-if="loading"
                        class="loading loading-spinner loading-xs"
                      ></span>
                      <span class="ml-2">
                        {{ loading ? "Retrying..." : "Retry Connection" }}
                      </span>
                    </button>
                  </td>
                </tr>
              </template>
              <template v-else-if="loading && !tableHasData">
                <tr>
                  <td
                    :colspan="table.getAllColumns().length"
                    class="text-base-content py-12 text-center"
                  >
                    <div
                      class="loading loading-spinner loading-lg mx-auto mb-4"
                    ></div>
                    <div>Loading MK20 pipelines...</div>
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
            v-if="hasMore || loadingMore || paginationError"
            class="border-base-300 bg-base-100 flex items-center justify-center border-t py-4"
          >
            <div v-if="paginationError" class="space-y-2 text-center">
              <div class="text-error text-sm">
                Failed to load more: {{ paginationError.message }}
              </div>
              <button
                class="btn btn-outline btn-sm"
                :disabled="loadingMore"
                @click="retryPagination"
              >
                <span
                  v-if="loadingMore"
                  class="loading loading-spinner loading-xs"
                ></span>
                Retry
              </button>
            </div>
            <div
              v-else-if="loadingMore"
              class="text-base-content flex items-center gap-2"
            >
              <span
                class="loading loading-spinner loading-sm"
                aria-hidden="true"
              ></span>
              <span>Loading more...</span>
            </div>
            <div v-else-if="hasMore" class="text-base-content text-sm">
              Scroll to load additional pipelines
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmationDialog
      v-model:show="showConfirmDialog"
      v-bind="getConfirmationProps"
      :loading="operationLoading"
      @confirm="handleConfirmAction"
      @cancel="handleCancelAction"
    />
  </SectionCard>
</template>
