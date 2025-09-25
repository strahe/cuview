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
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { AllowDeny, AccessControlTableEntry } from "@/types/wallet";
import { getTableRowClasses } from "@/utils/ui";

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
    id: item.wallet,
    wallet: item.wallet,
    status: item.status,
    statusText: item.status ? "allowed" : "denied",
    statusBadgeClass: item.status ? "badge-success" : "badge-error",
  })) as AccessControlTableEntry[];
});

const showAddDialog = ref(false);
const showRemoveDialog = ref(false);
const selectedEntry = ref<AccessControlTableEntry | null>(null);
const newEntry = ref({ wallet: "", status: true });
const operationError = ref<string | null>(null);
const operationSuccess = ref<string | null>(null);
const manualRefreshLoading = ref(false);

const isAddingFilter = ref(false);
const removingFilters = ref(new Set<string>());

const { call } = useCurioQuery();

const columnHelper = createColumnHelper<AccessControlTableEntry>();

const columns = [
  columnHelper.accessor("wallet", {
    header: "Client Address",
    size: 200,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("statusText", {
    header: "Deal Permission",
    size: 120,
    enableGrouping: true,
    enableColumnFilter: true,
    cell: (info) => {
      const entry = info.row.original;
      const isAllowed = entry.status;
      const badgeClass = isAllowed ? "badge-success" : "badge-error";
      const icon = isAllowed ? ShieldCheckIcon : ShieldExclamationIcon;

      return h("div", { class: "flex items-center gap-2" }, [
        h(icon, { class: "size-4" }),
        h(
          "div",
          { class: `badge badge-outline ${badgeClass}` },
          entry.statusText.toUpperCase(),
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
      const isAllowed = entry.status;
      return h(
        "span",
        { class: "text-sm" },
        isAllowed
          ? "Client can make storage deals with this cluster"
          : "Client is blocked from making storage deals",
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 100,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const entry = info.row.original;
      const isRemoving = removingFilters.value.has(entry.wallet);

      return h(
        "button",
        {
          class: isRemoving
            ? "btn btn-error btn-xs loading cursor-not-allowed"
            : "btn btn-error btn-xs",
          disabled: isRemoving,
          title: "Remove client access filter",
          onClick: () => handleRemoveClick(entry),
        },
        isRemoving ? "Removing..." : [h(TrashIcon, { class: "size-3" })],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<AccessControlTableEntry>({
    tableId: "clientAccessTable",
    columns: columns as ColumnDef<AccessControlTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "wallet", desc: false }],
    getRowId: (row) => `client-${row.wallet}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const statusFilter = computed({
  get: () => {
    const filter = table.getColumn("statusText")?.getFilterValue() as string;
    return filter || "all";
  },
  set: (value: string) => {
    table
      .getColumn("statusText")
      ?.setFilterValue(value === "all" ? undefined : value);
  },
});

const statusDistribution = computed(() => {
  if (!rawData.value?.length) return { allowed: 0, denied: 0 };

  return rawData.value.reduce(
    (acc, entry) => {
      acc[entry.statusText as keyof typeof acc]++;
      return acc;
    },
    { allowed: 0, denied: 0 },
  );
});

const handleAddClick = () => {
  newEntry.value = { wallet: "", status: true };
  operationError.value = null;
  operationSuccess.value = null;
  showAddDialog.value = true;
};

const handleAddCancel = () => {
  showAddDialog.value = false;
  newEntry.value = { wallet: "", status: true };
  operationError.value = null;
  operationSuccess.value = null;
};

const handleAddConfirm = async () => {
  if (!newEntry.value.wallet.trim()) {
    operationError.value = "Client address is required";
    return;
  }

  const exists = rawData.value.some(
    (entry) => entry.wallet === newEntry.value.wallet.trim(),
  );
  if (exists) {
    operationError.value = "Client already exists in access control list";
    return;
  }

  try {
    operationError.value = null;
    operationSuccess.value = null;
    isAddingFilter.value = true;

    await call("AddAllowDenyList", [
      newEntry.value.wallet.trim(),
      newEntry.value.status,
    ]);

    operationSuccess.value = "success";
    props.onRefresh();
  } catch (error) {
    operationError.value =
      error instanceof Error
        ? error.message
        : "Failed to add client access filter";
  } finally {
    isAddingFilter.value = false;
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
    removingFilters.value.add(selectedEntry.value.wallet);

    await call("RemoveAllowFilter", [selectedEntry.value.wallet]);

    props.onRefresh();
    handleRemoveCancel();
  } catch (error) {
    operationError.value =
      error instanceof Error
        ? error.message
        : "Failed to remove client access filter";
  } finally {
    removingFilters.value.delete(selectedEntry.value!.wallet);
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
    case "wallet":
      return `${data.length} total clients`;
    case "statusText": {
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
      search-placeholder="Search client addresses..."
      :loading="props.loading"
      :refresh-loading="manualRefreshLoading"
      @refresh="handleManualRefresh"
    >
      <div class="border-base-300 border-l pl-3">
        <button class="btn btn-primary btn-sm gap-2" @click="handleAddClick">
          <PlusIcon class="size-4" />
          Add Client
        </button>
      </div>

      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Permission:
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
        <span class="font-medium">{{ totalItems }}</span> client access rules
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
                <div>Loading client access rules...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <ShieldCheckIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No client access rules configured</div>
                <div class="text-base-content/50 mt-1 text-xs">
                  Add rules to control which clients can make storage deals
                </div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[getTableRowClasses(), 'bg-base-100']"
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

  <!-- Add Client Access Filter Dialog -->
  <div
    v-if="showAddDialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div class="bg-base-100 w-full max-w-md rounded-lg p-6 shadow-xl">
      <!-- Success State -->
      <template v-if="operationSuccess">
        <!-- Header: Success Icon + Title -->
        <div class="mb-6 text-center">
          <div class="mx-auto mb-3 flex size-16 items-center justify-center">
            <CheckCircleIcon class="text-success size-16" />
          </div>
          <h3 class="text-lg font-semibold">Client Access Rule Added</h3>
        </div>

        <!-- Primary Info: Client & Permission -->
        <div class="bg-base-200/30 mb-4 rounded-lg p-4">
          <div class="mb-2 text-center">
            <div class="font-mono text-lg font-bold">
              {{ newEntry.wallet }}
            </div>
            <div class="text-base-content/70 text-sm">can now</div>
            <div class="mt-2 flex items-center justify-center gap-2">
              <ShieldCheckIcon
                v-if="newEntry.status"
                class="text-success size-5"
              />
              <ShieldExclamationIcon v-else class="text-error size-5" />
              <span
                class="badge badge-outline"
                :class="newEntry.status ? 'badge-success' : 'badge-error'"
              >
                {{ newEntry.status ? "MAKE DEALS" : "BLOCKED" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Secondary Info: Description -->
        <div class="text-base-content/70 mb-6 text-center text-sm">
          This client
          {{ newEntry.status ? "is now authorized to" : "is now blocked from" }}
          {{ newEntry.status ? "make storage deals" : "making storage deals" }}
          with your Curio cluster.
        </div>

        <!-- Action: Close -->
        <div class="flex justify-end">
          <button class="btn btn-primary" @click="handleAddCancel">
            Close
          </button>
        </div>
      </template>

      <!-- Form State -->
      <template v-else>
        <h3 class="mb-4 text-lg font-semibold">Add Client Access Rule</h3>

        <!-- Client Address Input -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Client Address</span>
          </label>
          <input
            v-model="newEntry.wallet"
            type="text"
            placeholder="f1abc... or f3xyz..."
            class="input input-bordered font-mono"
            :disabled="isAddingFilter"
          />
        </div>

        <!-- Deal Permission Selection -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Deal Permission</span>
          </label>
          <div class="flex gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="newEntry.status"
                type="radio"
                :value="true"
                class="radio radio-success"
                :disabled="isAddingFilter"
              />
              <div class="flex items-center gap-2">
                <ShieldCheckIcon class="text-success size-4" />
                <span>Allow Deals</span>
              </div>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="newEntry.status"
                type="radio"
                :value="false"
                class="radio radio-error"
                :disabled="isAddingFilter"
              />
              <div class="flex items-center gap-2">
                <ShieldExclamationIcon class="text-error size-4" />
                <span>Block Deals</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Info Note -->
        <div class="bg-info/10 mb-4 rounded-lg p-3 text-sm">
          <div class="text-info mb-1 font-medium">Note:</div>
          <div class="text-base-content/80">
            Client access rules control which storage deal clients can interact
            with your Curio cluster. Allowed clients can make storage deals,
            while blocked clients are rejected.
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="operationError" class="mb-4">
          <div
            class="bg-error/10 border-error/20 text-error flex items-start gap-3 rounded-lg border p-3"
          >
            <ExclamationTriangleIcon class="text-error mt-0.5 h-5 w-5" />
            <div class="flex-1 text-sm">{{ operationError }}</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button
            class="btn btn-ghost"
            :disabled="isAddingFilter"
            @click="handleAddCancel"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="isAddingFilter"
            @click="handleAddConfirm"
          >
            <span
              v-if="isAddingFilter"
              class="loading loading-spinner loading-sm"
            ></span>
            Add Rule
          </button>
        </div>
      </template>
    </div>
  </div>

  <!-- Remove Confirmation Dialog -->
  <div
    v-if="showRemoveDialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div class="bg-base-100 w-full max-w-md rounded-lg p-6 shadow-xl">
      <h3 class="text-error mb-4 text-lg font-semibold">
        Remove Client Access Rule
      </h3>

      <div class="mb-4">
        <p class="text-base-content/70 mb-3">
          Are you sure you want to remove the access rule for client:
        </p>
        <div class="bg-base-200/50 rounded p-3 font-mono text-sm break-all">
          {{ selectedEntry?.wallet }}
        </div>
        <p class="text-base-content/70 mt-3 text-sm">
          This will remove all access control restrictions for this client
          regarding storage deals.
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="operationError" class="mb-4">
        <div
          class="bg-error/10 border-error/20 text-error flex items-start gap-3 rounded-lg border p-3"
        >
          <ExclamationTriangleIcon class="text-error mt-0.5 h-5 w-5" />
          <div class="flex-1 text-sm">{{ operationError }}</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button
          class="btn btn-ghost"
          :disabled="removingFilters.has(selectedEntry?.wallet || '')"
          @click="handleRemoveCancel"
        >
          Cancel
        </button>
        <button
          class="btn btn-error"
          :disabled="removingFilters.has(selectedEntry?.wallet || '')"
          @click="handleRemoveConfirm"
        >
          <span
            v-if="removingFilters.has(selectedEntry?.wallet || '')"
            class="loading loading-spinner loading-sm"
          ></span>
          Remove Rule
        </button>
      </div>
    </div>
  </div>
</template>
