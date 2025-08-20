<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import KPICard from "@/components/ui/KPICard.vue";
import type { ClusterMachine, HarmonyTaskStat } from "@/types/cluster";
import type { StorageUseStat } from "@/types/storage";
import type { ActorSummaryData } from "@/types/actor";
import {
  CpuChipIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CircleStackIcon,
  WalletIcon,
} from "@heroicons/vue/24/outline";

const {
  data: machines,
  loading: machinesLoading,
  error: machinesError,
} = useCachedQuery<ClusterMachine[]>("ClusterMachines", [], {
  pollingInterval: 30000,
});

const {
  data: taskStats,
  loading: tasksLoading,
  error: tasksError,
} = useCachedQuery<HarmonyTaskStat[]>("HarmonyTaskStats", [], {
  pollingInterval: 30000,
});

const {
  data: storageStats,
  loading: storageLoading,
  error: storageError,
} = useCachedQuery<StorageUseStat[]>("StorageUseStats", [], {
  pollingInterval: 30000,
});

const {
  data: actors,
  loading: actorsLoading,
  error: actorsError,
} = useCachedQuery<ActorSummaryData[]>("ActorSummary", [], {
  pollingInterval: 30000,
});

const loading = computed(
  () =>
    machinesLoading.value ||
    tasksLoading.value ||
    storageLoading.value ||
    actorsLoading.value,
);
const error = computed(
  () =>
    machinesError.value ||
    tasksError.value ||
    storageError.value ||
    actorsError.value,
);

const isInitialLoading = computed(
  () =>
    loading.value &&
    !machines.value &&
    !taskStats.value &&
    !storageStats.value &&
    !actors.value,
);

const onlineMachines = computed(() => {
  if (!machines.value) return 0;
  return machines.value.filter((m) => !m.Unschedulable).length;
});

const totalMachines = computed(() => machines.value?.length || 0);

const machineHealthPercentage = computed(() => {
  if (totalMachines.value === 0) return 0;
  return Math.round((onlineMachines.value / totalMachines.value) * 100);
});

const activeTasks = computed(() => {
  if (!machines.value) return 0;
  return machines.value.reduce((sum, machine) => sum + machine.RunningTasks, 0);
});

const totalCPUs = computed(() => {
  if (!machines.value) return 0;
  return machines.value.reduce((sum, machine) => sum + machine.Cpu, 0);
});

const taskSuccessRate = computed(() => {
  if (!taskStats.value || taskStats.value.length === 0) return 0;
  const totalSuccess = taskStats.value.reduce(
    (sum, task) => sum + task.TrueCount,
    0,
  );
  const totalTasks = taskStats.value.reduce(
    (sum, task) => sum + task.TotalCount,
    0,
  );
  if (totalTasks === 0) return 0;
  return Math.round((totalSuccess / totalTasks) * 100);
});

const totalSuccessfulTasks = computed(() => {
  if (!taskStats.value) return 0;
  return taskStats.value.reduce((sum, task) => sum + task.TrueCount, 0);
});

const totalFailedTasks = computed(() => {
  if (!taskStats.value) return 0;
  return taskStats.value.reduce((sum, task) => sum + task.FalseCount, 0);
});

const storageUsagePercentage = computed(() => {
  if (!storageStats.value || storageStats.value.length === 0) return 0;
  const totalCapacity = storageStats.value.reduce(
    (sum, stat) => sum + stat.Capacity,
    0,
  );
  const totalAvailable = storageStats.value.reduce(
    (sum, stat) => sum + stat.Available,
    0,
  );
  if (totalCapacity === 0) return 0;
  return Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100);
});

const totalStorageCapacity = computed(() => {
  if (!storageStats.value || storageStats.value.length === 0) return "0 TB";
  const totalTB =
    storageStats.value.reduce((sum, stat) => sum + stat.Capacity, 0) /
    (1024 * 1024 * 1024 * 1024);
  return `${totalTB.toFixed(1)} TB`;
});

