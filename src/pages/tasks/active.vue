<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import TasksLayout from "./components/TasksLayout.vue";
import ActiveTasksTable from "./components/ActiveTasksTable.vue";
import Card from "@/components/ui/Card.vue";
</script>

<template>
  <TasksLayout current-tab="active">
    <div class="space-y-6">
      <Card>
        <ActiveTasksTable />
      </Card>
    </div>
  </TasksLayout>
</template>
