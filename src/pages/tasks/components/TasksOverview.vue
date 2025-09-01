<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/24/outline";
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
    error-title="Task Statistics Error"
    empty-icon="📊"
    empty-message="No task statistics available"
  >
    <template #loading>Loading task statistics...</template>

    <div
      class="border-base-300/30 bg-base-100 overflow-x-auto rounded-lg border shadow-md"
    >
      <table class="table w-full">
        <thead class="bg-base-200/50 sticky top-0 z-10">
          <tr class="border-base-300/50 border-b">
            <th
              class="text-base-content border-base-300/30 w-2/5 border-r bg-transparent px-3 py-3 font-medium"
            >
              Task Type
            </th>
            <th
              class="text-base-content border-base-300/30 w-2/5 border-r bg-transparent px-3 py-3 font-medium"
            >
              Success Rate
            </th>
            <th
              class="text-base-content w-1/5 bg-transparent px-3 py-3 text-center font-medium"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="task in processedData"
            :key="task.Name"
            class="bg-base-100 hover:bg-primary! hover:text-primary-content cursor-pointer transition-all duration-200"
          >
            <td
              class="border-base-300/30 border-r px-3 py-3 text-sm font-medium"
            >
              <span
                :class="{ 'text-error': task.isError }"
                :title="task.Name"
                class="block truncate"
              >
                {{ task.Name }}
              </span>
            </td>

            <td class="border-base-300/30 border-r px-3 py-3 text-sm">
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

            <td class="border-base-300/30 px-3 py-3 text-center text-sm">
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
      </table>
    </div>
  </DataSection>
</template>
