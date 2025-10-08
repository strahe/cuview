<script setup lang="ts">
import { computed, h, ref, nextTick, type VNode } from "vue";
import { useForm } from "@tanstack/vue-form";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useTableActions } from "@/composables/useTableActions";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormLayout,
  FormSection,
  FormInput,
  FormActions,
} from "@/components/ui/form";
import type { WalletTableEntry } from "@/types/wallet";
import { getTableRowClasses } from "@/utils/ui";

interface Props {
  items?: WalletTableEntry[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  onRefreshBalance?: (address: string) => void;
  onSetWalletEditing?: (
    address: string,
    isEditing: boolean,
    tempName?: string,
  ) => void;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  onRefresh: () => {},
  onRefreshBalance: () => {},
  onSetWalletEditing: () => {},
});

const rawData = computed(() => props.items || []);

const showAddDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedWallet = ref<WalletTableEntry | null>(null);
const newWallet = ref({ address: "", name: "" });
const operationError = ref<string | null>(null);
const manualRefreshLoading = ref(false);

const { call } = useCurioQuery();
const { isLoading: isActionLoading, executeAction } =
  useTableActions<WalletTableEntry>({
    actions: {
      add: {
        name: "add",
        handler: async () => {
          await call("WalletAdd", [
            newWallet.value.address,
            newWallet.value.name,
          ]);
        },
        loadingKey: () => "add-wallet",
        onSuccess: () => {
          props.onRefresh();
          handleAddCancel();
        },
      },
      remove: {
        name: "remove",
        handler: async (wallet) => {
          await call("WalletRemove", [wallet.Address]);
        },
        loadingKey: (wallet) => `remove-${wallet.Address}`,
        onSuccess: () => {
          props.onRefresh();
          handleDeleteCancel();
        },
      },
    },
  });

type AddWalletFormValues = {
  address: string;
  name: string;
};

const addWalletForm = useForm({
  defaultValues: {
    address: "",
    name: "",
  } as AddWalletFormValues,
  onSubmit: async ({ value }) => {
    operationError.value = null;

    // Update newWallet ref for the API call
    newWallet.value = {
      address: value.address.trim(),
      name: value.name.trim(),
    };

    await executeAction("add", {} as WalletTableEntry);
  },
});

const isSubmittingAdd = addWalletForm.useStore((state) => state.isSubmitting);
const canSubmitAdd = addWalletForm.useStore((state) => state.canSubmit);

const addressValidators = {
  onChange: ({ value }: { value: string }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Wallet address is required";
    }
    // Basic Filecoin address validation
    if (!/^[ft][0-3]/.test(trimmed)) {
      return "Invalid Filecoin address format";
    }
    return undefined;
  },
};

const getWalletTypeClass = (type: string) => {
  switch (type) {
    case "secp256k1":
      return "badge-outline";
    case "bls":
      return "badge-outline";
    case "multisig":
      return "badge-outline";
    default:
      return "badge-outline";
  }
};

const columnHelper = createColumnHelper<WalletTableEntry>();

