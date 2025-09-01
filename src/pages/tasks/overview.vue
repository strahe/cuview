<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import TasksLayout from "./components/TasksLayout.vue";
import TasksOverview from "./components/TasksOverview.vue";
import Card from "@/components/ui/Card.vue";
</script>

<template>
  <TasksLayout current-tab="overview">
    <div class="space-y-6">
      <Card>
        <TasksOverview />
      </Card>
    </div>
  </TasksLayout>
</template>
