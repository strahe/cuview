<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import { ArrowRightIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useTableActions } from "@/composables/useTableActions";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import type {
  MarketBalanceStatus,
  MarketBalanceTableEntry,
  TransferRequest,
} from "@/types/wallet";

interface Props {
  items?: MarketBalanceStatus[];
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
    id: item.Miner,
    totalBalance: parseFloat(item.Balance) || 0,
    availableNumber: parseFloat(item.Available) || 0,
  })) as MarketBalanceTableEntry[];
});

const showTransferDialog = ref(false);
const selectedBalance = ref<MarketBalanceTableEntry | null>(null);
const transferData = ref<TransferRequest>({
  miner: "",
  amount: "",
  wallet: "",
});
const operationError = ref<string | null>(null);
const manualRefreshLoading = ref(false);

const { call } = useCurioQuery();
const { isLoading: isActionLoading, executeAction } =
  useTableActions<MarketBalanceTableEntry>({
    actions: {
      transfer: {
        name: "transfer",
        handler: async () => {
          await call("MoveBalanceToEscrow", [
            transferData.value.miner,
            transferData.value.amount,
            transferData.value.wallet,
          ]);
        },
        loadingKey: (item) => `transfer-${item.Miner}`,
        onSuccess: () => {
          props.onRefresh();
          handleTransferCancel();
        },
      },
    },
  });

const formatBalance = (balance: string) => {
  const num = parseFloat(balance);
  if (num === 0) return "0 FIL";
  if (num < 0.001) return `${(num * 1000).toFixed(6)} mFIL`;
  return `${num.toFixed(6)} FIL`;
};

const getBalanceClass = (balance: string) => {
  const num = parseFloat(balance);
  if (num === 0) return "text-base-content/60";
  if (num < 1) return "text-warning";
  return "text-success";
};

const columnHelper = createColumnHelper<MarketBalanceTableEntry>();