const totalActorBalance = computed(() => {
  if (!actors.value || actors.value.length === 0) return "0 FIL";
  let totalBalance = 0;
  actors.value.forEach((actor) => {
    const balance = parseFloat(
      actor.ActorBalance.replace(/[^\d.-]/g, "") || "0",
    );
    totalBalance += balance;
  });
  if (totalBalance >= 1000) {
    return `${(totalBalance / 1000).toFixed(1)}k FIL`;
  }
  return `${totalBalance.toFixed(2)} FIL`;
});

const actorCount = computed(() => actors.value?.length || 0);

const totalActorAvailable = computed(() => {
  if (!actors.value || actors.value.length === 0) return "0 FIL";
  let totalAvailable = 0;
  actors.value.forEach((actor) => {
    const available = parseFloat(
      actor.ActorAvailable.replace(/[^\d.-]/g, "") || "0",
    );
    totalAvailable += available;
  });
  if (totalAvailable >= 1000) {
    return `${(totalAvailable / 1000).toFixed(1)}k FIL`;
  }
  return `${totalAvailable.toFixed(2)} FIL`;
});

const totalWins7d = computed(() => {
  if (!actors.value || actors.value.length === 0) return 0;
  return actors.value.reduce((sum, actor) => sum + actor.Win7, 0);
});

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};
</script>

