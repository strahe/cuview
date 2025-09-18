<script setup lang="ts">
import { computed, h } from "vue";
import { useRouter } from "vue-router";
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
import { formatBytes } from "@/utils/format";
import { getProgressColor } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { StoragePathInfo } from "@/types/storage";

interface Props {
  storagePathsData: StoragePathInfo[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => props.storagePathsData);
const router = useRouter();

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
  columnHelper.accessor("ID", {
    header: "Path ID",
    size: 200,
    enableColumnFilter: true,
    cell: (info) => {
      const pathId = info.getValue();
      return h("div", { class: "font-mono text-sm" }, pathId);
    },
  }),
  columnHelper.accessor("Machine", {
    header: "Machine",
    size: 150,
    enableColumnFilter: true,
    cell: (info) => {
      const machine = info.getValue();
      const machineId = info.row.original.MachineID;
      return h(
        "button",
        {
          class: "link link-primary text-sm hover:link-hover",
          onClick: () => {
            // Navigate to machine detail page
            router.push(`/machines/${machineId}`);
          },
        },
        machine,
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

      if (path.CanSeal) {
        types.push(h("div", { class: "badge badge-primary badge-sm" }, "Seal"));
      }
      if (path.CanStore) {
        types.push(
          h("div", { class: "badge badge-secondary badge-sm" }, "Store"),
        );
      }

      return h("div", { class: "flex flex-wrap gap-1" }, types);
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const path = row.original;
      const searchValue = filterValue.toLowerCase();

      if (searchValue === "seal" && path.CanSeal) return true;
      if (searchValue === "store" && path.CanStore) return true;
      return false;
    },
  }),
  columnHelper.accessor("Capacity", {
    header: "Capacity",
    size: 120,
    cell: (info) => {
      const capacity = info.getValue();
      return h("div", { class: "font-medium" }, formatBytes(capacity));
    },
  }),
  columnHelper.accessor("Used", {
    header: "Used",
    size: 120,
    cell: (info) => {
      const used = info.getValue();
      return h("div", { class: "font-medium" }, formatBytes(used));
    },
  }),
  columnHelper.accessor("Available", {
    header: "Available",
    size: 120,
    cell: (info) => {
      const available = info.getValue();
      return h("div", { class: "font-medium" }, formatBytes(available));
    },
  }),
  columnHelper.accessor("UsedPercent", {
    header: "Usage",
    size: 150,
    cell: (info) => {
      const usedPercent = info.getValue();
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
      const Icon = getHealthStatusIcon(path.HealthStatus);

      return h("div", { class: "flex items-center gap-2" }, [
        h(Icon, {
          class: `h-4 w-4 ${getHealthStatusColor(path.HealthStatus)}`,
        }),
        h(
          "span",
          {
            class: `text-sm capitalize ${getHealthStatusColor(path.HealthStatus)}`,
          },
          path.HealthStatus,
        ),
      ]);
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      return row.original.HealthStatus.toLowerCase().includes(
        filterValue.toLowerCase(),
      );
    },
  }),
  columnHelper.accessor("LastHeartbeat", {
    header: "Last Heartbeat",
    size: 140,
    cell: (info) => {
      const heartbeat = info.getValue();
      const path = info.row.original;

      if (path.HeartbeatErr) {
        return h("div", [
          h("div", { class: "text-error text-sm font-medium" }, heartbeat),
          h(
            "div",
            {
              class: "text-error text-xs",
              title: path.HeartbeatErr,
            },
            path.HeartbeatErr,
          ),
        ]);
      }

      return h("div", { class: "text-sm" }, heartbeat);
    },
  }),
];

const { table, store, helpers, handlers } = useStandardTable<StoragePathInfo>({
  tableId: "storagePathsTable",
  columns: columns as ColumnDef<StoragePathInfo>[],
  data: rawData,
  defaultSorting: [{ id: "UsedPercent", desc: true }],
  getRowId: (row) => `storage-path-${row.ID}`,
});

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;

const { clearAllFilters } = handlers;

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "ID":
      return `${data.length} storage paths`;
    case "Machine": {
      const machines = new Set(data.map((path) => path.Machine));
      return `${machines.size} unique machines`;
    }
    case "type": {
      const sealPaths = data.filter((path) => path.CanSeal).length;
      const storePaths = data.filter((path) => path.CanStore).length;
      return `${sealPaths} seal, ${storePaths} store`;
    }
    case "Capacity": {
      const total = data.reduce((sum, path) => sum + path.Capacity, 0);
      return formatBytes(total);
    }
    case "Used": {
      const total = data.reduce((sum, path) => sum + path.Used, 0);
      return formatBytes(total);
    }
    case "Available": {
      const total = data.reduce((sum, path) => sum + path.Available, 0);
      return formatBytes(total);
    }
    case "UsedPercent": {
      if (data.length === 0) return "";
      const average =
        data.reduce((sum, path) => sum + path.UsedPercent, 0) / data.length;
      return `${Math.round(average)}% average`;
    }
    case "health": {
      const healthy = data.filter(
        (path) => path.HealthStatus === "healthy",
      ).length;
      const warning = data.filter(
        (path) => path.HealthStatus === "warning",
      ).length;
      const error = data.filter((path) => path.HealthStatus === "error").length;
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
      :loading="props.loading"
      @refresh="props.onRefresh"
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
          <template v-if="props.error">
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
                    props.loading ? "Retrying..." : "Retry"
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
</template>
