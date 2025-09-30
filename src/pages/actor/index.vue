<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "Actors"
  }
}
</route>

<script setup lang="ts">
import { computed } from "vue";
import { UserGroupIcon } from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import KPICard from "@/components/ui/KPICard.vue";
import ActorSummaryTable from "./components/ActorSummaryTable.vue";
import { useActorSummary } from "./composables/useActorData";
import { usePageTitle } from "@/composables/usePageTitle";

const { actors, loading, error, refresh } = useActorSummary();

const { updateTitle } = usePageTitle();

const stats = computed(() => {
  if (!actors.value) return null;

  const total = actors.value.length;
  const totalBalance = actors.value.reduce((sum, actor) => {
    const balance = parseFloat(actor.ActorBalance) || 0;
    return sum + balance;
  }, 0);

  const totalAvailable = actors.value.reduce((sum, actor) => {
    const available = parseFloat(actor.ActorAvailable) || 0;
    return sum + available;
  }, 0);

  const totalWins1d = actors.value.reduce((sum, actor) => sum + actor.Win1, 0);
  const totalWins7d = actors.value.reduce((sum, actor) => sum + actor.Win7, 0);
  const totalWins30d = actors.value.reduce(
    (sum, actor) => sum + actor.Win30,
    0,
  );

  return {
    total,
    totalBalance,
    totalAvailable,
    totalWins1d,
    totalWins7d,
    totalWins30d,
  };
});

// Update title with actor count
const dynamicTitle = computed(() => {
  if (loading.value && !actors.value) return "Loading...";
  if (error.value && !actors.value) return "Error";

  const count = actors.value?.length ?? 0;
  return count > 0 ? `Actors (${count})` : "Actors";
});

updateTitle(dynamicTitle);
</script>

<template>
  <div class="p-6">
    <!-- KPI Cards -->
    <div
      v-if="stats && (actors?.length || 0) > 0"
      class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      <KPICard label="Total Actors" :value="stats.total" />
      <KPICard
        label="Total Balance"
        :value="stats.totalBalance.toFixed(2)"
        subtitle="FIL"
      />
      <KPICard
        label="Available Balance"
        :value="stats.totalAvailable.toFixed(2)"
        subtitle="FIL"
      />
      <KPICard label="Wins (1d)" :value="stats.totalWins1d" />
      <KPICard label="Wins (7d)" :value="stats.totalWins7d" />
      <KPICard label="Wins (30d)" :value="stats.totalWins30d" />
    </div>

    <!-- Actors Table wrapped in SectionCard -->
    <SectionCard title="Storage Providers" :icon="UserGroupIcon">
      <ActorSummaryTable
        :actors="actors || []"
        :loading="loading"
        :error="error"
        :on-refresh="refresh"
      />
    </SectionCard>
  </div>
</template>
