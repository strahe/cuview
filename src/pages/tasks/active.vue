<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import TasksLayout from "./components/TasksLayout.vue";
import ActiveTasksTable from "./components/ActiveTasksTable.vue";
import { useCachedQuery } from "@/composables/useCachedQuery";
import { usePageTitle } from "@/composables/usePageTitle";
import type { TaskSummary } from "@/types/task";

const route = useRoute();

const { data, loading, error, refresh } = useCachedQuery<TaskSummary[]>(
  "ClusterTaskSummary",
  [],
  {
    pollingInterval: 2000,
  },
);

const { updateTitle } = usePageTitle();

const dynamicTitle = computed(() => {
  if (loading.value && !data.value) return "Loading...";
  if (error.value && !data.value) return "Error";

  const count = data.value?.length ?? 0;
  const searchParam = route.query.search as string;

  if (searchParam) {
    return `Active Tasks (${count}) - ${searchParam}`;
  }

  return `Active Tasks (${count})`;
});

updateTitle(dynamicTitle);

const initialSearch = computed(() => (route.query.search as string) || "");

const currentSearch = ref(initialSearch.value);

watch(
  () => route.query.search,
  (newSearch) => {
    currentSearch.value = (newSearch as string) || "";
  },
  { immediate: true },
);
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
      :initial-search="initialSearch"
      :current-search="currentSearch"
    />
  </TasksLayout>
</template>
