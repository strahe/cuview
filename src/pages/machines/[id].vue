<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  ArrowLeftIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  SignalIcon,
} from "@heroicons/vue/24/outline";

import { useCachedQuery } from "@/composables/useCachedQuery";
import { useMachineOperations } from "./composables/useMachineOperations";
import type { MachineInfo } from "@/types/machine";
import DataTable from "@/components/ui/DataTable.vue";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog.vue";
import { formatBytes, formatDuration } from "@/utils/format";

const router = useRouter();
const route = useRoute();

const machineId = computed(() => parseInt(route.params.id as string));

const {
  data: machineData,
  loading,
  error,
  refresh,
} = useCachedQuery<MachineInfo>("ClusterNodeInfo", [machineId.value], {
  pollingInterval: 30000,
});

const {
  loading: operationLoading,
  cordon,
  uncordon,
  restart,
} = useMachineOperations();

const cpuUsage = computed(() => {
  if (!machineData.value?.RunningTasks || !machineData.value?.Info?.CPU)
    return 0;

  const cpuIntensiveTasks = machineData.value.RunningTasks.filter((task) =>
    ["SDR", "PC1", "PC2"].includes(task.Task),
  ).length;

  const estimatedUsage =
    ((cpuIntensiveTasks * 2) / machineData.value.Info.CPU) * 100;
  return Math.min(estimatedUsage, 100);
});

const memoryUsage = computed(() => {
  const defaultMemoryStats = { used: 0, total: 0, percentage: 0 };

  if (
    !machineData.value?.Info?.Memory ||
    !machineData.value?.Info?.RunningTasks
  ) {
    return defaultMemoryStats;
  }

  const totalGB = Math.round(
    machineData.value.Info.Memory / (1024 * 1024 * 1024),
  );
  const estimatedUsedGB = machineData.value.Info.RunningTasks * 4;
  const percentage = Math.min((estimatedUsedGB / totalGB) * 100, 100);

  return {
    used: estimatedUsedGB,
    total: totalGB,
    percentage,
  };
});

const gpuUsage = computed(() => {
  if (!machineData.value?.RunningTasks || !machineData.value?.Info?.GPU)
    return 0;

  const gpuIntensiveTasks = machineData.value.RunningTasks.filter((task) =>
    ["SDR", "PC2"].includes(task.Task),
  ).length;

  return Math.min((gpuIntensiveTasks / machineData.value.Info.GPU) * 100, 100);
});

const storageStats = computed(() => {
  const defaultStats = { volumes: 0, used: 0, total: 0, percentage: 0 };

  if (!machineData.value?.Storage?.length) return defaultStats;

  const { Storage } = machineData.value;
  const totalCapacity = Storage.reduce(
    (sum, storage) => sum + storage.Capacity,
    0,
  );
  const totalUsed = Storage.reduce((sum, storage) => sum + storage.Used, 0);
  const percentage = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  return {
    volumes: Storage.length,
    used: totalUsed,
    total: totalCapacity,
    percentage,
  };
});

const machineHealthStatus = computed(() => {
  if (!machineData.value)
    return { status: "unknown", color: "neutral", icon: SignalIcon };

  const { Info } = machineData.value;
  const isOnline = Info.LastContact && parseInt(Info.LastContact) < 60;
  const isUnschedulable = Info.Unschedulable;
  const hasHighLoad = cpuUsage.value > 90 || memoryUsage.value.percentage > 90;

  if (!isOnline)
    return { status: "offline", color: "error", icon: ExclamationTriangleIcon };
  if (isUnschedulable)
    return { status: "cordoned", color: "warning", icon: PauseIcon };
  if (hasHighLoad)
    return { status: "high-load", color: "warning", icon: BoltIcon };
  return { status: "healthy", color: "success", icon: CheckCircleIcon };
});

const showConfirmDialog = ref(false);
const confirmAction = ref<"cordon" | "uncordon" | "restart">("cordon");
const confirmLoading = ref(false);

