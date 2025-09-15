<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from "vue";
import TasksLayout from "./components/TasksLayout.vue";
import ActiveTasksTable from "./components/ActiveTasksTable.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { usePageTitle } from "@/composables/usePageTitle";
import type { TaskSummary } from "@/types/task";

// Data fetching for active tasks
const { data, loading, error, refresh } = useCachedQuery<TaskSummary[]>(
  "ClusterTaskSummary",
  [],
  {
    pollingInterval: 2000,
  },
);

const { updateTitle } = usePageTitle();

// Update title with active task count
const dynamicTitle = computed(() => {
  if (loading.value && !data.value) return "Loading...";
  if (error.value && !data.value) return "Error";

  const count = data.value?.length ?? 0;
  return `Active Tasks (${count})`;
});

updateTitle(dynamicTitle);
</script>

<route>
{
  "meta": {
    "title": "Active Tasks"
  }
}
</route>

<template>
  <TasksLayout current-tab="active">
    <ActiveTasksTable
      :items="data || []"
      :loading="loading"
      :error="error"
      :on-refresh="refresh"
    />
  </TasksLayout>
</template>
