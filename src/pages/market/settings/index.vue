<route>
{
  "meta": {
    "title": "Market Settings"
  }
}
</route>

<script setup lang="ts">
import { ShieldCheckIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import SectionCard from "@/components/ui/SectionCard.vue";
import ClientAccessTable from "./components/ClientAccessTable.vue";
import type { AllowDeny } from "@/types/wallet";

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
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Market Settings</h1>
      <p class="text-base-content/70 mt-1">
        Configure market operations and client access controls
      </p>
    </div>

    <SectionCard
      title="Client Access Control"
      :icon="ShieldCheckIcon"
      tooltip="Control which storage deal clients can access the Curio cluster for storage deals"
    >
      <template #description>
        <p class="text-base-content/70 text-sm">
          Manage which clients are allowed to make storage deals with your Curio
          cluster. This controls storage deal client filtering and access
          permissions for market operations.
        </p>
      </template>

      <ClientAccessTable
        :items="allowDenyList || []"
        :loading="filtersLoading"
        :error="filtersError"
        :on-refresh="refreshFilters"
      />
    </SectionCard>
  </div>
</template>
