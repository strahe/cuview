<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";

import {
  CircleStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { formatBytes, formatDateTime } from "@/utils/format";
import { getProgressColor } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import StoragePathDetailModal from "./StoragePathDetailModal.vue";
import type { StoragePathInfo } from "@/types/storage";

// Self-contained data fetching
const {
  data: storagePathsData,
  loading,
  error,
  refresh,
} = useCachedQuery<StoragePathInfo[]>("StoragePathList", [], {
  pollingInterval: 30000,
});

const rawData = computed(() => storagePathsData.value || []);

// Modal state
const showDetailModal = ref(false);
const selectedStorageId = ref<string | null>(null);

const handleRowClick = (storageId: string) => {
  selectedStorageId.value = storageId;
  showDetailModal.value = true;
};

// Helper functions for derived data
const getHealthStatus = (
  path: StoragePathInfo,
): "healthy" | "warning" | "error" => {
  // If there's a heartbeat error, it's an error
  if (path.HeartbeatErr && path.HeartbeatErr.trim() !== "") {
    return "error";
  }

  // If no heartbeat timestamp, it's an error
  if (!path.LastHeartbeat) {
    return "error";
  }

  // Check if heartbeat is recent (within last 5 minutes)
  try {
    const heartbeatTime = new Date(path.LastHeartbeat);
    const now = new Date();
    const timeDiff = now.getTime() - heartbeatTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 30) {
      return "error";
    } else if (minutesDiff > 10) {
      return "warning";
    }

    return "healthy";
  } catch {
    return "error";
  }
};

const getUsagePercent = (path: StoragePathInfo): number => {
  if (!path.Capacity || path.Capacity <= 0 || !path.Used) {
    return 0;
  }
  return Math.min((path.Used / path.Capacity) * 100, 100);
};

const formatNullableBytes = (value: number | null): string => {
  return value !== null && value !== undefined ? formatBytes(value) : "-";
};

const formatNullableDateTime = (value: string | null): string => {
  return value ? formatDateTime(value) : "-";
};

const getHealthStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "text-success";
    case "warning":
      return "text-warning";
    case "error":
      return "text-error";
    default:
      return "text-base-content/60";
  }
};

const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return CheckCircleIcon;
    case "warning":
      return ExclamationTriangleIcon;
    case "error":
      return ExclamationTriangleIcon;
    default:
      return ClockIcon;
  }
};

const columnHelper = createColumnHelper<StoragePathInfo>();

