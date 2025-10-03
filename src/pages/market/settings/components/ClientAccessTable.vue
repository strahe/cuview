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
import { useForm } from "@tanstack/vue-form";
import { useStandardTable } from "@/composables/useStandardTable";
import { useCurioQuery } from "@/composables/useCurioQuery";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import type { AllowDeny, AccessControlTableEntry } from "@/types/wallet";
import { getTableRowClasses } from "@/utils/ui";
import BaseModal from "@/components/ui/BaseModal.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import {
  FormFieldWrapper,
  FormInput,
  FormLayout,
  FormSection,
  FormActions,
} from "@/components/ui/form";

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
const tableOperationError = ref<string | null>(null);
const addDialogError = ref<string | null>(null);
const removeDialogError = ref<string | null>(null);
const operationSuccess = ref<string | null>(null);
const manualRefreshLoading = ref(false);

const removingFilters = ref(new Set<string>());

const { call } = useCurioQuery();
const isRemovingSelected = computed(() => {
  if (!selectedEntry.value) return false;
  return removingFilters.value.has(selectedEntry.value.wallet);
});

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

type AddClientFormValues = {
  wallet: string;
  status: boolean;
};

const lastAddedEntry = ref<AddClientFormValues>({ wallet: "", status: true });

const addClientFormDefaultValues: AddClientFormValues = {
  wallet: "",
  status: true,
};

const addClientForm = useForm({
  defaultValues: addClientFormDefaultValues,
  onSubmit: async ({ value }) => {
    const trimmedWallet = value.wallet.trim();

    const exists = rawData.value.some(
      (entry) => entry.wallet === trimmedWallet,
    );
    if (exists) {
      addDialogError.value = "Client already exists in access control list";
      return;
    }

    try {
      addDialogError.value = null;
      tableOperationError.value = null;
      operationSuccess.value = null;

      await call("AddAllowDenyList", [trimmedWallet, value.status]);

      lastAddedEntry.value = {
        wallet: trimmedWallet,
        status: value.status,
      };
      operationSuccess.value = "success";
      props.onRefresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add client access filter";
      addDialogError.value = errorMessage;
      tableOperationError.value = errorMessage;
    }
  },
});

const addClientFormIsSubmitting = addClientForm.useStore(
  (state) => state.isSubmitting,
);
const canSubmitAddClient = addClientForm.useStore((state) => state.canSubmit);
const AddClientField = addClientForm.Field;

const trimInput = (value: string) => value.trim();

const addClientWalletValidators = {
  onChange: ({ value }: { value: string }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Client address is required";
    }
    if (!/^[ft][0-3][0-9a-z]+$/i.test(trimmed)) {
      return "Invalid wallet address format (must be f0-f3 or t0-t3)";
    }
    if (rawData.value.some((entry) => entry.wallet === trimmed)) {
      return "Client already exists in access control list";
    }
    return undefined;
  },
};

const handleAddClick = () => {
  addClientForm.reset({ wallet: "", status: true });
  addDialogError.value = null;
  tableOperationError.value = null;
  operationSuccess.value = null;
  showAddDialog.value = true;
};

const handleAddCancel = () => {
  showAddDialog.value = false;
  addDialogError.value = null;
  operationSuccess.value = null;
  addClientForm.reset({ wallet: "", status: true });
};

const handleRemoveClick = (entry: AccessControlTableEntry) => {
  selectedEntry.value = entry;
  removeDialogError.value = null;
  showRemoveDialog.value = true;
};

const handleRemoveCancel = () => {
  showRemoveDialog.value = false;
  selectedEntry.value = null;
  removeDialogError.value = null;
};

