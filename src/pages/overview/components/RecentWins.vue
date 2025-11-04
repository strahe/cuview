<script setup lang="ts">
import { computed } from "vue";
import { TrophyIcon } from "@heroicons/vue/24/outline";
import DataSection from "@/components/ui/DataSection.vue";
import DataTable from "@/components/ui/DataTable.vue";
import CopyButton from "@/components/ui/CopyButton.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { getTableRowClasses } from "@/utils/ui";
import type { WinStat } from "@/types/win";

const { data, loading, error, refresh } = useCachedQuery<WinStat[]>(
  "WinStats",
  [],
  {
    pollingInterval: 120000,
  },
);

const wins = computed(() => data.value ?? []);
const hasRows = computed(() => wins.value.length > 0);
const limitedWins = computed(() => wins.value.slice(0, 8));

const formatBlock = (cid: string): string => {
  if (!cid) return "—";
  return cid.length <= 12 ? cid : `...${cid.slice(-10)}`;
};

const getTaskSuccessClass = (value: string): string => {
  if (!value) return "text-base-content/60";
  const normalized = value.toLowerCase();
  if (normalized.includes("fail") && normalized.includes("success")) {
    return "text-warning";
  }
  if (normalized.includes("fail")) {
    return "text-error";
  }
  if (normalized.includes("success")) {
    return "text-success";
  }
  return "text-base-content/80";
};

const getIncludedBadgeClass = (value: string): string => {
  const normalized = value?.toLowerCase();
  if (normalized === "included") {
    return "badge-success";
  }
  if (normalized === "not included") {
    return "badge-error";
  }
  if (normalized === "not checked") {
    return "badge-outline";
  }
  return "badge-neutral";
};

const formatComputeTime = (value: string): string => {
  return value && value.trim().length > 0 ? value : "—";
};

const handleRefresh = async () => {
  await refresh();
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasRows"
    :on-retry="handleRefresh"
    :empty-icon="TrophyIcon"
    error-title="Win Stats Error"
    empty-message="No recent wins"
  >
    <template #loading>Loading recent wins...</template>

    <DataTable :compact="true" :zebra="true">
      <thead>
        <tr>
          <th>Address</th>
          <th>Epoch</th>
          <th>Block</th>
          <th>Task Success</th>
          <th>Submitted At</th>
          <th>Compute Time</th>
          <th>Included</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in limitedWins"
          :key="`${entry.Actor}-${entry.Epoch}-${entry.Block}`"
          :class="getTableRowClasses()"
        >
          <td class="font-mono text-sm">
            {{ entry.Miner || entry.Actor }}
          </td>
          <td class="text-sm">
            {{ entry.Epoch }}
          </td>
          <td class="font-mono text-xs">
            <div class="flex items-center gap-2">
              <span :title="entry.Block">{{ formatBlock(entry.Block) }}</span>
              <CopyButton
                :value="entry.Block"
                :aria-label="`Copy block ${entry.Block}`"
                size="xs"
                :icon-only="true"
              />
            </div>
          </td>
          <td>
            <span
              :class="[
                'text-sm font-medium',
                getTaskSuccessClass(entry.TaskSuccess),
              ]"
            >
              {{ entry.TaskSuccess || "—" }}
            </span>
          </td>
          <td class="text-sm whitespace-nowrap">
            {{ entry.SubmittedAtStr || "Not Submitted" }}
          </td>
          <td class="font-mono text-xs whitespace-nowrap">
            {{ formatComputeTime(entry.ComputeTime) }}
          </td>
          <td>
            <span
              class="badge badge-sm"
              :class="getIncludedBadgeClass(entry.IncludedStr)"
            >
              {{ entry.IncludedStr || "Unknown" }}
            </span>
          </td>
        </tr>
      </tbody>
    </DataTable>
  </DataSection>
</template>
