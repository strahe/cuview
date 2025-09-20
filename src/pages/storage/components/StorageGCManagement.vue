<script setup lang="ts">
import { computed, ref, h } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import { formatDistanceToNow } from "date-fns";
import {
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useTableActions } from "@/composables/useTableActions";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { StorageGCMark, StorageGCStats } from "@/types/storage";

const {
  data: gcStats,
  loading: statsLoading,
  error: statsError,
  refresh: refreshStats,
} = useCachedQuery<StorageGCStats[]>("StorageGCStats", [], {
  pollingInterval: 60000,
});

const {
  data: gcMarks,
  loading: marksLoading,
  error: marksError,
  refresh: refreshMarks,
} = useCachedQuery<StorageGCMark[]>("StorageGCMarks", [null, null, 1000, 0], {
  pollingInterval: 60000,
});

const loading = computed(() => statsLoading.value || marksLoading.value);
const error = computed(() => statsError.value || marksError.value);

const refresh = () => {
  refreshStats();
  refreshMarks();
};

const pendingMarks = computed(() => {
  if (!gcMarks.value) return [];
  return gcMarks.value.filter((mark) => !mark.approved);
});

const approvedMarks = computed(() => {
  if (!gcMarks.value) return [];
  return gcMarks.value.filter((mark) => mark.approved);
});

const totalPendingCount = computed(() => pendingMarks.value.length);
const totalApprovedCount = computed(() => approvedMarks.value.length);

const { call } = useCurioQuery();