const handleCordonClick = () => {
  confirmAction.value = "cordon";
  showConfirmDialog.value = true;
};

const handleUncordonClick = () => {
  confirmAction.value = "uncordon";
  showConfirmDialog.value = true;
};

const handleRestartClick = () => {
  confirmAction.value = "restart";
  showConfirmDialog.value = true;
};

const executeAction = async () => {
  if (!machineData.value?.Info) return;

  confirmLoading.value = true;
  let result;

  try {
    const machineId = machineData.value.Info.ID;
    const machineName = machineData.value.Info.Name;

    if (confirmAction.value === "cordon") {
      result = await cordon(machineId, machineName);
    } else if (confirmAction.value === "uncordon") {
      result = await uncordon(machineId, machineName);
    } else if (confirmAction.value === "restart") {
      result = await restart(machineId, machineName);
    }

    if (result?.success) {
      refresh();
      showConfirmDialog.value = false;
    }
  } finally {
    confirmLoading.value = false;
  }
};

const getConfirmationDetails = () => {
  if (!machineData.value?.Info)
    return {
      title: "",
      message: "",
      confirmText: "",
      type: "warning" as const,
    };

  const machineName = machineData.value.Info.Name;

  if (confirmAction.value === "cordon") {
    return {
      title: "Cordon Machine",
      message: `Are you sure you want to cordon machine "${machineName}"? This will prevent new tasks from being scheduled to this machine. Running tasks will continue to completion.`,
      confirmText: "Cordon",
      type: "warning" as const,
    };
  } else if (confirmAction.value === "uncordon") {
    return {
      title: "Uncordon Machine",
      message: `Are you sure you want to uncordon machine "${machineName}"? This will allow new tasks to be scheduled to this machine.`,
      confirmText: "Uncordon",
      type: "success" as const,
    };
  } else {
    return {
      title: "Restart Machine",
      message: `Are you sure you want to restart machine "${machineName}"? This will gracefully restart the machine after all current tasks complete.`,
      confirmText: "Restart",
      type: "error" as const,
    };
  }
};

const goBack = () => {
  router.push("/machines");
};
</script>