const handleRemoveConfirm = async () => {
  if (!selectedEntry.value) return;

  const wallet = selectedEntry.value.wallet;

  try {
    removeDialogError.value = null;
    removingFilters.value.add(wallet);

    await call("RemoveAllowFilter", [wallet]);

    props.onRefresh();
    handleRemoveCancel();
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to remove client access filter";
    removeDialogError.value = errorMessage;
    tableOperationError.value = errorMessage;
  } finally {
    removingFilters.value.delete(wallet);
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

    <div
      v-if="tableOperationError && !showAddDialog && !showRemoveDialog"
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
    :open="showAddDialog"
    title="Add Client Access Rule"
    size="md"
    :modal="true"
    :show-close-button="!addClientFormIsSubmitting"
    @close="handleAddCancel"
  >
    <template v-if="operationSuccess">
      <FormLayout>
        <div class="space-y-6 text-center">
          <div>
            <div class="mx-auto mb-3 flex size-16 items-center justify-center">
              <CheckCircleIcon class="text-success size-16" />
            </div>
            <h3 class="text-lg font-semibold">Client Access Rule Added</h3>
          </div>
          <div class="bg-base-200/30 rounded-lg p-4">
            <div class="mb-2 text-center">
              <div class="font-mono text-lg font-bold">
                {{ lastAddedEntry.wallet }}
              </div>
              <div class="text-base-content/70 text-sm">can now</div>
              <div class="mt-2 flex items-center justify-center gap-2">
                <ShieldCheckIcon
                  v-if="lastAddedEntry.status"
                  class="text-success size-5"
                />
                <ShieldExclamationIcon v-else class="text-error size-5" />
                <span
                  class="badge badge-outline"
                  :class="
                    lastAddedEntry.status ? 'badge-success' : 'badge-error'
                  "
                >
                  {{ lastAddedEntry.status ? "MAKE DEALS" : "BLOCKED" }}
                </span>
              </div>
            </div>
          </div>
          <div class="text-base-content/70 text-sm">
            This client
            {{
              lastAddedEntry.status
                ? "is now authorized to"
                : "is now blocked from"
            }}
            {{
              lastAddedEntry.status
                ? "make storage deals"
                : "making storage deals"
            }}
            with your Curio cluster.
          </div>
        </div>
      </FormLayout>
    </template>

    <template v-else>
      <FormLayout>
        <FormSection>
          <FormInput
            :form="addClientForm"
            name="wallet"
            label="Client Address"
            placeholder="f1abc... or f3xyz..."
            input-class="font-mono"
            :disabled="addClientFormIsSubmitting"
            :normalize="trimInput"
            :validators="addClientWalletValidators"
          />
          <component :is="AddClientField" name="status">
            <template #default="{ field }">
              <FormFieldWrapper label="Deal Permission">
                <div class="flex flex-col gap-2 sm:flex-row">
                  <label class="flex cursor-pointer items-center gap-2">
                    <input
                      :checked="field.state.value === true"
                      type="radio"
                      class="radio radio-success"
                      :disabled="addClientFormIsSubmitting"
                      @change="() => field.handleChange(true)"
                    />
                    <div class="flex items-center gap-2">
                      <ShieldCheckIcon class="text-success size-4" />
                      <span>Allow Deals</span>
                    </div>
                  </label>
                  <label class="flex cursor-pointer items-center gap-2">
                    <input
                      :checked="field.state.value === false"
                      type="radio"
                      class="radio radio-error"
                      :disabled="addClientFormIsSubmitting"
                      @change="() => field.handleChange(false)"
                    />
                    <div class="flex items-center gap-2">
                      <ShieldExclamationIcon class="text-error size-4" />
                      <span>Block Deals</span>
                    </div>
                  </label>
                </div>
              </FormFieldWrapper>
            </template>
          </component>
          <div class="border-info/20 bg-info/5 rounded-lg border p-4 text-sm">
            <div class="text-info mb-1 font-medium">Note</div>
            <p class="text-base-content/70">
              Client access rules control which storage deal clients can
              interact with your Curio cluster. Allowed clients can make storage
              deals, while blocked clients are rejected.
            </p>
          </div>
          <div
            v-if="addDialogError"
            class="alert alert-error flex items-center gap-2"
          >
            <ExclamationTriangleIcon class="size-4" />
            <span class="text-sm">{{ addDialogError }}</span>
          </div>
        </FormSection>
      </FormLayout>
    </template>

    <template #footer>
      <FormActions v-if="operationSuccess">
        <button class="btn btn-primary" @click="handleAddCancel">Close</button>
      </FormActions>
      <FormActions v-else>
        <button
          class="btn btn-ghost"
          :disabled="addClientFormIsSubmitting"
          @click="handleAddCancel"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="addClientFormIsSubmitting || !canSubmitAddClient"
          @click="addClientForm.handleSubmit"
        >
          <span
            v-if="addClientFormIsSubmitting"
            class="loading loading-spinner loading-sm"
          ></span>
          Add Rule
        </button>
      </FormActions>
    </template>
  </BaseModal>

  <ConfirmationDialog
    v-model:show="showRemoveDialog"
    title="Remove Client Access Rule"
    message="Confirm removal of client access rule."
    confirm-text="Remove Rule"
    cancel-text="Cancel"
    type="danger"
    :loading="isRemovingSelected"
    @confirm="handleRemoveConfirm"
    @cancel="handleRemoveCancel"
  >
    <template #description>
      <p class="text-base-content/70 text-sm">
        Are you sure you want to remove the access rule for client:
      </p>
      <div class="bg-base-200/50 mt-2 rounded p-3 font-mono text-sm break-all">
        {{ selectedEntry?.wallet }}
      </div>
      <p class="text-base-content/70 mt-3 text-sm">
        This will remove all access control restrictions for this client
        regarding storage deals.
      </p>
      <div
        v-if="removeDialogError"
        class="alert alert-error mt-4 flex items-center gap-2"
      >
        <ExclamationTriangleIcon class="size-4" />
        <div class="text-sm">{{ removeDialogError }}</div>
      </div>
    </template>
  </ConfirmationDialog>
</template>
