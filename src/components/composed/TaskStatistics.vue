<script setup lang="ts">
import { computed } from "vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";
import DataTable from "@/components/ui/DataTable.vue";
import DataSection from "@/components/ui/DataSection.vue";
import { getTableRowClasses } from "@/utils/ui";
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
  if (!rawData.value?.length) {
    return [];
  }

  return rawData.value.map((task) => ({
    ...task,
    isError: task.TrueCount === 0 && task.FalseCount > 0,
  }));
});

const getSuccessRate = (task: TaskStatWithPercentage): number => {
  return task.TotalCount > 0 ? (task.TrueCount / task.TotalCount) * 100 : 0;
};

const getStatusBadge = (task: TaskStatWithPercentage) => {
  if (task.isError) {
    return { class: "badge-error", label: "Error" };
  }
  if (task.FalseCount === 0) {
    return { class: "badge-success", label: "Healthy" };
  }
  return { class: "badge-warning", label: "Warning" };
};
</script>

<template>
  <DataSection
    :loading="loading"
    :error="error"
    :has-data="hasData"
    :on-retry="refresh"
    error-title="Task Stats Error"
    :empty-icon="ClipboardDocumentListIcon"
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
          :class="getTableRowClasses()"
        >
          <td class="truncate font-medium">
            <span :title="task.Name" class="block truncate">
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
              {{ getStatusBadge(task).label }}
            </div>
          </td>
        </tr>
      </tbody>
    </DataTable>
  </DataSection>
</template>