const columns = [
  columnHelper.accessor("StorageID", {
    header: "Storage ID",
    size: 200,
    enableColumnFilter: true,
    cell: (info) => {
      const storageId = info.getValue();
      return h("div", { class: "font-mono text-sm" }, storageId);
    },
  }),
  columnHelper.accessor("URLs", {
    header: "URLs",
    size: 200,
    enableColumnFilter: true,
    cell: (info) => {
      const urls = info.getValue();
      if (!urls) {
        return h("div", { class: "text-base-content/50 text-sm" }, "-");
      }

      // Handle multiple URLs (comma or space separated)
      const urlList = urls.split(/[,\s]+/).filter((url) => url.trim());
      if (urlList.length <= 1) {
        return h("div", { class: "font-mono text-xs" }, urls);
      }

      return h(
        "div",
        { class: "space-y-1" },
        urlList
          .slice(0, 2)
          .map((url) => h("div", { class: "font-mono text-xs" }, url))
          .concat(
            urlList.length > 2
              ? [
                  h(
                    "div",
                    { class: "text-base-content/50 text-xs" },
                    `+${urlList.length - 2} more`,
                  ),
                ]
              : [],
          ),
      );
    },
  }),
  columnHelper.display({
    id: "type",
    header: "Type",
    size: 120,
    enableColumnFilter: true,
    cell: (info) => {
      const path = info.row.original;
      const types = [];

      if (path.CanSeal === true) {
        types.push(h("div", { class: "badge badge-primary badge-sm" }, "Seal"));
      }
      if (path.CanStore === true) {
        types.push(
          h("div", { class: "badge badge-secondary badge-sm" }, "Store"),
        );
      }

      if (types.length === 0) {
        return h("div", { class: "text-base-content/50 text-sm" }, "-");
      }

      return h("div", { class: "flex flex-wrap gap-1" }, types);
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const path = row.original;
      const searchValue = filterValue.toLowerCase();

      if (searchValue === "seal" && path.CanSeal === true) return true;
      if (searchValue === "store" && path.CanStore === true) return true;
      return false;
    },
  }),
  columnHelper.accessor("Weight", {
    header: "Weight",
    size: 100,
    cell: (info) => {
      const weight = info.getValue();
      return h("div", { class: "text-sm" }, weight?.toString() || "-");
    },
  }),
  columnHelper.accessor("Capacity", {
    header: "Capacity",
    size: 120,
    cell: (info) => {
      const capacity = info.getValue();
      return h("div", { class: "font-medium" }, formatNullableBytes(capacity));
    },
  }),
  columnHelper.accessor("Used", {
    header: "Used",
    size: 120,
    cell: (info) => {
      const used = info.getValue();
      return h("div", { class: "font-medium" }, formatNullableBytes(used));
    },
  }),
  columnHelper.accessor("Available", {
    header: "Available",
    size: 120,
    cell: (info) => {
      const available = info.getValue();
      return h("div", { class: "font-medium" }, formatNullableBytes(available));
    },
  }),
  columnHelper.display({
    id: "usage",
    header: "Usage",
    size: 150,
    cell: (info) => {
      const path = info.row.original;
      const usedPercent = getUsagePercent(path);

      if (!path.Capacity || !path.Used) {
        return h("div", { class: "text-base-content/50 text-sm" }, "-");
      }

      return h("div", { class: "flex items-center gap-3" }, [
        h("progress", {
          class: `progress w-16 ${getProgressColor(usedPercent)}`,
          value: usedPercent,
          max: 100,
        }),
        h(
          "span",
          { class: "text-sm font-medium" },
          `${Math.round(usedPercent)}%`,
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "health",
    header: "Health",
    size: 120,
    enableColumnFilter: true,
    cell: (info) => {
      const path = info.row.original;
      const healthStatus = getHealthStatus(path);
      const Icon = getHealthStatusIcon(healthStatus);

      return h("div", { class: "flex items-center gap-2" }, [
        h(Icon, {
          class: `h-4 w-4 ${getHealthStatusColor(healthStatus)}`,
        }),
        h(
          "span",
          {
            class: `text-sm capitalize ${getHealthStatusColor(healthStatus)}`,
          },
          healthStatus,
        ),
      ]);
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const healthStatus = getHealthStatus(row.original);
      return healthStatus.toLowerCase().includes(filterValue.toLowerCase());
    },
  }),
  columnHelper.accessor("LastHeartbeat", {
    header: "Last Heartbeat",
    size: 140,
    cell: (info) => {
      const heartbeat = info.getValue();
      const path = info.row.original;

      if (!heartbeat) {
        return h("div", { class: "text-base-content/50 text-sm" }, "Never");
      }

      if (path.HeartbeatErr && path.HeartbeatErr.trim() !== "") {
        return h("div", { class: "space-y-1" }, [
          h(
            "div",
            { class: "text-error text-sm font-medium" },
            formatNullableDateTime(heartbeat),
          ),
          h(
            "div",
            {
              class: "text-error text-xs truncate max-w-32",
              title: path.HeartbeatErr,
            },
            path.HeartbeatErr,
          ),
        ]);
      }

      return h("div", { class: "text-sm" }, formatNullableDateTime(heartbeat));
    },
  }),
];

const { table, store, helpers, handlers } = useStandardTable<StoragePathInfo>({
  tableId: "storagePathsTableV2",
  columns: columns as ColumnDef<StoragePathInfo>[],
  data: rawData,
  defaultSorting: [{ id: "usage", desc: true }],
  getRowId: (row) => `storage-path-${row.StorageID}`,
});

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;

const { clearAllFilters } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "StorageID":
      return `${data.length} storage paths`;
    case "URLs": {
      const withUrls = data.filter(
        (path) => path.URLs && path.URLs.trim() !== "",
      ).length;
      return `${withUrls} configured`;
    }
    case "type": {
      const sealPaths = data.filter((path) => path.CanSeal === true).length;
      const storePaths = data.filter((path) => path.CanStore === true).length;
      return `${sealPaths} seal, ${storePaths} store`;
    }
    case "Weight": {
      const withWeight = data.filter((path) => path.Weight !== null).length;
      return `${withWeight} configured`;
    }
    case "Capacity": {
      const withCapacity = data.filter(
        (path) => path.Capacity !== null && path.Capacity > 0,
      );
      if (withCapacity.length === 0) return "No data";
      const total = withCapacity.reduce(
        (sum, path) => sum + (path.Capacity || 0),
        0,
      );
      return formatBytes(total);
    }
    case "Used": {
      const withUsed = data.filter(
        (path) => path.Used !== null && path.Used > 0,
      );
      if (withUsed.length === 0) return "No data";
      const total = withUsed.reduce((sum, path) => sum + (path.Used || 0), 0);
      return formatBytes(total);
    }
    case "Available": {
      const withAvailable = data.filter(
        (path) => path.Available !== null && path.Available > 0,
      );
      if (withAvailable.length === 0) return "No data";
      const total = withAvailable.reduce(
        (sum, path) => sum + (path.Available || 0),
        0,
      );
      return formatBytes(total);
    }
    case "usage": {
      const withUsage = data.filter((path) => path.Capacity && path.Used);
      if (withUsage.length === 0) return "No data";
      const average =
        withUsage.reduce((sum, path) => sum + getUsagePercent(path), 0) /
        withUsage.length;
      return `${Math.round(average)}% average`;
    }
    case "health": {
      const healthy = data.filter(
        (path) => getHealthStatus(path) === "healthy",
      ).length;
      const warning = data.filter(
        (path) => getHealthStatus(path) === "warning",
      ).length;
      const error = data.filter(
        (path) => getHealthStatus(path) === "error",
      ).length;
      return `${healthy} healthy, ${warning} warnings, ${error} errors`;
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
      search-placeholder="Search storage paths..."
      :loading="loading"
      :refresh-loading="loading"
      @refresh="refresh"
    >
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
        <span class="font-medium">{{ totalItems }}</span> storage paths
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
                  Storage Paths Error
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
                <div>Loading storage paths...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <CircleStackIcon
                  class="text-base-content/20 mx-auto mb-3 h-12 w-12"
                />
                <div>No storage paths found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="bg-base-100 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200"
              @click="handleRowClick(row.original.StorageID)"
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

    <!-- Detail Modal -->
    <StoragePathDetailModal
      v-model:open="showDetailModal"
      :storage-id="selectedStorageId"
    />
  </div>
</template>
