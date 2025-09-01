<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import TasksLayout from "./components/TasksLayout.vue";
import TaskHistoryTable from "./components/TaskHistoryTable.vue";
import Card from "@/components/ui/Card.vue";
</script>

<template>
  <TasksLayout current-tab="history">
    <div class="space-y-6">
      <Card>
        <TaskHistoryTable />
      </Card>
    </div>
  </TasksLayout>
</template>
