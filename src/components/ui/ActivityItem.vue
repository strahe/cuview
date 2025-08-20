<script setup lang="ts">
import StatusBadge from "./StatusBadge.vue";

interface ActivityItemProps {
  title: string;
  description: string;
  status: "success" | "info" | "warning" | "error";
  statusLabel: string;
  timestamp?: string;
}

defineProps<ActivityItemProps>();
</script>

<template>
  <div
    class="border-base-300 hover:bg-base-50 flex items-center justify-between rounded-lg border p-3 transition-colors"
  >
    <div class="flex items-center gap-3">
      <StatusBadge
        :status="status"
        :label="statusLabel"
        :show-indicator="true"
      />
      <div>
        <p class="text-sm font-medium">{{ title }}</p>
        <p class="text-base-content/60 text-xs">{{ description }}</p>
      </div>
    </div>
  </div>
</template>
