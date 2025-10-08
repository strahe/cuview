<script setup lang="ts">
import { computed, h, ref } from "vue";
import { useForm } from "@tanstack/vue-form";
import {
  createColumnHelper,
  FlexRender,
  type ColumnDef,
} from "@tanstack/vue-table";
import {
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
} from "@heroicons/vue/24/outline";
import { useStandardTable } from "@/composables/useStandardTable";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { useWatermarkValidators } from "@/composables/useWatermarkValidators";
import TableControls from "@/components/table/TableControls.vue";
import ColumnStats from "@/components/table/ColumnStats.vue";
import { getTableRowClasses } from "@/utils/ui";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  FormFieldWrapper,
  FormGrid,
  FormInput,
  FormLayout,
  FormSelect,
  FormActions,
} from "@/components/ui/form";
import type {
  BalanceManagerRule,
  BalanceManagerRuleDisplay,
  BalanceManagerTableEntry,
  BalanceManagerRuleAddRequest,
} from "@/types/wallet";

interface Props {
  items?: BalanceManagerRule[];
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

  return props.items
    .map((item) => {
      try {
        if (!item || typeof item !== "object") {
          return null;
        }

        // Parse watermark values for sorting (remove " FIL" suffix if present)
        const lowWatermark = parseFloat(
          item.low_watermark.replace(/\s*FIL$/i, "").trim() || "0",
        );
        const highWatermark = parseFloat(
          item.high_watermark.replace(/\s*FIL$/i, "").trim() || "0",
        );

        // Determine status based on activity
        let status: "active" | "inactive" | "pending" = "inactive";
        if (item.task_id !== null) {
          status = "pending";
        } else if (item.last_msg_landed_at) {
          status = "active";
        }

        const displayItem: BalanceManagerRuleDisplay = {
          ID: item.id,
          SubjectAddress: item.subject_address,
          SecondAddress: item.second_address,
          ActionType: item.action_type,
          SubjectType: item.subject_type,
          LowWatermark: item.low_watermark,
          HighWatermark: item.high_watermark,
          Status: status,
          LastMessageCid: item.last_msg_cid,
          LastMessageSent: item.last_msg_sent_at,
          LastMessageLanded: item.last_msg_landed_at,
        };

        const tableEntry: BalanceManagerTableEntry = {
          ...displayItem,
          id: item.id.toString(),
          lowWatermarkNumber: lowWatermark,
          highWatermarkNumber: highWatermark,
          statusBadgeClass: getStatusBadgeClass(status),
          actionTypeBadgeClass: getActionTypeBadgeClass(),
          age: "",
          lastActionAge: "",
        };

        return tableEntry;
      } catch {
        return null;
      }
    })
    .filter((item): item is BalanceManagerTableEntry => item !== null);
});

const showAddWalletDialog = ref(false);
const showAddProofshareDialog = ref(false);
const editingId = ref<number | null>(null);
const editFormData = ref({ low: "", high: "" });
const operationError = ref<string | null>(null);
const operationSuccess = ref<string | null>(null);
const manualRefreshLoading = ref(false);
const isOperating = ref(false);

const walletActionOptions = [
  { label: "Auto Top-up", value: "requester" },
  { label: "Auto Withdraw", value: "active-provider" },
];

const createWalletRuleDefaults = (): BalanceManagerRuleAddRequest => ({
  subject: "",
  second: "",
  actionType: "requester",
  subjectType: "wallet",
  lowWatermark: "",
  highWatermark: "",
});

const createProofshareRuleDefaults = (): BalanceManagerRuleAddRequest => ({
  subject: "",
  second: "",
  actionType: "requester",
  subjectType: "proofshare",
  lowWatermark: "",
  highWatermark: "",
});

const {
  validateWatermarkPair,
  createRequiredStringValidator,
  createNonNegativeNumberValidator,
  createHighWatermarkValidator,
} = useWatermarkValidators();

const walletSubjectValidators =
  createRequiredStringValidator("Monitored address");
const walletFundingValidators = createRequiredStringValidator("Funding source");
const walletLowWatermarkValidators =
  createNonNegativeNumberValidator("Min balance");
const walletHighWatermarkValidators = createHighWatermarkValidator(
  "Target balance",
  "lowWatermark",
  "Min balance",
);

const proofshareSubjectValidators =
  createRequiredStringValidator("Monitored address");
const proofshareLowWatermarkValidators =
  createNonNegativeNumberValidator("Min balance");
