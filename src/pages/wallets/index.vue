<route>
{
  "meta": {
    "title": "Wallets"
  }
}
</route>

<script setup lang="ts">
import { WalletIcon, ClockIcon, CogIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useWalletData } from "@/composables/useWalletData";
import SectionCard from "@/components/ui/SectionCard.vue";
import WalletsTable from "./components/WalletsTable.vue";
import PendingMessagesTable from "./components/PendingMessagesTable.vue";
import BalanceManagerTable from "./components/BalanceManagerTable.vue";
import type { PendingMessages, BalanceManagerRule } from "@/types/wallet";

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
  data: pendingMessages,
  loading: messagesLoading,
  error: messagesError,
  refresh: refreshMessages,
} = useCachedQuery<PendingMessages>("PendingMessages", [], {
  pollingInterval: 30000,
});

const {
  data: balanceManagerRules,
  loading: balanceManagerLoading,
  error: balanceManagerError,
  refresh: refreshBalanceManager,
} = useCachedQuery<BalanceManagerRule[]>("BalanceMgrRules", [], {
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
      title="Balance Manager Rules"
      :icon="CogIcon"
      tooltip="Automatic balance management between wallet addresses"
    >
      <BalanceManagerTable
        :items="balanceManagerRules || []"
        :loading="balanceManagerLoading"
        :error="balanceManagerError"
        :on-refresh="refreshBalanceManager"
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
  </div>
</template>
