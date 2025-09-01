<script setup lang="ts">
import ActiveTasksTable from "./ActiveTasksTable.vue";
import Card from "@/components/ui/Card.vue";
</script>

<template>
  <div class="space-y-6">
    <!-- Active Tasks Table -->
    <Card>
      <ActiveTasksTable />
    </Card>
  </div>
</template>
