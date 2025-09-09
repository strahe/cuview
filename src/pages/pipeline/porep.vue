<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <PipelineLayout current-tab="porep">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base-content text-xl font-semibold">
            PoRep Pipeline
          </h2>
          <p class="text-base-content/70 text-sm">
            Proof of Replication sealing operations
          </p>
        </div>
        <div class="flex gap-2">
          <button
            :disabled="porepSectors.loading.value"
            class="btn btn-outline btn-sm"
            @click="refreshData"
          >
            <ArrowPathIcon
              class="h-4 w-4"
              :class="{ 'animate-spin': porepSectors.loading.value }"
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

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="bg-base-100 card card-compact shadow">
          <div class="card-body">
            <div class="text-base-content/60 text-xs uppercase">
              Total Sectors
            </div>
            <div class="text-base-content text-xl font-bold">
              {{ porepStats.data.value?.TotalSectors || 0 }}
            </div>
          </div>
        </div>
        <div class="bg-base-100 card card-compact shadow">
          <div class="card-body">
            <div class="text-base-content/60 text-xs uppercase">
              In Progress
            </div>
            <div class="text-info text-xl font-bold">
              {{ porepStats.data.value?.InProgressSectors || 0 }}
            </div>
          </div>
        </div>
        <div class="bg-base-100 card card-compact shadow">
          <div class="card-body">
            <div class="text-base-content/60 text-xs uppercase">Failed</div>
            <div
              class="text-xl font-bold"
              :class="failedCount > 0 ? 'text-error' : 'text-base-content'"
            >
              {{ failedCount }}
            </div>
          </div>
        </div>
      </div>

      <!-- Pipeline Summary -->
      <SectionCard
        title="Pipeline Summary"
        description="Stage breakdown of PoRep operations"
        :icon="ChartBarIcon"
        :loading="porepSummary.loading.value"
      >
        <div v-if="porepSummary.data.value" class="space-y-4">
          <div
            v-for="summary in porepSummary.data.value"
            :key="summary.Actor"
            class="bg-base-200 flex items-center justify-between rounded-lg p-3"
          >
            <div class="flex items-center gap-3">
              <div class="text-base-content font-medium">
                {{ summary.Actor }}
              </div>
              <div class="text-base-content/60 text-sm">
                {{ getTotalCount(summary) }} total sectors
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex flex-wrap items-center gap-1">
                <div
                  v-if="summary.CountSDR > 0"
                  class="bg-info/20 text-info rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountSDR }} SDR
                </div>
                <div
                  v-if="summary.CountTrees > 0"
                  class="bg-info/20 text-info rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountTrees }} Trees
                </div>
                <div
                  v-if="summary.CountPrecommitMsg > 0"
                  class="bg-warning/20 text-warning rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountPrecommitMsg }} PreCommit
                </div>
                <div
                  v-if="summary.CountWaitSeed > 0"
                  class="bg-warning/20 text-warning rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountWaitSeed }} WaitSeed
                </div>
                <div
                  v-if="summary.CountPoRep > 0"
                  class="bg-info/20 text-info rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountPoRep }} PoRep
                </div>
                <div
                  v-if="summary.CountCommitMsg > 0"
                  class="bg-warning/20 text-warning rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountCommitMsg }} Commit
                </div>
                <div
                  v-if="summary.CountDone > 0"
                  class="bg-success/20 text-success rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountDone }} Done
                </div>
                <div
                  v-if="summary.CountFailed > 0"
                  class="bg-error/20 text-error rounded px-2 py-1 text-xs"
                >
                  {{ summary.CountFailed }} Failed
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Sectors Table -->
      <SectionCard
        title="Active Sectors"
        description="Currently processing PoRep sectors"
        :icon="CogIcon"
        :loading="porepSectors.loading.value"
      >
        <PoRepSectorsTable @refresh="refreshData" />
      </SectionCard>
    </div>
  </PipelineLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import PoRepSectorsTable from "./components/PoRepSectorsTable.vue";
import PipelineLayout from "./components/PipelineLayout.vue";
import { usePipelineData } from "@/composables/usePipelineData";
import type { PorepPipelineSummary } from "@/types/pipeline";

const { porepSectors, porepSummary, porepStats, restartPorepPipeline } =
  usePipelineData();

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

const failedCount = computed(() => porepStats.data.value?.FailedSectors || 0);

const refreshData = async () => {
  await Promise.all([
    porepSectors.refresh(),
    porepSummary.refresh(),
    porepStats.refresh(),
  ]);
};

const handleRestartAll = async () => {
  isRestarting.value = true;
  try {
    await restartPorepPipeline();
    await refreshData();
  } finally {
    isRestarting.value = false;
  }
};
</script>
