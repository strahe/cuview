<script setup lang="ts">
import { computed, h, ref, nextTick } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  ArrowRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { formatFIL } from "@/utils/format";
import { getTableRowClasses } from "@/utils/ui";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type {
  MarketBalanceStatus,
  MarketBalanceDisplay,
  MarketBalanceTableEntry,
  TransferRequest,
  WalletInfo,
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
  if (!props.items || props.items.length === 0) {
    return [];
  }

  const processedData = props.items
    .map((item) => {
      try {
        if (!item || typeof item !== "object") {
          return null;
        }

        const availableMarketBalanceString = item.market_balance || "0";
        const availableMarketBalance = parseFloat(availableMarketBalanceString);
        const safeAvailableMarketBalance = isNaN(availableMarketBalance)
          ? 0
          : availableMarketBalance;

        const balances = Array.isArray(item.balances) ? item.balances : [];

        const totalWalletBalance = balances.reduce((sum, wallet) => {
          if (!wallet || typeof wallet !== "object") {
            return sum;
          }

          const walletBalance = parseFloat(wallet.Balance || "0");
          if (isNaN(walletBalance)) {
            return sum;
          }
          return sum + walletBalance;
        }, 0);

        const escrowBalance = safeAvailableMarketBalance;

        const wallets: WalletInfo[] = balances
          .filter(
            (wallet) => wallet && typeof wallet === "object" && wallet.Address,
          )
          .map((wallet) => ({
            Address: wallet.Address || "unknown",
            Name: wallet.Address || "unknown",
            Type: "unknown",
            Balance: wallet.Balance || "0",
          }));

        const displayItem: MarketBalanceDisplay = {
          Miner: item.miner || "unknown",
          MarketAvailable: escrowBalance.toString(),
          WalletCount: wallets.length,
          TotalWalletBalance: totalWalletBalance.toString(),
          Wallets: balances,
        };

        const tableEntry = {
          ...displayItem,
          id: item.miner || `unknown-${Math.random()}`,
          marketAvailableNumber: escrowBalance,
          totalWalletBalanceNumber: totalWalletBalance,
        } as MarketBalanceTableEntry;

        return tableEntry;
      } catch {
        return null;
      }
    })
    .filter((item): item is MarketBalanceTableEntry => item !== null);

  return processedData;
});

const showTransferDialog = ref(false);
const selectedBalance = ref<MarketBalanceTableEntry | null>(null);
const transferData = ref<TransferRequest>({
  miner: "",
  amount: "",
  wallet: "",
});
const operationError = ref<string | null>(null);
const operationSuccess = ref<string | null>(null);
const manualRefreshLoading = ref(false);
const messageCid = ref<string>("");

const {
  copy: copyMessageCid,
  copied: copiedCid,
  reset: resetCopyState,
} = useCopyToClipboard({
  resetDelay: 2000,
});

