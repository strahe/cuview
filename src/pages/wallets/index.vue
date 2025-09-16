<route>
{
  "meta": {
    "title": "Wallets"
  }
}
</route>

<script setup lang="ts">
import {
  WalletIcon,
  ScaleIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useWalletData } from "@/composables/useWalletData";
import SectionCard from "@/components/ui/SectionCard.vue";
import WalletsTable from "./components/WalletsTable.vue";
import MarketBalanceTable from "./components/MarketBalanceTable.vue";
import PendingMessagesTable from "./components/PendingMessagesTable.vue";
import WalletFiltersTable from "./components/WalletFiltersTable.vue";
import type {
  MarketBalanceStatus,
  PendingMessages,
  AllowDeny,
} from "@/types/wallet";

const {
  tableData: walletTableData,
  listLoading: walletsLoading,
  listError: walletsError,
  refreshWalletList: refreshWallets,
  loadWalletBalance,
  setWalletEditing,
} = useWalletData({
  balanceRefreshInterval: 15000, // 15 seconds for balances
  listRefreshInterval: 30000, // 30 seconds for wallet list
});

const {
  data: marketBalance,
  loading: marketLoading,
  error: marketError,
  refresh: refreshMarket,
} = useCachedQuery<MarketBalanceStatus[]>("MarketBalance", [], {
  pollingInterval: 30000,
});

const {
  data: pendingMessages,
  loading: messagesLoading,
  error: messagesError,
  refresh: refreshMessages,
} = useCachedQuery<PendingMessages>("PendingMessages", [], {
  pollingInterval: 30000,
});

const {
  data: allowDenyList,
  loading: filtersLoading,
  error: filtersError,
  refresh: refreshFilters,
} = useCachedQuery<AllowDeny[]>("GetAllowDenyList", [], {
  pollingInterval: 30000,
});
</script>

<template>
  <div class="space-y-6 p-6">
    <SectionCard
      title="Wallet Overview"
      :icon="WalletIcon"
      tooltip="Add, rename, and manage wallet addresses"
    >
      <WalletsTable
        :items="walletTableData"
        :loading="walletsLoading"
        :error="walletsError"
        :on-refresh="refreshWallets"
        :on-refresh-balance="loadWalletBalance"
        :on-set-wallet-editing="setWalletEditing"
      />
    </SectionCard>

    <SectionCard
      title="Market Balance"
      :icon="ScaleIcon"
      tooltip="Transfer funds to market escrow"
    >
      <MarketBalanceTable
        :items="marketBalance || []"
        :loading="marketLoading"
        :error="marketError"
        :on-refresh="refreshMarket"
      />
    </SectionCard>

    <SectionCard
      title="Pending Messages"
      :icon="ClockIcon"
      tooltip="View pending transactions"
    >
      <PendingMessagesTable
        :messages="pendingMessages || undefined"
        :loading="messagesLoading"
        :error="messagesError"
        :on-refresh="refreshMessages"
      />
    </SectionCard>

    <SectionCard
      title="Access Control"
      :icon="ShieldCheckIcon"
      tooltip="Manage wallet allow/deny list"
    >
      <WalletFiltersTable
        :items="allowDenyList || []"
        :loading="filtersLoading"
        :error="filtersError"
        :on-refresh="refreshFilters"
      />
    </SectionCard>
  </div>
</template>
