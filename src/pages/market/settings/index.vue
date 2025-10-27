<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { PlusIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useLazyQuery } from "@/composables/useLazyQuery";
import SectionCard from "@/components/ui/SectionCard.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import MarketLayout from "../components/MarketLayout.vue";
import PricingFiltersTable from "./components/PricingFiltersTable.vue";
import PricingFilterForm from "./components/PricingFilterForm.vue";
import ClientFiltersTable from "./components/ClientFiltersTable.vue";
import ClientFilterForm from "./components/ClientFilterForm.vue";
import AllowDenyListTable from "./components/AllowDenyListTable.vue";
import AddWalletForm from "./components/AddWalletForm.vue";
import type {
  PricingFilter,
  ClientFilter,
  AllowDenyEntry,
  DefaultFilterBehaviour,
} from "@/types/market";

// Pricing Filters
const {
  data: pricingFilters,
  loading: pricingLoading,
  error: pricingError,
  refresh: refreshPricing,
} = useCachedQuery<PricingFilter[]>("GetPriceFilters", [], {
  pollingInterval: 30000,
});

const showPricingForm = ref(false);
const pricingFormMode = ref<"add" | "edit">("add");
const currentPricingFilter = ref<PricingFilter | null>(null);
const showPricingConfirmDialog = ref(false);
const pricingFilterToDelete = ref<string | null>(null);

const { execute: addPricingFilter } = useLazyQuery("AddPriceFilters");
const { execute: updatePricingFilter } = useLazyQuery("SetPriceFilters");
const { loading: removePricingLoading, execute: removePricingFilter } =
  useLazyQuery("RemovePricingFilter");

// Client Filters
const {
  data: clientFilters,
  loading: clientLoading,
  error: clientError,
  refresh: refreshClient,
} = useCachedQuery<ClientFilter[]>("GetClientFilters", [], {
  pollingInterval: 30000,
});

const showClientForm = ref(false);
const clientFormMode = ref<"add" | "edit">("add");
const currentClientFilter = ref<ClientFilter | null>(null);
const showClientConfirmDialog = ref(false);
const clientFilterToDelete = ref<string | null>(null);

const { execute: addClientFilter } = useLazyQuery("AddClientFilters");
const { execute: updateClientFilter } = useLazyQuery("SetClientFilters");
const { loading: removeClientLoading, execute: removeClientFilter } =
  useLazyQuery("RemoveClientFilter");

// Allow/Deny List
const {
  data: allowDenyList,
  loading: allowDenyLoading,
  error: allowDenyError,
  refresh: refreshAllowDeny,
} = useCachedQuery<AllowDenyEntry[]>("GetAllowDenyList", [], {
  pollingInterval: 30000,
});

const showAddWalletForm = ref(false);
const showAllowDenyConfirmDialog = ref(false);
const walletToDelete = ref<string | null>(null);

const { execute: addAllowDeny } = useLazyQuery("AddAllowDenyList");
const { execute: toggleAllowDeny } = useLazyQuery("SetAllowDenyList");
const { loading: removeAllowDenyLoading, execute: removeAllowDeny } =
  useLazyQuery("RemoveAllowFilter");

// Default Filter Behaviour
const {
  data: defaultFilter,
  loading: defaultFilterLoading,
  error: defaultFilterError,
  refresh: refreshDefaultFilter,
} = useCachedQuery<DefaultFilterBehaviour>("DefaultFilterBehaviour", [], {
  pollingInterval: 60000,
});

const cidGravityEntries = computed(() => {
  if (!defaultFilter.value) {
    return [] as Array<{ miner: string; enabled: boolean }>;
  }

  return Object.entries(defaultFilter.value.cid_gravity_status || {}).map(
    ([miner, enabled]) => ({ miner, enabled }),
  );
});

// Common
const operationError = ref<string | null>(null);

// Computed list of pricing filter names for client filter validation
const pricingFilterNames = computed<string[]>(() => {
  return (pricingFilters.value || []).map((f) => f.name);
});

// Pricing Filters Handlers
const handlePricingAdd = () => {
  pricingFormMode.value = "add";
  currentPricingFilter.value = null;
  showPricingForm.value = true;
};

const handlePricingEdit = (filter: PricingFilter) => {
  pricingFormMode.value = "edit";
  currentPricingFilter.value = filter;
  showPricingForm.value = true;
};