const proofshareHighWatermarkValidators = createHighWatermarkValidator(
  "Target balance",
  "lowWatermark",
  "Min balance",
);

const { call } = useCurioQuery();

const walletRuleForm = useForm({
  defaultValues: createWalletRuleDefaults(),
  onSubmit: async ({ value }) => {
    const subject = value.subject.trim();
    const fundingSource = value.second.trim();
    const lowValue = value.lowWatermark.trim();
    const highValue = value.highWatermark.trim();

    try {
      operationError.value = null;
      isOperating.value = true;

      await call("BalanceMgrRuleAdd", [
        subject,
        fundingSource,
        value.actionType,
        lowValue,
        highValue,
        value.subjectType,
      ]);

      walletRuleForm.reset(createWalletRuleDefaults());
      showAddWalletDialog.value = false;
      operationSuccess.value = "Wallet rule added successfully";
      props.onRefresh();
    } catch (error) {
      operationError.value =
        error instanceof Error ? error.message : "Failed to add wallet rule";
    } finally {
      isOperating.value = false;
    }
  },
});

const walletFormCanSubmit = walletRuleForm.useStore((state) => state.canSubmit);
const walletFormIsSubmitting = walletRuleForm.useStore(
  (state) => state.isSubmitting,
);

const proofshareRuleForm = useForm({
  defaultValues: createProofshareRuleDefaults(),
  onSubmit: async ({ value }) => {
    const subject = value.subject.trim();
    const lowValue = value.lowWatermark.trim();
    const highValue = value.highWatermark.trim();

    try {
      operationError.value = null;
      isOperating.value = true;

      await call("BalanceMgrRuleAdd", [
        subject,
        subject,
        "requester",
        lowValue,
        highValue,
        "proofshare",
      ]);

      proofshareRuleForm.reset(createProofshareRuleDefaults());
      showAddProofshareDialog.value = false;
      operationSuccess.value = "SnarkMarket Client rule added successfully";
      props.onRefresh();
    } catch (error) {
      operationError.value =
        error instanceof Error
          ? error.message
          : "Failed to add proofshare rule";
    } finally {
      isOperating.value = false;
    }
  },
});

const proofshareFormCanSubmit = proofshareRuleForm.useStore(
  (state) => state.canSubmit,
);
const proofshareFormIsSubmitting = proofshareRuleForm.useStore(
  (state) => state.isSubmitting,
);

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "active":
      return "text-success";
    case "pending":
      return "text-warning";
    case "inactive":
    default:
      return "";
  }
};

const getActionTypeBadgeClass = () => {
  return "badge badge-outline";
};

const getActionTypeDisplayText = (actionType: string) => {
  switch (actionType) {
    case "requester":
      return "Auto Top-up";
    case "active-provider":
      return "Auto Withdraw";
    default:
      return actionType;
  }
};

const formatAddress = (address: string) => {
  if (address.length > 20) {
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  }
  return address;
};

const columnHelper = createColumnHelper<BalanceManagerTableEntry>();

