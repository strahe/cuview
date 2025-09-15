<script setup lang="ts">
import { computed, h, ref, onMounted, onUnmounted } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/vue-table";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { usePaginatedTaskHistory } from "../composables/usePaginatedTaskHistory";
import TableControls from "@/components/table/TableControls.vue";
import type { TaskHistorySummary } from "@/types/task";

const {
  data: composableData,
  loading,
  error,
  hasMore,
  loadingMore,
  paginationError,
  refresh,
  loadMore,
  retryPagination,
} = usePaginatedTaskHistory({
  batchSize: 100,
  initialBatches: 2,
  immediate: true,
});

// Create a computed ref for the data to ensure proper reactivity
const rawData = computed(() => composableData.value);

const columnHelper = createColumnHelper<TaskHistorySummary>();

const columns = [
  columnHelper.accessor("TaskID", {
    header: "Task ID",
    size: 120,
    cell: (info) => {
      const taskId = info.getValue();
      return h(
        "button",
        {
          class: "link link-primary font-mono text-sm hover:link-hover",
          onClick: () => handleTaskClick(taskId),
        },
        `#${taskId}`,
      );
    },
  }),
  columnHelper.accessor("Name", {
    header: "Task Type",
    size: 200,
    cell: (info) => {
      const taskName = info.getValue();
      return h("span", { class: "font-semibold capitalize" }, taskName);
    },
  }),
  columnHelper.accessor("Posted", {
    header: "Posted",
    size: 150,
    cell: (info) => h("span", { class: "text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("Start", {
    header: "Started",
    size: 150,
    cell: (info) => h("span", { class: "text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("Queued", {
    header: "Queued",
    size: 100,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("Took", {
    header: "Duration",
    size: 100,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("CompletedBy", {
    header: "Completed By",
    size: 150,
    cell: (info) => {
      const machine = info.getValue();
      return h(
        "button",
        {
          class: "link link-secondary font-mono text-sm hover:link-hover",
          onClick: () => handleMachineClick(machine),
        },
        machine,
      );
    },
  }),
  columnHelper.accessor("Result", {
    header: "Result",
    size: 100,
    cell: (info) => {
      const success = info.getValue();
      if (success) {
        return h("div", { class: "flex items-center gap-1" }, [
          h(CheckCircleIcon, { class: "h-4 w-4 text-success" }),
          h("span", { class: "text-sm font-medium text-success" }, "Success"),
        ]);
      } else {
        return h("div", { class: "flex items-center gap-1" }, [
          h(XCircleIcon, { class: "h-4 w-4 text-error" }),
          h("span", { class: "text-sm font-medium text-error" }, "Failed"),
        ]);
      }
    },
  }),
  columnHelper.accessor("Err", {
    header: "Error",
    size: 200,
    cell: (info) => {
      const error = info.getValue();
      if (!error) return h("span", { class: "text-base-content/40" }, "—");

      return h(
        "span",
        {
          class: "text-sm text-error cursor-help",
          title: error,
        },
        error.length > 50 ? `${error.slice(0, 50)}...` : error,
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<TaskHistorySummary>({
    tableId: "taskHistoryTable",
    columns: columns as ColumnDef<TaskHistorySummary>[],
    data: rawData,
    // Disable sorting completely for scroll pagination - sorting defeats virtual scrolling purpose
    enableSorting: false,
    enableGrouping: false,
    getRowId: (row) => `task-${row.TaskID}`,
  });

const { hasData: tableHasData, totalItems } = helpers;
const { handleCellRightClick, getCellTooltip } = handlers;

// Table container ref and dynamic height
const tableContainer = ref<HTMLDivElement>();
const tableHeight = ref("600px");

// Calculate dynamic height based on viewport
const calculateTableHeight = () => {
  // Use viewport height minus typical header/padding/margins
  // Assuming ~200px for header, controls, and other page elements
  const availableHeight = window.innerHeight - 200;
  const minHeight = 400;
  const maxHeight = Math.max(availableHeight, minHeight);
  tableHeight.value = `${maxHeight}px`;
};

onMounted(() => {
  calculateTableHeight();
  window.addEventListener("resize", calculateTableHeight);
});

onUnmounted(() => {
  window.removeEventListener("resize", calculateTableHeight);
});

// Get filtered and sorted rows from the table
const tableRows = computed(() => table.getRowModel().rows);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleTaskClick = (_taskId: number) => {
  // TODO: Navigate to task details
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleMachineClick = (_machineName: string) => {
  // TODO: Navigate to machine details or filter by machine
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;
  const scrolledPercentage = (scrollTop + clientHeight) / scrollHeight;

  // Trigger load more when scrolled 70% to the bottom
  if (scrolledPercentage > 0.7 && hasMore.value && !loadingMore.value) {
    loadMore();
  }
};

const handleRowClick = (row: Row<TaskHistorySummary>) => {
  handleTaskClick(row.original.TaskID);
};
</script>

<template>
  <div class="space-y-4">
    <TableControls
      v-model:search-input="store.searchQuery"
      search-placeholder="Search history..."
      :loading="loading"
      @refresh="refresh"
    >
      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> records
      </template>
    </TableControls>

    <!-- Error/Loading/Empty States -->
    <template v-if="error">
      <div
        class="border-base-300/30 bg-base-100 flex h-96 items-center justify-center rounded-lg border shadow-md"
      >
        <div class="py-12 text-center">
          <div
            class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
          >
            <div class="text-error text-2xl">⚠️</div>
          </div>
          <h3 class="text-base-content mb-2 text-lg font-semibold">
            Connection Error
          </h3>
          <p class="text-base-content/70 mb-4 text-sm">
            {{ error.message }}
          </p>
          <button
            class="btn btn-outline btn-sm"
            :disabled="loading"
            @click="refresh"
          >
            <span
              v-if="loading"
              class="loading loading-spinner loading-xs"
            ></span>
            <span class="ml-2">{{
              loading ? "Retrying..." : "Retry Connection"
            }}</span>
          </button>
        </div>
      </div>
    </template>
    <template v-else-if="loading && !tableHasData">
      <div
        class="border-base-300/30 bg-base-100 flex h-96 items-center justify-center rounded-lg border shadow-md"
      >
        <div class="text-base-content/60 py-12 text-center">
          <div class="loading loading-spinner loading-lg mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    </template>
    <template v-else-if="!tableHasData">
      <div
        class="border-base-300/30 bg-base-100 flex h-96 items-center justify-center rounded-lg border shadow-md"
      >
        <div class="text-base-content/60 py-8 text-center">
          <div class="mb-2 text-4xl">📊</div>
          <div>No task history found</div>
        </div>
      </div>
    </template>

    <!-- Scrollable container -->
    <div
      v-else
      ref="tableContainer"
      class="border-base-300/30 bg-base-100 overflow-auto rounded-lg border shadow-md"
      :style="{ height: tableHeight }"
      @scroll="handleScroll"
    >
      <!-- Single unified table for proper column alignment -->
      <table class="table w-full">
        <!-- Fixed header -->
        <thead class="bg-base-200 sticky top-0 z-20">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-base-300/50 border-b"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
              class="text-base-content border-base-300/30 bg-base-200 border-r px-3 py-3 font-medium last:border-r-0"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </th>
          </tr>
        </thead>

        <!-- Table body -->
        <tbody>
          <tr
            v-for="row in tableRows"
            :key="row.id"
            v-memo="[
              row.original.TaskID,
              row.original.Result,
              row.original.Err,
            ]"
            class="bg-base-100 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200"
            @click="handleRowClick(row)"
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
        </tbody>
      </table>

      <!-- Load more indicator at the bottom -->
      <div
        v-if="hasMore || loadingMore || paginationError"
        class="border-base-300/30 flex items-center justify-center border-t py-4"
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
          class="text-base-content/60 flex items-center gap-2"
        >
          <div class="loading loading-spinner loading-sm"></div>
          <span>Loading more...</span>
        </div>
        <div v-else-if="hasMore" class="text-base-content/40 text-sm">
          Scroll down for more
        </div>
      </div>
    </div>
  </div>
</template>
