<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { ArrowRightIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import type { ClusterMachine } from "@/types/cluster";

const router = useRouter();
const detailed = ref(false);

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
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <label class="label cursor-pointer gap-2">
        <input
          v-model="detailed"
          type="checkbox"
          class="toggle toggle-primary"
        />
        <span class="label-text">Detailed View</span>
      </label>

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
      empty-icon="🖥️"
      empty-message="No cluster machines available"
    >
      <template #loading>Loading cluster machines...</template>

      <DataTable :fixed="true">
        <thead>
          <tr>
            <th class="w-32">Name</th>
            <th class="w-40">Host</th>
            <th class="w-16">ID</th>
            <th v-if="detailed" class="w-16">CPUs</th>
            <th v-if="detailed" class="w-20">RAM</th>
            <th v-if="detailed" class="w-16">GPUs</th>
            <th class="w-32">Last Contact</th>
            <th class="w-24">Uptime</th>
            <th class="w-48">Status</th>
            <th v-if="detailed" class="w-40">Tasks</th>
            <th v-if="detailed" class="w-40">Layers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in machines" :key="item.ID">
            <td class="truncate font-medium">{{ item.Name }}</td>
            <td class="truncate font-mono text-sm">{{ item.Address }}</td>
            <td class="text-base-content/70 text-sm">{{ item.ID }}</td>

            <td v-if="detailed">{{ item.Cpu }}</td>
            <td v-if="detailed">{{ item.RamHumanized }}</td>
            <td v-if="detailed">{{ item.Gpu }}</td>

            <td class="text-sm">{{ item.SinceContact }}</td>
            <td class="text-sm">{{ item.Uptime }}</td>

            <td>
              <div :class="['badge', getStatusBadge(item).class]">
                {{ getStatusBadge(item).text }}
              </div>
            </td>

            <td v-if="detailed">
              <div class="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
                <span
                  v-for="task in (item.Tasks || '')
                    .split(',')
                    .map((t) => t.trim())
                    .filter((t) => t)"
                  :key="task"
                  class="badge badge-outline badge-sm"
                >
                  {{ task }}
                </span>
              </div>
            </td>

            <td v-if="detailed">
              <div class="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
                <span
                  v-for="layer in (item.Layers || '')
                    .split(',')
                    .map((l) => l.trim())
                    .filter((l) => l)"
                  :key="layer"
                  class="badge badge-outline badge-sm"
                >
                  {{ layer }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </DataSection>
  </div>
</template>
