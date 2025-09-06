<script setup lang="ts">
import type { TaskStatus } from "@/types/task";
import { getTaskStatusBadgeColor } from "@/utils/ui";

interface Props {
  status: TaskStatus["Status"];
  size?: "xs" | "sm" | "md" | "lg";
}

const { status, size = "sm" } = defineProps<Props>();

const statusLabels = {
  pending: "Pending",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

const getBadgeClass = (status: string) => getTaskStatusBadgeColor(status);
const getLabel = (status: string) =>
  statusLabels[status as keyof typeof statusLabels] || status;
</script>

<template>
  <div :class="['badge', `badge-${size}`, getBadgeClass(status)]">
    {{ getLabel(status) }}
  </div>
</template>