const handlePricingRemove = (name: string) => {
  pricingFilterToDelete.value = name;
  showPricingConfirmDialog.value = true;
};

const handlePricingSave = async (filter: PricingFilter) => {
  try {
    operationError.value = null;

    if (pricingFormMode.value === "add") {
      await addPricingFilter(
        filter.name,
        filter.min_dur,
        filter.max_dur,
        filter.min_size,
        filter.max_size,
        filter.price,
        filter.verified,
      );
    } else {
      await updatePricingFilter(
        filter.name,
        filter.min_dur,
        filter.max_dur,
        filter.min_size,
        filter.max_size,
        filter.price,
        filter.verified,
      );
    }

    showPricingForm.value = false;
    currentPricingFilter.value = null;
    await refreshPricing();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to save pricing filter";
  }
};

const handlePricingConfirmDelete = async () => {
  if (!pricingFilterToDelete.value) return;

  try {
    operationError.value = null;
    await removePricingFilter(pricingFilterToDelete.value);
    showPricingConfirmDialog.value = false;
    pricingFilterToDelete.value = null;
    await refreshPricing();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to delete pricing filter";
  }
};

const handlePricingCancelDelete = () => {
  showPricingConfirmDialog.value = false;
  pricingFilterToDelete.value = null;
};

// Client Filters Handlers
const handleClientAdd = () => {
  clientFormMode.value = "add";
  currentClientFilter.value = null;
  showClientForm.value = true;
};

const handleClientEdit = (filter: ClientFilter) => {
  clientFormMode.value = "edit";
  currentClientFilter.value = filter;
  showClientForm.value = true;
};

const handleClientRemove = (name: string) => {
  clientFilterToDelete.value = name;
  showClientConfirmDialog.value = true;
};

const handleClientToggle = async (name: string, active: boolean) => {
  try {
    operationError.value = null;
    const filter = clientFilters.value?.find((f) => f.name === name);
    if (!filter) return;

    await updateClientFilter(
      name,
      active,
      filter.wallets,
      filter.peer_ids,
      filter.pricing_filters,
      filter.max_deals_per_hour,
      filter.max_deal_size_per_hour,
      filter.additional_info,
    );

    await refreshClient();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to toggle client filter";
  }
};

const handleClientSave = async (filter: ClientFilter) => {
  try {
    operationError.value = null;

    if (clientFormMode.value === "add") {
      await addClientFilter(
        filter.name,
        filter.active,
        filter.wallets,
        filter.peer_ids,
        filter.pricing_filters,
        filter.max_deals_per_hour,
        filter.max_deal_size_per_hour,
        filter.additional_info,
      );
    } else {
      await updateClientFilter(
        filter.name,
        filter.active,
        filter.wallets,
        filter.peer_ids,
        filter.pricing_filters,
        filter.max_deals_per_hour,
        filter.max_deal_size_per_hour,
        filter.additional_info,
      );
    }

    showClientForm.value = false;
    currentClientFilter.value = null;
    await refreshClient();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to save client filter";
  }
};

const handleClientConfirmDelete = async () => {
  if (!clientFilterToDelete.value) return;

  try {
    operationError.value = null;
    await removeClientFilter(clientFilterToDelete.value);
    showClientConfirmDialog.value = false;
    clientFilterToDelete.value = null;
    await refreshClient();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to delete client filter";
  }
};

const handleClientCancelDelete = () => {
  showClientConfirmDialog.value = false;
  clientFilterToDelete.value = null;
};

// Allow/Deny List Handlers
const handleAllowListAdd = () => {
  showAddWalletForm.value = true;
};

const handleAllowListToggle = async (wallet: string, newStatus: boolean) => {
  try {
    operationError.value = null;
    await toggleAllowDeny(wallet, newStatus);
    await refreshAllowDeny();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to toggle wallet status";
  }
};

const handleAllowListRemove = (wallet: string) => {
  walletToDelete.value = wallet;
  showAllowDenyConfirmDialog.value = true;
};

const handleAddWalletSave = async (data: {
  wallet: string;
  status: boolean;
}) => {
  try {
    operationError.value = null;
    await addAllowDeny(data.wallet, data.status);
    showAddWalletForm.value = false;
    await refreshAllowDeny();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to add wallet";
  }
};

