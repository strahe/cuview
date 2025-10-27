<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { ArrowRightIcon } from "@heroicons/vue/24/outline";
import { parseGoDurationSeconds } from "@/utils/duration";
import type { ClusterMachine } from "@/types/cluster";

const router = useRouter();

const OFFLINE_THRESHOLD_SECONDS = 60;

const {
  data: machines,
  loading,
  error,
  refresh,
  hasData,
} = useCachedQuery<ClusterMachine[]>("ClusterMachines", [], {
  pollingInterval: 5000,
});

const navigateToMachines = () => {
  router.push("/machines");
};

const getStatusBadge = (item: ClusterMachine) => {
  if (item.Restarting) {
    return {
      text: `restarting (since ${item.RestartRequest})`,
      class: "badge-outline",
    };
  }
  if (!item.Unschedulable) {
    return { text: "enabled", class: "badge-outline" };
  }
  if (item.RunningTasks > 0) {
    return {
      text: `cordoned (${item.RunningTasks} tasks running)`,
      class: "badge-outline",
    };
  }
  return { text: "cordoned", class: "badge-outline" };
};

const summaryStats = computed(() => {
  if (!machines.value?.length) return null;

  const total = machines.value.length;
  const online = machines.value.filter((m) => {
    const secondsSinceContact = parseGoDurationSeconds(m.SinceContact);
    return (
      secondsSinceContact <= OFFLINE_THRESHOLD_SECONDS &&
      !m.Unschedulable &&
      !m.Restarting
    );
  }).length;

  const totalRunningTasks = machines.value.reduce(
    (sum, m) => sum + (m.RunningTasks || 0),
    0,
  );

  return { total, online, totalRunningTasks };
});

const problemMachines = computed(() => {
  if (!machines.value?.length) return [];

  return machines.value.filter((m) => {
    const secondsSinceContact = parseGoDurationSeconds(m.SinceContact);
    const isOffline = secondsSinceContact > OFFLINE_THRESHOLD_SECONDS;

    return m.Restarting || m.Unschedulable || isOffline;
  });
});

const hasProblemMachines = computed(() => problemMachines.value.length > 0);
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="summaryStats && hasData"
      class="bg-base-200 border-base-300 flex items-center justify-between rounded-lg border p-4 shadow-sm"
    >
      <div class="flex items-center gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold">{{ summaryStats.total }}</div>
          <div class="text-base-content/70 text-sm">Total Machines</div>
        </div>
        <div class="text-center">
          <div class="text-base-content text-2xl font-bold">
            {{ summaryStats.online }}
          </div>
          <div class="text-base-content/70 text-sm">Online</div>
        </div>
        <div class="text-center">
          <div class="text-base-content text-2xl font-bold">
            {{ summaryStats.totalRunningTasks }}
          </div>
          <div class="text-base-content/70 text-sm">Running Tasks</div>
        </div>
      </div>

      <button class="btn btn-neutral btn-sm gap-2" @click="navigateToMachines">
        Manage Machines
        <ArrowRightIcon class="size-4" />
      </button>
    </div>

    <div v-else-if="!loading" class="flex items-center justify-end">
      <button class="btn btn-neutral btn-sm gap-2" @click="navigateToMachines">
        Manage Machines
        <ArrowRightIcon class="size-4" />
      </button>
    </div>

    <div v-if="hasProblemMachines && !loading" class="space-y-2">
      <h4 class="text-base-content/80 text-sm font-medium">
        Machines Requiring Attention
      </h4>
      <div class="space-y-2">
        <div
          v-for="machine in problemMachines"
          :key="machine.ID"
          class="border-base-300 bg-base-100 flex items-center justify-between rounded-lg border p-3"
        >
          <div class="flex items-center gap-3">
            <div class="font-medium">{{ machine.Name }}</div>
            <div class="text-base-content/60 font-mono text-sm">
              {{ machine.Address }}
            </div>
          </div>
          <div :class="['badge', getStatusBadge(machine).class]">
            {{ getStatusBadge(machine).text }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-base-content/60 text-sm">
        Loading cluster machines...
      </div>
    </div>

    <div v-if="error && !loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="text-error mb-2 text-sm">Connection Error</div>
        <button class="btn btn-sm btn-outline" @click="refresh">Retry</button>
      </div>
    </div>
  </div>
</template>