const columns = [
  columnHelper.accessor("ID", {
    header: "ID",
    size: 60,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => h("span", { class: "font-mono text-sm" }, info.getValue()),
  }),
  columnHelper.accessor("SubjectType", {
    header: "Type",
    size: 90,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) =>
      h("span", { class: "badge badge-outline badge-sm" }, info.getValue()),
  }),
  columnHelper.accessor("SubjectAddress", {
    header: "Monitored Address",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => {
      const value = info.getValue();
      return h(
        "span",
        {
          class: "font-mono text-sm",
          title: value,
        },
        formatAddress(value),
      );
    },
  }),
  columnHelper.accessor("SecondAddress", {
    header: "Funding Source",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => {
      const item = info.row.original;
      const value = info.getValue();

      // For proofshare, show "-" since subject == second
      if (item.SubjectType === "proofshare") {
        return h("span", { class: "text-base-content/50" }, "-");
      }

      return h(
        "span",
        {
          class: "font-mono text-sm",
          title: value,
        },
        formatAddress(value),
      );
    },
  }),
  columnHelper.accessor("ActionType", {
    header: "Action",
    size: 180,
    enableGrouping: false,
    enableColumnFilter: true,
    cell: (info) => {
      const actionType = info.getValue();
      return h(
        "span",
        { class: "text-sm" },
        getActionTypeDisplayText(actionType),
      );
    },
  }),
  columnHelper.accessor("LowWatermark", {
    header: "Min Balance (FIL)",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const item = info.row.original;
      const isEditing = editingId.value === item.ID;

      if (isEditing) {
        return h("input", {
          class: "input input-xs input-bordered font-mono w-full",
          value: editFormData.value.low,
          onInput: (e: Event) => {
            const target = e.target as HTMLInputElement;
            editFormData.value.low = target.value;
          },
          placeholder: "0.0",
        });
      }

      return h("span", { class: "font-mono text-sm" }, info.getValue());
    },
  }),
  columnHelper.accessor("HighWatermark", {
    header: "Target Balance (FIL)",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const item = info.row.original;
      const isEditing = editingId.value === item.ID;

      if (isEditing) {
        return h("input", {
          class: "input input-xs input-bordered font-mono w-full",
          value: editFormData.value.high,
          onInput: (e: Event) => {
            const target = e.target as HTMLInputElement;
            editFormData.value.high = target.value;
          },
          placeholder: "0.0",
        });
      }

      return h("span", { class: "font-mono text-sm" }, info.getValue());
    },
  }),
  columnHelper.accessor("LastMessageCid", {
    header: "Last Msg",
    size: 120,
    enableGrouping: false,
    cell: (info) => {
      const cid = info.getValue();
      if (!cid) {
        return h("span", { class: "text-base-content/50" }, "-");
      }
      return h(
        "span",
        {
          class:
            "font-mono text-xs text-blue-600 cursor-pointer hover:underline",
          title: cid,
        },
        `${cid.slice(0, 8)}...`,
      );
    },
  }),
  columnHelper.display({
    id: "task",
    header: "Task",
    size: 80,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const item = info.row.original;
      if (item.Status === "pending") {
        return h(
          "span",
          { class: "badge badge-outline text-warning badge-sm" },
          "Running",
        );
      }
      return h("span", { class: "text-base-content/50" }, "-");
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 160,
    enableGrouping: false,
    enableSorting: false,
    cell: (info) => {
      const item = info.row.original;
      const isEditing = editingId.value === item.ID;
      const isItemOperating = isOperating.value;

      if (isEditing) {
        return h("div", { class: "flex gap-1" }, [
          h(
            "button",
            {
              class: "btn btn-success btn-xs",
              disabled: isItemOperating,
              onClick: () => handleSaveEdit(item),
            },
            "Save",
          ),
          h(
            "button",
            {
              class: "btn btn-ghost btn-xs",
              disabled: isItemOperating,
              onClick: cancelEdit,
            },
            "Cancel",
          ),
        ]);
      }

      return h("div", { class: "flex gap-1" }, [
        h(
          "button",
          {
            class: "btn btn-ghost btn-xs",
            disabled: isItemOperating,
            title: "Edit watermarks",
            onClick: () => startEdit(item),
          },
          h(PencilIcon, { class: "size-3" }),
        ),
        h(
          "button",
          {
            class:
              "btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content",
            disabled: isItemOperating,
            title: "Remove rule",
            onClick: () => handleRemoveClick(item),
          },
          h(TrashIcon, { class: "size-3" }),
        ),
      ]);
    },
  }),
];

const { table, store, helpers, handlers } =
  useStandardTable<BalanceManagerTableEntry>({
    tableId: "balanceManagerTable",
    columns: columns as ColumnDef<BalanceManagerTableEntry>[],
    data: rawData,
    defaultSorting: [{ id: "ID", desc: true }],
    getRowId: (row) => `balance-manager-${row.ID}`,
    enableGrouping: false,
  });

const { hasData: tableHasData, totalItems, hasActiveFilters } = helpers;
const { handleCellRightClick, getCellTooltip, clearAllFilters } = handlers;

const startEdit = (item: BalanceManagerTableEntry) => {
  editingId.value = item.ID;

  editFormData.value.low = item.LowWatermark.replace(/\s*FIL$/i, "").trim();
  editFormData.value.high = item.HighWatermark.replace(/\s*FIL$/i, "").trim();
  operationError.value = null;
};

const cancelEdit = () => {
  editingId.value = null;
  editFormData.value = { low: "", high: "" };
  operationError.value = null;
};

const handleSaveEdit = async (item: BalanceManagerTableEntry) => {
  const watermarkError = validateWatermarkPair(
    editFormData.value.low,
    editFormData.value.high,
    "Min balance",
    "Target balance",
  );

  if (watermarkError) {
    operationError.value = watermarkError;
    return;
  }

  try {
    operationError.value = null;
    isOperating.value = true;

    await call("BalanceMgrRuleUpdate", [
      item.ID,
      editFormData.value.low,
      editFormData.value.high,
    ]);

    cancelEdit();
    operationSuccess.value = "Rule updated successfully";
    props.onRefresh();
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Failed to update rule";
  } finally {
    isOperating.value = false;
  }
};