const approveGCMark = async (mark: StorageGCMark) => {
  try {
    await call("StorageGCMarkApprove", [
      mark.sp_id,
      mark.sector_num,
      mark.sector_filetype,
      mark.storage_id,
    ]);
    return { success: true };
  } catch (error) {
    console.error("Failed to approve GC mark:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const unapproveGCMark = async (mark: StorageGCMark) => {
  try {
    await call("StorageGCMarkUnapprove", [
      mark.sp_id,
      mark.sector_num,
      mark.sector_filetype,
      mark.storage_id,
    ]);
    return { success: true };
  } catch (error) {
    console.error("Failed to unapprove GC mark:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const bulkApproveGCMarks = async (marks: StorageGCMark[]) => {
  const results = await Promise.allSettled(
    marks.map((mark) => approveGCMark(mark)),
  );

  const successful = results.filter(
    (result) => result.status === "fulfilled" && result.value.success,
  ).length;

  const failed = results.length - successful;

  return {
    success: successful > 0,
    successful,
    failed,
    total: marks.length,
  };
};

const bulkUnapproveGCMarks = async (marks: StorageGCMark[]) => {
  const results = await Promise.allSettled(
    marks.map((mark) => unapproveGCMark(mark)),
  );

  const successful = results.filter(
    (result) => result.status === "fulfilled" && result.value.success,
  ).length;

  const failed = results.length - successful;

  return {
    success: successful > 0,
    successful,
    failed,
    total: marks.length,
  };
};

const selectedMarks = ref<StorageGCMark[]>([]);
const selectAll = ref(false);

const { isLoading: isActionLoading, executeAction } =
  useTableActions<StorageGCMark>({
    actions: {
      approve: {
        name: "approve",
        handler: async (mark) => {
          const result = await approveGCMark(mark);
          if (!result.success) {
            throw new Error(result.error || "Failed to approve GC mark");
          }
        },
        loadingKey: (mark) =>
          `${mark.sp_id}-${mark.sector_num}-${mark.storage_id}`,
        onSuccess: () => refresh(),
      },
      unapprove: {
        name: "unapprove",
        handler: async (mark) => {
          const result = await unapproveGCMark(mark);
          if (!result.success) {
            throw new Error(result.error || "Failed to unapprove GC mark");
          }
        },
        loadingKey: (mark) =>
          `${mark.sp_id}-${mark.sector_num}-${mark.storage_id}`,
        onSuccess: () => refresh(),
      },
    },
  });

const handleBulkApprove = async () => {
  if (selectedMarks.value.length === 0) return;

  const result = await bulkApproveGCMarks(selectedMarks.value);
  if (result.success) {
    selectedMarks.value = [];
    selectAll.value = false;
    refresh();
  }
};

const handleBulkUnapprove = async () => {
  if (selectedMarks.value.length === 0) return;

  const result = await bulkUnapproveGCMarks(selectedMarks.value);
  if (result.success) {
    selectedMarks.value = [];
    selectAll.value = false;
    refresh();
  }
};

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedMarks.value = [...(gcMarks.value || [])];
  } else {
    selectedMarks.value = [];
  }
};

const toggleMarkSelection = (mark: StorageGCMark) => {
  const index = selectedMarks.value.findIndex(
    (m) =>
      m.sp_id === mark.sp_id &&
      m.sector_num === mark.sector_num &&
      m.storage_id === mark.storage_id,
  );

  if (index >= 0) {
    selectedMarks.value.splice(index, 1);
  } else {
    selectedMarks.value.push(mark);
  }

  selectAll.value = selectedMarks.value.length === (gcMarks.value?.length || 0);
};

const isMarkSelected = (mark: StorageGCMark) => {
  return selectedMarks.value.some(
    (m) =>
      m.sp_id === mark.sp_id &&
      m.sector_num === mark.sector_num &&
      m.storage_id === mark.storage_id,
  );
};

const columnHelper = createColumnHelper<StorageGCMark>();

const columns = [
  columnHelper.display({
    id: "select",
    header: () =>
      h("input", {
        type: "checkbox",
        class: "checkbox checkbox-sm",
        checked: selectAll.value,
        onChange: () => {
          selectAll.value = !selectAll.value;
          toggleSelectAll();
        },
      }),
    size: 50,
    cell: (info) => {
      const mark = info.row.original;
      return h("input", {
        type: "checkbox",
        class: "checkbox checkbox-sm",
        checked: isMarkSelected(mark),
        onChange: () => toggleMarkSelection(mark),
      });
    },
  }),
  columnHelper.accessor("Miner", {
    header: "Miner",
    size: 120,
    enableColumnFilter: true,
    cell: (info) => h("div", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("sector_num", {
    header: "Sector",
    size: 100,
    cell: (info) =>
      h("div", { class: "font-mono text-sm" }, info.getValue().toString()),
  }),
  columnHelper.accessor("TypeName", {
    header: "File Type",
    size: 120,
    enableColumnFilter: true,
    cell: (info) => {
      const typeName = info.getValue();
      return h("div", { class: "badge badge-outline badge-sm" }, typeName);
    },
  }),
  columnHelper.accessor("PathType", {
    header: "Path Type",
    size: 100,
    enableColumnFilter: true,
    cell: (info) => {
      const pathType = info.getValue();
      return h("div", { class: "badge badge-secondary badge-sm" }, pathType);
    },
  }),
  columnHelper.accessor("storage_id", {
    header: "Storage ID",
    size: 150,
    cell: (info) => h("div", { class: "font-mono text-xs" }, info.getValue()),
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    size: 120,
    cell: (info) => {
      const createdAt = info.getValue();
      try {
        const date = new Date(createdAt);
        return h(
          "span",
          {
            class: "text-sm",
            title: date.toLocaleString(),
          },
          formatDistanceToNow(date, { addSuffix: true }),
        );
      } catch {
        return h("div", { class: "text-sm text-error" }, "Invalid date");
      }
    },
  }),
  columnHelper.accessor("approved", {
    header: "Status",
    size: 100,
    enableColumnFilter: true,
    cell: (info) => {
      const approved = info.getValue();

      if (approved) {
        return h("div", { class: "flex items-center gap-1" }, [
          h(CheckIcon, { class: "h-4 w-4 text-success" }),
          h("span", { class: "text-success text-sm" }, "Approved"),
        ]);
      } else {
        return h("div", { class: "flex items-center gap-1" }, [
          h(ClockIcon, { class: "h-4 w-4 text-warning" }),
          h("span", { class: "text-warning text-sm" }, "Pending"),
        ]);
      }
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const approved = row.original.approved;
      return filterValue === "approved" ? approved : !approved;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 120,
    cell: (info) => {
      const mark = info.row.original;
      const isApproving = isActionLoading("approve", mark);
      const isUnapproving = isActionLoading("unapprove", mark);
      const isLoading = isApproving || isUnapproving;

      if (mark.approved) {
        return h(
          "button",
          {
            class: isUnapproving
              ? "btn btn-xs btn-warning loading cursor-not-allowed"
              : "btn btn-xs btn-warning hover:btn-outline transition-colors",
            disabled: isLoading,
            title: "Unapprove for garbage collection",
            onClick: (e: Event) => {
              e.stopPropagation();
              executeAction("unapprove", mark);
            },
          },
          isUnapproving ? "..." : "Unapprove",
        );
      } else {
        return h(
          "button",
          {
            class: isApproving
              ? "btn btn-xs btn-success loading cursor-not-allowed"
              : "btn btn-xs btn-success hover:btn-outline transition-colors",
            disabled: isLoading,
            title: "Approve for garbage collection",
            onClick: (e: Event) => {
              e.stopPropagation();
              executeAction("approve", mark);
            },
          },
          isApproving ? "..." : "Approve",
        );
      }
    },
  }),
];

const gcMarksData = computed(() => gcMarks.value || []);

const { table, store, helpers, handlers } = useStandardTable<StorageGCMark>({
  tableId: "storageGCMarksTable",
  columns: columns as ColumnDef<StorageGCMark>[],
  data: gcMarksData,
  defaultSorting: [{ id: "created_at", desc: true }],
  getRowId: (row) => `gc-mark-${row.sp_id}-${row.sector_num}-${row.storage_id}`,
});

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;

const { clearAllFilters } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = gcMarks.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "Miner": {
      const miners = new Set(data.map((mark) => mark.Miner));
      return `${miners.size} unique miners`;
    }
    case "sector_num":
      return `${data.length} sectors`;
    case "TypeName": {
      const types = new Set(data.map((mark) => mark.TypeName));
      return `${types.size} file types`;
    }
    case "PathType": {
      const types = new Set(data.map((mark) => mark.PathType));
      return `${types.size} path types`;
    }
    case "approved": {
      const approved = data.filter((mark) => mark.approved).length;
      const pending = data.length - approved;
      return `${approved} approved, ${pending} pending`;
    }
    default:
      return "";
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- GC Stats Cards -->
    <div
      v-if="gcStats && gcStats.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div class="card bg-base-200/50">
        <div class="card-body p-4">
          <div class="flex items-center gap-3">
            <ClockIcon class="text-warning h-6 w-6" />
            <div>
              <div class="text-lg font-bold">{{ totalPendingCount }}</div>
              <div class="text-base-content/60 text-xs">Pending Approval</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200/50">
        <div class="card-body p-4">
          <div class="flex items-center gap-3">
            <CheckIcon class="text-success h-6 w-6" />
            <div>
              <div class="text-lg font-bold">{{ totalApprovedCount }}</div>
              <div class="text-base-content/60 text-xs">Approved</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200/50">
        <div class="card-body p-4">
          <div class="flex items-center gap-3">
            <TrashIcon class="text-info h-6 w-6" />
            <div>
              <div class="text-lg font-bold">{{ gcStats.length }}</div>
              <div class="text-base-content/60 text-xs">Storage Providers</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200/50">
        <div class="card-body p-4">
          <div class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-2">
              <div class="bg-primary h-2 w-2 rounded-full"></div>
            </div>
            <div>
              <div class="text-lg font-bold">{{ selectedMarks.length }}</div>
              <div class="text-base-content/60 text-xs">Selected</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- GC Marks Table -->
    <div class="space-y-4">
      <TableControls
        v-model:search-input="store.searchQuery"
        search-placeholder="Search GC marks..."
        :loading="loading"
        :refresh-loading="loading"
        @refresh="refresh"
      >
        <div class="border-base-300 border-l pl-3">
          <label
            class="flex cursor-pointer items-center gap-2 whitespace-nowrap"
          >
            <input
              v-model="store.showAggregateInfo"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            <span class="text-sm">Column stats</span>
          </label>
        </div>

        <template #actions>
          <div class="flex items-center gap-2">
            <!-- Bulk Actions -->
            <div
              v-if="selectedMarks.length > 0"
              class="flex items-center gap-2"
            >
              <button
                class="btn btn-success btn-sm"
                :disabled="loading"
                @click="handleBulkApprove"
              >
                <CheckIcon class="h-4 w-4" />
                Approve ({{ selectedMarks.length }})
              </button>
              <button
                class="btn btn-warning btn-sm"
                :disabled="loading"
                @click="handleBulkUnapprove"
              >
                <XMarkIcon class="h-4 w-4" />
                Unapprove ({{ selectedMarks.length }})
              </button>
            </div>

            <!-- Clear Filters -->
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
          </div>
        </template>

        <template #stats>
          <span class="font-medium">{{ totalItems }}</span> GC marks
          <span v-if="selectedMarks.length > 0" class="text-primary">
            •
            <span class="font-medium">{{ selectedMarks.length }}</span>
            selected
          </span>
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
            <template v-if="error">
              <tr>
                <td :colspan="columns.length" class="py-12 text-center">
                  <div
                    class="bg-error/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
                  >
                    <ExclamationTriangleIcon class="text-error h-8 w-8" />
                  </div>
                  <h3 class="text-base-content mb-2 text-lg font-semibold">
                    GC Data Error
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
                      loading ? "Retrying..." : "Retry"
                    }}</span>
                  </button>
                </td>
              </tr>
            </template>
            <template v-else-if="loading && !tableHasData">
              <tr>
                <td
                  :colspan="columns.length"
                  class="text-base-content/60 py-12 text-center"
                >
                  <div
                    class="loading loading-spinner loading-lg mx-auto mb-4"
                  ></div>
                  <div>Loading garbage collection data...</div>
                </td>
              </tr>
            </template>
            <template v-else-if="!tableHasData">
              <tr>
                <td
                  :colspan="columns.length"
                  class="text-base-content/60 py-8 text-center"
                >
                  <TrashIcon
                    class="text-base-content/20 mx-auto mb-3 h-12 w-12"
                  />
                  <div>No garbage collection marks found</div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                class="bg-base-100 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="border-base-300/30 border-r px-3 py-3 text-sm last:border-r-0"
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
  </div>
</template>
