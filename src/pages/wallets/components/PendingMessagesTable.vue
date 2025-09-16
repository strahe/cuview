<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import { EyeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { formatDistanceToNow } from "date-fns";
import { useStandardTable } from "@/composables/useStandardTable";
import { useItemModal } from "@/composables/useItemModal";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ItemDetailsModal from "@/components/table/ItemDetailsModal.vue";
import type { PendingMessages, PendingMessageTableEntry } from "@/types/wallet";

interface Props {
  messages?: PendingMessages;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  messages: undefined,
  loading: false,
  error: null,
  onRefresh: () => {},
});

const rawData = computed(() => {
  if (!props.messages?.Messages) return [];

  return props.messages.Messages.map((message) => ({
    ...message,
    id: message.Cid,
    valueNumber: parseFloat(message.Value) || 0,
    gasFeeCapNumber: parseFloat(message.GasFeeCap) || 0,
    age: formatDistanceToNow(new Date(message.CreatedAt), { addSuffix: true }),
  })) as PendingMessageTableEntry[];
});

const { showModal, selectedItem, openModal, handleModalClose } =
  useItemModal<PendingMessageTableEntry>();

const manualRefreshLoading = ref(false);

const formatFIL = (value: string) => {
  const num = parseFloat(value);
  if (num === 0) return "0 FIL";
  if (num < 0.001) return `${(num * 1000).toFixed(6)} mFIL`;
  return `${num.toFixed(6)} FIL`;
};

const getStateClass = (state: string) => {
  switch (state) {
    case "pending":
      return "badge-warning";
    case "confirmed":
      return "badge-success";
    case "failed":
      return "badge-error";
    default:
      return "badge-neutral";
  }
};

const getMethodName = (method: string) => {
  const methodMap: Record<string, string> = {
    "0": "Send",
    "1": "CreateMiner",
    "2": "SwapSigner",
    "3": "AddBalance",
    "4": "WithdrawBalance",
    "5": "ChangeWorkerAddress",
    "6": "ChangePeerID",
    "7": "SubmitWindowedPoSt",
  };
  return methodMap[method] || `Method ${method}`;
};

const columnHelper = createColumnHelper<PendingMessageTableEntry>();