const columns = [
  columnHelper.accessor("Address", {
    header: "Address",
    size: 200,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("Name", {
    header: "Name",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const wallet = row.original;
      const searchTerm = filterValue.toLowerCase();
      const nameMatch = (wallet.Name || "").toLowerCase().includes(searchTerm);
      const addressMatch = wallet.Address.toLowerCase().includes(searchTerm);
      return nameMatch || addressMatch;
    },
    cell: (info) => {
      const wallet = info.row.original;
      const name = info.getValue();

      if (wallet.isEditing) {
        return h("div", { class: "flex items-center gap-2" }, [
          h("input", {
            type: "text",
            value: wallet.tempName ?? name ?? "",
            class: "input input-xs input-bordered flex-1 min-w-0",
            placeholder: "Enter name",
            onInput: (e: Event) => {
              const target = e.target as HTMLInputElement;
              const newValue = target.value;
              props.onSetWalletEditing(wallet.Address, true, newValue);
            },
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveInlineEdit(wallet);
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleCancelInlineEdit(wallet);
              }
            },
            onVnodeMounted: (vnode: VNode) => {
              const input = vnode.el as HTMLInputElement;
              nextTick(() => {
                input.focus();
                input.select();
              });
            },
          }),
          h(
            "button",
            {
              class: "btn btn-success btn-xs",
              title: "Save",
              onClick: () => handleSaveInlineEdit(wallet),
            },
            [h(CheckIcon, { class: "size-3" })],
          ),
          h(
            "button",
            {
              class: "btn btn-ghost btn-xs",
              title: "Cancel",
              onClick: () => handleCancelInlineEdit(wallet),
            },
            [h(XMarkIcon, { class: "size-3" })],
          ),
        ]);
      }

      return h("div", { class: "flex items-center gap-2 group" }, [
        h(
          "span",
          {
            class: "font-medium flex-1",
          },
          name ||
            h("span", { class: "text-base-content/40 italic" }, "Unnamed"),
        ),
        h(
          "button",
          {
            class:
              "btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity",
            title: "Edit name",
            onClick: () => handleStartInlineEdit(wallet),
          },
          [h(PencilSquareIcon, { class: "size-3" })],
        ),
      ]);
    },
  }),
  columnHelper.accessor("Type", {
    header: "Type",
    size: 120,
    enableGrouping: true,
    enableColumnFilter: true,
    cell: (info) => {
      const type = info.getValue();
      const badgeClass = getWalletTypeClass(type);
      return h("div", { class: `badge ${badgeClass}` }, type.toUpperCase());
    },
  }),
  columnHelper.accessor("Balance", {
    header: "Balance",
    size: 140,
    enableGrouping: false,
    cell: (info) => {
      const wallet = info.row.original;
      const balance = info.getValue();
      // Parse balance value, removing "FIL" suffix if present
      const balanceValue = parseFloat(
        balance.replace(/\s*FIL$/i, "").trim() || "0",
      );
      const hasBalance = balanceValue > 0;

      if (wallet.balanceLoading) {
        return h(
          "div",
          { class: "flex items-center gap-2 w-full min-w-[100px]" },
          [
            h("span", { class: "loading loading-spinner loading-xs" }),
            h("span", { class: "text-base-content/60 text-sm" }, "Loading..."),
          ],
        );
      }

      if (wallet.balanceError) {
        return h(
          "div",
          { class: "flex items-center gap-1 w-full min-w-[100px]" },
          [
            h("span", { class: "text-error text-sm" }, "Error"),
            h(
              "button",
              {
                class: "btn btn-ghost btn-xs",
                title: "Retry loading balance",
                onClick: () => props.onRefreshBalance(wallet.Address),
              },
              [h(ArrowPathIcon, { class: "size-3" })],
            ),
          ],
        );
      }

      return h("div", { class: "flex items-center justify-between group" }, [
        h(
          "span",
          {
            class: hasBalance
              ? "font-mono text-sm text-success"
              : "font-mono text-sm text-base-content/60",
          },
          hasBalance
            ? balance.endsWith(" FIL")
              ? balance
              : `${balance} FIL`
            : "0 FIL",
        ),
        h(
          "button",
          {
            class:
              "btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity",
            title: "Refresh balance",
            onClick: () => props.onRefreshBalance(wallet.Address),
          },
          [h(ArrowPathIcon, { class: "size-3" })],
        ),
      ]);
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 100,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const wallet = info.row.original;
      const isRemoving = isActionLoading("remove", wallet);

      if (wallet.isEditing) {
        return h(
          "div",
          { class: "text-center text-base-content/40 text-xs" },
          "Editing...",
        );
      }

      return h("div", { class: "flex gap-1" }, [
        h(
          "button",
          {
            class: isRemoving
              ? "btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content loading cursor-not-allowed"
              : "btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content",
            disabled: isRemoving,
            title: "Remove wallet",
            onClick: () => handleDeleteClick(wallet),
          },
          isRemoving ? "Removing..." : [h(TrashIcon, { class: "size-3" })],
        ),
      ]);
    },
  }),
];

const { table, store, helpers, handlers } = useStandardTable<WalletTableEntry>({
  tableId: "walletsTable",
  columns: columns as ColumnDef<WalletTableEntry>[],
  data: rawData,
  defaultSorting: [{ id: "Address", desc: false }],
  getRowId: (row) => `wallet-${row.Address}`,
  enableGrouping: false,
});

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const handleStartInlineEdit = (wallet: WalletTableEntry) => {
  props.onSetWalletEditing(wallet.Address, true, wallet.Name);
};

const handleSaveInlineEdit = async (wallet: WalletTableEntry) => {
  if (wallet.tempName !== wallet.Name) {
    try {
      await call("WalletNameChange", [wallet.Address, wallet.tempName || ""]);
      props.onRefresh();
    } catch (error) {
      operationError.value =
        error instanceof Error ? error.message : "Failed to rename wallet";
    }
  }
  handleCancelInlineEdit(wallet);
};

const handleCancelInlineEdit = (wallet: WalletTableEntry) => {
  props.onSetWalletEditing(wallet.Address, false);
};

const handleAddClick = () => {
  addWalletForm.reset({ address: "", name: "" });
  operationError.value = null;
  showAddDialog.value = true;
};

const handleAddCancel = () => {
  showAddDialog.value = false;
  addWalletForm.reset({ address: "", name: "" });
  operationError.value = null;
};

const handleAddConfirm = async () => {
  await addWalletForm.handleSubmit();
};

const handleDeleteClick = (wallet: WalletTableEntry) => {
  selectedWallet.value = wallet;
  operationError.value = null;
  showDeleteDialog.value = true;
};

const handleDeleteCancel = () => {
  showDeleteDialog.value = false;
  selectedWallet.value = null;
  operationError.value = null;
};

