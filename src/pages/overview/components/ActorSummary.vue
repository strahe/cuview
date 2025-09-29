<script setup lang="ts">
import { UserGroupIcon } from "@heroicons/vue/24/outline";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { getTableRowClasses } from "@/utils/ui";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import DeadlineGrid from "@/components/ui/DeadlineGrid.vue";
import DeadlineLegend from "@/components/ui/DeadlineLegend.vue";
import type { ActorSummaryData } from "@/types/actor";

const {
  data: actors,
  loading,
  error,
  hasData,
  refresh,
} = useCachedQuery<ActorSummaryData[]>("ActorSummary", [], {
  pollingInterval: 30000,
});
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Actor Data Error"
    :empty-icon="UserGroupIcon"
    empty-message="No actors available"
  >
    <template #loading>Loading actor summary...</template>

    <div class="space-y-4">
      <DataTable>
        <thead>
          <tr>
            <th>Address</th>
            <th>Source Layer</th>
            <th>QaP</th>
            <th>Deadlines</th>
            <th>Balance</th>
            <th>Available</th>
            <th>Wins (1d/7d/30d)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in actors"
            :key="entry.Address"
            :class="getTableRowClasses()"
          >
            <td>
              <div class="flex items-center gap-1">
                <span class="font-mono text-sm">{{ entry.Address }}</span>
                <CopyButton
                  :value="entry.Address"
                  :icon-only="true"
                  aria-label="Copy address"
                />
              </div>
            </td>

            <td>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="layer in entry.CLayers"
                  :key="layer"
                  class="badge badge-outline badge-sm"
                >
                  {{ layer }}
                </span>
              </div>
            </td>

            <td class="font-medium">{{ entry.QualityAdjustedPower }}</td>

            <td>
              <DeadlineGrid
                :deadlines="entry.Deadlines"
                :entity-id="entry.Address"
              />
            </td>

            <td class="font-medium">{{ entry.ActorBalance }}</td>
            <td class="font-medium">{{ entry.ActorAvailable }}</td>

            <td>
              <div class="flex items-center gap-1 text-sm">
                <span class="font-medium">{{ entry.Win1 }}</span>
                <span class="text-base-content/60">/</span>
                <span class="font-medium">{{ entry.Win7 }}</span>
                <span class="text-base-content/60">/</span>
                <span class="font-medium">{{ entry.Win30 }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>

      <DeadlineLegend />
    </div>
  </DataSection>
</template>
