<script setup lang="ts">
interface StatusBadgeProps {
  status: "success" | "info" | "warning" | "error";
  label: string;
  size?: "sm" | "md" | "lg";
  showIndicator?: boolean;
}

withDefaults(defineProps<StatusBadgeProps>(), {
  size: "sm",
  showIndicator: true,
});

const statusConfig = {
  success: {
    textClass: "text-success",
  },
  info: {
    textClass: "text-info",
  },
  warning: {
    textClass: "text-warning",
  },
  error: {
    textClass: "text-error",
  },
};
</script>

<template>
  <span class="font-medium" :class="statusConfig[status].textClass">
    {{ label }}
  </span>
</template>
