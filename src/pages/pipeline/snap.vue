<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <PipelineLayout current-tab="snap">
    <div class="space-y-4">
      <!-- Integrated Header Dashboard -->
      <div class="bg-base-100 rounded-lg p-4 shadow">
        <!-- Title Row with Quick Stats -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-6">
            <div>
              <h2 class="text-base-content text-xl font-semibold">
                Snap Pipeline
              </h2>
            </div>
            <!-- Inline Stats -->
            <div class="flex items-center gap-4 border-l pl-6">
              <div class="text-center">
                <div class="text-base-content text-lg font-bold">
                  {{ totalUpgrades }}
                </div>
                <div class="text-base-content/60 text-xs">Available</div>
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

        <!-- Success Rate Progress Bar -->
        <div class="mt-4 border-t pt-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-base-content text-sm font-medium"
              >Upgrade Success Rate</span
            >
            <span class="text-primary font-bold">{{ successRate }}%</span>
          </div>
          <div class="bg-base-200 h-2 w-full rounded-full">
            <div
              class="from-success to-primary h-2 rounded-full bg-gradient-to-r transition-all duration-500"
              :style="{ width: `${successRate}%` }"
            ></div>
          </div>
          <div class="text-base-content/60 mt-1 flex justify-between text-xs">
            <span>{{ completedSectors }} completed</span>
            <span>{{ failedCount }} failed</span>
          </div>
        </div>

        <!-- Pipeline Status Grid -->
        <div class="mt-4 border-t pt-3">
          <h3 class="text-base-content/80 mb-3 text-sm font-medium">
            Pipeline Status
          </h3>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div class="bg-base-200/50 rounded-lg p-3 text-center">
              <div class="text-info mb-1 text-sm font-bold">
                {{ pipelineStats.encode }}
              </div>
              <div class="text-base-content/60 text-xs">Encoding</div>
            </div>
            <div class="bg-base-200/50 rounded-lg p-3 text-center">
              <div class="text-warning mb-1 text-sm font-bold">
                {{ pipelineStats.prove }}
              </div>
              <div class="text-base-content/60 text-xs">Proving</div>
            </div>
            <div class="bg-base-200/50 rounded-lg p-3 text-center">
              <div class="text-primary mb-1 text-sm font-bold">
                {{ pipelineStats.submit }}
              </div>
              <div class="text-base-content/60 text-xs">Submitting</div>
            </div>
            <div class="bg-base-200/50 rounded-lg p-3 text-center">
              <div class="text-secondary mb-1 text-sm font-bold">
                {{ pipelineStats.moveStorage }}
              </div>
              <div class="text-base-content/60 text-xs">Moving</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Upgrades Table -->
      <SectionCard title="Active Upgrades" :icon="ArrowUpIcon">
        <template #actions>
          <button
            :disabled="upgradeSectors.loading.value"
            class="btn btn-outline btn-sm"
            @click="upgradeSectors.refresh"
          >
            <ArrowPathIcon
              class="h-4 w-4"
              :class="{ 'animate-spin': upgradeSectors.loading.value }"
            />
            Refresh
          </button>
        </template>
        <SnapUpgradesTable
          :sectors="upgradeSectors.data.value || []"
          :loading="upgradeSectors.loading.value"
          :error="upgradeSectors.error.value"
          :on-refresh="upgradeSectors.refresh"
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
  ArrowUpIcon,
} from "@heroicons/vue/24/outline";

import SectionCard from "@/components/ui/SectionCard.vue";
import SnapUpgradesTable from "./components/SnapUpgradesTable.vue";
import PipelineLayout from "./components/PipelineLayout.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { useCurioQuery } from "@/composables/useCurioQuery";
import type { PipelineStats, SnapSectorEntry } from "@/types/pipeline";

// Data queries
const snapStats = useCachedQuery<PipelineStats>("PipelineStatsSnap", [], {
  pollingInterval: 30000,
});

const upgradeSectors = useCachedQuery<SnapSectorEntry[]>("UpgradeSectors", [], {
  pollingInterval: 30000,
});

// Action functions
const { pipelineSnapRestartAll } = useCurioQuery();

const restartSnapPipeline = async () => {
  try {
    await pipelineSnapRestartAll();
    await Promise.all([snapStats.refresh(), upgradeSectors.refresh()]);
    return { success: true };
  } catch (error) {
    console.error("Failed to restart Snap pipeline:", error);
    return { success: false, error: error as Error };
  }
};

const isRestarting = ref(false);
const isRefreshingDashboard = ref(false);

// Calculate all statistics from actual sector data for consistency with table
const totalUpgrades = computed(() => {
  const data = upgradeSectors.data.value;
  return data ? data.length : 0;
});

const activeSectors = computed(() => {
  if (!upgradeSectors.data.value) return 0;
  // Active sectors are those that are not failed and not completed
  return upgradeSectors.data.value.filter(
    (sector) => !sector.Failed && !sector.AfterMoveStorage,
  ).length;
});

const completedSectors = computed(() => {
  if (!upgradeSectors.data.value) return 0;
  // Completed sectors are those that have finished moving storage
  return upgradeSectors.data.value.filter(
    (sector) => sector.AfterMoveStorage && !sector.Failed,
  ).length;
});

const failedCount = computed(() => {
  if (!upgradeSectors.data.value) return 0;
  return upgradeSectors.data.value.filter((sector) => sector.Failed).length;
});

const successRate = computed(() => {
  const total = totalUpgrades.value;
  if (!total) return 0;
  return Math.round((completedSectors.value / total) * 100);
});

// Pipeline status breakdown
const pipelineStats = computed(() => {
  const data = upgradeSectors.data.value || [];
  return {
    encode: data.filter((s) => !s.AfterEncode && !s.Failed).length,
    prove: data.filter((s) => s.AfterEncode && !s.AfterProve && !s.Failed)
      .length,
    submit: data.filter((s) => s.AfterProve && !s.AfterSubmit && !s.Failed)
      .length,
    moveStorage: data.filter(
      (s) => s.AfterSubmit && !s.AfterMoveStorage && !s.Failed,
    ).length,
  };
});

// Action handlers
const refreshDashboard = async () => {
  isRefreshingDashboard.value = true;
  try {
    await Promise.all([
      snapStats.refresh(),
      upgradeSectors.refresh(), // Include upgradeSectors refresh since all stats depend on it
    ]);
  } finally {
    isRefreshingDashboard.value = false;
  }
};

const refreshData = async () => {
  await Promise.all([snapStats.refresh(), upgradeSectors.refresh()]);
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
