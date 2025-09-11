<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ClockIcon } from "@heroicons/vue/24/outline";
import TasksLayout from "./components/TasksLayout.vue";
import TaskHistoryTable from "./components/TaskHistoryTable.vue";
import SectionCard from "@/components/ui/SectionCard.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import type { TaskHistorySummary } from "@/types/task";

// Data fetching for task history
const { data, loading, error, refresh } = useCachedQuery<TaskHistorySummary[]>(
  "ClusterTaskHistory",
  [],
  {
    pollingInterval: 30000,
  },
);
</script>

<template>
  <TasksLayout current-tab="history">
    <div class="space-y-6">
      <SectionCard
        title="Task History"
        description="Completed and failed task execution history"
        :icon="ClockIcon"
      >
        <TaskHistoryTable
          :items="data || []"
          :loading="loading"
          :error="error"
          :on-refresh="refresh"
        />
      </SectionCard>
    </div>
  </TasksLayout>
</template>
