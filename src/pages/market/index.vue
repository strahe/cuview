<script setup lang="ts">
import {
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ScaleIcon,
} from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import SectionCard from "@/components/ui/SectionCard.vue";
import MarketBalanceTable from "./components/MarketBalanceTable.vue";
import type { MarketBalanceStatus } from "@/types/wallet";

const {
  data: marketBalance,
  loading: marketLoading,
  error: marketError,
  refresh: refreshMarket,
} = useCachedQuery<MarketBalanceStatus[]>("MarketBalance", [], {
  pollingInterval: 30000,
});
</script>

<route>
{
  "meta": {
    "title": "Market"
  }
}
</route>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Market</h1>
      <p class="text-base-content/70 mt-1">
        Monitor and manage storage market operations
      </p>
    </div>

    <!-- Market Balance -->
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

    <!-- Market Overview -->
    <SectionCard
      title="Market Overview"
      :icon="ChartBarIcon"
      tooltip="Storage deal statistics and market activity"
    >
      <div class="text-base-content/70 py-8 text-center">
        <div class="mb-2 text-4xl">📊</div>
        <div>Market overview coming soon</div>
        <div class="text-base-content/50 mt-1 text-xs">
          Deal statistics, pricing trends, and market activity
        </div>
      </div>
    </SectionCard>

    <!-- Quick Access to Settings -->
    <SectionCard
      title="Market Configuration"
      :icon="CogIcon"
      tooltip="Access market settings and configurations"
    >
      <div class="grid gap-4 md:grid-cols-2">
        <router-link
          to="/market/settings"
          class="border-base-300 hover:border-primary bg-base-100 hover:bg-primary/5 group flex items-center gap-4 rounded-lg border p-4 transition-all"
        >
          <div
            class="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content flex size-12 items-center justify-center rounded-lg transition-all"
          >
            <ShieldCheckIcon class="size-6" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold">Client Access Control</h3>
            <p class="text-base-content/70 mt-1 text-sm">
              Manage which clients can make storage deals
            </p>
          </div>
          <div
            class="text-base-content/40 group-hover:text-primary transition-colors"
          >
            →
          </div>
        </router-link>

        <div
          class="border-base-300 bg-base-100 flex items-center gap-4 rounded-lg border p-4 opacity-50"
        >
          <div
            class="bg-base-200 text-base-content/50 flex size-12 items-center justify-center rounded-lg"
          >
            <CogIcon class="size-6" />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold">Deal Policies</h3>
            <p class="text-base-content/70 mt-1 text-sm">
              Configure pricing and deal acceptance rules
            </p>
            <div class="text-base-content/50 mt-1 text-xs">Coming soon</div>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
