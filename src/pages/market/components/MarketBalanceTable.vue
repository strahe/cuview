<script setup lang="ts">
import { computed, h, ref } from "vue";
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
import { useForm } from "@tanstack/vue-form";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormFieldWrapper,
  FormInput,
  FormLayout,
  FormSection,
  FormActions,
} from "@/components/ui/form";
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
const tableOperationError = ref<string | null>(null);
const operationSuccess = ref<string | null>(null);
const manualRefreshLoading = ref(false);
const messageCid = ref<string>("");
const submissionError = ref<string | null>(null);
const transferModalTitle = computed(() =>
  operationSuccess.value ? "Transfer Successful" : "Move Funds to Escrow",
);
const lastSubmittedTransfer = ref<TransferRequest>({
  miner: "",
  amount: "",
  wallet: "",
});

const {
  copy: copyMessageCid,
  copied: copiedCid,
  reset: resetCopyState,
} = useCopyToClipboard({
  resetDelay: 2000,
});

const { call } = useCurioQuery();

const transferForm = useForm({
  defaultValues: {
    miner: "",
    amount: "",
    wallet: "",
  },
  onSubmit: async ({ value }) => {
    try {
      tableOperationError.value = null;
      submissionError.value = null;
      operationSuccess.value = null;

      const amountWithUnit = `${value.amount} FIL`;
      const cid = await call("MoveBalanceToEscrow", [
        value.miner,
        amountWithUnit,
        value.wallet.trim(),
      ]);

      messageCid.value = String(cid);
      lastSubmittedTransfer.value = {
        miner: value.miner,
        amount: value.amount,
        wallet: value.wallet.trim(),
      };
      operationSuccess.value = "success";
      props.onRefresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Transfer failed";
      submissionError.value = errorMessage;
      tableOperationError.value = errorMessage;
    }
  },
});

const isTransferring = transferForm.useStore((state) => state.isSubmitting);
const canSubmitTransfer = transferForm.useStore((state) => state.canSubmit);
const transferValues = transferForm.useStore((state) => state.values);
const transferAmountValidators = {
  onChange: ({ value }: { value: string }) => {
    const amount = Number.parseFloat(value);
    if (!value || Number.isNaN(amount)) {
      return "Amount is required";
    }
    if (amount <= 0) {
      return "Amount must be greater than 0";
    }
    return undefined;
  },
};

const transferWalletValidators = {
  onChange: ({ value }: { value: string }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Wallet address is required";
    }
    return undefined;
  },
};

const trimInput = (value: string) => value.trim();

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
      const isItemTransferring =
        isTransferring.value && selectedBalance.value?.Miner === item.Miner;

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
  transferForm.reset({
    miner: item.Miner,
    amount: "",
    wallet: "",
  });
  lastSubmittedTransfer.value = {
    miner: item.Miner,
    amount: "",
    wallet: "",
  };
  tableOperationError.value = null;
  submissionError.value = null;
  operationSuccess.value = null;
  messageCid.value = "";
  resetCopyState();
  showTransferDialog.value = true;
};

const handleTransferCancel = () => {
  showTransferDialog.value = false;
  selectedBalance.value = null;
  tableOperationError.value = null;
  submissionError.value = null;
  operationSuccess.value = null;
  messageCid.value = "";
  resetCopyState();
  transferForm.reset({ miner: "", amount: "", wallet: "" });
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

    <div
      v-if="tableOperationError && !showTransferDialog"
      class="alert alert-error"
    >
      <div class="flex items-start justify-between">
        <span>{{ tableOperationError }}</span>
        <button
          class="btn btn-ghost btn-xs"
          @click="tableOperationError = null"
        >
          ×
        </button>
      </div>
    </div>
  </div>

  <BaseModal
    :open="showTransferDialog"
    :title="transferModalTitle"
    size="md"
    :modal="true"
    @close="handleTransferCancel"
  >
    <template v-if="operationSuccess">
      <FormLayout>
        <div class="space-y-6 text-center">
          <div>
            <div class="mx-auto mb-3 flex size-16 items-center justify-center">
              <CheckCircleIcon class="text-success size-16" />
            </div>
            <h3 class="text-lg font-semibold">Transfer Successful</h3>
          </div>
          <div class="bg-base-200/30 rounded-lg p-4 text-left">
            <div class="text-base-content/70 text-xs font-medium uppercase">
              Transfer Summary
            </div>
            <div class="mt-3 space-y-2">
              <div>
                <div class="text-base-content/60 text-xs">Amount</div>
                <div class="font-mono text-2xl font-bold">
                  {{ lastSubmittedTransfer.amount }} FIL
                </div>
              </div>
              <div>
                <div class="text-base-content/60 text-xs">Storage Provider</div>
                <div class="font-mono font-medium">
                  {{ lastSubmittedTransfer.miner }}
                </div>
              </div>
            </div>
          </div>
          <div>
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
        </div>
      </FormLayout>
    </template>

    <template v-else>
      <FormLayout>
        <FormSection>
          <FormFieldWrapper label="Storage Provider">
            <input
              :value="transferValues.miner"
              type="text"
              class="input input-bordered input-sm font-mono"
              readonly
              tabindex="-1"
            />
          </FormFieldWrapper>

          <FormInput
            :form="transferForm"
            name="amount"
            label="Amount (FIL)"
            type="number"
            placeholder="0.000000"
            input-class="font-mono"
            :disabled="isTransferring"
            :validators="transferAmountValidators"
          />

          <FormInput
            :form="transferForm"
            name="wallet"
            label="From Wallet Address"
            placeholder="Enter wallet address..."
            input-class="font-mono"
            :disabled="isTransferring"
            :normalize="trimInput"
            :validators="transferWalletValidators"
          />
          <div
            v-if="submissionError"
            class="alert alert-error flex items-center gap-2"
          >
            <ExclamationTriangleIcon class="size-4" />
            <span class="text-sm">{{ submissionError }}</span>
          </div>
        </FormSection>
      </FormLayout>
    </template>

    <template #footer>
      <FormActions v-if="operationSuccess">
        <button class="btn btn-primary" @click="handleTransferCancel">
          Close
        </button>
      </FormActions>
      <FormActions v-else>
        <button
          class="btn btn-ghost"
          :disabled="isTransferring"
          @click="handleTransferCancel"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="isTransferring || !canSubmitTransfer"
          @click="transferForm.handleSubmit"
        >
          <span
            v-if="isTransferring"
            class="loading loading-spinner loading-sm"
          ></span>
          Move Funds
        </button>
      </FormActions>
    </template>
  </BaseModal>
</template>
