<script setup lang="ts">
import { computed } from "vue";
import { Cog6ToothIcon, ServerIcon } from "@heroicons/vue/24/outline";
import SectionCard from "@/components/ui/SectionCard.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import { useIpniSummary } from "@/composables/useIpniSummary";
import { getServiceHost } from "@/utils/ipni";

const { providers, totalServiceCount } = useIpniSummary();

const serviceCatalog = computed(() => {
  const map = new Map<string, { url: string; providers: Set<string> }>();
  providers.value.forEach((provider) => {
    (provider.sync_status || []).forEach((status) => {
      const current = map.get(status.service) || {
        url: status.service,
        providers: new Set<string>(),
      };
      current.providers.add(provider.miner);
      map.set(status.service, current);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.url.localeCompare(b.url));
});

const configuredProviders = computed(() =>
  providers.value.map((provider) => ({
    miner: provider.miner,
    peer: provider.peer_id,
    head: provider.head,
    services: (provider.sync_status || []).map((status) => status.service),
  })),
);
</script>

<template>
  <div class="space-y-6">
    <SectionCard
      title="IPNI Integrations"
      :icon="Cog6ToothIcon"
      tooltip="Overview of configured IPNI service endpoints"
    >
      <div class="text-base-content/60 mb-4 text-sm">
        {{ totalServiceCount }} service connections detected across
        {{ serviceCatalog.length }} unique endpoints.
      </div>

      <div
        v-if="serviceCatalog.length === 0"
        class="border-base-300 bg-base-200/40 text-base-content/60 rounded-lg border border-dashed p-6 text-sm"
      >
        No IPNI services detected. Configure service URLs in the Curio config to
        enable synchronization.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="service in serviceCatalog"
          :key="service.url"
          class="border-base-300 rounded-lg border p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold">{{ service.url }}</div>
              <div class="text-base-content/60 text-xs">
                {{ service.providers.size }} provider(s) • Host:
                {{ getServiceHost(service.url) }}
              </div>
            </div>
            <CopyButton
              :value="service.url"
              label="Copy URL"
              size="sm"
              variant="ghost"
              aria-label="Copy service URL"
            />
          </div>

          <div class="text-base-content/70 mt-3 flex flex-wrap gap-2 text-xs">
            <span
              v-for="miner in Array.from(service.providers).sort()"
              :key="miner"
              class="badge badge-outline"
            >
              {{ miner }}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>

    <SectionCard
      title="Publishers"
      :icon="ServerIcon"
      tooltip="Current publisher peers and their assigned heads"
    >
      <div class="grid gap-3 md:grid-cols-2">
        <div
          v-for="publisher in configuredProviders"
          :key="publisher.peer"
          class="border-base-300 rounded-lg border p-4"
        >
          <h3 class="text-sm font-semibold">{{ publisher.miner }}</h3>
          <p class="text-base-content/60 text-xs">Peer: {{ publisher.peer }}</p>
          <p class="text-base-content/60 text-xs">
            Head:
            <span class="font-mono">{{ publisher.head || "—" }}</span>
          </p>
          <div class="mt-2 space-y-1 text-xs">
            <p class="text-base-content/60">Services</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="service in publisher.services"
                :key="`${publisher.peer}-${service}`"
                class="badge badge-outline"
              >
                {{ getServiceHost(service) }}
              </span>
              <span
                v-if="publisher.services.length === 0"
                class="text-base-content/50"
              >
                No services detected
              </span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>
