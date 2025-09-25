<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { ArrowRightIcon, ComputerDesktopIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import { getTableRowClasses } from "@/utils/ui";
import type { ClusterMachine } from "@/types/cluster";

const router = useRouter();

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
      class: "badge-error",
    };
  }
  if (!item.Unschedulable) {
    return { text: "enabled", class: "badge-success" };
  }
  if (item.RunningTasks > 0) {
    return {
      text: `cordoned (${item.RunningTasks} tasks running)`,
      class: "badge-warning",
    };
  }
  return { text: "cordoned", class: "badge-warning" };
};

// Calculate summary metrics for overview display
const summaryStats = computed(() => {
  if (!machines.value?.length) return null;

  const total = machines.value.length;
  const online = machines.value.filter((m) => {
    const contactMatch = m.SinceContact.match(/(\d+)s/);
    const secondsSinceContact = contactMatch ? parseInt(contactMatch[1]) : 0;
    return secondsSinceContact <= 60 && !m.Unschedulable && !m.Restarting;
  }).length;

  const totalRunningTasks = machines.value.reduce(
    (sum, m) => sum + (m.RunningTasks || 0),
    0,
  );

  return { total, online, totalRunningTasks };
});
</script>

<template>
  <div class="space-y-4">
    <!-- Summary Statistics -->
    <div
      v-if="summaryStats && hasData"
      class="bg-base-200/50 flex items-center justify-between rounded-lg p-4"
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

      <button class="btn btn-primary btn-sm gap-2" @click="navigateToMachines">
        Manage Machines
        <ArrowRightIcon class="size-4" />
      </button>
    </div>

    <!-- Fallback button when no data -->
    <div v-else-if="!loading" class="flex items-center justify-end">
      <button class="btn btn-primary btn-sm gap-2" @click="navigateToMachines">
        Manage Machines
        <ArrowRightIcon class="size-4" />
      </button>
    </div>

    <DataSection
      :loading="loading"
      :error="error"
      :has-data="hasData"
      :on-retry="refresh"
      error-title="Connection Error"
      :empty-icon="ComputerDesktopIcon"
      empty-message="No cluster machines available"
    >
      <template #loading>Loading cluster machines...</template>

      <DataTable :fixed="true">
        <thead>
          <tr>
            <th class="w-32">Name</th>
            <th class="w-40">Host</th>
            <th class="w-24">Resources</th>
            <th class="w-16">Tasks</th>
            <th class="w-20">Uptime</th>
            <th class="w-24">Last Contact</th>
            <th class="w-36">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in machines"
            :key="item.ID"
            :class="getTableRowClasses()"
          >
            <td class="truncate font-medium">{{ item.Name }}</td>
            <td class="truncate font-mono text-sm">{{ item.Address }}</td>
            <td class="font-mono text-sm">
              <div class="flex items-center gap-1">
                <span class="text-primary">{{ item.Cpu }}C</span>
                <span class="text-base-content/60">•</span>
                <span class="text-base-content">{{ item.RamHumanized }}</span>
                <template v-if="item.Gpu > 0">
                  <span class="text-base-content/60">•</span>
                  <span class="text-warning">{{ item.Gpu }}G</span>
                </template>
              </div>
            </td>
            <td class="text-center">
              <span class="text-primary font-medium">{{
                item.RunningTasks || 0
              }}</span>
            </td>
            <td class="text-sm">
              {{ item.Uptime || "-" }}
            </td>
            <td class="text-sm">{{ item.SinceContact }}</td>
            <td>
              <div :class="['badge', getStatusBadge(item).class]">
                {{ getStatusBadge(item).text }}
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </DataSection>
  </div>
</template>
