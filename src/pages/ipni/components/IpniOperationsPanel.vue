<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  WrenchScrewdriverIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import { useIpniSummary } from "@/composables/useIpniSummary";
import {
  getSyncStatusBadge,
  getSyncStatusLabel,
  getServiceHost,
  hasSyncError,
  isSyncBehind,
} from "@/utils/ipni";
import { getTableRowClasses } from "@/utils/ui";
import type { IpniSyncStatus } from "@/types/ipni";

interface ProviderIssue {
  miner: string;
  peer: string;
  head: string | null;
  statuses: IpniSyncStatus[];
}

const router = useRouter();

const {
  providers,
  loading,
  error,
  refresh,
  providersBehindCount,
  providersWithErrorsCount,
  serviceBehindCount,
  serviceErrorCount,
} = useIpniSummary();

const providerIssues = computed<ProviderIssue[]>(() =>
  providers.value
    .map((provider) => {
      const problematic = (provider.sync_status || []).filter(
        (status) => hasSyncError(status) || isSyncBehind(status),
      );
      if (problematic.length === 0) return null;
      return {
        miner: provider.miner,
        peer: provider.peer_id,
        head: provider.head,
        statuses: problematic,
      } as ProviderIssue;
    })
    .filter((item): item is ProviderIssue => item !== null),
);

const uniqueServices = computed(() => {
  const map = new Map<string, { url: string; issues: number }>();
  providers.value.forEach((provider) => {
    (provider.sync_status || []).forEach((status) => {
      const existing = map.get(status.service) || {
        url: status.service,
        issues: 0,
      };
      if (hasSyncError(status) || isSyncBehind(status)) {
        existing.issues += 1;
      }
      map.set(status.service, existing);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.url.localeCompare(b.url));
});

const issuesPresent = computed(
  () =>
    providersBehindCount.value > 0 ||
    providersWithErrorsCount.value > 0 ||
    serviceBehindCount.value > 0 ||
    serviceErrorCount.value > 0,
);

const navigateToAdSearch = (adCid: string) => {
  router.push({
    path: "/ipni",
    query: {
      tab: "ads",
      ad: adCid,
    },
  });
};
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      title="Operational Health"
      :icon="WrenchScrewdriverIcon"
      tooltip="Identify providers and services that require attention"
      :loading="loading"
    >
      <template #actions>
        <button
          class="btn btn-outline btn-sm"
          :disabled="loading"
          @click="refresh"
        >
          Refresh
        </button>
      </template>

      <div v-if="error" class="alert alert-error mb-4">
        <ShieldExclamationIcon class="size-5" />
        <span>{{ error.message }}</span>
      </div>

      <div
        v-if="!issuesPresent && !loading"
        class="border-base-300 bg-base-200/40 text-base-content/60 rounded-lg border p-6 text-center text-sm"
      >
        All IPNI publishers are in sync. No action required.
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <div class="border-base-300 rounded-lg border p-4">
          <h3
            class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
          >
            Providers Requiring Attention
          </h3>
          <p class="text-base-content/60 text-xs">
            {{ providersBehindCount }} behind •
            {{ providersWithErrorsCount }} error states
          </p>
          <div class="mt-3 space-y-3">
            <div
              v-for="provider in providerIssues"
              :key="provider.peer"
              class="border-base-300/60 rounded-lg border p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div class="text-sm font-semibold">{{ provider.miner }}</div>
                  <div class="text-base-content/60 text-xs">
                    {{ provider.peer }}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    class="btn btn-ghost btn-xs"
                    type="button"
                    :disabled="!provider.head"
                    @click="navigateToAdSearch(provider.head || '')"
                  >
                    <ArrowTopRightOnSquareIcon class="size-4" />
                    Open head
                  </button>
                  <CopyButton
                    :value="provider.head || ''"
                    label="Copy head"
                    size="sm"
                    variant="ghost"
                    :disabled="!provider.head"
                    aria-label="Copy provider head"
                  />
                </div>
              </div>

              <table class="mt-3 w-full text-xs">
                <tbody>
                  <tr
                    v-for="status in provider.statuses"
                    :key="`${provider.peer}-${status.service}`"
                    :class="getTableRowClasses()"
                  >
                    <td class="w-1/2 font-medium">
                      {{ getServiceHost(status.service) }}
                    </td>
                    <td>
                      <span
                        class="badge badge-sm"
                        :class="getSyncStatusBadge(status)"
                      >
                        {{ getSyncStatusLabel(status) }}
                      </span>
                    </td>
                    <td class="text-base-content/60 text-right text-[11px]">
                      {{ status.remote_ad || "n/a" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="border-base-300 rounded-lg border p-4">
          <h3
            class="text-base-content/70 text-sm font-semibold tracking-wide uppercase"
          >
            Services Overview
          </h3>
          <p class="text-base-content/60 text-xs">
            {{ uniqueServices.length }} integrations •
            {{ serviceErrorCount + serviceBehindCount }} issues detected
          </p>
          <table class="mt-3 table w-full text-xs">
            <thead>
              <tr>
                <th>Service</th>
                <th class="text-right">Issues</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="service in uniqueServices"
                :key="service.url"
                :class="getTableRowClasses()"
              >
                <td class="font-medium">{{ service.url }}</td>
                <td class="text-right">{{ service.issues }}</td>
                <td class="text-right">
                  <CopyButton
                    :value="service.url"
                    label="Copy URL"
                    size="sm"
                    variant="ghost"
                    aria-label="Copy service URL"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>

    <SectionCard
      title="Recommended Actions"
      :icon="ClockIcon"
      tooltip="Follow-up steps when providers fall behind"
    >
      <ol class="space-y-2 text-sm">
        <li>
          1. Verify the provider's networking endpoints using the copied head
          CID.
        </li>
        <li>
          2. Check remote IPNI service dashboards for discrepancies and restart
          the advertisement push job if required.
        </li>
        <li>
          3. Use the advertisement search tab to inspect and optionally skip
          problematic advertisements before re-announcing.
        </li>
      </ol>
    </SectionCard>
  </div>
</template>
