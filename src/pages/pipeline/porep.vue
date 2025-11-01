<!-- eslint-disable vue/multi-word-component-names -->
<route>
{
  "meta": {
    "title": "PoRep Pipeline"
  }
}
</route>

<template>
  <PipelineLayout current-tab="porep">
    <div class="space-y-4">
      <!-- Integrated Header Dashboard -->
      <div class="bg-base-100 rounded-lg p-4 shadow">
        <!-- Title Row with Quick Stats -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-6">
            <div>
              <h2 class="text-base-content text-xl font-semibold">
                PoRep Pipeline
              </h2>
            </div>
            <!-- Inline Stats -->
            <div class="flex items-center gap-4 border-l pl-6">
              <div class="text-center">
                <div class="text-base-content text-lg font-bold">
                  {{ totalSectors }}
                </div>
                <div class="text-base-content/60 text-xs">Total</div>
              </div>
              <div class="text-center">
                <div class="text-info text-lg font-bold">
                  {{ activeSectors }}
                </div>
                <div class="text-base-content/60 text-xs">Active</div>
              </div>
              <div class="text-center">
                <div class="text-success text-lg font-bold">
                  {{ completedSectors }}
                </div>
                <div class="text-base-content/60 text-xs">Completed</div>
              </div>
              <div class="text-center">
                <div
                  class="text-lg font-bold"
                  :class="failedCount > 0 ? 'text-error' : 'text-base-content'"
                >
                  {{ failedCount }}
                </div>
                <div class="text-base-content/60 text-xs">Failed</div>
              </div>
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              :disabled="isRefreshingDashboard"
              class="btn btn-outline btn-sm"
              @click="refreshDashboard"
            >
              <ArrowPathIcon
                class="h-4 w-4"
                :class="{ 'animate-spin': isRefreshingDashboard }"
              />
              Refresh
            </button>
            <button
              :disabled="isRestarting"
              class="btn btn-warning btn-sm"
              @click="handleRestartAll"
            >
              <ExclamationTriangleIcon
                class="h-4 w-4"
                :class="{ 'animate-spin': isRestarting }"
              />
              Restart All Failed
            </button>
          </div>
        </div>

        <!-- Pipeline Breakdown Table -->
        <div class="mt-4 border-t pt-3">
          <div
            v-if="porepSummary.loading.value || porepStats.loading.value"
            class="flex justify-center py-2"
          >
            <span class="loading loading-spinner loading-sm"></span>
          </div>
          <div v-else-if="porepSummary.data.value" class="overflow-x-auto">
            <table class="table-zebra table w-full">
              <thead>
                <tr>
                  <th>Actor</th>
                  <th class="text-center">SDR</th>
                  <th class="text-center">Trees</th>
                  <th class="text-center">PreCommit</th>
                  <th class="text-center">WaitSeed</th>
                  <th class="text-center">PoRep</th>
                  <th class="text-center">Commit</th>
                  <th class="text-center">Done</th>
                  <th class="text-center">Failed</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="summary in porepSummary.data.value"
                  :key="summary.Actor"
                  :class="getTableRowClasses()"
                >
                  <td class="font-medium">{{ summary.Actor }}</td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountSDR > 0"
                      class="text-info font-medium"
                      >{{ summary.CountSDR }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountTrees > 0"
                      class="text-info font-medium"
                      >{{ summary.CountTrees }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountPrecommitMsg > 0"
                      class="text-warning font-medium"
                      >{{ summary.CountPrecommitMsg }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountWaitSeed > 0"
                      class="text-warning font-medium"
                      >{{ summary.CountWaitSeed }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountPoRep > 0"
                      class="text-info font-medium"
                      >{{ summary.CountPoRep }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountCommitMsg > 0"
                      class="text-warning font-medium"
                      >{{ summary.CountCommitMsg }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountDone > 0"
                      class="text-success font-medium"
                      >{{ summary.CountDone }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-center">
                    <span
                      v-if="summary.CountFailed > 0"
                      class="text-error font-medium"
                      >{{ summary.CountFailed }}</span
                    >
                    <span v-else class="text-base-content/30">-</span>
                  </td>
                  <td class="text-right font-medium">
                    {{ getTotalCount(summary) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sectors Table -->
      <SectionCard title="Active Sectors" :icon="CogIcon">
        <PoRepSectorsTable
          :sectors="porepSectors.data.value || []"
          :loading="porepSectors.loading.value"
          :error="porepSectors.error.value"
          :on-refresh="porepSectors.refresh"
        />
      </SectionCard>
    </div>
  </PipelineLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CogIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import PoRepSectorsTable from "./components/PoRepSectorsTable.vue";
import PipelineLayout from "./components/PipelineLayout.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useCurioQuery } from "@/composables/useCurioQuery";
import { usePageTitle } from "@/composables/usePageTitle";
import type {
  PorepPipelineSummary,
  SectorListEntry,
  PipelineStats,
} from "@/types/pipeline";
import { getTableRowClasses } from "@/utils/ui";

// Direct queries for each data need
const porepSectors = useCachedQuery<SectorListEntry[]>(
  "PipelinePorepSectors",
  [],
  {
    pollingInterval: 30000,
  },
);

const porepSummary = useCachedQuery<PorepPipelineSummary[]>(
  "PorepPipelineSummary",
  [],
  {
    pollingInterval: 30000,
  },
);

const porepStats = useCachedQuery<PipelineStats>("PipelineStatsSDR", [], {
  pollingInterval: 30000,
});

// Action functions
const { pipelinePorepRestartAll } = useCurioQuery();

const restartPorepPipeline = async () => {
  try {
    await pipelinePorepRestartAll();
    await Promise.all([
      porepSectors.refresh(),
      porepSummary.refresh(),
      porepStats.refresh(),
    ]);
    return { success: true };
  } catch (error) {
    console.error("Failed to restart PoRep pipeline:", error);
    return { success: false, error: error as Error };
  }
};

const getTotalCount = (summary: PorepPipelineSummary): number => {
  return (
    summary.CountSDR +
    summary.CountTrees +
    summary.CountPrecommitMsg +
    summary.CountWaitSeed +
    summary.CountPoRep +
    summary.CountCommitMsg +
    summary.CountDone +
    summary.CountFailed
  );
};

const isRestarting = ref(false);
const isRefreshingDashboard = ref(false);

// Calculate all statistics from PorepPipelineSummary data for consistency with table
const totalSectors = computed(() => {
  if (!porepSummary.data.value) return 0;
  return porepSummary.data.value.reduce((total, summary) => {
    return total + getTotalCount(summary);
  }, 0);
});

const activeSectors = computed(() => {
  if (!porepSummary.data.value) return 0;
  // Active sectors are those in pipeline stages (SDR, Trees, PreCommit, WaitSeed, PoRep, Commit)
  return porepSummary.data.value.reduce((total, summary) => {
    return (
      total +
      summary.CountSDR +
      summary.CountTrees +
      summary.CountPrecommitMsg +
      summary.CountWaitSeed +
      summary.CountPoRep +
      summary.CountCommitMsg
    );
  }, 0);
});

const completedSectors = computed(() => {
  if (!porepSummary.data.value) return 0;
  // Completed sectors are those marked as Done
  return porepSummary.data.value.reduce((total, summary) => {
    return total + summary.CountDone;
  }, 0);
});

const failedCount = computed(() => {
  if (!porepSummary.data.value) return 0;
  // Failed sectors from all actors
  return porepSummary.data.value.reduce((total, summary) => {
    return total + summary.CountFailed;
  }, 0);
});

const { updateTitle } = usePageTitle();

// Update title with active sector count
const dynamicTitle = computed(() => {
  const loading = porepSummary.loading.value || porepStats.loading.value;
  const error = porepSummary.error.value || porepStats.error.value;

  if (loading && !porepSummary.data.value && !porepStats.data.value) {
    return "Loading...";
  }
  if (error && !porepSummary.data.value && !porepStats.data.value) {
    return "Error";
  }

  return `PoRep Pipeline (${activeSectors.value} active)`;
});

updateTitle(dynamicTitle);

const refreshDashboard = async () => {
  isRefreshingDashboard.value = true;
  try {
    await Promise.all([porepSummary.refresh(), porepStats.refresh()]);
  } finally {
    isRefreshingDashboard.value = false;
  }
};

const refreshAllData = async () => {
  await Promise.all([
    porepSummary.refresh(),
    porepStats.refresh(),
    porepSectors.refresh(),
  ]);
};

const handleRestartAll = async () => {
  isRestarting.value = true;
  try {
    await restartPorepPipeline();
    await refreshAllData();
  } finally {
    isRestarting.value = false;
  }
};
</script>
