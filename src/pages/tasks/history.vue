<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import TasksLayout from "./components/TasksLayout.vue";
import TaskHistoryTable from "./components/TaskHistoryTable.vue";
</script>

<route>
{
  "meta": {
    "title": "Task History"
  }
}
</route>

<template>
  <TasksLayout current-tab="history">
    <TaskHistoryTable />
  </TasksLayout>
</template>
