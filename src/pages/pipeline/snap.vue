<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <PipelineLayout current-tab="snap">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base-content text-xl font-semibold">Snap Pipeline</h2>
          <p class="text-base-content/70 text-sm">
            Sector upgrade operations (CC → Storage)
          </p>
        </div>
        <div class="flex gap-2">
          <button
            :disabled="snapStats.loading.value"
            class="btn btn-outline btn-sm"
            @click="refreshData"
          >
            <ArrowPathIcon
              class="h-4 w-4"
              :class="{ 'animate-spin': snapStats.loading.value }"
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
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div class="bg-base-100 card card-compact shadow">
          <div class="card-body">
            <div class="text-base-content/60 text-xs uppercase">
              Total Upgrades
            </div>
            <div class="text-base-content text-xl font-bold">
              {{ snapStats.data.value?.TotalSectors || 0 }}
            </div>
          </div>
        </div>
        <div class="bg-base-100 card card-compact shadow">
          <div class="card-body">
            <div class="text-base-content/60 text-xs uppercase">
              In Progress
            </div>
            <div class="text-info text-xl font-bold">
              {{ snapStats.data.value?.InProgressSectors || 0 }}
            </div>
          </div>
        </div>
        <div class="bg-base-100 card card-compact shadow">
          <div class="card-body">
            <div class="text-base-content/60 text-xs uppercase">Completed</div>
            <div class="text-success text-xl font-bold">
              {{ snapStats.data.value?.CompletedSectors || 0 }}
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

      <!-- Success Rate Progress -->
      <SectionCard
        title="Upgrade Statistics"
        description="Snap deal upgrade performance metrics"
        :icon="ChartBarIcon"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-base-content text-sm">Success Rate</span>
            <span class="text-base-content font-bold">{{ successRate }}%</span>
          </div>
          <div class="bg-base-200 h-2 w-full rounded-full">
            <div
              class="bg-success h-2 rounded-full transition-all duration-300"
              :style="{ width: `${successRate}%` }"
            ></div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex justify-between">
              <span class="text-base-content/60">Completed:</span>
              <span class="text-success font-medium">
                {{ snapStats.data.value?.CompletedSectors || 0 }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-base-content/60">Failed:</span>
              <span
                class="font-medium"
                :class="failedCount > 0 ? 'text-error' : 'text-base-content/60'"
              >
                {{ failedCount }}
              </span>
            </div>
          </div>

          <div
            v-if="snapStats.data.value?.AverageTimePerSector"
            class="border-base-300 border-t pt-2"
          >
            <div class="flex justify-between text-sm">
              <span class="text-base-content/60">Average Time per Sector:</span>
              <span class="text-base-content font-medium">
                {{ snapStats.data.value.AverageTimePerSector }}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Upgrade Queue Status -->
      <SectionCard
        title="Upgrade Queue"
        description="Current snap upgrade operations"
        :icon="ArrowUpIcon"
      >
        <div class="space-y-4">
          <div
            v-if="!snapStats.data.value || snapStats.loading.value"
            class="py-8 text-center"
          >
            <div class="flex items-center justify-center gap-2">
              <span class="loading loading-spinner loading-sm"></span>
              Loading upgrade queue...
            </div>
          </div>

          <div
            v-else-if="(snapStats.data.value?.InProgressSectors || 0) === 0"
            class="py-8 text-center"
          >
            <div class="text-base-content/60">
              <CheckCircleIcon class="text-success mx-auto mb-2 h-12 w-12" />
              <div class="text-lg font-medium">No active upgrades</div>
              <div class="text-sm">All snap operations are complete</div>
            </div>
          </div>

          <div v-else class="space-y-3">
            <div
              class="bg-base-200 flex items-center justify-between rounded-lg p-4"
            >
              <div class="flex items-center gap-3">
                <div class="bg-info/20 text-info rounded-full p-2">
                  <ArrowUpIcon class="h-4 w-4" />
                </div>
                <div>
                  <div class="text-base-content font-medium">
                    Active Upgrades
                  </div>
                  <div class="text-base-content/60 text-sm">
                    Upgrading CC sectors to storage sectors
                  </div>
                </div>
              </div>
              <div class="text-info text-xl font-bold">
                {{ snapStats.data.value?.InProgressSectors || 0 }}
              </div>
            </div>

            <div
              v-if="(snapStats.data.value?.PendingSectors || 0) > 0"
              class="bg-base-200 flex items-center justify-between rounded-lg p-4"
            >
              <div class="flex items-center gap-3">
                <div class="bg-warning/20 text-warning rounded-full p-2">
                  <ClockIcon class="h-4 w-4" />
                </div>
                <div>
                  <div class="text-base-content font-medium">
                    Pending Upgrades
                  </div>
                  <div class="text-base-content/60 text-sm">
                    Waiting for available resources
                  </div>
                </div>
              </div>
              <div class="text-warning text-xl font-bold">
                {{ snapStats.data.value?.PendingSectors || 0 }}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Recent Activity -->
      <SectionCard
        title="Recent Activity"
        description="Latest snap upgrade completions and failures"
        :icon="ClockIcon"
      >
        <div class="space-y-3">
          <div class="text-base-content/60 py-8 text-center">
            <InformationCircleIcon class="mx-auto mb-2 h-8 w-8" />
            <div class="text-sm">Activity feed coming soon</div>
          </div>
        </div>
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
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import PipelineLayout from "./components/PipelineLayout.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useCurioQuery } from "@/composables/useCurioQuery";
import type { PipelineStats } from "@/types/pipeline";

// Direct query for snap stats
const snapStats = useCachedQuery<PipelineStats>("PipelineStatsSnap", [], {
  pollingInterval: 30000,
});

// Action functions
const { pipelineSnapRestartAll } = useCurioQuery();

const restartSnapPipeline = async () => {
  try {
    await pipelineSnapRestartAll();
    await snapStats.refresh();
    return { success: true };
  } catch (error) {
    console.error("Failed to restart Snap pipeline:", error);
    return { success: false, error: error as Error };
  }
};

const isRestarting = ref(false);

const failedCount = computed(() => snapStats.data.value?.FailedSectors || 0);
const successRate = computed(() => {
  const stats = snapStats.data.value;
  if (!stats || !stats.TotalSectors) return 0;
  return Math.round((stats.CompletedSectors / stats.TotalSectors) * 100);
});

const refreshData = async () => {
  await snapStats.refresh();
};

const handleRestartAll = async () => {
  isRestarting.value = true;
  try {
    await restartSnapPipeline();
    await refreshData();
  } finally {
    isRestarting.value = false;
  }
};
</script>
