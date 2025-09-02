<script setup lang="ts">
import type { TaskStatus } from "@/types/task";

interface Props {
  status: TaskStatus["Status"];
  size?: "xs" | "sm" | "md" | "lg";
}

const { status, size = "sm" } = defineProps<Props>();

const statusConfig = {
  pending: {
    class: "badge-ghost",
    label: "Pending",
  },
  running: {
    class: "badge-info",
    label: "Running",
  },
  done: {
    class: "badge-success",
    label: "Done",
  },
  failed: {
    class: "badge-error",
    label: "Failed",
  },
};

const config = statusConfig[status];
</script>

<template>
  <div :class="['badge', `badge-${size}`, config.class]">
    {{ config.label }}
  </div>
</template>