const columns = [
  columnHelper.accessor("Cid", {
    header: "Message ID",
    size: 150,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => {
      const cid = info.getValue();
      return h(
        "button",
        {
          class: "link link-primary font-mono text-sm hover:link-hover",
          onClick: () => handleMessageClick(info.row.original),
        },
        cid.substring(0, 12) + "...",
      );
    },
  }),
  columnHelper.accessor("From", {
    header: "From",
    size: 130,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h(
        "span",
        { class: "font-mono text-sm" },
        info.getValue().substring(0, 8) + "...",
      ),
  }),
  columnHelper.accessor("To", {
    header: "To",
    size: 130,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h(
        "span",
        { class: "font-mono text-sm" },
        info.getValue().substring(0, 8) + "...",
      ),
  }),
  columnHelper.accessor("Method", {
    header: "Method",
    size: 120,
    enableGrouping: true,
    enableColumnFilter: true,
    cell: (info) => {
      const method = info.getValue();
      const methodName = getMethodName(method);
      return h("div", { class: "badge badge-outline badge-sm" }, methodName);
    },
  }),
  columnHelper.accessor("Value", {
    header: "Value",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const value = info.getValue();
      const hasValue = parseFloat(value) > 0;
      return h(
        "span",
        {
          class: hasValue
            ? "font-mono text-sm text-success"
            : "font-mono text-sm text-base-content/60",
        },
        formatFIL(value),
      );
    },
  }),
  columnHelper.accessor("State", {
    header: "Status",
    size: 100,
    enableGrouping: true,
    enableColumnFilter: true,
    cell: (info) => {
      const state = info.getValue();
      const badgeClass = getStateClass(state);
      return h(
        "div",
        { class: `badge badge-outline ${badgeClass}` },
        state.toUpperCase(),
      );
    },
  }),
  columnHelper.accessor("CreatedAt", {
    id: "CreatedAt",
    header: "Age",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const age = info.row.original.age;
      return h("span", { class: "text-sm text-base-content/70" }, age);
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 80,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      return h(
        "button",
        {
          class: "btn btn-outline btn-xs",
          title: "View message details",
          onClick: () => handleMessageClick(info.row.original),
        },
        [h(EyeIcon, { class: "size-3" })],
      );
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<PendingMessageTableEntry>({
    tableId: "pendingMessagesTable",
    columns: columns as ColumnDef<PendingMessageTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "CreatedAt", desc: true }],
    getRowId: (row) => `message-${row.Cid}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const stateFilter = computed({
  get: () => {
    const filter = table.getColumn("State")?.getFilterValue() as string;
    return filter || "all";
  },
  set: (value: string) => {
    table
      .getColumn("State")
      ?.setFilterValue(value === "all" ? undefined : value);
  },
});

const stateDistribution = computed(() => {
  if (!rawData.value?.length) return { pending: 0, confirmed: 0, failed: 0 };

  return rawData.value.reduce(
    (acc, message) => {
      acc[message.State as keyof typeof acc]++;
      return acc;
    },
    { pending: 0, confirmed: 0, failed: 0 },
  );
});

const handleMessageClick = async (message: PendingMessageTableEntry) => {
  openModal(message);
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
    case "Cid":
      return `${data.length} total messages`;
    case "From": {
      const uniqueSenders = new Set(data.map((msg) => msg.From));
      return `${uniqueSenders.size} unique senders`;
    }
    case "To": {
      const uniqueReceivers = new Set(data.map((msg) => msg.To));
      return `${uniqueReceivers.size} unique receivers`;
    }
    case "Method": {
      const methods = data.reduce(
        (acc, msg) => {
          const methodName = getMethodName(msg.Method);
          acc[methodName] = (acc[methodName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const uniqueCount = Object.keys(methods).length;
      return `${uniqueCount} unique methods`;
    }
    case "Value": {
      const total = data.reduce((sum, msg) => sum + msg.valueNumber, 0);
      return `${formatFIL(total.toString())} total value`;
    }
    case "State": {
      const { pending, confirmed, failed } = stateDistribution.value;
      return `${pending} pending, ${confirmed} confirmed, ${failed} failed`;
    }
    case "CreatedAt": {
      const oldestMessage = data.reduce((oldest, msg) => {
        const msgDate = new Date(msg.CreatedAt);
        const oldestDate = new Date(oldest.CreatedAt);
        return msgDate < oldestDate ? msg : oldest;
      });
      return `Oldest: ${oldestMessage.age}`;
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
      search-placeholder="Search messages..."
      :loading="props.loading"
      :refresh-loading="manualRefreshLoading"
      @refresh="handleManualRefresh"
    >
      <div class="border-base-300 border-l pl-3">
        <div class="flex items-center gap-2">
          <span
            class="text-base-content/70 text-sm font-medium whitespace-nowrap"
          >
            Status:
          </span>
          <select
            v-model="stateFilter"
            class="select select-bordered select-sm min-w-32"
          >
            <option value="all">All</option>
            <option value="pending">
              Pending ({{ stateDistribution.pending }})
            </option>
            <option value="confirmed">
              Confirmed ({{ stateDistribution.confirmed }})
            </option>
            <option value="failed">
              Failed ({{ stateDistribution.failed }})
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
        <span class="font-medium">{{ totalItems }}</span> messages
        <span v-if="props.messages?.TotalCount" class="text-base-content/40">
          • {{ props.messages.TotalCount }} total
        </span>
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
                <div>Loading messages...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <div class="mb-2 text-4xl">📨</div>
                <div>No pending messages found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="bg-base-100 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200"
              @click="handleMessageClick(row.original)"
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

    <ItemDetailsModal
      v-model:show="showModal"
      :item="selectedItem"
      @close="handleModalClose"
    >
      <template #title="{ item }">
        <h3 class="text-lg font-bold">Message Details</h3>
        <div class="text-base-content/60 font-mono text-sm">
          {{ item?.Cid }}
        </div>
      </template>

      <template #header-stats="{ item }">
        <div class="mb-4 grid grid-cols-3 gap-3">
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div
              class="mb-1 text-xl font-bold"
              :class="
                item?.State === 'confirmed'
                  ? 'text-success'
                  : item?.State === 'failed'
                    ? 'text-error'
                    : 'text-warning'
              "
            >
              {{ item?.State?.toUpperCase() }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Status
            </div>
          </div>
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div class="text-info mb-1 text-xl font-bold">
              {{ getMethodName(item?.Method || "") }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Method
            </div>
          </div>
          <div class="bg-base-200/30 rounded-lg p-3 text-center">
            <div class="text-primary mb-1 text-xl font-bold">
              {{ formatFIL(item?.Value || "0") }}
            </div>
            <div class="text-base-content/60 text-xs tracking-wider uppercase">
              Value
            </div>
          </div>
        </div>
      </template>

      <template #main-content="{ item }">
        <div class="space-y-4">
          <div class="bg-base-200/30 rounded-lg p-4">
            <h4 class="mb-3 font-semibold">Transaction Details</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/70">From:</span>
                <span class="font-mono">{{ item?.From }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">To:</span>
                <span class="font-mono">{{ item?.To }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Nonce:</span>
                <span class="font-mono">{{ item?.Nonce }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Gas Limit:</span>
                <span class="font-mono">{{
                  item?.GasLimit?.toLocaleString()
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Gas Fee Cap:</span>
                <span class="font-mono">{{
                  formatFIL(item?.GasFeeCap || "0")
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Gas Premium:</span>
                <span class="font-mono">{{
                  formatFIL(item?.GasPremium || "0")
                }}</span>
              </div>
            </div>
          </div>

          <div class="bg-base-200/30 rounded-lg p-4">
            <h4 class="mb-3 font-semibold">Timing Information</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/70">Created:</span>
                <span>{{ item?.age }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Full Date:</span>
                <span class="font-mono text-xs">
                  {{ new Date(item?.CreatedAt || "").toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ItemDetailsModal>
  </div>
</template>