const handleAllowDenyConfirmDelete = async () => {
  if (!walletToDelete.value) return;

  try {
    operationError.value = null;
    await removeAllowDeny(walletToDelete.value);
    showAllowDenyConfirmDialog.value = false;
    walletToDelete.value = null;
    await refreshAllowDeny();
  } catch (err) {
    operationError.value =
      err instanceof Error ? err.message : "Failed to delete wallet";
  }
};

const handleAllowDenyCancelDelete = () => {
  showAllowDenyConfirmDialog.value = false;
  walletToDelete.value = null;
};

const clearError = () => {
  operationError.value = null;
};
</script>

<route>
{
  "meta": {
    "title": "Market Settings"
  }
}
</route>

<template>
  <MarketLayout current-tab="settings">
    <div class="space-y-6">
      <!-- Error Alert -->
      <div v-if="operationError" class="alert alert-error shadow-lg">
        <div class="flex w-full items-start justify-between">
          <span>{{ operationError }}</span>
          <button class="btn btn-ghost btn-xs" @click="clearError">×</button>
        </div>
      </div>

      <!-- Default Filter Behaviour -->
      <SectionCard title="Default Filter Behaviour">
        <template #actions>
          <button
            class="btn btn-ghost btn-sm"
            :disabled="defaultFilterLoading"
            @click="refreshDefaultFilter"
          >
            <span
              v-if="defaultFilterLoading"
              class="loading loading-spinner loading-xs"
            ></span>
            <span class="ml-1">Refresh</span>
          </button>
        </template>

        <div v-if="defaultFilterError" class="alert alert-error">
          <div class="flex w-full items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold">Failed to load default behaviour</h3>
              <p class="text-sm">{{ defaultFilterError.message }}</p>
            </div>
            <button class="btn btn-ghost btn-xs" @click="refreshDefaultFilter">
              Retry
            </button>
          </div>
        </div>
        <div
          v-else-if="defaultFilterLoading && !defaultFilter"
          class="text-base-content/60 flex items-center gap-2"
        >
          <span class="loading loading-spinner loading-sm"></span>
          <span>Loading default behaviour...</span>
        </div>
        <div v-else-if="defaultFilter" class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="bg-base-200 border-base-300 rounded-lg border p-4">
              <div class="text-base-content/70 text-xs tracking-wide uppercase">
                Allow deals from unknown clients
              </div>
              <div class="mt-2 text-lg font-semibold">
                {{
                  defaultFilter.allow_deals_from_unknown_clients
                    ? "Enabled"
                    : "Disabled"
                }}
              </div>
              <div
                class="badge mt-2"
                :class="
                  defaultFilter.allow_deals_from_unknown_clients
                    ? 'badge-success'
                    : 'badge-error'
                "
              >
                {{
                  defaultFilter.allow_deals_from_unknown_clients
                    ? "Allow"
                    : "Deny"
                }}
              </div>
            </div>
            <div class="bg-base-200 border-base-300 rounded-lg border p-4">
              <div class="text-base-content/70 text-xs tracking-wide uppercase">
                Reject deals when CIDGravity unavailable
              </div>
              <div class="mt-2 text-lg font-semibold">
                {{
                  defaultFilter.is_deal_rejected_when_cid_gravity_not_reachable
                    ? "Enabled"
                    : "Disabled"
                }}
              </div>
              <div
                class="badge mt-2"
                :class="
                  defaultFilter.is_deal_rejected_when_cid_gravity_not_reachable
                    ? 'badge-error'
                    : 'badge-success'
                "
              >
                {{
                  defaultFilter.is_deal_rejected_when_cid_gravity_not_reachable
                    ? "Reject"
                    : "Allow"
                }}
              </div>
            </div>
          </div>

          <div>
            <div
              class="text-base-content/70 mb-2 text-xs tracking-wide uppercase"
            >
              CIDGravity status by storage provider
            </div>
            <div
              v-if="cidGravityEntries.length"
              class="border-base-300 divide-base-300 divide-y rounded-lg border"
            >
              <div
                v-for="entry in cidGravityEntries"
                :key="entry.miner"
                class="flex items-center justify-between gap-4 border-b px-3 py-2 last:border-b-0"
              >
                <span class="font-mono text-sm">{{ entry.miner }}</span>
                <span
                  class="badge"
                  :class="entry.enabled ? 'badge-success' : 'badge-neutral'"
                >
                  {{ entry.enabled ? "Enabled" : "Disabled" }}
                </span>
              </div>
            </div>
            <div v-else class="text-base-content/60 text-sm">
              No configured storage providers.
            </div>
          </div>
        </div>
        <div v-else class="text-base-content/60 text-sm">
          No default behaviour information available.
        </div>
      </SectionCard>

      <!-- Section 1: Pricing Filters -->
      <SectionCard title="Pricing Filters">
        <template #actions>
          <button class="btn btn-primary btn-sm" @click="handlePricingAdd">
            <PlusIcon class="size-4" />
            Add Filter
          </button>
        </template>

        <PricingFiltersTable
          :items="pricingFilters || []"
          :loading="pricingLoading"
          :error="pricingError"
          :on-refresh="refreshPricing"
          @add="handlePricingAdd"
          @edit="handlePricingEdit"
          @remove="handlePricingRemove"
        />
      </SectionCard>

      <!-- Section 2: Client Filters -->
      <SectionCard title="Client Filters">
        <template #actions>
          <button class="btn btn-primary btn-sm" @click="handleClientAdd">
            <PlusIcon class="size-4" />
            Add Filter
          </button>
        </template>

        <ClientFiltersTable
          :items="clientFilters || []"
          :loading="clientLoading"
          :error="clientError"
          :on-refresh="refreshClient"
          :available-pricing-filters="pricingFilterNames"
          @add="handleClientAdd"
          @edit="handleClientEdit"
          @remove="handleClientRemove"
          @toggle="handleClientToggle"
        />
      </SectionCard>

      <!-- Section 3: Allow/Deny List -->
      <SectionCard title="Allow/Deny List">
        <template #actions>
          <button class="btn btn-primary btn-sm" @click="handleAllowListAdd">
            <PlusIcon class="size-4" />
            Add Wallet
          </button>
        </template>

        <AllowDenyListTable
          :items="allowDenyList || []"
          :loading="allowDenyLoading"
          :error="allowDenyError"
          :on-refresh="refreshAllowDeny"
          @add="handleAllowListAdd"
          @toggle="handleAllowListToggle"
          @remove="handleAllowListRemove"
        />
      </SectionCard>

      <!-- Pricing Filter Form -->
      <PricingFilterForm
        v-model:visible="showPricingForm"
        :mode="pricingFormMode"
        :initial-filter="currentPricingFilter"
        @save="handlePricingSave"
      />

      <!-- Pricing Filter Confirmation Dialog -->
      <ConfirmationDialog
        v-model:show="showPricingConfirmDialog"
        type="danger"
        title="Remove Pricing Filter"
        :message="`Are you sure you want to delete pricing filter '${pricingFilterToDelete}'? This operation cannot be undone.`"
        confirm-text="Delete"
        :loading="removePricingLoading"
        @confirm="handlePricingConfirmDelete"
        @cancel="handlePricingCancelDelete"
      />

      <!-- Client Filter Form -->
      <ClientFilterForm
        v-model:visible="showClientForm"
        :mode="clientFormMode"
        :initial-filter="currentClientFilter"
        :available-pricing-filters="pricingFilterNames"
        @save="handleClientSave"
      />

      <!-- Client Filter Confirmation Dialog -->
      <ConfirmationDialog
        v-model:show="showClientConfirmDialog"
        type="danger"
        title="Remove Client Filter"
        :message="`Are you sure you want to delete client filter '${clientFilterToDelete}'? This operation cannot be undone.`"
        confirm-text="Delete"
        :loading="removeClientLoading"
        @confirm="handleClientConfirmDelete"
        @cancel="handleClientCancelDelete"
      />

      <!-- Add Wallet Form -->
      <AddWalletForm
        v-model:visible="showAddWalletForm"
        @save="handleAddWalletSave"
      />

      <!-- Allow/Deny List Confirmation Dialog -->
      <ConfirmationDialog
        v-model:show="showAllowDenyConfirmDialog"
        type="danger"
        title="Remove Wallet Address"
        :message="`Are you sure you want to delete wallet address '${walletToDelete}'? This operation cannot be undone.`"
        confirm-text="Delete"
        :loading="removeAllowDenyLoading"
        @confirm="handleAllowDenyConfirmDelete"
        @cancel="handleAllowDenyCancelDelete"
      />
    </div>
  </MarketLayout>
</template>
