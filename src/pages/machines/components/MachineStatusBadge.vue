<script setup lang="ts">
import { computed } from "vue";

interface Props {
  unschedulable: boolean;
  sinceContact: string;
  runningTasks?: number;
  restarting?: boolean;
  restartRequest?: string;
}

const props = defineProps<Props>();

const status = computed(() => {
  // Check if machine is restarting first (highest priority)
  if (props.restarting && props.restartRequest) {
    // Format restart time display
    const restartTime = props.restartRequest;
    let timeDisplay = restartTime;

    // Handle "now" case and format better time display
    if (restartTime === "now") {
      timeDisplay = "just started";
    } else if (restartTime.includes("ago")) {
      // Keep the original format if it already has "ago"
      timeDisplay = restartTime;
    } else {
      // Add "ago" suffix if not present
      timeDisplay = `${restartTime} ago`;
    }

    return {
      label: `Restarting (${timeDisplay})`,
      class: "badge-error",
      icon: "🔄",
    };
  }

  // Simple heuristic for determining if machine is offline
  // If last contact was more than 60 seconds ago, consider offline
  const contactMatch = props.sinceContact.match(/(\d+)s/);
  const secondsSinceContact = contactMatch ? parseInt(contactMatch[1]) : 0;

  if (secondsSinceContact > 60) {
    return {
      label: "Offline",
      class: "badge-error",
      icon: "🔴",
    };
  }

  if (props.unschedulable) {
    return {
      label: "Cordoned",
      class: "badge-warning",
      icon: "⚠️",
    };
  }

  return {
    label: "Online",
    class: "badge-success",
    icon: "🟢",
  };
});
</script>

<template>
  <div class="badge gap-1 text-xs" :class="status.class">
    <span>{{ status.icon }}</span>
    <span>{{ status.label }}</span>
    <span
      v-if="props.runningTasks && props.runningTasks > 0"
      class="font-medium"
    >
      ({{ props.runningTasks }})
    </span>
  </div>
</template>
