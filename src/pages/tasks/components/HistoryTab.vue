<script setup lang="ts">
import TaskHistoryTable from "./TaskHistoryTable.vue";
import Card from "@/components/ui/Card.vue";
</script>

<template>
  <div class="space-y-6">
    <!-- Task History Table -->
    <Card>
      <TaskHistoryTable />
    </Card>
  </div>
</template>
