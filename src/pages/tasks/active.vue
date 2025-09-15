<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import TasksLayout from "./components/TasksLayout.vue";
import ActiveTasksTable from "./components/ActiveTasksTable.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import type { TaskSummary } from "@/types/task";

// Data fetching for active tasks
const { data, loading, error, refresh } = useCachedQuery<TaskSummary[]>(
  "ClusterTaskSummary",
  [],
  {
    pollingInterval: 2000,
  },
);
</script>

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
