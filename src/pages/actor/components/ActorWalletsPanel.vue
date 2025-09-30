<script setup lang="ts">
import { computed } from "vue";
import { WalletIcon } from "@heroicons/vue/24/outline";
import CopyButton from "@/components/ui/CopyButton.vue";
import DataTable from "@/components/ui/DataTable.vue";
import type { WalletInfo } from "@/types/actor";

interface Props {
  wallets: WalletInfo[];
}

const props = defineProps<Props>();

const hasWallets = computed(() => props.wallets && props.wallets.length > 0);

const totalBalance = computed(() => {
  if (!hasWallets.value) return 0;
  return props.wallets.reduce((sum, wallet) => {
    const balance = parseFloat(wallet.Balance.replace(/[^\d.-]/g, "") || "0");
    return sum + balance;
  }, 0);
});

const walletsWithBalance = computed(() => {
  if (!hasWallets.value) return 0;
  return props.wallets.filter(
    (w) => parseFloat(w.Balance.replace(/[^\d.-]/g, "") || "0") > 0,
  ).length;
});

const hasBalance = (wallet: WalletInfo) => {
  return parseFloat(wallet.Balance.replace(/[^\d.-]/g, "") || "0") > 0;
};
</script>

<template>
  <div
    v-if="!hasWallets"
    class="bg-base-100 border-base-300 rounded-lg border p-8 text-center"
  >
    <WalletIcon class="text-base-content/40 mx-auto mb-4 h-12 w-12" />
    <h3 class="mb-2 text-lg font-semibold">No Wallets Found</h3>
    <p class="text-base-content/60 text-sm">
      This actor doesn't have any associated wallets.
    </p>
  </div>

  <div v-else class="card bg-base-100 border-base-300 border shadow-sm">
    <div class="card-header border-base-300 border-b px-4 py-4">
      <h3 class="text-lg font-semibold">Wallet Information</h3>
    </div>
    <div class="card-body p-0">
      <DataTable>
        <tbody>
          <tr>
            <td class="w-64 align-top font-medium">Total Wallets</td>
            <td class="align-top">{{ wallets.length }}</td>
          </tr>
          <tr>
            <td class="w-64 align-top font-medium">Wallets with Balance</td>
            <td class="align-top">{{ walletsWithBalance }}</td>
          </tr>
          <tr>
            <td class="w-64 align-top font-medium">Combined Balance</td>
            <td class="align-top">{{ totalBalance.toFixed(2) }} FIL</td>
          </tr>
        </tbody>
      </DataTable>

      <div class="border-base-300 border-t">
        <DataTable>
          <thead>
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="wallet in wallets" :key="wallet.Address">
              <td>
                <span class="badge badge-outline badge-sm capitalize">{{
                  wallet.Type
                }}</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 w-2 rounded-full"
                    :class="
                      hasBalance(wallet) ? 'bg-success' : 'bg-base-content/30'
                    "
                  ></div>
                  <span
                    class="text-sm"
                    :class="
                      hasBalance(wallet)
                        ? 'text-success'
                        : 'text-base-content/60'
                    "
                  >
                    {{ hasBalance(wallet) ? "Active" : "Empty" }}
                  </span>
                </div>
              </td>
              <td
                class="font-medium"
                :class="
                  hasBalance(wallet) ? 'text-success' : 'text-base-content/60'
                "
              >
                {{ wallet.Balance }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm break-all">{{
                    wallet.Address
                  }}</span>
                  <CopyButton
                    :value="wallet.Address"
                    :aria-label="`Copy ${wallet.Type} wallet address`"
                    size="sm"
                    :icon-only="true"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </DataTable>
      </div>
    </div>
  </div>
</template>
