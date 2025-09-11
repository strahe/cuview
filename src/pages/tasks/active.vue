<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";
import TasksLayout from "./components/TasksLayout.vue";
import ActiveTasksTable from "./components/ActiveTasksTable.vue";
import SectionCard from "@/components/ui/SectionCard.vue";
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
    <div class="space-y-6">
      <SectionCard
        title="Active Tasks"
        description="Currently running tasks across all machines"
        :icon="ClipboardDocumentListIcon"
      >
        <ActiveTasksTable
          :items="data || []"
          :loading="loading"
          :error="error"
          :on-refresh="refresh"
        />
      </SectionCard>
    </div>
  </TasksLayout>
</template>