<template>
  <div class="bg-base-200/30 min-h-screen">
    <!-- Loading State -->
    <div
      v-if="loading && !machineData"
      class="flex min-h-screen items-center justify-center"
    >
      <div class="text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/70 mt-4">Loading machine details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && !machineData"
      class="flex min-h-screen items-center justify-center"
    >
      <div class="card bg-base-100 mx-4 w-full max-w-md shadow-xl">
        <div class="card-body text-center">
          <ExclamationTriangleIcon class="text-error mx-auto mb-4 h-16 w-16" />
          <h2 class="card-title text-error justify-center">Failed to Load</h2>
          <p class="text-base-content/70">{{ error.message }}</p>
          <div class="card-actions mt-4 justify-center">
            <button class="btn btn-primary" @click="refresh">
              <ArrowPathIcon class="h-4 w-4" />
              Try Again
            </button>
            <button class="btn btn-ghost" @click="goBack">
              <ArrowLeftIcon class="h-4 w-4" />
              Back to Machines
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="machineData" class="pb-8">
      <!-- Hero Section - Machine Overview -->
      <div class="bg-base-100 border-base-300 border-b">
        <!-- Navigation Bar -->
        <div class="border-base-200 border-b px-6 py-3">
          <button class="btn btn-ghost btn-sm gap-2" @click="goBack">
            <ArrowLeftIcon class="h-4 w-4" />
            Back to Machines
          </button>
        </div>

        <!-- Machine Header -->
        <div class="px-6 py-6">
          <div
            class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between"
          >
            <!-- Left: Machine Info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-start gap-4">
                <div
                  class="flex-shrink-0 rounded-lg p-3"
                  :class="`bg-${machineHealthStatus.color}/10 border border-${machineHealthStatus.color}/20`"
                >
                  <component
                    :is="machineHealthStatus.icon"
                    class="h-8 w-8"
                    :class="`text-${machineHealthStatus.color}`"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <h1 class="text-base-content mb-2 text-3xl font-bold">
                    {{ machineData.Info.Name }}
                  </h1>

                  <div
                    class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4"
                  >
                    <div>
                      <span class="text-base-content/60">Status:</span>
                      <span
                        :class="`ml-2 font-medium text-${machineHealthStatus.color} capitalize`"
                      >
                        {{ machineHealthStatus.status.replace("-", " ") }}
                      </span>
                    </div>
                    <div>
                      <span class="text-base-content/60">Host:</span>
                      <span class="text-base-content ml-2 font-mono">{{
                        machineData.Info.Host
                      }}</span>
                    </div>
                    <div>
                      <span class="text-base-content/60">Machine ID:</span>
                      <span class="text-base-content ml-2 font-mono">{{
                        machineData.Info.ID
                      }}</span>
                    </div>
                    <div>
                      <span class="text-base-content/60">Last Contact:</span>
                      <span
                        :class="`ml-2 font-medium ${parseInt(machineData.Info.LastContact) > 60 ? 'text-error' : 'text-success'}`"
                      >
                        {{ machineData.Info.LastContact }} ago
                      </span>
                    </div>
                    <div>
                      <span class="text-base-content/60">Layers:</span>
                      <span class="badge badge-outline badge-sm ml-2">{{
                        machineData.Info.Layers
                      }}</span>
                    </div>
                    <div>
                      <span class="text-base-content/60">Running Tasks:</span>
                      <span class="text-primary ml-2 font-semibold">{{
                        machineData.Info.RunningTasks
                      }}</span>
                    </div>
                    <div class="md:col-span-2">
                      <span class="text-base-content/60">Supported Tasks:</span>
                      <!-- TODO: Add Supported Tasks field to RPC response -->
                      <div class="mt-1">
                        <span class="text-base-content/40 text-xs">
                          Not available
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex-shrink-0">
              <div class="flex flex-col gap-2">
                <button
                  v-if="machineData.Info.Unschedulable"
                  :disabled="operationLoading"
                  class="btn btn-success gap-2"
                  @click="handleUncordonClick"
                >
                  <PlayIcon class="h-4 w-4" />
                  Uncordon
                </button>
                <button
                  v-else
                  :disabled="operationLoading"
                  class="btn btn-warning gap-2"
                  @click="handleCordonClick"
                >
                  <PauseIcon class="h-4 w-4" />
                  Cordon
                </button>
                <button
                  :disabled="
                    operationLoading || !machineData.Info.Unschedulable
                  "
                  class="btn btn-info gap-2"
                  :class="{ 'btn-disabled': !machineData.Info.Unschedulable }"
                  @click="handleRestartClick"
                >
                  <ArrowPathIcon class="h-4 w-4" />
                  Restart
                </button>
                <button
                  class="btn btn-ghost gap-2"
                  :disabled="loading"
                  @click="refresh"
                >
                  <ArrowPathIcon class="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <!-- Hardware Stats -->
          <div
            class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          >
            <div class="card bg-base-200/50">
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <CpuChipIcon class="text-primary h-6 w-6" />
                  <div>
                    <div class="text-lg font-bold">
                      {{ Math.round(cpuUsage) }}%
                    </div>
                    <div class="text-base-content/60 text-xs">
                      CPU ({{ machineData.Info.CPU }} cores)
                    </div>
                  </div>
                </div>
                <progress
                  class="progress progress-primary progress-sm mt-2"
                  :value="cpuUsage"
                  max="100"
                ></progress>
              </div>
            </div>

            <div class="card bg-base-200/50">
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <ServerIcon class="text-info h-6 w-6" />
                  <div>
                    <div class="text-lg font-bold">
                      {{ Math.round(memoryUsage.percentage) }}%
                    </div>
                    <div class="text-base-content/60 text-xs">
                      Memory ({{ memoryUsage.used }}/{{ memoryUsage.total }}GB)
                    </div>
                  </div>
                </div>
                <progress
                  class="progress progress-info progress-sm mt-2"
                  :value="memoryUsage.percentage"
                  max="100"
                ></progress>
              </div>
            </div>

            <div class="card bg-base-200/50">
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <BoltIcon class="text-warning h-6 w-6" />
                  <div>
                    <div class="text-lg font-bold">
                      {{ Math.round(gpuUsage) }}%
                    </div>
                    <div class="text-base-content/60 text-xs">
                      GPU ({{ machineData.Info.GPU }} units)
                    </div>
                  </div>
                </div>
                <progress
                  class="progress progress-warning progress-sm mt-2"
                  :value="gpuUsage"
                  max="100"
                ></progress>
              </div>
            </div>

            <div class="card bg-base-200/50">
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <CircleStackIcon class="text-secondary h-6 w-6" />
                  <div>
                    <div class="text-lg font-bold">
                      {{ Math.round(storageStats.percentage) }}%
                    </div>
                    <div class="text-base-content/60 text-xs">
                      Storage ({{ storageStats.volumes }} volumes)
                    </div>
                  </div>
                </div>
                <progress
                  class="progress progress-secondary progress-sm mt-2"
                  :value="storageStats.percentage"
                  max="100"
                ></progress>
              </div>
            </div>

            <div class="card bg-base-200/50">
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <ClockIcon class="text-success h-6 w-6" />
                  <div>
                    <div class="text-lg font-bold">
                      {{ machineData.RunningTasks?.length || 0 }}
                    </div>
                    <div class="text-base-content/60 text-xs">
                      Running Tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-200/50">
              <div class="card-body p-4">
                <div class="flex items-center gap-3">
                  <CheckCircleIcon class="text-accent h-6 w-6" />
                  <div>
                    <div class="text-lg font-bold">
                      {{ machineData.FinishedTasks?.length || 0 }}
                    </div>
                    <div class="text-base-content/60 text-xs">
                      Completed Tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Sections - Full Width -->
      <div class="mt-4 px-4">
        <div class="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <!-- Left Section - Hardware & Storage (Expanded) -->
          <div class="space-y-6 2xl:col-span-2">
            <!-- Hardware Resources -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body p-4">
                <div class="mb-4 flex items-center gap-2">
                  <ServerIcon class="text-primary h-5 w-5" />
                  <h2 class="card-title text-lg">Hardware Resources</h2>
                </div>

                <div
                  class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  <div
                    class="bg-primary/5 border-primary/10 rounded-lg border p-4"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-base-content/60 text-xs font-medium"
                        >CPU</span
                      >
                      <CpuChipIcon class="text-primary h-4 w-4" />
                    </div>
                    <div class="mb-1 text-xl font-bold">
                      {{ machineData.Info.CPU }}
                    </div>
                    <div class="text-base-content/60 mb-2 text-xs">
                      cores available
                    </div>
                    <div class="flex items-center gap-3">
                      <progress
                        class="progress progress-primary flex-1"
                        :value="cpuUsage"
                        max="100"
                      ></progress>
                      <span class="text-sm font-medium"
                        >{{ Math.round(cpuUsage) }}%</span
                      >
                    </div>
                  </div>

                  <div class="bg-info/5 border-info/10 rounded-lg border p-4">
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-base-content/60 text-xs font-medium"
                        >Memory</span
                      >
                      <ServerIcon class="text-info h-4 w-4" />
                    </div>
                    <div class="mb-1 text-xl font-bold">
                      {{ memoryUsage.total }}GB
                    </div>
                    <div class="text-base-content/60 mb-2 text-xs">
                      {{ memoryUsage.used }}GB used
                    </div>
                    <div class="flex items-center gap-3">
                      <progress
                        class="progress progress-info flex-1"
                        :value="memoryUsage.percentage"
                        max="100"
                      ></progress>
                      <span class="text-sm font-medium"
                        >{{ Math.round(memoryUsage.percentage) }}%</span
                      >
                    </div>
                  </div>

                  <div
                    class="bg-warning/5 border-warning/10 rounded-lg border p-4"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-base-content/60 text-xs font-medium"
                        >GPU</span
                      >
                      <BoltIcon class="text-warning h-4 w-4" />
                    </div>
                    <div class="mb-1 text-xl font-bold">
                      {{ machineData.Info.GPU }}
                    </div>
                    <div class="text-base-content/60 mb-2 text-xs">
                      units available
                    </div>
                    <div class="flex items-center gap-3">
                      <progress
                        class="progress progress-warning flex-1"
                        :value="gpuUsage"
                        max="100"
                      ></progress>
                      <span class="text-sm font-medium"
                        >{{ Math.round(gpuUsage) }}%</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Storage Volumes -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body p-4">
                <div class="mb-4 flex items-center gap-2">
                  <CircleStackIcon class="text-secondary h-5 w-5" />
                  <h2 class="card-title text-lg">Storage Volumes</h2>
                  <div class="badge badge-secondary badge-sm">
                    {{ storageStats.volumes }}
                  </div>
                </div>

                <div
                  v-if="!machineData.Storage?.length"
                  class="py-8 text-center"
                >
                  <CircleStackIcon
                    class="text-base-content/20 mx-auto mb-3 h-12 w-12"
                  />
                  <p class="text-base-content/60 text-sm">
                    No storage volumes configured
                  </p>
                </div>

                <DataTable v-else>
                  <thead>
                    <tr>
                      <th>Volume ID</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Used</th>
                      <th>Available</th>
                      <th>Usage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="volume in machineData.Storage" :key="volume.ID">
                      <td>
                        <div class="font-mono font-semibold">
                          {{ volume.ID }}
                        </div>
                      </td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          <div
                            class="badge badge-sm"
                            :class="
                              volume.CanSeal ? 'badge-primary' : 'badge-neutral'
                            "
                          >
                            {{ volume.CanSeal ? "Seal" : "Store" }}
                          </div>
                          <div
                            v-if="volume.CanStore"
                            class="badge badge-secondary badge-sm"
                          >
                            Store
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="font-medium">
                          {{
                            volume.Capacity
                              ? formatBytes(Number(volume.Capacity))
                              : "N/A"
                          }}
                        </div>
                      </td>
                      <td>
                        <div class="font-medium">
                          {{
                            volume.Used
                              ? formatBytes(Number(volume.Used))
                              : "0 B"
                          }}
                        </div>
                      </td>
                      <td>
                        <div class="font-medium">
                          {{
                            volume.Available
                              ? formatBytes(Number(volume.Available))
                              : "N/A"
                          }}
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-3">
                          <progress
                            class="progress progress-sm w-16"
                            :class="{
                              'progress-success': volume.UsedPercent < 70,
                              'progress-warning':
                                volume.UsedPercent >= 70 &&
                                volume.UsedPercent < 90,
                              'progress-error': volume.UsedPercent >= 90,
                            }"
                            :value="volume.UsedPercent"
                            max="100"
                          ></progress>
                          <span
                            class="text-sm font-semibold"
                            :class="{
                              'text-success': volume.UsedPercent < 70,
                              'text-warning':
                                volume.UsedPercent >= 70 &&
                                volume.UsedPercent < 90,
                              'text-error': volume.UsedPercent >= 90,
                            }"
                          >
                            {{ Math.round(volume.UsedPercent) }}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div
                            class="badge badge-sm"
                            :class="
                              volume.HeartbeatErr
                                ? 'badge-error'
                                : 'badge-success'
                            "
                          >
                            {{ volume.HeartbeatErr ? "Error" : "Healthy" }}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </div>
            <!-- Recent Activity -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body p-4">
                <div class="mb-4 flex items-center gap-2">
                  <ClockIcon class="text-info h-5 w-5" />
                  <h2 class="card-title text-lg">Recent Activity</h2>
                </div>

                <div
                  v-if="!machineData.FinishedTasks?.length"
                  class="py-8 text-center"
                >
                  <ClockIcon
                    class="text-base-content/20 mx-auto mb-3 h-12 w-12"
                  />
                  <p class="text-base-content/60 text-sm">No recent activity</p>
                </div>

                <DataTable v-else>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Sector</th>
                      <th>Status</th>
                      <th>Start</th>
                      <th>Took</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="task in machineData.FinishedTasks.slice(0, 20)"
                      :key="task.ID"
                    >
                      <td>
                        <div class="font-mono font-semibold">
                          #{{ task.ID }}
                        </div>
                      </td>
                      <td>
                        <div class="text-sm font-medium">
                          {{ task.Task }}
                        </div>
                      </td>
                      <td>
                        <div class="text-sm">N/A</div>
                      </td>
                      <td>
                        <span
                          class="badge badge-sm"
                          :class="
                            task.Outcome === 'Success'
                              ? 'badge-success'
                              : 'badge-error'
                          "
                        >
                          {{
                            task.Outcome === "Success" ? "Success" : "Failed"
                          }}
                        </span>
                      </td>
                      <td>
                        <div class="text-sm">
                          {{ task.Start }}
                        </div>
                      </td>
                      <td>
                        <div class="font-medium">
                          {{ task.Took || "N/A" }}
                        </div>
                      </td>
                      <td>
                        <div
                          v-if="task.Outcome !== 'Success' && task.Message"
                          class="text-error max-w-xs truncate text-xs"
                          :title="task.Message"
                        >
                          {{ task.Message }}
                        </div>
                        <div v-else class="text-base-content/40 text-xs">-</div>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </div>
          </div>

          <!-- Right Column - Running Tasks Only -->
          <div class="space-y-6">
            <!-- Running Tasks -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body p-4">
                <div class="mb-4 flex items-center gap-2">
                  <ClockIcon class="text-success h-5 w-5" />
                  <h2 class="card-title text-lg">Running Tasks</h2>
                  <div class="badge badge-primary badge-sm">
                    {{ machineData.RunningTasks?.length || 0 }}
                  </div>
                </div>

                <div
                  v-if="!machineData.RunningTasks?.length"
                  class="py-8 text-center"
                >
                  <ClockIcon
                    class="text-base-content/20 mx-auto mb-3 h-12 w-12"
                  />
                  <p class="text-base-content/60 text-sm">
                    No tasks currently running
                  </p>
                </div>

                <DataTable v-else>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Sector</th>
                      <th>Elapsed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="task in machineData.RunningTasks.slice(0, 20)"
                      :key="task.ID"
                    >
                      <td>
                        <div class="font-mono font-semibold">
                          #{{ task.ID }}
                        </div>
                      </td>
                      <td>
                        <div class="text-sm font-medium">
                          {{ task.Task }}
                        </div>
                      </td>
                      <td>
                        <div class="text-sm">
                          {{ task.PoRepSector || "N/A" }}
                        </div>
                      </td>
                      <td>
                        <div class="font-medium">
                          {{ formatDuration(task.Posted) }}
                        </div>
                      </td>
                      <td>
                        <span class="badge badge-success badge-sm">
                          Running
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </DataTable>

                <div
                  v-if="machineData.RunningTasks.length > 20"
                  class="mt-4 text-center"
                >
                  <div class="text-base-content/60 text-sm">
                    Showing 20 of {{ machineData.RunningTasks.length }} running
                    tasks
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <ConfirmationDialog
      v-if="machineData"
      :show="showConfirmDialog"
      :title="getConfirmationDetails().title"
      :message="getConfirmationDetails().message"
      :confirm-text="getConfirmationDetails().confirmText"
      :type="
        getConfirmationDetails().type === 'error'
          ? 'danger'
          : (getConfirmationDetails().type as 'warning' | 'info')
      "
      :loading="confirmLoading"
      @confirm="executeAction"
      @cancel="showConfirmDialog = false"
    />
  </div>
</template>