<template>
  <div v-if="!isInitialLoading" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <!-- Online Machines -->
    <KPICard
      :value="onlineMachines"
      label="Online Machines"
      :subtitle="`${machineHealthPercentage}% cluster health`"
      :trend="machineHealthPercentage > 80 ? 'up' : 'down'"
      :icon="ServerIcon"
      icon-color="success"
    />

    <!-- Active Tasks -->
    <KPICard
      :value="formatNumber(activeTasks)"
      label="Active Tasks"
      :subtitle="`${formatNumber(totalSuccessfulTasks)} completed successfully`"
      :trend="'neutral'"
      :icon="ClockIcon"
      icon-color="info"
    />

    <!-- Task Success Rate -->
    <KPICard
      :value="`${taskSuccessRate}%`"
      label="Success Rate"
      :subtitle="`${formatNumber(totalFailedTasks)} failed tasks`"
      :trend="taskSuccessRate > 95 ? 'up' : 'down'"
      :icon="CheckCircleIcon"
      :icon-color="taskSuccessRate > 95 ? 'success' : 'warning'"
    />

    <!-- Total CPUs -->
    <KPICard
      :value="totalCPUs"
      label="CPU Cores"
      subtitle="Across all machines"
      :trend="'neutral'"
      :icon="CpuChipIcon"
      icon-color="primary"
    />

    <!-- Storage Usage -->
    <div
      class="bg-base-100 border-base-300 flex h-[180px] flex-col rounded-lg border p-4"
    >
      <div class="mb-3 flex items-start justify-between">
        <div class="flex-1">
          <div class="text-base-content/60 mb-1 text-sm font-medium">
            Storage Usage
          </div>
          <div class="text-base-content mb-2 text-3xl font-bold tracking-tight">
            {{ storageUsagePercentage }}%
          </div>
          <div
            class="text-xs font-medium"
            :class="
              storageUsagePercentage > 90
                ? 'text-error'
                : storageUsagePercentage > 80
                  ? 'text-base-content/60'
                  : 'text-success'
            "
          >
            {{ totalStorageCapacity }} total capacity
          </div>
        </div>
        <div
          class="ml-3 rounded-lg p-2.5"
          :class="
            storageUsagePercentage > 90
              ? 'bg-error/10 text-error'
              : storageUsagePercentage > 80
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
          "
        >
          <CircleStackIcon class="size-5" />
        </div>
      </div>

      <div class="flex flex-1 flex-col justify-end">
        <div class="space-y-2">
          <template v-if="storageStats && storageStats.length > 0">
            <div
              v-for="stat in storageStats.slice(0, 3)"
              :key="stat.Type"
              class="flex items-center justify-between"
            >
              <span class="text-base-content/70 text-xs">{{ stat.Type }}</span>
              <div class="text-right">
                <span class="text-xs font-medium"
                  >{{
                    Math.round((1 - stat.Available / stat.Capacity) * 100)
                  }}%</span
                >
              </div>
            </div>
          </template>
          <div v-else class="text-base-content/50 text-xs">
            No detailed breakdown available
          </div>
        </div>
      </div>
    </div>

    <!-- Total Balance -->
    <div
      class="bg-base-100 border-base-300 flex h-[180px] flex-col rounded-lg border p-4"
    >
      <div class="mb-3 flex items-start justify-between">
        <div class="flex-1">
          <div class="text-base-content/60 mb-1 text-sm font-medium">
            Total Balance
          </div>
          <div class="text-base-content mb-2 text-3xl font-bold tracking-tight">
            {{ totalActorBalance }}
          </div>
          <div class="text-accent text-xs font-medium">
            {{ actorCount }} storage providers
          </div>
        </div>
        <div class="bg-accent/10 text-accent ml-3 rounded-lg p-2.5">
          <WalletIcon class="size-5" />
        </div>
      </div>

      <div class="flex flex-1 flex-col justify-end">
        <div class="space-y-2">
          <template v-if="actors && actors.length > 0">
            <div class="flex items-center justify-between">
              <span class="text-base-content/70 text-xs">Available</span>
              <span class="text-xs font-medium">{{ totalActorAvailable }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-base-content/70 text-xs">Recent Wins (7d)</span>
              <span class="text-xs font-medium">{{ totalWins7d }}</span>
            </div>
          </template>
          <div v-else class="text-base-content/50 text-xs">
            No actor data available
          </div>
        </div>
      </div>
    </div>

    <!-- Machine Status Breakdown -->
    <div class="col-span-2 lg:col-span-2">
      <div
        class="bg-base-100 border-base-300 flex h-[180px] flex-col rounded-lg border p-4"
      >
        <h3 class="mb-3 flex items-center gap-2 font-semibold">
          <ServerIcon class="size-5" />
          Machine Status
        </h3>
        <div class="flex flex-1 flex-col">
          <div class="flex-1 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CheckCircleIcon class="text-success size-4" />
                <span class="text-sm">Online</span>
              </div>
              <div class="text-right">
                <span class="font-semibold">{{ onlineMachines }}</span>
                <span class="text-base-content/60 ml-1 text-xs">machines</span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ExclamationTriangleIcon class="text-error size-4" />
                <span class="text-sm">Offline</span>
              </div>
              <div class="text-right">
                <span class="font-semibold">{{
                  totalMachines - onlineMachines
                }}</span>
                <span class="text-base-content/60 ml-1 text-xs">machines</span>
              </div>
            </div>
          </div>

          <!-- Health indicator -->
          <div class="border-base-300 mt-auto border-t pt-2">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-base-content/60 text-sm">Cluster Health</span>
              <span class="text-sm font-medium"
                >{{ machineHealthPercentage }}%</span
              >
            </div>
            <div class="bg-base-200 h-2 w-full rounded-full">
              <div
                class="h-2 rounded-full transition-all duration-500"
                :class="
                  machineHealthPercentage > 80
                    ? 'bg-success'
                    : machineHealthPercentage > 60
                      ? 'bg-warning'
                      : 'bg-error'
                "
                :style="{ width: `${machineHealthPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <div v-for="i in 6" :key="i" class="animate-pulse">
      <div class="bg-base-100 border-base-300 h-24 rounded-lg border p-4">
        <div class="bg-base-200 mb-2 h-4 w-3/4 rounded"></div>
        <div class="bg-base-200 h-3 w-1/2 rounded"></div>
      </div>
    </div>
  </div>

  <div v-if="error" class="text-error py-8 text-center">
    <div class="mb-2 text-lg">📊 Stats Error</div>
    <div class="text-sm">{{ error.message }}</div>
  </div>
</template>
