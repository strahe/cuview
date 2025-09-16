<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useTableActions } from "@/composables/useTableActions";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import type { AllowDeny, AccessControlTableEntry } from "@/types/wallet";

interface Props {
  items?: AllowDeny[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => {
  return props.items.map((item) => ({
    ...item,
    id: item.Wallet,
    Status: item.Allow ? "allowed" : "denied",
    statusBadgeClass: item.Allow ? "badge-success" : "badge-error",
  })) as AccessControlTableEntry[];
});

const showAddDialog = ref(false);
const showRemoveDialog = ref(false);
const selectedEntry = ref<AccessControlTableEntry | null>(null);
const newEntry = ref({ wallet: "", allow: true });
const operationError = ref<string | null>(null);
const manualRefreshLoading = ref(false);

const { call } = useCurioQuery();
const { isLoading: isActionLoading, executeAction } =
  useTableActions<AccessControlTableEntry>({
    actions: {
      add: {
        name: "add",
        handler: async () => {
          await call("AddAllowDenyList", [
            newEntry.value.wallet,
            newEntry.value.allow,
          ]);
        },
        loadingKey: () => "add-filter",
        onSuccess: () => {
          props.onRefresh();
          handleAddCancel();
        },
      },
      remove: {
        name: "remove",
        handler: async (entry) => {
          await call("RemoveAllowFilter", [entry.Wallet]);
        },
        loadingKey: (entry) => `remove-${entry.Wallet}`,
        onSuccess: () => {
          props.onRefresh();
          handleRemoveCancel();
        },
      },
    },
  });

const columnHelper = createColumnHelper<AccessControlTableEntry>();

const columns = [
  columnHelper.accessor("Wallet", {
    header: "Wallet Address",
    size: 200,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("Status", {
    header: "Status",
    size: 120,
    enableGrouping: true,
    enableColumnFilter: true,
    cell: (info) => {
      const status = info.getValue();
      const isAllowed = status === "allowed";
      const badgeClass = isAllowed ? "badge-success" : "badge-error";
      const icon = isAllowed ? ShieldCheckIcon : ShieldExclamationIcon;

      return h("div", { class: "flex items-center gap-2" }, [
        h(icon, { class: "size-4" }),
        h(
          "div",
          { class: `badge badge-outline ${badgeClass}` },
          status.toUpperCase(),
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "description",
    header: "Description",
    size: 250,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const entry = info.row.original;
      const isAllowed = entry.Allow;
      return h(
        "span",
        { class: "text-sm text-base-content/70" },
        isAllowed
          ? "Wallet is allowed to access cluster resources"
          : "Wallet is denied access to cluster resources",
      );
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
      const isRemoving = isActionLoading("remove", entry);

      return h(
        "button",
        {
          class: isRemoving
            ? "btn btn-error btn-xs loading cursor-not-allowed"
            : "btn btn-error btn-xs",
          disabled: isRemoving,
          title: "Remove access filter",
          onClick: () => handleRemoveClick(entry),
        },
        isRemoving ? "Removing..." : [h(TrashIcon, { class: "size-3" })],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<AccessControlTableEntry>({
    tableId: "walletFiltersTable",
    columns: columns as ColumnDef<AccessControlTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "Wallet", desc: false }],
    getRowId: (row) => `filter-${row.Wallet}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const statusFilter = computed({
  get: () => {
    const filter = table.getColumn("Status")?.getFilterValue() as string;
    return filter || "all";
  },
  set: (value: string) => {
    table
      .getColumn("Status")
      ?.setFilterValue(value === "all" ? undefined : value);
  },
});

const statusDistribution = computed(() => {
  if (!rawData.value?.length) return { allowed: 0, denied: 0 };

  return rawData.value.reduce(
    (acc, entry) => {
      acc[entry.Status as keyof typeof acc]++;
      return acc;
    },
    { allowed: 0, denied: 0 },
  );
});

const handleAddClick = () => {
  newEntry.value = { wallet: "", allow: true };
  operationError.value = null;
  showAddDialog.value = true;
};

const handleAddCancel = () => {
  showAddDialog.value = false;
  newEntry.value = { wallet: "", allow: true };
  operationError.value = null;
};

const handleAddConfirm = async () => {
  if (!newEntry.value.wallet.trim()) {
    operationError.value = "Wallet address is required";
    return;
  }

  const exists = rawData.value.some(
    (entry) => entry.Wallet === newEntry.value.wallet,
  );
  if (exists) {
    operationError.value = "Wallet already exists in access control list";
    return;
  }

  try {
    operationError.value = null;
    await executeAction("add", {} as AccessControlTableEntry);
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Failed to add access filter";
  }
};

const handleRemoveClick = (entry: AccessControlTableEntry) => {
  selectedEntry.value = entry;
  operationError.value = null;
  showRemoveDialog.value = true;
};

const handleRemoveCancel = () => {
  showRemoveDialog.value = false;
  selectedEntry.value = null;
  operationError.value = null;
};

const handleRemoveConfirm = async () => {
  if (!selectedEntry.value) return;

  try {
    operationError.value = null;
    await executeAction("remove", selectedEntry.value!);
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Failed to remove access filter";
  }
};

const handleManualRefresh = async () => {
  manualRefreshLoading.value = true;
  try {
    await props.onRefresh();
  } finally {
    manualRefreshLoading.value = false;
  }
};

const getColumnAggregateInfo = (columnId: string) => {
  const data = rawData.value;
  if (!data || !data.length) return "";

  switch (columnId) {
    case "Wallet":
      return `${data.length} total entries`;
    case "Status": {
      const { allowed, denied } = statusDistribution.value;
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
      :refresh-loading="manualRefreshLoading"
      @refresh="handleManualRefresh"
    >
      <div class="border-base-300 border-l pl-3">
        <button class="btn btn-primary btn-sm gap-2" @click="handleAddClick">
          <PlusIcon class="size-4" />
          Add Filter
        </button>
      </div>

      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Status:
          </span>
          <select
            v-model="statusFilter"
            class="select select-bordered select-sm min-w-32"
          >
            <option value="all">All</option>
            <option value="allowed">
              Allowed ({{ statusDistribution.allowed }})
            </option>
            <option value="denied">
              Denied ({{ statusDistribution.denied }})
            </option>
          </select>
        </div>
      </div>

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
        <span class="font-medium">{{ totalItems }}</span> access filters
      </template>

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
                  <div class="text-error text-2xl">⚠️</div>
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
                <div>Loading access filters...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <div class="mb-2 text-4xl">🛡️</div>
                <div>No access filters configured</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="bg-base-100 hover:bg-primary hover:text-primary-content transition-all duration-200"
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

    <div v-if="operationError" class="alert alert-error">
      <div class="flex items-start justify-between">
        <span>{{ operationError }}</span>
        <button class="btn btn-ghost btn-xs" @click="operationError = null">
          ×
        </button>
      </div>
    </div>
  </div>

  <ConfirmationDialog
    v-model:show="showAddDialog"
    title="Add Access Filter"
    message="Add a new access control filter for the specified wallet address."
    confirm-text="Add Filter"
    type="info"
    :loading="isActionLoading('add', {} as AccessControlTableEntry)"
    @confirm="handleAddConfirm"
    @cancel="handleAddCancel"
  >
    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Wallet Address</span>
        </label>
        <input
          v-model="newEntry.wallet"
          type="text"
          placeholder="f1abc... or f3xyz..."
          class="input input-bordered font-mono"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Access Level</span>
        </label>
        <div class="flex gap-4">
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="newEntry.allow"
              type="radio"
              :value="true"
              class="radio radio-success"
            />
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="text-success size-4" />
              <span>Allow Access</span>
            </div>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="newEntry.allow"
              type="radio"
              :value="false"
              class="radio radio-error"
            />
            <div class="flex items-center gap-2">
              <ShieldExclamationIcon class="text-error size-4" />
              <span>Deny Access</span>
            </div>
          </label>
        </div>
      </div>

      <div class="bg-info/10 rounded-lg p-3 text-sm">
        <div class="text-info mb-1 font-medium">Note:</div>
        <div class="text-base-content/80">
          Access filters control which wallets can interact with the Curio
          cluster. Allowed wallets can perform operations, while denied wallets
          are blocked.
        </div>
      </div>
    </div>
  </ConfirmationDialog>

  <ConfirmationDialog
    v-model:show="showRemoveDialog"
    title="Remove Access Filter"
    :message="`Are you sure you want to remove the access filter for wallet ${selectedEntry?.Wallet}? This will remove all access control restrictions for this wallet.`"
    type="danger"
    confirm-text="Remove Filter"
    :loading="isActionLoading('remove', selectedEntry!)"
    @confirm="handleRemoveConfirm"
    @cancel="handleRemoveCancel"
  />
</template>
