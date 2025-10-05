<script setup lang="ts">
import { computed } from "vue";
import KPICard from "@/components/ui/KPICard.vue";
import IpniProvidersTable from "./IpniProvidersTable.vue";
import { useIpniSummary } from "@/composables/useIpniSummary";
import { usePageTitle } from "@/composables/usePageTitle";

const {
  providers,
  loading,
  error,
  refresh,
  providerCount,
  providersBehindCount,
  providersWithErrorsCount,
  totalServiceCount,
  serviceErrorCount,
  serviceBehindCount,
} = useIpniSummary();

const { updateTitle } = usePageTitle();

const dynamicTitle = computed(() => `IPNI (${providerCount.value} providers)`);
updateTitle(dynamicTitle);

const statusHasIssues = computed(
  () => serviceErrorCount.value > 0 || serviceBehindCount.value > 0,
);
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="providerCount > 0"
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
    >
      <KPICard label="Providers" :value="providerCount" />
      <KPICard
        label="Services"
        :value="totalServiceCount"
        :class="totalServiceCount > 0 ? 'bg-info/10' : ''"
      />
      <KPICard
        label="Providers Behind"
        :value="providersBehindCount"
        :class="providersBehindCount > 0 ? 'bg-warning/10' : ''"
      />
      <KPICard
        label="Providers With Errors"
        :value="providersWithErrorsCount"
        :class="providersWithErrorsCount > 0 ? 'bg-error/10' : ''"
      />
      <KPICard
        label="Service Issues"
        :value="serviceErrorCount + serviceBehindCount"
        :subtitle="`${serviceErrorCount} errors • ${serviceBehindCount} behind`"
        :class="statusHasIssues ? 'bg-warning/10' : ''"
      />
    </div>

    <IpniProvidersTable
      :items="providers"
      :loading="loading"
      :error="error"
      :on-refresh="refresh"
    />
  </div>
</template>