const handleAddWalletClick = () => {
  walletRuleForm.reset(createWalletRuleDefaults());
  operationError.value = null;
  operationSuccess.value = null;
  showAddWalletDialog.value = true;
};

const handleAddProofshareClick = () => {
  proofshareRuleForm.reset(createProofshareRuleDefaults());
  operationError.value = null;
  operationSuccess.value = null;
  showAddProofshareDialog.value = true;
};

const handleWalletFormSubmit = () => walletRuleForm.handleSubmit();

const handleProofshareFormSubmit = () => proofshareRuleForm.handleSubmit();

const handleRemoveClick = async (item: BalanceManagerTableEntry) => {
  if (!confirm("Delete this rule?")) {
    return;
  }

  try {
    operationError.value = null;
    isOperating.value = true;

    await call("BalanceMgrRuleRemove", [item.ID]);
    operationSuccess.value = "Rule removed successfully";
    props.onRefresh();
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : "Failed to remove rule";
  } finally {
    isOperating.value = false;
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
    case "ID":
      return `${data.length} rules`;
    case "ActionType": {
      const requesterCount = data.filter(
        (item) => item.ActionType === "requester",
      ).length;
      const providerCount = data.filter(
        (item) => item.ActionType === "active-provider",
      ).length;
      return `${requesterCount} requester, ${providerCount} provider`;
    }
    case "SubjectType": {
      const walletCount = data.filter(
        (item) => item.SubjectType === "wallet",
      ).length;
      const proofshareCount = data.filter(
        (item) => item.SubjectType === "proofshare",
      ).length;
      return `${walletCount} wallet, ${proofshareCount} proofshare`;
    }
    case "Status": {
      const activeCount = data.filter(
        (item) => item.Status === "active",
      ).length;
      const pendingCount = data.filter(
        (item) => item.Status === "pending",
      ).length;
      const inactiveCount = data.filter(
        (item) => item.Status === "inactive",
      ).length;
      return `${activeCount} active, ${pendingCount} pending, ${inactiveCount} inactive`;
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
      search-placeholder="Search balance manager rules..."
      :loading="props.loading"
      :refresh-loading="manualRefreshLoading"
      @refresh="handleManualRefresh"
    >
      <div class="border-base-300 border-l pl-3">
        <button
          class="btn btn-primary btn-sm gap-1"
          :disabled="isOperating"
          @click="handleAddWalletClick"
        >
          <PlusIcon class="size-4" />
          Add Wallet Rule
        </button>
      </div>

      <div class="border-base-300 border-l pl-3">
        <button
          class="btn btn-primary btn-sm gap-1"
          :disabled="isOperating"
          @click="handleAddProofshareClick"
        >
          <PlusIcon class="size-4" />
          Add SnarkMarket Client Rule
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
        <span class="font-medium">{{ totalItems }}</span> rules
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
                  <ExclamationTriangleIcon class="text-error size-8" />
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
                <div>Loading balance manager rules...</div>
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
                <div>No balance-manager rules found</div>
                <div class="mt-2 text-sm">
                  Add rules to automatically manage wallet balances
                </div>
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

    <!-- Operation Messages -->
    <div v-if="operationError" class="alert alert-error">
      <div class="flex items-start justify-between">
        <span>{{ operationError }}</span>
        <button class="btn btn-ghost btn-xs" @click="operationError = null">
          ×
        </button>
      </div>
    </div>

    <div v-if="operationSuccess" class="alert alert-success">
      <div class="flex items-start justify-between">
        <span>{{ operationSuccess }}</span>
        <button class="btn btn-ghost btn-xs" @click="operationSuccess = null">
          ×
        </button>
      </div>
    </div>
  </div>

  <!-- Add Wallet Rule Dialog -->
  <BaseModal
    :open="showAddWalletDialog"
    title="Add Wallet Rule"
    size="lg"
    :modal="true"
    :show-close-button="!isOperating"
    @close="showAddWalletDialog = false"
  >
    <div class="space-y-6">
      <FormLayout>
        <FormGrid :columns="2">
          <FormInput
            :form="walletRuleForm"
            name="subject"
            label="Monitored Address"
            placeholder="Subject wallet address..."
            input-class="font-mono"
            :disabled="isOperating || walletFormIsSubmitting"
            :validators="walletSubjectValidators"
          />

          <FormInput
            :form="walletRuleForm"
            name="second"
            label="Funding Source"
            placeholder="Second wallet address..."
            input-class="font-mono"
            :disabled="isOperating || walletFormIsSubmitting"
            :validators="walletFundingValidators"
          />

          <FormSelect
            :form="walletRuleForm"
            name="actionType"
            label="Action"
            :options="walletActionOptions"
            :disabled="isOperating || walletFormIsSubmitting"
          />

          <div aria-hidden="true"></div>

          <FormInput
            :form="walletRuleForm"
            name="lowWatermark"
            label="Min Balance (FIL)"
            placeholder="0.0"
            input-class="font-mono"
            :disabled="isOperating || walletFormIsSubmitting"
            :validators="walletLowWatermarkValidators"
          />

          <FormInput
            :form="walletRuleForm"
            name="highWatermark"
            label="Target Balance (FIL)"
            placeholder="0.0"
            input-class="font-mono"
            :disabled="isOperating || walletFormIsSubmitting"
            :validators="walletHighWatermarkValidators"
          />
        </FormGrid>
      </FormLayout>

      <!-- Error Message -->
      <div v-if="operationError">
        <div
          class="bg-error/10 border-error/20 text-error flex items-start gap-3 rounded-lg border p-3"
        >
          <ExclamationTriangleIcon class="text-error mt-0.5 size-5" />
          <div class="flex-1 text-sm">{{ operationError }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <FormActions>
        <button
          class="btn btn-ghost"
          :disabled="isOperating || walletFormIsSubmitting"
          @click="showAddWalletDialog = false"
        >
          Cancel
        </button>
        <button
          class="btn btn-success"
          :disabled="
            isOperating || walletFormIsSubmitting || !walletFormCanSubmit
          "
          @click="handleWalletFormSubmit"
        >
          <span
            v-if="isOperating || walletFormIsSubmitting"
            class="loading loading-spinner loading-sm"
          ></span>
          Save
        </button>
      </FormActions>
    </template>
  </BaseModal>

  <!-- Add SnarkMarket Client Rule Dialog -->
  <BaseModal
    :open="showAddProofshareDialog"
    title="Add SnarkMarket Client Rule"
    size="lg"
    :modal="true"
    :show-close-button="!isOperating"
    @close="showAddProofshareDialog = false"
  >
    <div class="space-y-6">
      <FormLayout>
        <FormGrid :columns="2">
          <FormInput
            :form="proofshareRuleForm"
            name="subject"
            label="Monitored Address"
            placeholder="Subject address..."
            input-class="font-mono"
            :disabled="isOperating || proofshareFormIsSubmitting"
            :validators="proofshareSubjectValidators"
          />

          <FormFieldWrapper label="Action" :disabled="true">
            <input
              class="input input-bordered input-sm bg-base-200 text-base-content"
              value="Auto Top-up"
              readonly
            />
          </FormFieldWrapper>

          <FormInput
            :form="proofshareRuleForm"
            name="lowWatermark"
            label="Min Balance (FIL)"
            placeholder="0.0"
            input-class="font-mono"
            :disabled="isOperating || proofshareFormIsSubmitting"
            :validators="proofshareLowWatermarkValidators"
          />

          <FormInput
            :form="proofshareRuleForm"
            name="highWatermark"
            label="Target Balance (FIL)"
            placeholder="0.0"
            input-class="font-mono"
            :disabled="isOperating || proofshareFormIsSubmitting"
            :validators="proofshareHighWatermarkValidators"
          />
        </FormGrid>
      </FormLayout>

      <!-- Error Message -->
      <div v-if="operationError">
        <div
          class="bg-error/10 border-error/20 text-error flex items-start gap-3 rounded-lg border p-3"
        >
          <ExclamationTriangleIcon class="text-error mt-0.5 size-5" />
          <div class="flex-1 text-sm">{{ operationError }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <FormActions>
        <button
          class="btn btn-ghost"
          :disabled="isOperating || proofshareFormIsSubmitting"
          @click="showAddProofshareDialog = false"
        >
          Cancel
        </button>
        <button
          class="btn btn-success"
          :disabled="
            isOperating ||
            proofshareFormIsSubmitting ||
            !proofshareFormCanSubmit
          "
          @click="handleProofshareFormSubmit"
        >
          <span
            v-if="isOperating || proofshareFormIsSubmitting"
            class="loading loading-spinner loading-sm"
          ></span>
          Save
        </button>
      </FormActions>
    </template>
  </BaseModal>
</template>