const columns = [
  columnHelper.accessor("Miner", {
    header: "Storage Provider",
    size: 150,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "font-mono text-sm font-medium" }, info.getValue()),
  }),
  columnHelper.accessor("totalBalance", {
    header: "Total Balance",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const balance = info.row.original.Balance;
      return h(
        "span",
        {
          class: `font-mono text-sm ${getBalanceClass(balance)}`,
        },
        formatBalance(balance),
      );
    },
  }),
  columnHelper.accessor("EscrowBalance", {
    header: "Escrow Balance",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const balance = info.getValue();
      return h(
        "span",
        {
          class: `font-mono text-sm ${getBalanceClass(balance)}`,
        },
        formatBalance(balance),
      );
    },
  }),
  columnHelper.accessor("LockedBalance", {
    header: "Locked Balance",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const balance = info.getValue();
      return h(
        "span",
        {
          class: `font-mono text-sm ${getBalanceClass(balance)}`,
        },
        formatBalance(balance),
      );
    },
  }),
  columnHelper.accessor("Available", {
    header: "Available",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const balance = info.getValue();
      return h(
        "span",
        {
          class: `font-mono text-sm ${getBalanceClass(balance)}`,
        },
        formatBalance(balance),
      );
    },
  }),
  columnHelper.display({
    id: "wallets",
    header: "Wallets",
    size: 100,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const item = info.row.original;
      const walletCount = item.Wallets?.length || 0;
      return h(
        "div",
        { class: "badge badge-neutral badge-sm" },
        `${walletCount} wallets`,
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
      const item = info.row.original;
      const isTransferring = isActionLoading("transfer", item);
      const hasAvailableBalance = parseFloat(item.Available) > 0;

      return h(
        "button",
        {
          class: isTransferring
            ? "btn btn-primary btn-xs gap-1 loading cursor-not-allowed"
            : hasAvailableBalance
              ? "btn btn-primary btn-xs gap-1"
              : "btn btn-outline btn-neutral btn-xs gap-1 border-base-content/30",
          disabled: isTransferring || !hasAvailableBalance,
          title: hasAvailableBalance
            ? "Transfer balance to escrow"
            : "No available balance to transfer",
          onClick: () => handleTransferClick(item),
        },
        isTransferring
          ? "Transferring..."
          : [h(ArrowRightIcon, { class: "size-3" }), h("span", "Transfer")],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<MarketBalanceTableEntry>({
    tableId: "marketBalanceTable",
    columns: columns as ColumnDef<MarketBalanceTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "totalBalance", desc: true }],
    getRowId: (row) => `market-${row.Miner}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const handleTransferClick = (item: MarketBalanceTableEntry) => {
  selectedBalance.value = item;
  transferData.value = {
    miner: item.Miner,
    amount: "",
    wallet: item.Wallets?.[0]?.Address || "",
  };
  operationError.value = null;
  showTransferDialog.value = true;
};

const handleTransferCancel = () => {
  showTransferDialog.value = false;
  selectedBalance.value = null;
  transferData.value = { miner: "", amount: "", wallet: "" };
  operationError.value = null;
};

const handleTransferConfirm = async () => {
  if (!selectedBalance.value) return;

  const amount = parseFloat(transferData.value.amount);
  const available = parseFloat(selectedBalance.value.Available);

  if (!transferData.value.amount.trim()) {
    operationError.value = "Amount is required";
    return;
  }

  if (amount <= 0) {
    operationError.value = "Amount must be greater than 0";
    return;
  }

  if (amount > available) {
    operationError.value = "Amount exceeds available balance";
    return;
  }

  if (!transferData.value.wallet.trim()) {
    operationError.value = "Wallet address is required";
    return;
  }

  try {
    operationError.value = null;
    await executeAction("transfer", selectedBalance.value!);
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Transfer failed";
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
    case "Miner":
      return `${data.length} storage providers`;
    case "totalBalance": {
      const total = data.reduce((sum, item) => sum + item.totalBalance, 0);
      return `${formatBalance(total.toString())} total`;
    }
    case "EscrowBalance": {
      const total = data.reduce(
        (sum, item) => sum + parseFloat(item.EscrowBalance),
        0,
      );
      return `${formatBalance(total.toString())} total`;
    }
    case "LockedBalance": {
      const total = data.reduce(
        (sum, item) => sum + parseFloat(item.LockedBalance),
        0,
      );
      return `${formatBalance(total.toString())} total`;
    }
    case "Available": {
      const total = data.reduce(
        (sum, item) => sum + parseFloat(item.Available),
        0,
      );
      return `${formatBalance(total.toString())} total`;
    }
    case "wallets": {
      const totalWallets = data.reduce(
        (sum, item) => sum + (item.Wallets?.length || 0),
        0,
      );
      return `${totalWallets} total wallets`;
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
      search-placeholder="Search storage providers..."
      :loading="props.loading"
      :refresh-loading="manualRefreshLoading"
      @refresh="handleManualRefresh"
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

      <template #stats>
        <span class="font-medium">{{ totalItems }}</span> storage providers
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
                <div>Loading market balances...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <div class="mb-2 text-4xl">⚖️</div>
                <div>No market balances found</div>
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
    v-model:show="showTransferDialog"
    title="Transfer Balance to Escrow"
    message="Transfer the specified amount from the selected wallet to the storage provider's market escrow balance. This action cannot be undone."
    confirm-text="Transfer"
    type="warning"
    :loading="isActionLoading('transfer', selectedBalance!)"
    @confirm="handleTransferConfirm"
    @cancel="handleTransferCancel"
  >
    <div class="space-y-4">
      <div class="bg-base-200/30 rounded-lg p-3">
        <div class="text-base-content/70 text-sm">Storage Provider</div>
        <div class="font-mono font-medium">{{ selectedBalance?.Miner }}</div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Amount (FIL)</span>
          <span class="text-base-content/60 label-text-alt">
            Available: {{ formatBalance(selectedBalance?.Available || "0") }}
          </span>
        </label>
        <input
          v-model="transferData.amount"
          type="number"
          step="0.000001"
          :max="selectedBalance?.Available"
          placeholder="0.000000"
          class="input input-bordered font-mono"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">From Wallet</span>
        </label>
        <select
          v-model="transferData.wallet"
          class="select select-bordered font-mono"
        >
          <option value="">Select wallet...</option>
          <option
            v-for="wallet in selectedBalance?.Wallets"
            :key="wallet.Address"
            :value="wallet.Address"
          >
            {{ wallet.Address }} ({{ formatBalance(wallet.Balance) }})
          </option>
        </select>
      </div>
    </div>
  </ConfirmationDialog>
</template>
