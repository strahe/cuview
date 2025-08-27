<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import type { HarmonyTaskStat, TaskStatWithPercentage } from "@/types/cluster";

const {
  data: rawData,
  loading,
  error,
  hasData,
  refresh,
} = useCachedQuery<HarmonyTaskStat[]>("HarmonyTaskStats", [], {
  pollingInterval: 30000,
});
const processedData = computed<TaskStatWithPercentage[]>(() => {
  if (rawData.value && rawData.value.length > 0) {
    return rawData.value.map((task) => ({
      ...task,
      FailedPercentage:
        task.FalseCount > 0
          ? `${((task.FalseCount / task.TotalCount) * 100).toFixed(2)}%`
          : "0%",
      isError: task.FalseCount > task.TrueCount && task.TrueCount === 0,
    }));
  }
  return [];
});

const getSuccessRate = (task: TaskStatWithPercentage): number => {
  return task.TotalCount > 0 ? (task.TrueCount / task.TotalCount) * 100 : 0;
};

const getStatusBadge = (task: TaskStatWithPercentage) => {
  if (task.isError) {
    return { class: "badge-error", icon: XCircleIcon };
  }
  if (task.FalseCount === 0) {
    return { class: "badge-success", icon: CheckCircleIcon };
  }
  return { class: "badge-warning", icon: null };
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Task Stats Error"
    empty-icon="📊"
    empty-message="No task statistics available"
  >
    <template #loading>Loading task statistics...</template>

    <DataTable :compact="true">
      <thead>
        <tr>
          <th class="w-2/5">Task Name</th>
          <th class="w-2/5">Success Rate</th>
          <th class="w-1/5 text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="task in processedData"
          :key="task.Name"
          :class="{ 'bg-error/10': task.isError }"
        >
          <td class="truncate font-medium">
            <span
              :class="{ 'text-error': task.isError }"
              :title="task.Name"
              class="block truncate"
            >
              {{ task.Name }}
            </span>
          </td>

          <td>
            <div class="flex items-center gap-3">
              <span class="min-w-[3rem] text-sm font-medium">
                {{ getSuccessRate(task).toFixed(1) }}%
              </span>
              <progress
                class="progress progress-sm flex-1"
                :class="
                  task.isError
                    ? 'progress-error'
                    : task.FalseCount === 0
                      ? 'progress-success'
                      : 'progress-warning'
                "
                :value="getSuccessRate(task)"
                max="100"
              ></progress>
              <span class="text-base-content/50 min-w-[4rem] text-xs">
                {{ task.TrueCount }}/{{ task.TotalCount }}
              </span>
            </div>
          </td>

          <td class="text-center">
            <div class="badge badge-sm" :class="getStatusBadge(task).class">
              <component
                :is="getStatusBadge(task).icon"
                v-if="getStatusBadge(task).icon"
                class="mr-1 size-3"
              />
              {{
                task.isError
                  ? "Error"
                  : task.FalseCount === 0
                    ? "Healthy"
                    : "Warning"
              }}
            </div>
          </td>
        </tr>
      </tbody>
    </DataTable>
  </DataSection>
</template>
