<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "Market Balance"
  }
}
</route>

<script setup lang="ts">
import { ScaleIcon, ChartBarIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import SectionCard from "@/components/ui/SectionCard.vue";
import MarketLayout from "./components/MarketLayout.vue";
import MarketBalanceTable from "./components/MarketBalanceTable.vue";
import PieceSummaryCard from "./components/PieceSummaryCard.vue";
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

<template>
  <MarketLayout current-tab="balance">
    <div class="space-y-6">
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

      <!-- Piece Summary -->
      <SectionCard
        title="Piece Summary"
        :icon="ChartBarIcon"
        tooltip="Storage piece statistics and indexing status"
      >
        <PieceSummaryCard />
      </SectionCard>
    </div>
  </MarketLayout>
</template>