const { call } = useCurioQuery();
const isTransferring = ref(false);

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
  columnHelper.accessor("totalWalletBalanceNumber", {
    header: "Total Wallet Balance",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const balance = info.row.original.TotalWalletBalance;
      return h(
        "span",
        {
          class: `font-mono text-sm ${getBalanceClass(balance)}`,
        },
        formatFIL(balance),
      );
    },
  }),
  columnHelper.accessor("MarketAvailable", {
    header: "Market Available",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const balance = info.getValue();
      return h(
        "span",
        {
          class: `font-mono text-sm ${getBalanceClass(balance)}`,
        },
        formatFIL(balance),
      );
    },
  }),
  columnHelper.accessor("WalletCount", {
    header: "Wallet Count",
    size: 100,
    enableGrouping: false,
    cell: (info) => {
      const count = info.getValue();
      return h(
        "div",
        { class: "badge badge-neutral badge-sm" },
        `${count} wallets`,
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 120,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const item = info.row.original;
      const isItemTransferring = isTransferring.value;

      return h(
        "button",
        {
          class: isItemTransferring
            ? "btn btn-primary btn-xs gap-1 loading cursor-not-allowed"
            : "btn btn-primary btn-xs gap-1",
          disabled: isItemTransferring,
          title: "Move funds from any wallet to market escrow",
          onClick: () => {
            handleTransferClick(item);
          },
        },
        isItemTransferring
          ? "Moving..."
          : [
              h(ArrowRightIcon, { class: "size-3" }),
              h("span", "Move to Escrow"),
            ],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<MarketBalanceTableEntry>({
    tableId: "marketBalanceTable",
    columns: columns as ColumnDef<MarketBalanceTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "totalWalletBalanceNumber", desc: true }],
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
    wallet: "",
  };
  operationError.value = null;
  operationSuccess.value = null;
  messageCid.value = "";
  resetCopyState();
  showTransferDialog.value = true;
};

const handleTransferCancel = () => {
  showTransferDialog.value = false;
  selectedBalance.value = null;
  transferData.value = { miner: "", amount: "", wallet: "" };
  operationError.value = null;
  operationSuccess.value = null;
  messageCid.value = "";
  resetCopyState();
};

const handleTransferConfirm = async () => {
  if (!selectedBalance.value) return;

  const amount = parseFloat(transferData.value.amount);

  if (
    !transferData.value.amount ||
    transferData.value.amount === "" ||
    isNaN(amount)
  ) {
    operationError.value = "Amount is required";
    return;
  }

  if (amount <= 0) {
    operationError.value = "Amount must be greater than 0";
    return;
  }

  const trimmedWallet = transferData.value.wallet.trim();
  if (!trimmedWallet) {
    operationError.value = "Wallet address is required";
    return;
  }

  try {
    operationError.value = null;
    operationSuccess.value = null;
    isTransferring.value = true;

    const amountWithUnit = `${transferData.value.amount} FIL`;
    const cid = await call("MoveBalanceToEscrow", [
      transferData.value.miner,
      amountWithUnit,
      trimmedWallet,
    ]);

    messageCid.value = String(cid);
    operationSuccess.value = "success";
    props.onRefresh();
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Transfer failed";
  } finally {
    isTransferring.value = false;
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
    case "totalWalletBalanceNumber": {
      const total = data.reduce(
        (sum, item) => sum + item.totalWalletBalanceNumber,
        0,
      );
      return `${formatFIL(total.toString())} total wallet`;
    }
    case "MarketAvailable": {
      const total = data.reduce(
        (sum, item) => sum + parseFloat(item.MarketAvailable),
        0,
      );
      return `${formatFIL(total.toString())} total market`;
    }
    case "WalletCount": {
      const totalWallets = data.reduce(
        (sum, item) => sum + item.WalletCount,
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
                <ScaleIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No market balances found</div>
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

  <!-- Move Funds to Escrow Dialog -->
  <div
    v-if="showTransferDialog"
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
          <h3 class="text-lg font-semibold">Transfer Successful</h3>
        </div>

        <!-- Primary Info: Amount & Miner -->
        <div class="bg-base-200/30 mb-4 rounded-lg p-4">
          <div class="mb-2 text-center">
            <div class="font-mono text-2xl font-bold">
              {{ transferData.amount }} FIL
            </div>
            <div class="text-base-content/70 text-sm">moved to escrow for</div>
            <div class="font-mono font-medium">{{ transferData.miner }}</div>
          </div>
        </div>

        <!-- Secondary Info: Transaction ID -->
        <div class="mb-6">
          <div
            class="text-base-content/70 mb-2 text-xs font-medium tracking-wide uppercase"
          >
            Transaction Message
          </div>
          <div class="bg-base-200/50 flex items-center gap-2 rounded p-3">
            <div class="flex-1 font-mono text-xs break-all">
              {{ messageCid }}
            </div>
            <button
              class="btn btn-ghost btn-xs"
              :class="{ 'text-success': copiedCid }"
              :title="copiedCid ? 'Copied!' : 'Copy Message CID'"
              @click="copyMessageCid(messageCid)"
            >
              <CheckCircleIcon v-if="copiedCid" class="size-4" />
              <ClipboardDocumentIcon v-else class="size-4" />
            </button>
          </div>
        </div>

        <!-- Action: Close -->
        <div class="flex justify-end">
          <button class="btn btn-primary" @click="handleTransferCancel">
            Close
          </button>
        </div>
      </template>

      <!-- Form State -->
      <template v-else>
        <h3 class="mb-4 text-lg font-semibold">Move Funds to Escrow</h3>

        <!-- Storage Provider Info -->
        <div class="bg-base-200/30 mb-4 rounded-lg p-3">
          <div class="text-base-content/70 text-sm">Storage Provider</div>
          <div class="font-mono font-medium">{{ selectedBalance?.Miner }}</div>
        </div>

        <!-- Amount Input -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Amount (FIL)</span>
          </label>
          <input
            v-model="transferData.amount"
            type="number"
            step="0.000001"
            min="0"
            placeholder="0.000000"
            class="input input-bordered font-mono"
            :disabled="isTransferring"
          />
        </div>

        <!-- Wallet Address Input -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">From Wallet Address</span>
          </label>
          <input
            v-model="transferData.wallet"
            type="text"
            placeholder="Enter wallet address..."
            class="input input-bordered font-mono"
            :disabled="isTransferring"
            @input="transferData.wallet = transferData.wallet.trim()"
            @paste="
              () =>
                nextTick(
                  () => (transferData.wallet = transferData.wallet.trim()),
                )
            "
          />
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
            :disabled="isTransferring"
            @click="handleTransferCancel"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="isTransferring"
            @click="handleTransferConfirm"
          >
            <span
              v-if="isTransferring"
              class="loading loading-spinner loading-sm"
            ></span>
            Move Funds
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
