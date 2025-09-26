<script setup lang="ts">
import { computed } from "vue";
import { formatDistanceToNow } from "date-fns";
import {
  ServerStackIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import KPICard from "@/components/ui/KPICard.vue";
import { useIpniSummary } from "@/composables/useIpniSummary";
import { usePageTitle } from "@/composables/usePageTitle";
import {
  getSyncStatusBadge,
  getSyncStatusLabel,
  getServiceHost,
} from "@/utils/ipni";
import { getTableRowClasses } from "@/utils/ui";

const {
  providers,
  loading,
  error,
  refresh,
  lastUpdated,
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

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return "Never";
  return formatDistanceToNow(new Date(lastUpdated.value), { addSuffix: true });
});

const providerRows = computed(() => {
  return providers.value.slice().sort((a, b) => a.miner.localeCompare(b.miner));
});

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

    <SectionCard
      title="Provider Synchronization"
      :icon="ServerStackIcon"
      :loading="loading"
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <div class="text-base-content/70 text-xs">
            Updated {{ lastUpdatedLabel }}
          </div>
          <button
            class="btn btn-outline btn-sm"
            :disabled="loading"
            @click="refresh"
          >
            <ArrowPathIcon
              class="size-4"
              :class="{ 'animate-spin': loading }"
            />
            Refresh
          </button>
        </div>
      </template>

      <div v-if="error" class="alert alert-error mb-4">
        <div>
          <ExclamationTriangleIcon class="size-5" />
          <span>{{ error.message }}</span>
        </div>
      </div>

      <div v-if="providerCount === 0 && !loading" class="py-12 text-center">
        <p class="text-base-content/70">No IPNI providers registered.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Miner</th>
              <th>Peer ID</th>
              <th>Head</th>
              <th>Services</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="provider in providerRows"
              :key="provider.peer_id"
              :class="getTableRowClasses()"
            >
              <td class="font-semibold">{{ provider.miner }}</td>
              <td class="font-mono text-xs">{{ provider.peer_id }}</td>
              <td class="font-mono text-xs">{{ provider.head || "—" }}</td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="status in provider.sync_status || []"
                    :key="`${provider.peer_id}-${status.service}`"
                    class="badge gap-2"
                    :class="getSyncStatusBadge(status)"
                  >
                    <span class="font-semibold">{{
                      getServiceHost(status.service)
                    }}</span>
                    <span>{{ getSyncStatusLabel(status) }}</span>
                  </span>
                  <span
                    v-if="
                      !(provider.sync_status && provider.sync_status.length)
                    "
                    class="badge badge-neutral"
                  >
                    Unknown
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>
  </div>
</template>