const handleDeleteConfirm = async () => {
  if (!selectedWallet.value) return;

  try {
    operationError.value = null;
    await executeAction("remove", selectedWallet.value!);
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Failed to remove wallet";
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
    case "Address":
      return `${data.length} total wallets`;
    case "Name": {
      const namedCount = data.filter((wallet) => wallet.Name).length;
      const editingCount = data.filter((wallet) => wallet.isEditing).length;
      const baseText = `${namedCount} named wallets`;
      return editingCount > 0
        ? `${baseText} (${editingCount} editing)`
        : baseText;
    }
    case "Type": {
      const types = data.reduce(
        (acc, wallet) => {
          acc[wallet.Type] = (acc[wallet.Type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      const typeList = Object.entries(types)
        .map(([type, count]) => `${count} ${type}`)
        .join(", ");
      return typeList;
    }
    case "Balance": {
      const withBalance = data.filter((wallet) => wallet.hasBalance).length;
      const loadingCount = data.filter(
        (wallet) => wallet.balanceLoading,
      ).length;
      const errorCount = data.filter((wallet) => wallet.balanceError).length;
      let result = `${withBalance} with balance`;
      if (loadingCount > 0) result += ` (${loadingCount} loading)`;
      if (errorCount > 0) result += ` (${errorCount} errors)`;
      return result;
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
      search-placeholder="Search wallets by name or address..."
      :loading="props.loading"
      :refresh-loading="manualRefreshLoading"
      @refresh="handleManualRefresh"
    >
      <div class="border-base-300 border-l pl-3">
        <button class="btn btn-primary btn-sm gap-2" @click="handleAddClick">
          <PlusIcon class="size-4" />
          Add Wallet
        </button>
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
        <span class="font-medium">{{ totalItems }}</span> wallets
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
                <div>Loading wallets...</div>
              </td>
            </tr>
          </template>
          <template v-else-if="!tableHasData">
            <tr>
              <td
                :colspan="columns.length"
                class="text-base-content/60 py-8 text-center"
              >
                <BanknotesIcon
                  class="text-base-content/40 mx-auto mb-2 h-12 w-12"
                />
                <div>No wallets found</div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="[getTableRowClasses(true), 'bg-base-100']"
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

  <BaseModal
    :open="showAddDialog"
    title="Add Wallet"
    size="md"
    :modal="true"
    :show-close-button="!isSubmittingAdd"
    @close="handleAddCancel"
  >
    <FormLayout>
      <FormSection>
        <FormInput
          :form="addWalletForm"
          name="address"
          label="Wallet Address"
          placeholder="f1abc123... or f3xyz789..."
          input-class="font-mono"
          :disabled="
            isSubmittingAdd || isActionLoading('add', {} as WalletTableEntry)
          "
          :validators="addressValidators"
          :autofocus="true"
          :required="true"
        >
          <template #hint>
            <p class="text-base-content/60 text-xs">
              Enter Filecoin wallet address (f0-f3 or t0-t3)
            </p>
          </template>
        </FormInput>

        <FormInput
          :form="addWalletForm"
          name="name"
          label="Display Name"
          placeholder="e.g., Main Wallet, Worker Wallet"
          :disabled="
            isSubmittingAdd || isActionLoading('add', {} as WalletTableEntry)
          "
        >
          <template #hint>
            <p class="text-base-content/60 text-xs">
              Optional: Give this wallet a friendly name
            </p>
          </template>
        </FormInput>

        <div v-if="operationError" class="alert alert-error">
          <XMarkIcon class="size-5" />
          <span>{{ operationError }}</span>
        </div>
      </FormSection>
    </FormLayout>

    <template #footer>
      <FormActions>
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="
            isSubmittingAdd || isActionLoading('add', {} as WalletTableEntry)
          "
          @click="handleAddCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary gap-2"
          :disabled="
            isSubmittingAdd ||
            isActionLoading('add', {} as WalletTableEntry) ||
            !canSubmitAdd
          "
          @click="handleAddConfirm"
        >
          <PlusIcon
            v-if="
              !isSubmittingAdd &&
              !isActionLoading('add', {} as WalletTableEntry)
            "
            class="size-4"
          />
          <span
            v-if="
              isSubmittingAdd || isActionLoading('add', {} as WalletTableEntry)
            "
            class="loading loading-spinner loading-xs"
          ></span>
          {{
            isSubmittingAdd || isActionLoading("add", {} as WalletTableEntry)
              ? "Adding..."
              : "Add Wallet"
          }}
        </button>
      </FormActions>
    </template>
  </BaseModal>

  <ConfirmationDialog
    v-model:show="showDeleteDialog"
    title="Remove Wallet"
    :message="`Are you sure you want to remove wallet ${selectedWallet?.Name || selectedWallet?.Address}? This action cannot be undone.`"
    type="danger"
    confirm-text="Remove Wallet"
    :loading="isActionLoading('remove', selectedWallet!)"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />
</template>
